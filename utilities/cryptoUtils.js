import { constant } from "../keyVaultConstant.js";
import crypto from  "crypto";


const iv = crypto.randomBytes(16);
const encryptionKey = constant?.FILE_ENCRYPTION_KEY;
const ivEncryptionKey = constant?.IV_ENCRYPTION_KEY;
const ivForIVEncription = constant?.IV_ENCRYPTION_IV;
const encryptionAlgorithm = 'aes-256-gcm';

const encryptData = async (key, iv, data, algo = encryptionAlgorithm) => {
    const cipherData = await crypto
        .createCipheriv(algo, Buffer.from(key, "hex"), Buffer.from(iv, "hex"))
        .update(data);
    return cipherData;
};

export const encryptFileData = async (uploadedFile) => {
    const cipher = await crypto.createCipheriv(encryptionAlgorithm, Buffer.from(encryptionKey,'hex'), iv);
    let  encryptedFileData = await cipher.update(uploadedFile.data);
    encryptedFileData = Buffer.concat([encryptedFileData, cipher.final()]);
    uploadedFile.data = encryptedFileData;
    const encryptedIV = await encryptData(ivEncryptionKey, ivForIVEncription, iv, encryptionAlgorithm);
    return {
        iv : encryptedIV?.toString('hex')
    };
}

export const streamToBuffer = async(readableStream) => {
    return new Promise((resolve,reject) => {
        const chunks = [];
        readableStream.on('data',(data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });

        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks));
        });

        readableStream.on('error', reject);
    });
}

