import axios from "axios";
import LoggerService from "../utilities/logger/logger.js";
import {StatusType} from "../utilities/status-enum.js";
import config from "../config/index.js";

const logger = new LoggerService("app");

export const verifyClaimUser = async (req, res, next) => {
  try {
    let retryCount = 0;
    const {web_token} = req.cookies;
    const {eclaimNo = "", orderNumber = "", transactionId = ""} = req?.body;

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
              returns(filter: {number: {eq: $number}}) {
                items {
                  ais_return_claimid
               }
              }
            }
        }`,
      variables: {
        number: orderNumber,
      },
    });

    try {
      logger.info(`verifyClaimUserRequestData`, {
        status: StatusType.SUCEESS,
        web_token,
        details: JSON.stringify(req.body),
      });
      console.log("verifyClaimUser request data", JSON.stringify(req.body));
    } catch (error) {
      console.log(`verifyClaimUserRequestData Logger Error`, error);
    }

    const verifyClaimUserFn = () => {
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
            logger.info(`verifyClaimUserGraphqlSuccess`, {
              status: StatusType.SUCEESS,
              transactionId,
              details: JSON.stringify({
                eclaimNo,
                orderNumber,
                response: response?.data,
              }),
            });
          } catch (error) {
            console.log(`verifyClaimUserGraphqlSuccess Logger Error`, error);
          }
          if (response?.status == 200 && !response?.data?.errors?.length) {
            const {items = []} = response?.data?.data?.customer?.returns;

            if (eclaimNo && items.some(item => item?.ais_return_claimid === eclaimNo)) {
              try {
                logger.info(`verifyClaimUserSuccess1`, {
                  status: StatusType.SUCEESS,
                  details: JSON.stringify(response?.data),
                });
                console.log(
                  "======response verifyClaimUser1=======",
                  JSON.stringify(response?.data)
                );
              } catch (error) {
                console.log(`verifyClaimUserSuccess1 Logger Error`, error);
              }

              next();
            } else {
              return res.status(401).json({
                error: "User not authorised",
                status: false,
                statusCode: "401",
              });
            }
          } else {
            return res.status(200).json({
              error: response?.data?.errors?.[0]?.message,
              status: false,
            });
          }
        })
        .catch(function (e) {
          try {
            logger.info(`verifyClaimUserError`, {
              status: StatusType.FAIL,
              request: req.body,
              web_token: web_token,
              details: e,
            });
            console.log(
              "======verifyClaimUser catch=======",
              JSON.stringify(response?.data)
            );
          } catch (error) {
            console.log(`verifyClaimUserError Logger Error`, error);
          }

          if (e?.status === 502 && retryCount === 0) {
            try {
              logger.info(`verifyClaimUserGraphqlError`, {
                status: StatusType.FAIL,
                request: req.body,
                web_token: web_token,
                retryCount,
                details: e,
              });
            } catch (error) {
              console.log(`verifyClaimUserGraphqlError Logger Error`, error);
            }
            retryCount++;
            verifyClaimUserFn();
          } else {
            return res.status(500).json({status: false, data: null, error: e});
          }
        });
    };
    verifyClaimUserFn();
  } catch (err) {
    try {
      logger.error(`verifyClaimUserError1`, {
        status: StatusType.FAIL,
        request: req.body,
        web_token: web_token,
        details: err,
      });
      console.log("=======verifyClaimUser catch 1==========", err);
    } catch (error) {
      console.log(`sendOTPCmd Error Logger Error 1`, error);
    }

    return res.status(500).json({error: "", status: false, statusCode: "500"});
  }
};
