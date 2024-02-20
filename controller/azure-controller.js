import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";
import {BlobServiceClient} from "@azure/storage-blob";
import { allFieldsRequired } from "../utilities/validation.js";
import axios from "axios";
import config from "../config/index.js";
import moment from "moment";
import { formatErrorObject } from "../utilities/util.js";
import { encryptFileData } from "../utilities/cryptoUtils.js";

const logger = new LoggerService('app');

const pad2 = (n) => 
{ 
    return n < 10 ? '0' + n : n;
};

const getFormattedDate = (formatString) => {
    return moment().utcOffset(420).format(formatString);
};

export const fileTypeFromName = (fileName) => {
    const fileNameSplitArray = fileName?.split(".");
    return "." + fileNameSplitArray?.[fileNameSplitArray?.length-1];
}

export const formatFileName = (uploadedFile, receiptNo="", index = 1, isAccessoryFile = false, eclaimNo = "", isManualRefund = "false") => {
    if(uploadedFile) { 
        let modifiedFileName = "";
        const fileType = fileTypeFromName(uploadedFile?.name);
        if(isManualRefund === "true") { 
            modifiedFileName = eclaimNo + "_" + pad2(index) + fileType;
        }
        else {
            modifiedFileName = isAccessoryFile 
                                ? receiptNo + "" + getFormattedDate("YYYYMMDDHHmmss") + "_ACC" + fileType 
                                : receiptNo + "" + getFormattedDate("YYYYMMDDHHmmss") + "_" + pad2(index) + fileType;
        }
        uploadedFile.name = modifiedFileName;
    }
};

const getActualContainerName = (downloadFor = "" ,blobName = "", receiptNo = "", containerName = "") => {
    let newContainerName = "";
    let blobNameSubString = "";
    switch(downloadFor?.toLowerCase()) {
        case "viewclaimrequest" : 
            blobNameSubString = blobName?.replace(receiptNo, "");
            newContainerName = containerName + "/attach-in/" + blobNameSubString?.substring(0,4) + "/" + blobNameSubString?.substring(4,6);
            break;
        case "coverpage" :
            newContainerName = containerName;
            break;
        case "manualrefund" :
            newContainerName = containerName + "/docrefund/" + getFormattedDate("YYYY/MM");
            break;
        default :
            newContainerName = containerName;
    }
    return newContainerName;
};


