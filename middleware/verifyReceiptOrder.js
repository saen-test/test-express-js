import axios from "axios";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";
import config from "../config/index.js";
import { randomUUID } from "crypto";

const logger = new LoggerService("app");

export const verifyReceiptOrder = async (req, res, next) => {
  try {
    let retryCount = 0;
    const { web_token } = req.cookies;
    const { orderNumber = "" } = req?.body;

    const transactionId = randomUUID();

    if (!web_token) {
      return res.status(401).json({
        error: "User not authorised",
        status: false,
        statusCode: "401",
      });
    }

    const data = JSON.stringify({
      query: `query customer($number: String!) {
            customer {
            orders(filter: {number: {eq: $number }}) {
                    items {
                        ais_receipt_no
                    }
                }   
            }
        }`,
      variables: {
        number: orderNumber,
      },
    });

    try {
      logger.info(`verifyReceiptOrderRequestData`, {
        status: StatusType.SUCEESS,
        web_token,
        details: JSON.stringify(req.body),
      });
      console.log("verifyReceiptOrder request data", JSON.stringify(req.body));
    } catch (error) {
      console.log(`verifyReceiptOrderRequestData Logger Error`, error);
    }

    const verifyReceiptOrderFn = () => {
      axios({
        method: "post",
        url: config.magento.graphQLApi,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
          Authorization: "Bearer " + web_token,
        },
        data: data,
      })
        .then(async function (response) {
          try {
            logger.info(`verifyReceiptOrderGraphqlSuccess`, {
              status: StatusType.SUCEESS,
              transactionId,
              details: JSON.stringify({
                orderNumber,
                response: response?.data,
              }),
            });
          } catch (error) {
            console.log(`verifyReceiptOrderGraphqlSuccess Logger Error`, error);
          }
          if (response?.status == 200 && !response?.data?.errors?.length) {
            const { items = [] } = response?.data?.data?.customer?.orders;

            if (items[0]?.ais_receipt_no) {
              try {
                logger.info(`verifyReceiptOrderSuccess1`, {
                  status: StatusType.SUCEESS,
                  details: JSON.stringify(response?.data),
                });
                console.log(
                  "======response verifyReceiptOrder1=======",
                  JSON.stringify(response?.data)
                );
              } catch (error) {
                console.log(`verifyReceiptOrderSuccess1 Logger Error`, error);
              }
              let receiptNoArr = JSON.parse(items[0]?.ais_receipt_no);

              req.body.receiptNo = receiptNoArr[0]?.receiptNo;
              req.body.company = receiptNoArr[0]?.receiptCompany;
              req.body.transactionId = transactionId;
              next();
            } else {
              return res.status(404).json({
                error: "eReceipt not found",
                status: false,
                statusCode: "404",
              });
            }
          } else {
            return res.status(500).json({
              error: response?.data?.errors?.[0]?.message,
              status: false,
            });
          }
        })
        .catch(function (e) {
          try {
            logger.info(`verifyReceiptOrderError`, {
              status: StatusType.FAIL,
              request: req.body,
              web_token: web_token,
              details: e,
            });
            console.log(
              "======verifyReceiptOrder catch=======",
              JSON.stringify(e)
            );
          } catch (error) {
            console.log(`verifyReceiptOrderError Logger Error`, error);
          }

          if (e?.status === 502 && retryCount === 0) {
            try {
              logger.info(`verifyReceiptOrderGraphqlError`, {
                status: StatusType.FAIL,
                request: req.body,
                web_token: web_token,
                retryCount,
                details: e,
              });
            } catch (error) {
              console.log(`verifyReceiptOrderGraphqlError Logger Error`, error);
            }
            retryCount++;
            verifyReceiptOrderFn();
          } else {
            return res
              .status(500)
              .json({ status: false, data: null, error: e });
          }
        });
    };
    verifyReceiptOrderFn();
  } catch (err) {
    try {
      logger.error(`verifyReceiptOrderError1`, {
        status: StatusType.FAIL,
        request: req.body,
        web_token: web_token,
        details: err,
      });
      console.log("=======verifyReceiptOrder catch 1==========", err);
    } catch (error) {
      console.log(`sendOTPCmd Error Logger Error 1`, error);
    }

    return res
      .status(500)
      .json({ error: "", status: false, statusCode: "500" });
  }
};
