import config from "../config/index.js";
import axios from "axios";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import stream from "stream";
import * as base64ToUint8Array from "base64-to-uint8array";
import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";
import { allFieldsRequired } from "../utilities/validation.js";

const logger = new LoggerService("app");

// export const reserveOrder=async(req,res)=>{
//     const {web_token} =req.cookies;
//     const transactionID=uuidv4();
//     const subscription_key = constant.MS_OCP_APIM_SUBSCRIPTION_KEY;

//     const {requestMessage}=req.body;

//     let reqData={...requestMessage};
//     reqData["transactionID"]=transactionID;
//     reqData["payments"]["paymentRefId"]=transactionID;
//     let mockResponse={
//     "transactionID": "95f83e0d-4ef9-4aaf-899e-8a4db9f56c40",
//     "resultCode": 20000,
//     "result": {
//         "transactionID": "95f83e0d-4ef9-4aaf-899e-8a4db9f56c40",
//         "resultCode": "20000",
//         "resultMessage": "Success",
//         "result": {
//             "reserveStock": {
//                 "resultCode": "20000",
//                 "resultMessage": "Success.",
//                 "result": {
//                     "soId": "198878",
//                     "productList": [
//                         {
//                             "locationDestination": "4289",
//                             "locationStock": "4289",
//                             "soCompany": "AWN",
//                             "locationStockType": "DEPO",
//                             "listMatFreeGoods": [],
//                             "privilege": [],
//                             "point": [],
//                             "matAirTime": "",
//                             "productType": "DEVICE",
//                             "productSubType": "HANDSET",
//                             "matCode": "NEW0AP12MN2-GN01",
//                             "qty": 1,
//                             "brand": "APPLE",
//                             "model": "IP12MN_128GB",
//                             "color": "GREEN"
//                         }
//                     ]
//                 }
//             }
//         },
//         "reserveId": "2022081800029",
//         "orderNumber": "000000071"
//         }
//     };
//     console.log("====Apicalled=======");
//     console.log("====requestReserveOrderAPI=======");

//     await axios({
//       method: "post",
//       url: `${config?.ms?.baseUrl}${config?.ms?.reserveOrder}`,
//     headers: {
//       "Content-Type": "application/json; charset=UTF-8",
//       Authorization: "Bearer " + web_token,
//       "Ocp-Apim-Subscription-Key": subscription_key,
//       "Ocp-Apim-Trace": true,
//       "X-Content-Type-Options": "nosniff",
//       "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
//     },
//     data: reqData,
//   })
//     .then((resp) => {
//       logger.info(`reserveOrder Success`, { status: StatusType.SUCEESS, details: resp });
//       console.log("====responseReserveOrderAPI=======", resp.data);
//       return res.status(200).json({ data: resp.data, status: true });
//     })
//     .catch((err) => {
//       console.log("=============Something went wrong==================", err);
//       logger.error(`reserveOrder Error`, { status: StatusType.FAIL, details: err });
//       return res.status(500).json({ error: err, status: false, data: null });
//     });
// };

