import express from 'express';
import { processPayment, paymentEnquiry, paymentTopUp } from "../controller/payment-controller.js";

const router = express.Router();

router.post("/", processPayment);
router.post("/enquiry", paymentEnquiry);
router.post("/top-up", paymentTopUp);

export default router;
