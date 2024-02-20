import express from 'express';

import { downloadSingleBlob, listAzureContainerBlobs, uploadFileToAzure, verifyReceiptNo } from '../controller/azure-controller.js';
import { verifyClaimUser } from '../middleware/verifyClaimUser.js';

const router = express.Router();

router.post("/uploadFile", verifyReceiptNo, uploadFileToAzure);
router.post("/uploadManualRefundFile", verifyClaimUser, uploadFileToAzure);
router.post("/listBlobs", listAzureContainerBlobs);
router.post("/downloadBlob", verifyClaimUser, downloadSingleBlob);

export default router;
