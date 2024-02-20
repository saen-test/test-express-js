import axios from "axios";
import crypto, { randomUUID } from  "crypto";
import { v4 as uuidv4 } from 'uuid';
import config from "../config/index.js";

export const mPayBaseURL = config.mPay.baseUrl;
export const mPayTopUpConfig = config.mPay.topUp;
export const mPayStorePurchasingConfig = config.mPay.storePurchasing;

export const generateSignature = (data, key, nonce = "") => {
  const signature = crypto
    .createHmac("sha256", key)
    .update(JSON.stringify(data) + nonce)
    .digest("hex");
  return signature;
};

export const getPackageDetailsForRlp = (cartDetails) => {
  return cartDetails?.items?.map((item, index) => {
    let itemPrice = item?.prices?.total_item_discount
      ? item?.prices?.price?.value * item?.quantity -
        item?.prices?.total_item_discount?.value
      : item?.prices?.price?.value * item?.quantity;
    return {
      id: item?.uid,
      amount: itemPrice,
      products: [
        {
          id: "" + item?.product?.id,
          name: item?.product?.name + " X " + item?.quantity,
          quantity: 1,
          price: itemPrice,
          image_url:
            item?.product?.primary_image_url ??
            "https://pay-store.line.com/images/pen_brown.jpg",
        },
      ],
    };
  });
};
