import express from "express";
import {
  getClaimOrderDetail,
  updateClaimOrder,
  getReceiptOrder,
} from "../controller/order-controller.js";
import { verifyClaimUser } from "../middleware/verifyClaimUser.js";
import { verifyReceiptOrder } from "../middleware/verifyReceiptOrder.js";

const router = express.Router();
router.post("/claim-order-detail", verifyClaimUser, getClaimOrderDetail);
router.put("/update-claim-order", verifyClaimUser, updateClaimOrder);
router.post("/get-order-receipt", verifyReceiptOrder, getReceiptOrder);

export default router;
