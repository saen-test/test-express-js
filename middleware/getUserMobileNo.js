import axios from "axios";
import config from "../config/index.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";

const logger = new LoggerService("app");

export const getUserMobileNo = async (req, res, next) => {
  try {
    const { web_token } = req.cookies;
    const queryLine = `{customer{ais_customer_phone}}`;
    const response = await axios({
      method: "get",
      url:
        `${config.magento.graphQLApi}?query=` + encodeURIComponent(queryLine),
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        Authorization: "Bearer " + web_token,
      },
    });

    try {
      logger.info(`getUserMobileNoMagentoResponseSuccess`, {
        status: StatusType.SUCEESS,
        details: JSON.stringify(response?.data),
      });
      console.log("getUserMobileNo response ", JSON.stringify(response?.data));
    } catch (error) {
      console.log("getUserMobileNo response error", error);
    }

    if (response?.status == 200 && !response?.data?.errors?.length) {
      req.userMobileNo = response?.data?.data?.customer?.ais_customer_phone;
    }
    next();
  } catch (err) {
    try {
      logger.error(`getUserMobileNoMagentoResponseCatch`, {
        status: StatusType.FAIL,
        details: JSON.stringify(err || {}),
      });
      console.log("====getUserMobileNo catch=======", err);
    } catch (error) {
      console.log("====getUserMobileNo catch=======", error);
    }
    next();
  }
};
