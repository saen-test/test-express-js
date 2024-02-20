import axios from "axios";
import config from "../config/index.js";
import LoggerService from "./logger/logger.js";
import { StatusType } from "./status-enum.js";

const logger = new LoggerService("app");

const getMagentoUrl = (orderNumber, cartId) => {
  const baseUrl = `${config.magento.graphQLApi}?query=`;
  let queryLine = "";
  let variables = "";

  if(orderNumber) {
    orderNumber = orderNumber.length >= 18 ? orderNumber.slice(0, -6) : orderNumber;
    queryLine = "query customer($number:String!){customer{orders(filter:{number:{eq:$number}}){total_count items{ais_bank_details total{grand_total{value }}}}}}";
    variables = `{"number":"${orderNumber}"}`;
  } else if(cartId) {
    queryLine = "query($cart_id:String!){cart(cart_id:$cart_id){prices{grand_total{value}}}}";
    variables = `{"cart_id":"${cartId}"}`;
  }
  const requestUrl = `${encodeURIComponent(queryLine)}&variables=${encodeURIComponent(variables)}`;
  console.log("getPaymentDetails Magento url ", baseUrl+requestUrl);
  return baseUrl+requestUrl;
};

export const getPaymentDetails = async (web_token, orderNumber, cartId) => {
  console.log("getPaymentDetails params web_token ", web_token, "orderNumber ", orderNumber, "cartId ", cartId);
  try {
    const response = await axios({
      method: "get",
      url: getMagentoUrl(orderNumber, cartId),
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        Authorization: "Bearer " + web_token,
      }
    });
    
    console.log("getPaymentDetails response ", JSON.stringify(response?.data));
    if (response?.status == 200 && !response?.data?.errors?.length) {
      logger.info(`viewCustomerCartMagentoResponseSuccess`, {
        status: StatusType.SUCEESS,
        details: response?.data,
      });

      const paymentData = {};

      if(orderNumber) {
        const orderData = response?.data?.data?.customer?.orders?.items?.[0];
        if(!orderData) {
          return null;
        }
        paymentData.grandTotal = orderData?.total?.grand_total?.value;
        paymentData.ais_bank_details = JSON.parse(orderData?.ais_bank_details || "{}");
      } else if(cartId) {
        const cartData = response?.data?.data?.cart;
        paymentData.grandTotal = cartData?.prices?.grand_total?.value;
      }

      console.log("paymentData ", paymentData);

      return paymentData;
    }
    return null;
  } catch (err) {
    console.log("====getPaymentDetails catch=======", err);
    logger.error(`getPaymentDetailsFail`, {
      status: StatusType.FAIL,
      details: JSON.stringify(err || {}),
    });
    return null;
  }
};
        