/*
  Created By : Natnisha
  Created At : 19-06-2022
  Description : 05+Command+Claim+Order+Detail
  Input Params: eclaimNo
*/
export const getClaimOrderDetail = async (req, res) => {
  try {
    const { eclaimNo, transactionId } = req.body;
    if (!eclaimNo && !transactionId) {
      return validate.allFieldsRequired(res);
    }

    const requestData = {
      transactionID: transactionId,
      eclaimNo: eclaimNo,
    };

    try {
      logger.info(`getClaimOrderDetailRequestData`, {
        status: StatusType.SUCEESS,
        eclaimNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log(
        "getClaimOrderDetail request data",
        JSON.stringify(requestData)
      );
    } catch (error) {
      console.log(`getClaimOrderDetailRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.returnOrClaim.claimOrderDetail,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        "x-claimncp-clientID": constant.CLAIM_NCP_ID,
        "x-claimncp-node": "NCP",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultResponse || "50000",
          resultMessage: response?.data?.resultDescription || "Fail",
          status: response?.data?.resultObject[0]?.status || "",
          inboundBomList:
            response?.data?.resultObject[0]?.checkReceiveList?.inboundBomList ||
            [],
          coverPageFile: response?.data?.resultObject[0]?.coverPageFile || "",
        };
        try {
          logger.info(`getClaimOrderDetailSuccess`, {
            status: StatusType.SUCEESS,
            eclaimNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response getClaimOrderDetail=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`getClaimOrderDetail Success Logger Error`, error);
        }

        return res.send({
          response: result,
          status: response?.data?.resultResponse == "20000",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`getClaimOrderDetailError1`, {
            status: StatusType.FAIL,
            eclaimNo,
            transactionId,
            details: error,
          });
          console.log("==========getClaimOrderDetail Catch 1=========", error);
        } catch (error) {
          console.log(`getClaimOrderDetail Error Logger Error 1`, error);
        }

        return res.send({ res: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`getClaimOrderDetailError2`, {
        status: StatusType.FAIL,
        eclaimNo: eclaimNo,
        transactionId,
        details: e,
      });
      console.log("==========getClaimOrderDetail Catch 2=========", e);
    } catch (error) {
      console.log(`getClaimOrderDetail Error Logger Error 2`, error);
    }

    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
      error: response,
    });
  }
};

export const updateClaimOrder = async (req, res) => {
  const { eclaimNo, transactionID, fileTypeObject } = req.body;
  try {
    if (
      !eclaimNo &&
      !transactionID &&
      !fileTypeObject?.idDocument &&
      fileTypeObject?.bankAccDocument
    ) {
      return allFieldsRequired(res);
    }

    const requestData = {
      transactionID,
      eclaimNo,
      status: "SEND_DOC_REFUND",
      actionBy: "NCP",
      idDocument: [
        {
          fileName: eclaimNo + "_01." + fileTypeObject?.idDocument,
        },
      ],
      bankAccDocument: [
        {
          fileName: eclaimNo + "_02." + fileTypeObject?.bankAccDocument,
        },
      ],
    };

    try {
      logger.info(`updateClaimOrderRequestData`, {
        status: StatusType.SUCEESS,
        transactionID,
        details: JSON.stringify(requestData),
      });
      console.log("updateClaimOrder request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`updateClaimOrderRequestData Logger Error`, error);
    }

    axios({
      method: "put",
      url: config.endPoint.returnOrClaim.updateClaimOrder,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        "x-claimncp-clientID": constant.CLAIM_NCP_ID,
        "x-claimncp-node": "NCP",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: response?.data?.transactionID,
          resultCode: response?.data?.resultResponse,
          resultMessage: response?.data?.resultDescription,
        };
        try {
          logger.info(`updateClaimOrderSuccess`, {
            status: StatusType.SUCEESS,
            transactionID,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response updateClaimOrder=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`updateClaimOrder Success Logger Error`, error);
        }

        return res.send({
          response: result,
          status: response?.data?.resultResponse == "20000",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`updateClaimOrderError1`, {
            status: StatusType.FAIL,
            transactionID,
            details: error,
          });
          console.log("==========updateClaimOrder Catch 1=========", error);
        } catch (error) {
          console.log(`updateClaimOrder Error Logger Error 1`, error);
        }
        return res.status(501).json({ res: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`updateClaimOrderError2`, {
        status: StatusType.FAIL,
        transactionID,
        details: e,
      });
      console.log("==========updateClaimOrder Catch 2=========", e);
    } catch (error) {
      console.log(`updateClaimOrder Error Logger Error 2`, error);
    }

    return res.status(501).json({
      response:
        "Something happend while trying to Update Claim Order. Please try again.",
      status: false,
      error: e,
    });
  }
};

export const getReceiptOrder = async (req, res) => {
  try {
    const {
      receiptNo,
      company = "",
      downloadOrSendMail = "",
      email = "",
      transactionId = "",
    } = req.body;

    if (!receiptNo && !downloadOrSendMail) {
      return validate.allFieldsRequired(res);
    }

    const requestData = {
      referWebSessionID: config.endPoint.referChannel + transactionId,
      referChannel: config.endPoint.referChannel,
      referChannelIP: "127.0.0.1",
      transactionID: transactionId,
      downloadOrSendMail: downloadOrSendMail,
      company: company,
      receiptNo: receiptNo,
    };

    if (downloadOrSendMail === "M") {
      requestData.email = email;
    }

    try {
      logger.info(`getReceiptOrderRequestData`, {
        status: StatusType.SUCEESS,
        receiptNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("getReceiptOrder request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`getReceiptOrderRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.getReceiptOrder,
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        "x-claimncp-node": "NCP",
        Authorization: "Bearer " + config.endPoint.getDtBearer,
      },
      data: requestData,
    })
      .then(async function (response) {
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail",
          result: response?.data?.result || [],
        };
        try {
          logger.info(`getReceiptOrderSuccess`, {
            status: StatusType.SUCEESS,
            receiptNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response getReceiptOrder=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`getReceiptOrder Success Logger Error`, error);
        }

        if (
          result?.resultCode === "20000" &&
          downloadOrSendMail === "M"
        ) {
          return res.send({
            response: result,
            status: true,
          });
        } else if (
          result?.resultCode === "20000" &&
          downloadOrSendMail === "D"
        ) {
          try {
            if (result.result.length === 1) {
              const pdfBuffer = Buffer.from(
                result.result[0].eReceipt,
                "base64"
              ); // Replace with your actual PDF generation logic

              // Set headers for a PDF response
              res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename=receipt.pdf`,
              });

              // Send the PDF buffer as the response
              res.send(pdfBuffer);
            } else {
              // Create a ZIP stream
              const archive = archiver("zip", {
                zlib: { level: 9 }, // Compression level
              });

              const str = new stream.PassThrough();

              // Process each base64 data and add it to the zip file
              for (let i = 0; i < result.result.length; i++) {
                try {
                  const binaryData = Buffer.from(
                    result.result[i].eReceipt,
                    "base64"
                  );
                  archive.append(binaryData, {
                    name: `receipt_${i + 1}.pdf`,
                  });
                } catch (error) {
                  console.error(
                    `Error converting base64 data for index ${i}:`,
                    error
                  );
                }
              }

              logger.info(`setReceiptOrderPdfSuccess`, {
                status: StatusType.SUCEESS,
                receiptNo,
                transactionId,
                details: JSON.stringify(response?.data),
              });
              console.log(
                "====response setReceiptOrderPdf=======",
                JSON.stringify(response?.data)
              );

              // Stream the ZIP archive to the response
              archive.pipe(str);
              // Finalize the archive
              archive.finalize();

              // Set the response headers
              res.setHeader("Content-Type", "application/zip");
              res.setHeader(
                "Content-Disposition",
                "attachment; filename=receipt.zip"
              );

              // Stream the ZIP file to the response
              str.pipe(res);
            }
          } catch (error) {
            logger.error(`setReceiptOrderPdfError`, {
              status: StatusType.FAIL,
              receiptNo: receiptNo,
              transactionId,
              details: error,
            });
            console.log(`setReceiptOrderPdf Success Logger Error`, error);
            return res.send({ res: error.toString(), status: false });
          }
        } else {
          return res.status(404).json({
            response: result,
            status: false,
          });
        }
      })
      .catch(function (error) {
        try {
          logger.error(`getReceiptOrderError1`, {
            status: StatusType.FAIL,
            receiptNo,
            transactionId,
            details: error,
          });
          console.log("==========getReceiptOrder Catch 1=========", error);
        } catch (error) {
          console.log(`getReceiptOrder Error Logger Error 1`, error);
        }

        return res.status(500).json({
          response: error,
          status: false,
        });
      });
  } catch (e) {
    try {
      logger.error(`getReceiptOrderError2`, {
        status: StatusType.FAIL,
        receiptNo: receiptNo,
        transactionId,
        details: e,
      });
      console.log("==========getReceiptOrder Catch 2=========", e);
    } catch (error) {
      console.log(`getReceiptOrder Error Logger Error 2`, error);
    }

    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
      error: e,
    });
  }
};