export const verifyReceiptNo = async (req, res, next) => {
    const {orderNo, receiptNo, transactionID} = req.body;
    try {
        let retryCount = 0;
        const { web_token } = req.cookies;
        if (!web_token) {
            const result = {
                transactionID: transactionID || "",
                resultCode : "401",
                resultMessage : "User not authorised"
            };
            try {
                logger.info(`verifyReceiptNoUserUnauthorised`, { status: StatusType.SUCEESS,  transactionID, details: JSON.stringify(result) });    
                console.log("======User Unauthorised verifyReceiptNo=======",JSON.stringify(result));
            } 
            catch (error) {
                console.log(`verifyReceiptNo User Unauthorised Logger Error`, error);
            }
            return res
                .status(401)
                .json({
                    response: result,
                    status: false,
                    statusCode: "401",
                    errorSource : "verifyReceiptNo",
                });
        }
        if(!orderNo && !receiptNo) {
            return allFieldsRequired(res);
        }

        try {
            logger.info(`verifyReceiptNoRequestData`, { status: StatusType.SUCEESS, transactionID, details: JSON.stringify(req.body) });
            console.log("verifyReceiptNo request data",JSON.stringify(req.body));
        } 
        catch (error) {
            console.log(`verifyReceiptNoRequestData Logger Error`, error);
        }
    
        const orderDetailQuery = JSON.stringify({
            query : `
                query customer($number: String!){
                    customer {
                        orders(filter: { number: { eq: $number } }) {
                            items {
                                number
                                ais_receipt_no
                            }
                        }
                    }
                }`,
            variables : {"number" : orderNo} 
        });

        const verifyReceiptNoFn = () => {
            axios({
                method: "post",
                url: config.magento.graphQLApi,
                headers: {
                    "Content-Type": "application/json",
                    "X-Content-Type-Options": "nosniff",
                    "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
                    Authorization: "Bearer " + web_token,
                    },
                    data: orderDetailQuery,
                })
                .then(response => {
                    try {
                        logger.info(`verifyReceiptNoResponseLog`, { status: StatusType.SUCEESS,  transactionID, details: JSON.stringify(response) });    
                        console.log("======ResponseLog verifyReceiptNo=======",JSON.stringify(response));
                    } 
                    catch (error) {
                        console.log(`verifyReceiptNo ResponseLog Logger Error`, error);
                    }
                    if(response?.status == 200 && !response?.data?.errors?.length) {
                        const {ais_receipt_no } = response?.data?.data?.customer?.orders?.items?.[0];
                        const receiptNoObject = (ais_receipt_no) ? JSON.parse(ais_receipt_no) : [{}];
                        const receiptNoFromGraphql = receiptNoObject?.[0]?.receiptNo || "";
                        if(receiptNoFromGraphql && (receiptNoFromGraphql === receiptNo)) {
                            try {
                                logger.info(`verifyReceiptNoSuccess`, { status: StatusType.SUCEESS,  transactionID, details: JSON.stringify(response?.data) });    
                                console.log("======response verifyReceiptNo=======",JSON.stringify(response?.data));
                            } 
                            catch (error) {
                                console.log(`verifyReceiptNo Success Logger Error`, error);
                            }
                            next();
                        }
                        else {
                            const result = {
                                transactionID: transactionID || "",
                                resultCode : "401",
                                resultMessage : "User not authorised"
                            };
                            try {
                                logger.info(`verifyReceiptNoUserUnauthorised1`, { status: StatusType.SUCEESS,  transactionID, details: JSON.stringify(response?.data) });    
                                console.log("======User Unauthorised verifyReceiptNo 1=======",JSON.stringify(response?.data));
                            } 
                            catch (error) {
                                console.log(`verifyReceiptNo User Unauthorised Logger Error 1`, error);
                            }
                            return res
                                .status(401)
                                .json({
                                    response: result,
                                    status: false,
                                    statusCode: "401",
                                    errorSource : "verifyReceiptNo",
                                });
                        }
                    }
                    else {
                        const result = {
                            transactionID: transactionID || "",
                            resultCode : "500000",
                            resultMessage : response?.data?.errors?.[0]?.message || "FAIL"
                        };
                        try {
                            logger.info(`verifyReceiptNoErrorResponse`, { status: StatusType.SUCEESS,  transactionID, details: JSON.stringify(response?.data) });    
                            console.log("======Error Response verifyReceiptNo=======",JSON.stringify(response?.data));
                        } 
                        catch (error) {
                            console.log(`verifyReceiptNo Error Response Logger Error`, error);
                        }
                        return res
                            .status(500)
                            .json({
                                response: result,
                                status: false,
                                errorSource : "verifyReceiptNo",
                            });                    
                    }                
                })
                .catch(error => {
                    try {
                        logger.info(`verifyReceiptNoCatch`, { status: StatusType.FAIL, transactionID, details: error });         
                        console.log("==========verifyReceiptNo Catch =========",error);
                    } 
                    catch (error) {
                        console.log(`verifyReceiptNo Error Logger Error`, error);
                    }
                    if (error?.status === 502 && retryCount === 0) {
                        console.log("verifyReceiptNo graphql catch", error?.status, retryCount);
                        retryCount++;
                        verifyReceiptNoFn();
                    }
                    return res
                        .status(500)
                        .json({ 
                                response: null, 
                                error: error, 
                                status: false,
                                errorSource : "verifyReceiptNo",
                            });            
                });
        };
        verifyReceiptNoFn();
    }
    catch(e) {
        try {
            logger.info(`verifyReceiptNoCatch2`, { status: StatusType.FAIL, transactionID,  details: e });         
            console.log("==========verifyReceiptNo Catch 2=========",e);
        } 
        catch (error) {
            console.log(`verifyReceiptNo Error Logger Error 2`, error);
        }
        return res.send({
            response: "Something happend while trying to validate the receipt number. please try again.",
            error: e,
            status: false,
            errorSource : "verifyReceiptNo",
        });
    }
};

const isInvalidFileType = (file, isManualRefund = "false") => {
    const allowedFileTypes = [".jpg",".png",".jpeg",".heic",".heif",".pdf","image/jpg","image/png","image/jpeg","image/heic","image/heif","application/pdf",".mp4",".m4v","video/mp4","video/x-m4v"];
    const allowedManualRefundFileTypes = [".jpg",".png",".jpeg",".heic",".heif",".pdf","image/jpg","image/png","image/jpeg","image/heic","image/heif","application/pdf"];
    let invalidFileType = false;
    if(isManualRefund === "true") {
        if(!file || !allowedManualRefundFileTypes.includes(fileTypeFromName(file?.name))) {
            invalidFileType = true;
        }
    }
    else {
        if(!file || !allowedFileTypes.includes(fileTypeFromName(file?.name))) {
            invalidFileType = true;
        }
    }
    return invalidFileType;
};

