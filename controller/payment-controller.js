import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";

const logger = new LoggerService('app');

import {
  mPayBaseURL,
  mPayTopUpConfig,
  mPayStorePurchasingConfig,
  generateSignature,
} from "../utilities/payment.js";
import { allFieldsRequired } from "../utilities/validation.js";
import { getPaymentDetails } from "../utilities/getPaymentDetails.js";
import config from "../config/index.js";

export const processPayment = async (req, res) => {
  const {
    paymentMethod,
    cartDetails,
    successUrl,
    thankYouPath,
    bankCode = "",
    orderNumber,
    pageLanguage
  } = req.body;
  if (!paymentMethod || !cartDetails|| !orderNumber || !thankYouPath || !successUrl) {
    return allFieldsRequired(res);
  }
  const {web_token}=req?.cookies;
  const serviceId = mPayStorePurchasingConfig.serviceId;
  const key = mPayStorePurchasingConfig.secretKey;
  const merchantName = mPayStorePurchasingConfig.merchantName;
  const merchantId = mPayStorePurchasingConfig.merchantId;
  const orderId = orderNumber;
  const thankyouPageUrl = `${config.aem.url}${thankYouPath}?orderId=${orderId}`;
  const successPageUrl = `${config.aem.url}${successUrl}?orderId=${orderId}`;

  // const grandTotal=cartDetails?.prices?.grand_total?.value;
  let paymentDetails = await getPaymentDetails(web_token, orderNumber);
  // attempting second time in case of magento failure
  if(!paymentDetails) {
    paymentDetails = await getPaymentDetails(web_token, orderNumber);
  }

  if(!paymentDetails) {
    return res.status(500).json({ response: null, status: false });
  }

  const { grandTotal, ais_bank_details = {} } = paymentDetails;

  let productName = "AIS";
  let skinCode = "";
  if(pageLanguage?.toLowerCase() === "en"){
    productName = "AIS";
    skinCode = "omni-en";
  }
  else {
    productName = "เอไอเอส";
    skinCode = "omni-th";
  }
  
  if (paymentMethod === "creditcard") {
    const data = {
      order_id: orderId,
      product_name: productName,
      service_id: serviceId,
      channel_type: "WEBSITE",
      cust_id: web_token,
      amount: grandTotal,
      currency: "THB",
      form_type: "FORM",
      skin_code: skinCode,
      is_remember: "false",
      "3ds": {
        "3ds_required": true,
        "3ds_url_success": successPageUrl,
        "3ds_url_fail": thankyouPageUrl,
      },
    };

    try {
      logger.info(`creditcardPaymentRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });
      console.log("============creditcard payment request===============", JSON.stringify(data));
    } catch (error) {
      console.log(`creditcardPaymentRequestData Logger Error`, error);
    }

    const nonce = uuidv4();
    const signature = generateSignature(data, key, nonce);
    axios({
      method: "post",
      url: mPayBaseURL + "/service-txn-gateway/v1/cc/txns/payment_order",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-sdpg-merchant-id": merchantId,
        "X-sdpg-signature": signature,
        "X-sdpg-nonce": nonce,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: data,
    })
    .then((result) => {
      try {
        logger.info(`creditcardPaymentSuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(result?.data) });
        console.log("============creditcard payment success===============",JSON.stringify(result.data));
      } catch (error) {
        console.log("creditcard Payment Success logger error ", error);
      }
      return res.status(200).json(result.data);
    })
    .catch((err) => {
      try {
        logger.error(`creditcardPaymentError`, { status: StatusType.FAIL, details: err });
        console.log("============creditcard payment failed===============",err);
      } catch (error) {
        console.log("creditcardPayment Error logger error ", error);
      }
      
      return res.status(err?.response?.status || 500).json(err);
    });
  } else if (paymentMethod === "bank-transfer") {
  } else if (paymentMethod === "internet-banking") {
    const data = {
      service_id: serviceId,
      channel_type: "WEBSITE",
      product_name: "AIS",
      order_id: orderId,
      bank_code: bankCode,
      currency: "THB",
      amount: grandTotal,
      redirect_urls: {
        url_success: successPageUrl,
        url_fail: thankyouPageUrl,
      },
    };

    try {
      logger.info(`InternetBankingPaymentRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });
      console.log("============Internet-banking payment request===============", JSON.stringify(data));
    } catch (error) {
      console.log(`InternetBankingPaymentRequestData Logger Error`, error);
    }

    const nonce = uuidv4();
    const signature = generateSignature(data, key, nonce);
    axios({
      method: "post",
      url: mPayBaseURL + "/service-txn-gateway/v1/ib/payment_order",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-sdpg-merchant-id": merchantId,
        "X-sdpg-signature": signature,
        "X-sdpg-nonce": nonce,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: data,
    })
    .then((resp) => {
      try {
        logger.info(`InternetBankingPaymentSuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(resp?.data) });
        console.log("============Internet-banking payment Success===============",JSON.stringify(resp?.data));
      } catch (error) {
        console.log("InternetBankingPayment Success logger error ", error);
      }
      
      return res.status(200).json(resp.data);
    })
    .catch((err) => {
      try {
        logger.error(`InternetBankingPaymentError`, { status: StatusType.FAIL, details: err });
        console.log("============Internet-banking payment Failed===============",err);
      } catch (error) {
        console.log("InternetBanking Error logger error ", error);
      }
      
      return res.status(200).json(err);
    });
  } else if (paymentMethod === "qr-code") {
    const data = {
      order_id: orderId,
      product_name: "AIS",
      sof: "PROMPTPAY",
      service_id: serviceId,
      amount: grandTotal,
      currency: "THB",
      expire_time_seconds: 3600,
    };

    try {
      logger.info(`QRPaymentRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });
      console.log("============QR payment request===============", JSON.stringify(data));
    } catch (error) {
      console.log(`QRPaymentRequestData Logger Error`, error);
    }

    const nonce = uuidv4();
    const signature = generateSignature(data, key, nonce);
    axios({
      method: "post",
      url: mPayBaseURL + "/service-txn-gateway/v1/qr",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-sdpg-merchant-id": merchantId,
        "X-sdpg-signature": signature,
        "X-sdpg-nonce": nonce,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: data,
    })
    .then((resp) => {
      try {
        logger.info(`QRPaymentSuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(resp?.data) });
        console.log("============QR payment Success===============",JSON.stringify(resp?.data));
      } catch (error) {
        console.log("QR Success logger error ", error);
      }
      
      return res.status(200).json(resp.data);
    })
    .catch((err) => {
      try {
        logger.error(`QRPaymentError`, { status: StatusType.FAIL, details: err });
        console.log("============QR payment failed===============",err);
      } catch (error) {
        console.log("QR Payment Error logger error ", error);
      }
      
      return res.status(200).json(err);
    });
  } else if (paymentMethod === "installment") {
    const data = {
      amount: grandTotal,
      order_id: orderId,
      product_name: productName,
      service_id: serviceId,
      channel_type: "WEBSITE",
      cust_id: web_token,
      plan_id: ais_bank_details.installment_plan_id,
      term: ais_bank_details.installment_term,
      flag_installment: true,
      form_type: "FORM",
      is_remember: "false",
      currency: "THB",
      skin_code: skinCode,
      "3ds": {
        "3ds_required": true,
        "3ds_url_success": successPageUrl,
        "3ds_url_fail": thankyouPageUrl,
      },
    };

    try {
      logger.info(`InstallmentPaymentRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });
      console.log("============Installment payment request===============", JSON.stringify(data));
    } catch (error) {
      console.log(`InstallmentPaymentRequestData Logger Error`, error);
    }

    const nonce = uuidv4();
    const signature = generateSignature(data, key, nonce);
    let response;
    axios({
      method: "post",
      url: mPayBaseURL + "/service-txn-gateway/v1/inst/txns/payment",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-sdpg-merchant-id": merchantId,
        "X-sdpg-signature": signature,
        "X-sdpg-nonce": nonce,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: data,
    })
    .then((resp) => {
      try {
        logger.info(`InstallmentPaymentSuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(resp?.data) });
        console.log("============installment payment success===============",JSON.stringify(resp?.data));
      } catch (error) {
        console.log("InstallmentPayment Success logger error ", error);
      }
      
      return res.status(200).json(resp.data);
    })
    .catch((err) => {
      try {
        logger.error(`InstallmentPaymentError`, { status: StatusType.FAIL, details: err });
        console.log("============installment payment failed===============",err);
      } catch (error) {
        console.log("Installment Payment Error logger error ", error);
      }
      
      return res.status(200).json(err);
    });
  } else if (paymentMethod === "rabbit") {
    // const orderId = uuidv4();
    const redirectUrl = config.aem?.url + thankYouPath + "?orderId=" + orderId;
    const data = {
      order_id: orderId,
      product_name: "AIS",
      service_id: serviceId,
      channel_type: "WEBSITE",
      cust_id: web_token,
      amount: grandTotal,
      currency: "THB",
      packages: [
        {
          id: "1",
          amount: grandTotal,
          products: [
            {
              id: "AIS",
              name: "AIS Online Store",
              image_url: "https://pay-store.line.com/images/pen_brown.jpg",
              quantity: 1,
              price: grandTotal,
            },
          ],
        },
      ],
      redirect_urls: {
        confirm_url: successPageUrl,
        cancel_url: redirectUrl,
      },
    };

    try {
      logger.info(`RabbitLinePaymentRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });
      console.log("============RabbitLine payment request===============", JSON.stringify(data));
    } catch (error) {
      console.log(`RabbitLinePaymentRequestData Logger Error`, error);
    }

    const nonce = uuidv4();
    const signature = generateSignature(data, key, nonce);
    axios({
      method: "post",
      url: mPayBaseURL + "/service-txn-gateway/v1/rlp/txns/payment",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-sdpg-merchant-id": merchantId,
        "X-sdpg-signature": signature,
        "X-sdpg-nonce": nonce,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: data,
    })
    .then((resp) => {
      try {
        logger.info(`RabbitLinePaymentSuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(resp?.data) });
        console.log("============RabbitLine payment Success===============",JSON.stringify(resp?.data));
      } catch (error) {
        console.log("RabbitLinePayment Success logger error ", error);
      }
      
      return res.status(200).json(resp.data);
    })
    .catch((err) => {
      try {
        logger.error(`RabbitLinePaymentError`, { status: StatusType.FAIL, details: err });
        console.log("============RabbitLine payment Failed===============",err);
      } catch (error) {
        console.log("RabbitLinePayment Error logger error ", error);
      }
      return res.status(200).json(err);
    });
  } else {
    try {
      logger.error(`processPaymentError`, { status: StatusType.FAIL, details: "Invalid payment method" });
    } catch (error) {
      console.log("processPayment Error logger error ", error);
    }
    
    return res.status(400).json({ error: "Invalid payment method" });
  }
};

