import axios from "axios";
import config from "../config/index.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";

const logger = new LoggerService("app");

export const verifyUser = async (req, res, next) => {
  try {
    let retryCount = 0;
    const { web_token } = req.cookies;
    const { mobileNo = "", id = "", cartId = "" } = req?.body;

    if (!web_token) {
      return res
        .status(401)
        .json({
          error: "User not authorised",
          status: false,
          statusCode: "401",
        });
    }
    if (web_token && req?.url === "/check-kyc-profile" && !cartId) {
      return next();
    }
    const queryLine = `
    query {
      customerCart {
        items {
          ais_mobile_number
        }
        ais_otp_mobile_number
        ais_national_id
      }
    }
  `;

    const verifyUserFn = () => {
      axios({
        method: "post",
        url: config.magento.graphQLApi,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
          Authorization: "Bearer " + web_token,
        },
        data: { query: queryLine },
      })
        .then(async function (response) {
          console.log(
            "====view customer cart Magento response=======",
            response?.data
          );
          if (response?.status == 200 && !response?.data?.errors?.length) {
            logger.info(`viewCartSuccess`, {
              status: StatusType.SUCEESS,
              details: response?.data,
            });
            const {
              items = [],
              ais_otp_mobile_number = "",
              ais_national_id = "",
            } = response?.data?.data?.customerCart;
            const { ais_mobile_number = "" } = items?.[0];

            if (
              (mobileNo &&
                (mobileNo == ais_otp_mobile_number ||
                  mobileNo == ais_mobile_number)) ||
              (id && id == ais_national_id)
            ) {
              next();
            } else {
              return res
                .status(401)
                .json({
                  error: "User not authorised",
                  status: false,
                  statusCode: "401",
                });
            }
          } else {
            return res
              .status(500)
              .json({
                error: response?.data?.errors?.[0]?.message,
                status: false,
              });
          }
        })
        .catch(function (error) {
          console.log("====view customer cart catch=======", error);
          logger.error(`viewCartFail`, {
            status: StatusType.FAIL,
            details: JSON.stringify(error || {}),
          });
          if (error?.status === 502 && retryCount === 0) {
            console.log("graphql catch", error?.status, retryCount);
            retryCount++;
            verifyUserFn();
          } else {
            return res
              .status(500)
              .json({ status: false, data: null, error: error });
          }
        });
    };
    verifyUserFn();
  } catch (err) {
    console.log("====verify User catch=======", err);
    logger.error(`verifyUserFail`, {
      status: StatusType.FAIL,
      details: JSON.stringify(err || {}),
    });
    return res
      .status(401)
      .json({ error: "User not authorised", status: false, statusCode: "401" });
  }
};