export const uploadFileToAzure = async (req,res) => {
    const {transactionID, receiptNo, fileIndex, eclaimNo, isManualRefund} = req?.body;
    try {
        if (!req?.files?.file && !req?.files?.accessoryFile) {
            return res.status(400).send({
                status : false, 
                response : "No files were uploaded.",
                errorSource : "uploadFileToAzure"
            });
        }
        const uploadedFile = (req?.files?.file) ? req?.files?.file : null;  
        const uploadedAccessoryFile = (req?.files?.accessoryFile) ? req?.files?.accessoryFile : null;  
        let fileToBeUploadedToAzure = null;
        let sourceFileName = "";
        if(uploadedFile) {
            sourceFileName = uploadedFile?.name;
            formatFileName(uploadedFile, receiptNo, fileIndex, false, eclaimNo, isManualRefund);
            fileToBeUploadedToAzure = uploadedFile;
        }
        else if(uploadedAccessoryFile) {
            sourceFileName = uploadedAccessoryFile?.name;
            formatFileName(uploadedAccessoryFile, receiptNo, fileIndex, true, "", isManualRefund);
            fileToBeUploadedToAzure = uploadedAccessoryFile;
        }

        if(isInvalidFileType(fileToBeUploadedToAzure, isManualRefund)) {
            return res.status(400).send({
                status : false, 
                response : "Invalid file type uploaded.",
                errorSource : "uploadFileToAzure",
            });
        }

        const containerName = constant?.UPLOAD_ECLAIM_AZURE_BLOB_CONTAINER_NAME;
        if (!containerName) throw Error('Azure Storage blob containerName not found');

        const fileLocation = ((isManualRefund === "true") ? "/docrefund/" : "/attach-in/") + getFormattedDate("YYYY/MM");

        const requestData = {
            sourceFileName,
            destinationFileName : fileToBeUploadedToAzure?.name, 
            fileSize : fileToBeUploadedToAzure?.size,
            receiptNo, 
            fileIndex, 
            eclaimNo, 
            isManualRefund,
            fileLocation,
        };

        try {
            logger.info(`uploadFileToAzureRequestData`, { status: StatusType.SUCEESS, transactionID, details: JSON.stringify(requestData) });
            console.log("uploadFileToAzure request data", JSON.stringify(requestData));
        } 
        catch (error) {
            console.log(`uploadFileToAzureRequestData Logger Error`, error);
        }

        const blobServiceUrl = constant?.UPLOAD_ECLAIM_AZURE_BLOB_SAS_URL;
        const blobServiceClient = new BlobServiceClient(blobServiceUrl);
        const containerClient = blobServiceClient.getContainerClient(containerName + fileLocation);
        const blobClient = containerClient.getBlockBlobClient(fileToBeUploadedToAzure?.name);

        let encryptionMetaData = {};
        if(isManualRefund === "true") {
            encryptionMetaData = await encryptFileData(fileToBeUploadedToAzure);
        }

        const promise = blobClient.uploadData(fileToBeUploadedToAzure?.data,{metadata : encryptionMetaData});
        promise
            .then(response => {
                const responseData = {...requestData, message : `Successfully added the file ${requestData?.destinationFileName} to Azure`, eTag : response?.etag };
                try {
                    logger.info(`uploadFileToAzureSuccess`, { status: StatusType.SUCEESS, transactionID, details: JSON.stringify(responseData) });
                    console.log("======response uploadFileToAzure=======", JSON.stringify(responseData));
                } catch (error) {
                    console.log(`uploadFileToAzure Success Logger Error`, error);
                }         
                const result = {
                    fileName : fileToBeUploadedToAzure?.name,
                };       
                return res.send({
                            response: result,
                            status: response?.etag  ? true : false,
                        });
            })
            .catch(error => {
                try {
                    logger.info(`uploadFileToAzureCatch1`, { status: StatusType.FAIL, transactionID, details: error });         
                    console.log("==========uploadFileToAzure Catch 1=========",error);
                } catch (error) {
                    console.log(`uploadFileToAzure Error Logger Error 1`, error);
                }
                return res.send({
                    response: "Something happend while uploading files to Azure. Please try again.",
                    error: formatErrorObject(error),
                    status: false,
                    errorSource : "uploadFileToAzure",
                });
            });
    }
    catch(e) {
        try {
            logger.info(`uploadFileToAzureCatch2`, { status: StatusType.FAIL, transactionID, details: e });         
            console.log("==========uploadFileToAzure Catch 2=========",e);
        } catch (error) {
            console.log(`uploadFileToAzure Error Logger Error 2`, error);
        }
        return res.send({
            response: "Something happend while trying to configure Azure Blob Storage in uploadFileToAzure. Please try again.",
            error: formatErrorObject(e),
            status: false,
            errorSource : "uploadFileToAzure",
        });
    }
};

