import axios from "axios";
import config from "../config/index.js";
import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";
import moment from "moment";

const logger = new LoggerService("app");
let token = false;
let expire = false;
let channelToken = false;
export const getTokenFromPrivilege = async (channel) => {
  const transactionId = Math.floor(Math.random() * 1000) + "_" + Date.now();
  try {
    const { privilege } = config.endPoint;
    let username = privilege.privilege.userName;
    let password = privilege.privilege.password;
    if (channel?.toLowerCase()?.trim() == "point") {
      username = privilege.point.userName;
      password = privilege.point.password;
    } else if (channel?.toLowerCase()?.trim() == "serenade") {
      username = privilege.serenade.userName;
      password = privilege.serenade.password;
    }

    const requestData = {
      transactionID: transactionId,
      username: username,
      password: password,
    };

    const logRequestData = {
      transactionID: transactionId,
      username: username,
    };

    try {
      logger.info(`getTokenFromPrivilege`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(logRequestData),
      });
      console.log("getTokenFromPrivilege request data");
    } catch (error) {
      logger.error(`getTokenFromPrivilegeError`, {
        status: StatusType.FAIL,
        transactionId,
        details: error,
      });
      console.log(`getTokenFromPrivilege Logger Error`, error);
    }

    axios({
      method: "post",
      url: privilege.getToken,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        // Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        console.log(response);
        try {
          logger.info(`getTokenFromPrivilegeSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====getTokenFromPrivilege response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          logger.error(`getTokenFromPrivilegeError`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log(
            "getTokenFromPrivilegeSuccess Success logger error ",
            error
          );
        }
        token = response.data?.token;
        expire = response.data?.expirationDate;
        return token;
      })
      .catch(function (error) {
        try {
          logger.error(`getTokenFromPrivilegeError`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("====getTokenFromPrivilege error=======", error);
        } catch (error) {
          logger.error(`getTokenFromPrivilegeError`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("getTokenFromPrivilege Error logger error ", error);
        }
        return false;
      });
  } catch (e) {
    try {
      logger.error(`getTokenFromPrivilege`, {
        status: StatusType.FAIL,
        transactionId,
        details: JSON.stringify(e),
      });
      console.log("====getTokenFromPrivilege error catch=======", e);
    } catch (error) {
      logger.error(`getTokenFromPrivilegeError`, {
        status: StatusType.FAIL,
        transactionId,
        details: error,
      });
      console.log("getTokenFromPrivilege Error logger error catch ", error);
    }
    return false;
  }
};

export const getTokenFromStorage = async (channel) => {
  if (
    token &&
    expire &&
    channelToken &&
    channelToken.toLowerCase().trim() === channel.toLowerCase().trim() &&
    moment().format("YYYY-MM-DD") <= moment(expire).format("YYYY-MM-DD")
  ) {
    console.log("getTokenFromStorage : " + token);
    return token;
  }

  channelToken = channel.toLowerCase().trim();
  token = await getTokenFromPrivilege(channelToken);
  console.log("getTokenFromPrivilege : " + token);
  return token;
};