export const paymentEnquiry = async (req, res) => {
  const { paymentMethod, cartDetails = {}, orderNumber } = req.body;
  const {web_token}=req?.cookies;

  const { cartId, prices } = cartDetails;

  if (!paymentMethod || (!cartId && !orderNumber && !prices)) {
    return allFieldsRequired(res);
  }

  const serviceId = mPayStorePurchasingConfig.serviceId;
  const merchantId = mPayStorePurchasingConfig.merchantId;
  const key = mPayStorePurchasingConfig.secretKey;

  if (paymentMethod === "enquiry") {
    const data = {
      order_id: orderNumber,
    };
    const nonce = uuidv4();
    const signature = generateSignature(data, key, nonce);

    try {
      logger.info(`paymentEnquiryRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });
      console.log("============Payment Enquiry request===============", JSON.stringify(data));
    } catch (error) {
      console.log(`paymentEnquiryRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: mPayBaseURL + "/service-txn-gateway/v1/enquiry",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-sdpg-merchant-id": merchantId,
        "X-sdpg-signature": signature,
        "X-sdpg-nonce": nonce,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: data,
    })
    .then((resp) => {
      try {
        logger.info(`paymentEnquirySuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(resp?.data) });
        console.log("paymentEnquiry Success ", JSON.stringify(resp?.data));
      } catch (error) {
        console.log("paymentEnquiry Success logger error ", error);
      }
      return res.status(200).json(resp.data);
    })
    .catch((err) => {
      try {
        logger.error(`paymentEnquiryError`, { status: StatusType.FAIL, details: err });
        console.log("paymentEnquiry Error ", err);
      } catch (error) {
        console.log("paymentEnquiry Error logger error ", error);
      }
      return res.status(200).json(err);
    });
  } else if (paymentMethod === "installment") {
    let grandTotal = "";
    if(prices) {
      grandTotal = prices?.grand_total?.value;
    } else {
      let paymentDetails = await getPaymentDetails(web_token, orderNumber, cartId);

      console.log("paymentDetails ", JSON.stringify(paymentDetails));
      // attempting second time in case of magento failure
      if(!paymentDetails) {
        paymentDetails = await getPaymentDetails(web_token, orderNumber, cartId);
      }

      if(!paymentDetails) {
        return res.status(500).json({ response: null, status: false });
      }
      grandTotal = paymentDetails.grandTotal;
    }

    const data = {
      merchant_id: merchantId,
      service_id: serviceId,
      product_code: constant.MPAY_STORE_MERCHANT_NAME,
      product_amt: grandTotal,
    };
    const nonce = uuidv4();
    const signature = generateSignature(data, key, nonce);

    try {
      logger.info(`InstallmentPaymentEnquiryRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });
      console.log("============Installment Payment Enquiry request===============", JSON.stringify(data));
    } catch (error) {
      console.log(`InstallmentPaymentEnquiryRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: mPayBaseURL + "/service-txn-gateway/v1/inst/inquiry_plan",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-sdpg-merchant-id": merchantId,
        "X-sdpg-signature": signature,
        "X-sdpg-nonce": nonce,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: data,
    })
      .then((resp) => {
        try {
          logger.info(`InstallmentPaymentEnquirySuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(resp?.data) });
          console.log("InstallmentPaymentEnquiry Success ", JSON.stringify(resp?.data));
        } catch (error) {
          console.log("InstallmentPaymentEnquiry Success logger error ", error);
        }
        return res.status(200).json(resp.data);
      })
      .catch((err) => {
        try {
          logger.error(`InstallmentPaymentEnquiryError`, { status: StatusType.FAIL, details: err });
          console.log("InstallmentPaymentEnquiry Error ", err);
        } catch (error) {
          console.log("InstallmentPaymentEnquiry Error logger error ", error);
        }
        return res.status(200).json(err);
      });
  }
};