export const listAzureContainerBlobs = async (req,res) => {
    const {transactionID} = req?.body;
    try {        
        const containerName = constant?.UPLOAD_ECLAIM_AZURE_BLOB_CONTAINER_NAME;
        if (!containerName) throw Error('Azure Storage blob containerName not found');

        try {
            logger.info(`listAzureContainerBlobsRequestData`, { status: StatusType.SUCEESS, transactionID, details: JSON.stringify(req?.body) });
            console.log("listAzureContainerBlobs request data", JSON.stringify(req?.body));
        } 
        catch (error) {
            console.log(`listAzureContainerBlobsRequestData Logger Error`, error);
        }

        const blobServiceUrl = constant?.UPLOAD_ECLAIM_AZURE_BLOB_SAS_URL;
        const blobServiceClient = new BlobServiceClient(blobServiceUrl);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        
        const blobNamesList = [];
        let index = 0;

        for await (const blob of containerClient.listBlobsFlat()) {
            if(index === 3) {
                break;
            }
            const tempBlockBlobClient = containerClient.getBlockBlobClient(blob.name);
            blobNamesList?.push({[blob.name] : tempBlockBlobClient.url});
            index++;
        }

        try {
            logger.info(`listAzureContainerBlobsSuccess`, { status: StatusType.SUCEESS, transactionID, details: JSON.stringify(blobNamesList)});
            console.log("======response listAzureContainerBlobs=======", JSON.stringify(blobNamesList));
        } 
        catch (error) {
            console.log(`listAzureContainerBlobs Success Logger Error`, error);
        } 

        res.send({
            response : blobNamesList,
            result : true,
        });
    }
    catch(e) {
        try {
            logger.info(`listAzureContainerBlobsCatch`, { status: StatusType.FAIL, transactionID, details: e });         
            console.log("==========listAzureContainerBlobs Catch=========",e);
        } catch (error) {
            console.log(`listAzureContainerBlobs Error Logger Error`, error);
        }
        return res.send({
            response: "Something happend while trying to configure Azure Blob Storage in listAzureContainerBlobs. Please try again.",
            error: formatErrorObject(e),
            status: false,
            errorSource : "listAzureContainerBlobs",
        });
    }
};

export const downloadSingleBlob = async (req,res) => {
    const {transactionID, blobName, receiptNo, downloadFor} = req?.body;
    try {        
        const containerName = constant?.UPLOAD_ECLAIM_AZURE_BLOB_CONTAINER_NAME;
        if (!containerName) throw Error('Azure Storage blob containerName not found');

        try {
            logger.info(`downloadSingleBlobRequestData`, { status: StatusType.SUCEESS, transactionID, details: JSON.stringify(req?.body) });
            console.log("downloadSingleBlob request data", JSON.stringify(req?.body));
        } 
        catch (error) {
            console.log(`downloadSingleBlobRequestData Logger Error`, error);
        }

        const newContainerName = getActualContainerName(downloadFor, blobName, receiptNo, containerName);

        const blobServiceUrl = constant?.UPLOAD_ECLAIM_AZURE_BLOB_SAS_URL;
        const blobServiceClient = new BlobServiceClient(blobServiceUrl);
        const containerClient = blobServiceClient.getContainerClient(newContainerName);
        
        const blobClient = await containerClient.getBlobClient(blobName);

        const downloadBlockBlobResponse = await blobClient.download(0);
        try {
            logger.info(`downloadSingleBlobSuccess`, { status: StatusType.SUCEESS, transactionID, details: `Successfully downloaded the blob "${blobName}"`});
            console.log("======response downloadSingleBlob=======", `Successfully downloaded the blob "${blobName}"`);
        } 
        catch (error) {
            console.log(`downloadSingleBlob Success Logger Error`, error);
        } 
        downloadBlockBlobResponse.readableStreamBody.pipe(res);

    }
    catch(e) {
        try {
            logger.info(`downloadSingleBlobCatch`, { status: StatusType.FAIL, transactionID, details: e });         
            console.log("==========downloadSingleBlob Catch=========",e);
        } catch (error) {
            console.log(`downloadSingleBlob Error Logger Error`, error);
        }
        return res.status(500).json({
            response: "Something happend while trying to configure Azure Blob Storage in downloadSingleBlob. Please try again.",
            error: formatErrorObject(e),
            status: false,
            errorSource : "downloadSingleBlob",
        });
    }
};