export const paymentTopUp = async (req, res) => {
  let {
    paymentMethod,
    phoneNumber,
    amount,
    thankYouPath = "/content/ais/testing-language-master/en_us/thankyou",
  } = req.body;
  amount = amount.replace(/[^0-9.]/g, "");
  if (!paymentMethod || !amount || isNaN(amount) || !phoneNumber) {
    return allFieldsRequired(res);
  }
  const serviceId = mPayTopUpConfig.serviceId;
  const key = mPayTopUpConfig.secretKey;
  const orderId = `${phoneNumber}-${Date.now()}`;
  const thankyouPageUrl = `${config.aem.url}${thankYouPath}?orderId=${orderId}`;
  if (paymentMethod === "creditcard") {
    const data = {
      order_id: orderId,
      product_name: mPayTopUpConfig.merchantName,
      service_id: serviceId,
      channel_type: "WEBSITE",
      cust_id: phoneNumber,
      amount: parseFloat(amount).toFixed(2),
      currency: "THB",
      form_type: "FORM",
      skin_code: "mpay",
      is_remember: "false",
      "3ds": {
        "3ds_required": true,
        "3ds_url_success": thankyouPageUrl,
        "3ds_url_fail": thankyouPageUrl,
      },
    };

    try {
      logger.info(`creditcardPaymentTopUpRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });
      console.log("============creditcardPaymentTopUp request===============", JSON.stringify(data));
    } catch (error) {
      console.log(`creditcardPaymentTopUpRequestData Logger Error`, error);
    }

    const nonce = uuidv4();
    const signature = generateSignature(data, key, nonce);
    axios({
      method: "post",
      url: mPayBaseURL + "/service-txn-gateway/v1/cc/txns/payment_order",
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
        "X-sdpg-merchant-id": mPayTopUpConfig.merchantId,
        "X-sdpg-signature": signature,
        "X-sdpg-nonce": nonce,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: data,
    })
    .then((result) => {
      try {
        logger.info(`creditcardPaymentTopUpSuccess`, { status: StatusType.SUCEESS, mobileNo: phoneNumber, details: JSON.stringify(result?.data) });
        console.log("creditcard Payment TopUp Success ", JSON.stringify(result?.data));
      } catch (error) {
        console.log("creditcardPaymentTopUp Success logger error ", error);
      }
      return res.status(200).json(result.data);
    })
    .catch((err) => {
      try {
        logger.error(`creditcardPaymentTopUpError`, { status: StatusType.FAIL, mobileNo: phoneNumber, details: err });
        console.log("creditcard Payment TopUp Error ", err);
      } catch (error) {
        console.log("creditcardPaymentTopUp Error logger error ", error);
      }
      
      return res.status(err?.response?.status || 500).json(err);
    });
  }
};
