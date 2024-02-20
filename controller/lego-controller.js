import axios from "axios";
import { allFieldsRequired, validateEmail } from "../utilities/validation.js";
import config from "../config/index.js";
import { randomUUID } from "crypto";
import moment from "moment";
import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";

const logger = new LoggerService("app");

const SubscriptionKey = constant.LEGO_SUBSCRIPTION_KEY;
const performanceTestingEnabled = constant.PERFORMANCE_TESTING_ENABLED;
const isPTEnabled =
  performanceTestingEnabled === true || performanceTestingEnabled === "true";
/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : send otp to customer mobile no.
  Input Params: 
*/

export const sendOTPCmd = async (req, res) => {
  try {
    let { emailId, mobileNo, channel, userToken } = req.body;
    if (!isPTEnabled && !channel) {
      return allFieldsRequired(res);
    }
    if (!isPTEnabled && channel == "email" && !emailId) {
      mobileNo = "";
      return allFieldsRequired(res);
    } else if (!isPTEnabled && channel == "mobile" && !mobileNo) {
      emailId = "";
      return allFieldsRequired(res);
    }
    if (channel == "mobile" && mobileNo) {
      mobileNo = mobileNo.replace(/\D/g, "");
      if (mobileNo.slice(0, 1) == "0") {
        mobileNo = "66" + mobileNo.slice(1);
      }
    }
    const transactionId = randomUUID();

    const requestData = {
      transactionID: transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      otpDigit: "6",
      refDigit: "6",
      emailAddr: emailId,
      msisdn: mobileNo,
    };

    try {
      logger.info(`sendOTPCmdRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("sendOTPCmd request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`sendOTPCmdRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.otp.send,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          referenceNumber: response?.data?.result?.referenceNumber || "",
          transactionId: response.data?.transactionID || "",
          lifeTimeoutMins: response?.data?.result?.lifeTimeoutMins || "",
          expirePassword: response?.data?.result?.expirePassword || "",
          transactionOtpId: response?.data?.result?.transactionID || "",
          FBBContactNo: response?.data?.result?.FBBContactNo || "",
        };
        if (response?.data?.resultCode === "20000") {
          try {
            logger.info(`sendOTPCmdSuccess`, {
              status: StatusType.SUCEESS,
              mobileNo,
              transactionId,
              details: JSON.stringify(response?.data),
            });
            console.log(
              "======response sendOTPCmd=======",
              JSON.stringify(response?.data)
            );
          } catch (error) {
            console.log(`sendOTPCmd Success Logger Error`, error);
          }
          return res.status(200).json({ response: result, status: true });
        } else {
          try {
            logger.error(`sendOTPCmdError1`, {
              status: StatusType.FAIL,
              mobileNo,
              transactionId,
              details: JSON.stringify(response?.data),
            });
            console.log(
              "====Error Response sendOTPCmd=======",
              JSON.stringify(response?.data)
            );
          } catch (error) {
            console.log(`sendOTPCmd Error Logger Error`, error);
          }
          return res.status(500).json({
            response: response?.data,
            message: "Failed",
            status: false,
          });
        }
      })
      .catch(function (error) {
        try {
          logger.info(`sendOTPCmdCatch`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========sendOTPCmd Catch 1=========", error);
        } catch (error) {
          console.log(`sendOTPCmd Error Logger Error 1`, error);
        }

        return res.status(500).json({
          response: {},
          status: false,
          error: {
            message: error?.message,
            status: error?.status,
            code: error?.code,
          },
        });
        // return res
        //   .status(500)
        //   .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`sendOTPCmdError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("=======sendOTPCmd Catch 2==========", e);
    } catch (error) {
      console.log(`sendOTPCmd Error Logger Error 2`, error);
    }

    return res.status(500).json({ response: null, error: e, status: false });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : confirm customer otp
  Input Params: 
*/

export const validateOTPCmd = async (req, res, next) => {
  try {
    let { otp, account, transactionId, transactionOTPId, requestFrom } =
      req.body;
    if (
      !isPTEnabled &&
      (!otp || !account || !transactionId || !transactionOTPId)
    ) {
      return allFieldsRequired(res);
    }
    const flagValidateEmail = validateEmail(account);
    if (!flagValidateEmail) {
      account = account.replace(/\D/g, "");
      if (account.slice(0, 1) == "0") {
        account = "66" + account.slice(1);
      }
    }
    const requestData = {
      transactionID: transactionId,
      msisdn: !flagValidateEmail ? account : "",
      emailAddr: flagValidateEmail ? account : "",
      pwd: otp,
      transactionIDFromOTP: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : transactionOTPId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
    };
    try {
      logger.info(`confirmOtpRequestData`, {
        status: StatusType.SUCEESS,
        account,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("confirm otp lego requestData ", JSON.stringify(requestData));
    } catch (error) {
      console.log(`confirmOtpRequestData Logger Error`, error);
    }
    axios({
      method: "post",
      url: config.endPoint.otp.verify,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionId: response.data?.transactionID,
          isSuccess: response.data?.result?.isSuccess?.toLowerCase(),
          msg: response.data?.result?.description,
        };

        if (response?.data?.resultCode === "20000") {
          try {
            logger.info(`validateOTPCmdSuccess`, {
              status: StatusType.SUCEESS,
              account,
              transactionId,
              details: JSON.stringify(response?.data),
            });
            console.log(
              "====response validateOTPCmd=======",
              JSON.stringify(response?.data)
            );
          } catch (error) {
            console.log(`validateOTPCmd Logger Error`, error);
          }
          if (requestFrom === "checkout") {
            next();
          } else {
            return res
              .status(200)
              .json({ response: result, status: true, result: response?.data });
          }
        } else {
          try {
            logger.error(`validateOTPCmdError1`, {
              status: StatusType.FAIL,
              account,
              transactionId,
              details: JSON.stringify(response?.data),
            });
          } catch (error) {
            console.log(`validateOTPCmd Error Logger Error 1`, error);
          }

          return res.status(500).json({
            response: response?.data,
            message: "Failed",
            status: false,
          });
        }
      })
      .catch(function (error) {
        try {
          logger.error(`validateOTPCmdError2`, {
            status: StatusType.FAIL,
            account,
            transactionId,
            details: error,
          });
          console.log("=========catch validateOTPCmd=======", error);
        } catch (error) {
          console.log(`validateOTPCmd Error Logger Error 2`, error);
        }

        return res.status(500).json({
          response: {},
          status: false,
          error: {
            message: error?.message,
            status: error?.status,
            code: error?.code,
          },
        });
      });
    //res.send('sendOTPCmd Info');
  } catch (e) {
    try {
      logger.error(`validateOTPCmdError3`, {
        status: StatusType.FAIL,
        account: req.body.account,
        transactionId,
        details: e,
      });
      console.log("=======error catch validateOTPCmd======", e);
    } catch (error) {
      console.log(`validateOTPCmd Error Logger Error 3`, error);
    }

    return res.send({
      res: e,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : fetch customer points
  Input Params: 
*/

export const getQueryPoint = async (req, res) => {
  const { account } = req.body;
  console.log("isPTEnabled ", isPTEnabled);
  if (!isPTEnabled && !account) {
    return allFieldsRequired(res);
  }

  const transactionId = randomUUID();
  const requestData = {
    referWebSessionID: config.endPoint.referChannel + transactionId,
    referChannel: isPTEnabled
      ? config.endPoint.referChannelPerfTest
      : config.endPoint.referChannel,
    referChannelIP: " ",
    transactionID: transactionId,
    msisdn: account,
  };

  try {
    logger.info(`getQueryPointRequestData`, {
      status: StatusType.SUCEESS,
      account,
      transactionId,
      details: JSON.stringify(requestData),
    });
    console.log("getQueryPoint request data", JSON.stringify(requestData));
  } catch (error) {
    console.log(`getQueryPointRequestData Logger Error`, error);
  }

  try {
    axios({
      method: "post",
      url: config.endPoint.queryPoint,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const data = {
          transactionId: response?.data?.transactionID,
          resultCode: "20000",
          resultMessage: "Success.",
          isSuccess: response?.data?.resultCode == "20000" || false,
          points: response?.data?.result?.points || 0,
          pointsBonus: response?.data?.result?.pointsBonus || 0,
          totalPoint: response?.data?.result?.totalPoint || 0,
        };

        if (
          response?.data?.resultCode &&
          response?.data?.resultCode == "20000"
        ) {
          try {
            logger.info(`getQueryPointSuccess`, {
              status: StatusType.SUCEESS,
              account,
              transactionId,
              details: JSON.stringify(response?.data),
            });
            console.log(
              "====response getQueryPoint=======",
              JSON.stringify(response?.data)
            );
          } catch (error) {
            console.log(`getQueryPoint Success Logger Error`, error);
          }
          return res.status(200).json({ status: true, response: data });
        } else {
          try {
            logger.error(`getQueryPointError1`, {
              status: StatusType.FAIL,
              account,
              transactionId,
              details: JSON.stringify(response?.data),
            });
            console.log(
              "==========Error Response getQueryPoint=========",
              JSON.stringify(response?.data)
            );
          } catch (error) {
            console.log(`getQueryPoint Error Logger Error 1`, error);
          }
          return res.status(500).json({
            status: false,
            response: null,
            error: "Something went wrong.",
          });
        }
      })
      .catch(function (error) {
        try {
          logger.error(`getQueryPointError2`, {
            status: StatusType.FAIL,
            account,
            transactionId,
            details: error,
          });
          console.log("====getQueryPoint Catch 1=======", error);
        } catch (error) {
          console.log(`getQueryPoint Error Logger Error 2`, error);
        }

        return res
          .status(500)
          .json({ status: false, response: null, error: error });
      });
    // return res.send("sdfsd sdfsdf");
  } catch (e) {
    try {
      logger.error(`getQueryPointError3`, {
        status: StatusType.FAIL,
        account,
        transactionId,
        details: e,
      });
      console.log("====getQueryPoint Catch 2=======", e);
    } catch (error) {
      console.log(`getQueryPoint Error Logger Error 3`, error);
    }

    return res.status(500).json({
      response: e,
      error: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : validate fbb 
  Input Params: 
*/

export const validateFiberFBB = async (req, res) => {
  const { mobileNo, ip = "127.0.0.1" } = req.body;
  if (!isPTEnabled && (!mobileNo || !ip)) {
    return allFieldsRequired(res);
  }

  const transactionId = randomUUID();
  const requestData = {
    referWebSessionID: config.endPoint.referChannel + transactionId,
    referChannel: isPTEnabled
      ? config.endPoint.referChannelPerfTest
      : config.endPoint.referChannel,
    referChannelIP: ip,
    transactionID: transactionId,
    mobileNo: mobileNo,
  };

  try {
    logger.info(`validateFiberFBBRequestData`, {
      status: StatusType.SUCEESS,
      mobileNo,
      transactionId,
      details: JSON.stringify(requestData),
    });
    console.log("validateFiberFBB request data", JSON.stringify(requestData));
  } catch (error) {
    console.log(`validateFiberFBBRequestData Logger Error`, error);
  }

  try {
    axios({
      method: "post",
      url: config.endPoint.fbb.validateMobile,
      headers: {
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: response?.data?.transactionID,
          customerType: response?.data?.result?.customerType || "",
          aisFlag: response?.data?.result?.aisFlag || "N",
          residentialFlag: response?.data?.result?.residentialFlag || "N",
        };
        try {
          logger.info(`validateFiberFBBSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response validateFiberFBB=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`validateFiberFBB Success Logger Error`, error);
        }
        return res.status(200).json({
          response: result,
          status:
            response?.data?.resultMessage?.toLowerCase()?.trim() ==
              "success." || false,
        });
      })
      .catch(function (error) {
        console.log("====error=======");
        console.log(error);
        try {
          logger.error(`validateFiberFBBError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========validateFiberFBB Catch 1=========", error);
        } catch (error) {
          console.log(`validateFiberFBB Error Logger Error 1`, error);
        }
        return res.status(500).json({
          message: "Something went wrong.Please try in sometime!",
          status: false,
        });
      });
    // return res.send("sdfsd sdfsdf");
  } catch (e) {
    try {
      logger.error(`validateFiberFBBError2`, {
        status: StatusType.FAIL,
        mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========validateFiberFBB Catch 2=========", e);
    } catch (error) {
      console.log(`validateFiberFBB Error Logger Error 2`, error);
    }

    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : check coverage 
  Input Params: 
*/

export const checkFiberFBBCoveragePort = async (req, res) => {
  const {
    ip = "127.0.0.1",
    addressType,
    lang = "E",
    buildingNo,
    buildingName,
    floor,
    unitNo,
    subDistricName,
    zipCode,
    latitude,
    longitude,
    phoneFlag,
  } = req.body;
  const transactionId = randomUUID();
  let result;

  const requestData = {
    referWebSessionID: config.endPoint.referChannel + transactionId,
    referChannel: isPTEnabled
      ? config.endPoint.referChannelPerfTest
      : config.endPoint.referChannel,
    referChannelIP: ip,
    transactionID: transactionId,
    addressType: addressType,
    language: lang,
    buildingNo: buildingNo,
    buildingName: buildingName,
    floorNo: floor,
    unitNo: unitNo,
    subDistricName: subDistricName,
    zipCode: zipCode,
    phoneFlag: phoneFlag,
    latitude: latitude,
    longitude: longitude,
  };

  try {
    logger.info(`checkFiberFBBCoveragePortRequestData`, {
      status: StatusType.SUCEESS,
      transactionId,
      details: JSON.stringify(requestData),
    });
    console.log(
      "checkFiberFBBCoveragePort request data",
      JSON.stringify(requestData)
    );
  } catch (error) {
    console.log(`checkFiberFBBCoveragePortRequestData Logger Error`, error);
  }

  try {
    axios({
      method: "post",
      url: config.endPoint.fbb.checkCoveragePort,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          ...response?.data,
        };
        try {
          logger.info(`checkFiberFBBCoveragePortSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response checkFiberFBBCoveragePort=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`checkFiberFBBCoveragePort Success Logger Error`, error);
        }
        return res.send({ response: result, status: true });
      })
      .catch(function (error) {
        try {
          logger.error(`checkFiberFBBCoveragePortError1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log(
            "====Error Response checkFiberFBBCoveragePort=======",
            error
          );
        } catch (error) {
          console.log(`checkFiberFBBCoveragePort Error Logger Error 1`, error);
        }
      });
  } catch (e) {
    try {
      logger.error(`checkFiberFBBCoveragePortError2`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("=======checkFiberFBBCoveragePort Catch ==========", e);
    } catch (error) {
      console.log(`checkFiberFBBCoveragePort Error Logger Error 2`, error);
    }
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : get FBB offers
  Input Params: 
*/

export const getFBBOffer = async (req, res) => {
  const {
    ip = "127.0.0.1",
    addressId,
    lang,
    province,
    region,
    district,
    subDistric,
    zipCode,
    mobileNo,
    accessMode,
  } = req.body;
  if (
    !isPTEnabled &&
    (!ip ||
      !mobileNo ||
      !accessMode ||
      !addressId ||
      !region ||
      !province ||
      !district ||
      !subDistric ||
      !zipCode)
  ) {
    return allFieldsRequired(res);
  }
  const transactionId = randomUUID();
  const requestData = {
    referWebSessionID: config.endPoint.referChannel + transactionId,
    referChannel: isPTEnabled
      ? config.endPoint.referChannelPerfTest
      : config.endPoint.referChannel,
    referChannelIP: ip,
    transactionID: transactionId,
    mobileno: mobileNo,
    accessMode: accessMode,
    addressId: addressId,
    district: district,
    subdistrict: subDistric,
    province: province,
    region: region,
    zipcode: zipCode,
  };

  try {
    logger.info(`getFBBOfferRequestData`, {
      status: StatusType.SUCEESS,
      mobileNo,
      transactionId,
      details: JSON.stringify(requestData),
    });
    console.log("getFBBOffer request data", JSON.stringify(requestData));
  } catch (error) {
    console.log(`getFBBOfferRequestData Logger Error`, error);
  }

  try {
    axios({
      method: "post",
      url: config.endPoint.fbb.getOffer,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          ...response?.data,
        };
        try {
          logger.info(`getFBBOfferSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response getFBBOffer=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`getFBBOffer Success Logger Error`, error);
        }
        return res.send({
          response: result,
          status:
            response?.data?.resultMessage?.toLowerCase()?.trim() ==
              "success." || false,
        });
      })
      .catch(function (error) {
        try {
          logger.error(`getFBBOfferError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========getFBBOffer Catch 1=========", error);
        } catch (error) {
          console.log(`getFBBOffer Error Logger Error 1`, error);
        }
      });
    // return res.send("sdfsd sdfsdf");
  } catch (e) {
    try {
      logger.error(`getFBBOfferError2`, {
        status: StatusType.FAIL,
        mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========getFBBOffer Catch 2=========", e);
    } catch (error) {
      console.log(`getFBBOffer Error Logger Error 2`, error);
    }
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : get customer related details
  Input Params: 
*/

export const getCustomerProfile = async (req, res) => {
  try {
    const { id, mobileNo } = req.body;
    if (!isPTEnabled && !mobileNo && !id) {
      return validate.allFieldsRequired(res);
    }

    const transactionId = randomUUID();
    const mobPayload = {
      transactionID: transactionId,
      mobileNo: mobileNo,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
    };
    const idPayload = {
      transactionID: transactionId,
      idCardNo: id,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
    };

    try {
      logger.info(`getCustomerProfileRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(mobileNo ? mobPayload : idPayload),
      });
      console.log(
        "getCustomerProfile request data",
        JSON.stringify(mobileNo ? mobPayload : idPayload)
      );
    } catch (error) {
      console.log(`getCustomerProfileRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.getCustomerProfile,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: mobileNo ? mobPayload : idPayload,
    })
      .then(function (response) {
        // const mockData = {
        //   transactionID: "AMP20210106001",
        //   resultCode: "20000",
        //   resultMessage: "Success",
        //   result: {
        //     customerProfile: {
        //       accntNo: "319XXXXXXXX285",
        //       accntClass: "Customer",
        //       accntSubCategory: "FOR",
        //       accntTitle: "คุณ",
        //       name: "ฝน ตก",
        //       idCardType: "PASSPORT",
        //       idCardNum: "254XXXXXXX750",
        //       birthdate: "23/04/2028",
        //       statusCd: "Active",
        //       mainPhone: "",
        //       mainMobile: "0911111111",
        //       billCycle: "16",
        //       address: {
        //         houseNo: "5",
        //         buildingName: "",
        //         floor: "",
        //         room: "",
        //         moo: "",
        //         mooban: "",
        //         streetName: "ถนนราชพฤกษ์",
        //         soi: "ซอยหมู่บ้านปริญญดาไลท์ พระราม 5",
        //         tumbol: "บางกร่าง",
        //         amphur: "เมืองนนทบุรี",
        //         provinceName: "นนทบุรี",
        //         zipCode: "11000",
        //         country: "Thailand",
        //       },
        //       vatAddress: {
        //         vatName: "คุณฝน ตก",
        //         vatRate: "7%",
        //         vatAddress1: "5",
        //         vatAddress2: "ซอย ซอยหมู่บ้านปริญญดาไลท์ พระราม 5",
        //         vatAddress3: "ถนน ถนนราชพฤกษ์",
        //         vatAddress4: "ตำบลบางกร่าง อำเภอเมืองนนทบุรี",
        //         vatAddress5: "นนทบุรี",
        //         vatPostalCd: "11000",
        //       },
        //       email: "",
        //       customerSegment: "",
        //     },
        //   },
        // };

        try {
          logger.info(`getCustomerProfileResultCode`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: response?.data?.resultCode,
          });
        } catch (error) {
          console.log(`getCustomerProfileResultCode Logger Error`, error);
        }
        try {
          logger.info(`getCustomerProfileResultMessage`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: response?.data?.resultMessage,
          });
        } catch (error) {
          console.log(`getCustomerProfileResultMessage Logger Error`, error);
        }
        try {
          logger.info(`getCustomerProfileData`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: response?.data,
          });
        } catch (error) {
          console.log(`getCustomerProfileData Logger Error`, error);
        }
        // try {
        //   logger.info(`getCustomerProfileResponse`, { status: StatusType.SUCEESS, details: response });
        // } catch (error) {
        //   console.log(`getCustomerProfileResponse Logger Error`, error);
        // }

        const result = {
          data:
            response?.data?.result?.customerProfile || response?.data || null,
        };
        try {
          logger.info(`getCustomerProfileSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response getCustomerProfile=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`getCustomerProfile Success Logger Error`, error);
        }
        return res.status(200).json({ response: result, status: true });
      })
      .catch(function (error) {
        try {
          logger.error(`getCustomerProfileError`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("==========getCustomerProfile Catch 1=========", error);
        } catch (error) {
          console.log(`getCustomerProfile Error Logger Error 1`, error);
        }
        return res.status(500).json({
          response: null,
          status: false,
          err: "Something happend please try again.",
        });
        //return res.send({res:error,status:"fail"})
      });
  } catch (e) {
    try {
      logger.error(`getCustomerProfileError`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("==========getCustomerProfile Catch 2=========", e);
    } catch (error) {
      console.log(`getCustomerProfile Error Logger Error 2`, error);
    }
    return res.status(500).json({
      response: null,
      status: false,
      err: "Something happend please try again.",
    });
  }
};

/*
  Created By : Himanshu Paney
  Created At : 18-01-2023
  Description : get Personal related details
  Input Params: 
*/

export const getPersonalInformation = async (req, res) => {
  try {
    const { option, mobileNo } = req.body;
    if (!isPTEnabled && !mobileNo && !option) {
      return validate.allFieldsRequired(res);
    }

    const transactionId = randomUUID();

    const requestData = {
      referWebSessionID: config.endPoint.referChannel + transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referChannelIP: "127.0.0.1",
      transactionID: transactionId,
      mobileNo: mobileNo,
      option: option,
    };

    try {
      logger.info(`getPersonalInformationRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log(
        "getPersonalInformation request data",
        JSON.stringify(requestData)
      );
    } catch (error) {
      console.log(`getPersonalInformationRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.getPersonalInformation,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          data: response?.data?.result?.[0] || null,
        };
        try {
          logger.info(`getPersonalInformationSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            mobileNo,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response getPersonalInformation=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`getPersonalInformation Success Logger Error`, error);
        }
        return res.status(200).json({ response: result, status: true });
      })
      .catch(function (error) {
        try {
          logger.error(`getPersonalInformationError1`, {
            status: StatusType.FAIL,
            transactionId,
            mobileNo,
            details: error,
          });
          console.log(
            "======Error Response getPersonalInformation=======",
            error
          );
        } catch (error) {
          console.log(`getPersonalInformation Error Logger Error 1`, error);
        }
        return res.status(500).json({
          response: null,
          status: false,
          err: "Something happend please try again.",
        });
        //return res.send({res:error,status:"fail"})
      });
  } catch (e) {
    try {
      logger.error(`getPersonalInformationError2`, {
        status: StatusType.FAIL,
        transactionId,
        mobileNo: req.body.mobileNo,
        details: e,
      });
      console.log("==========getPersonalInformation Catch=========", e);
    } catch (error) {
      console.log(`getPersonalInformation Error Logger Error 2`, error);
    }
    return res.status(500).json({
      response: null,
      status: false,
      err: "Something happend please try again.",
    });
  }
};

// export const verifyCustomerProfile = async (req, res) => {
//   try {
//     const { id, mobileNo, dob } = req.body;
//     if (!mobileNo && !id) {
//       return validate.allFieldsRequired(res);
//     }

//     const transactionId = randomUUID();
//     // axios({
//     //     method: 'post',
//     //     url : config.endPoint.verifyCustomerProfile,
//     //     headers:{
//     //         'Ocp-Apim-Subscription-Key':constant.LEGO_SUBSCRIPTION_KEY,
//     //         'Authorization': `Bearer ${constant.LEGO_AUTH_TOKEN}`
//     //     },
//     //     data : {
//     //         transactionID: transactionId,
//     //         mobileNo:mobileNo ? mobileNo : "",
//     //         idCardNo: id ? id : "",
//     //     }
//     // })
//     // .then(function (response) {
//     //     console.log("====response=======");
//     //     console.log(response);
//     const mockData = {
//       transactionID: "AMP20210106001",
//       resultCode: "20000",
//       resultMessage: "Success",
//       result: {
//         customerProfile: {
//           accntNo: "319XXXXXXXX285",
//           accntClass: "Customer",
//           accntSubCategory: "FOR",
//           accntTitle: "คุณ",
//           name: "ฝน ตก",
//           idCardType: "PASSPORT",
//           idCardNum: "254XXXXXXX750",
//           birthdate: "23/04/2022",
//           statusCd: "Active",
//           mainPhone: "",
//           mainMobile: "0911111111",
//           billCycle: "16",
//           address: {
//             houseNo: "5",
//             buildingName: "",
//             floor: "",
//             room: "",
//             moo: "",
//             mooban: "",
//             streetName: "ถนนราชพฤกษ์",
//             soi: "ซอยหมู่บ้านปริญญดาไลท์ พระราม 5",
//             tumbol: "บางกร่าง",
//             amphur: "เมืองนนทบุรี",
//             provinceName: "นนทบุรี",
//             zipCode: "11000",
//             country: "Thailand",
//           },
//           vatAddress: {
//             vatName: "คุณฝน ตก",
//             vatRate: "7%",
//             vatAddress1: "5",
//             vatAddress2: "ซอย ซอยหมู่บ้านปริญญดาไลท์ พระราม 5",
//             vatAddress3: "ถนน ถนนราชพฤกษ์",
//             vatAddress4: "ตำบลบางกร่าง อำเภอเมืองนนทบุรี",
//             vatAddress5: "นนทบุรี",
//             vatPostalCd: "11000",
//           },
//           email: "",
//           customerSegment: "",
//         },
//       },
//     };

//     if (
//       mockData?.resultMessage &&
//       mockData?.resultMessage === "Success" &&
//       mockData?.result?.customerProfile
//     ) {
//       const { birthdate } = mockData?.result?.customerProfile;
//       return res.send({
//         response: { customerProfileValid: birthdate === dob },
//         status: true,
//       });
//     } else {
//       return res.send({
//         response: { customerProfileValid: false },
//         status: false,
//       });
//     }
//     // })
//     // .catch(function (error) {
//     //     console.log("====error=======");
//     //     console.log(error);
//     //     //return res.send({res:error,status:"fail"})
//     // });
//   } catch (e) {
//     console.log("==catch=", e);
//     return res.send({
//       res: null,
//       err: "Something happend please try again.",
//       status: false,
//     });
//   }
// };

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : Check network type of mobile number
  Input Params: 
*/

export const getNetworkType = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    if (!isPTEnabled && !mobileNo) {
      return allFieldsRequired(res);
    }

    console.log(req.body);
    const transactionId = randomUUID();
    // axios({
    //     method: 'GET',
    //     url : 'config.endPoint.getNetworkType',
    //     headers:{
    //         'Ocp-Apim-Subscription-Key':constant.LEGO_SUBSCRIPTION_KEY,
    //         'Authorization': `Bearer ${constant.LEGO_AUTH_TOKEN}`
    //     },
    //     data : {
    //      "referWebSessionID": transactionId,
    // "referChannel": config.endPoint.referChannel,
    // "referChannelIP":  {{ your source IP}},
    // "transactionID": transactionId,
    // "channel": "NOCP",
    // "msisdn": "0659330182"
    //     }
    // })
    // .then(function (response) {
    //   console.log("====response=======");
    //   console.log(response);
    const mockData = {
      transactionID: "tt012022030700",
      resultCode: "20000",
      resultMessage: "Success.",
      result: {
        networkType: "CPE",
        mobileLocation: "CBS",
        spName: "awn",
        chargeMode: "1",
        groupCode: "R",
        corperateType: "THA",
        subNetworkType: "Pre-paid",
        cosId: "160503",
        cbpId: "159",
        scpId: "109",
        mobileStatus: "Active",
        state: "1",
        language: "1",
        servicePackageId: "8",
        brandId: "5",
        cfAddress: "3CBCB159",
        customerId: "669116637274436",
        gprsTbcf: "0",
        customerSegment: "classic",
      },
    };

    const result = {
      transactionId: mockData.transactionID,
      ...mockData.result,
    };
    return res.send({ response: result, status: true });
    // })
    // .catch(function (error) {
    //     console.log("====error=======");
    //     console.log(error);
    //     //return res.send({res:error,status:"fail"})
    // });
  } catch (e) {
    console.log("==catch network type error=", e);
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : validate top by mobile number and amount
  Input Params: 
*/

export const validateTopUp = async (req, res) => {
  try {
    const { mobileNo, amount } = req.body;
    if (!isPTEnabled && (!mobileNo || !amount)) {
      return allFieldsRequired(res);
    }
    const transactionId = randomUUID();
    const requestData = {
      referWebSessionID: config.endPoint.referChannel + transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referChannelIP:
        req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      transactionID: transactionId,
      mobileno: mobileNo,
      topupAmt: amount,
    };

    try {
      logger.info(`validateTopUpRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("validateTopUp request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`validateTopUpRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.topUp.validate,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          result: response?.data?.result || {},
          paymentUrl: response?.data?.url || "",
        };
        try {
          logger.info(`validateTopUpSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "=====response validateTopUp=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`validateTopUpSuccess Logger Error`, error);
        }
        return res.send({
          response: result,
          status: result.resultCode == "20000",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`validateTopUpError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========validateTopUp Catch 1=========", error);
        } catch (error) {
          console.log(`validateTopUp Error Logger Error 1`, error);
        }
        return res.send({ response: error, status: false });
      });
  } catch (e) {
    console.log("==catch=", e);
    try {
      logger.error(`validateTopUpError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========validateTopUp Catch 2=========", e);
    } catch (error) {
      console.log(`validateTopUp Error Logger Error 2`, error);
    }
    return res.send({
      response: e,
      status: false,
    });
  }
};
/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : request top 
  Input Params: 
*/

export const requestTopUp = async (req, res) => {
  try {
    const { mobileNo, amount } = req.body;
    if (!isPTEnabled && !mobileNo) {
      return allFieldsRequired(res);
    }

    const transactionId = randomUUID();
    const requestData = {
      referWebSessionID: config.endPoint.referChannel + transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referChannelIP: "127.0.0.1",
      transactionID: transactionId,
      mobileno: mobileNo,
      paymentGateway: {
        paymentRefNo: "3423424642" + "_" + Date.now(),
        paymentAmount: amount,
      },
      mobileTopup: {
        TopupMobileNo: "",
        topupAmount: "",
      },
      cashCard: {
        cashCardNo: "",
        cashCardAmount: "",
      },
    };

    try {
      logger.info(`requestTopUpRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("requestTopUp request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`requestTopUpRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.topUp.add,
      headers: {
        "Content-Type": "application/json",
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        // const mockData  = {
        //           "transactionID": "20220221134448406044",
        //           "resultCode": "20000",
        //           "resultMessage": "Success.",
        //           "result": {
        //             "msg": "Topup Complete"
        //           }
        //         }

        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          result: response?.data?.result || {},
        };
        try {
          logger.info(`requestTopUpSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "=====response requestTopUp=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`requestTopUp Success Logger Error`, error);
        }
        return res.send({
          response: result,
          status: result.resultMessage?.toLowerCase()?.trim() == "success.",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`requestTopUpError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========requestTopUp Catch 1=========", error);
        } catch (error) {
          console.log(`requestTopUp Error Logger Error 1`, error);
        }
        //return res.send({res:error,status:"fail"})
      });
  } catch (e) {
    try {
      logger.error(`requestTopUpError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========requestTopUp Catch 2=========", e);
    } catch (error) {
      console.log(`requestTopUp Error Logger Error 2`, error);
    }
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 05-07-2022
  Description : get installation time and date 
  Input Params: 
*/

export const getFBBTimeSlot = async (req, res) => {
  try {
    const {
      accessMode = "VDSL",
      zipcode,
      addressId = "20615721",
      subDistrict,
      region,
      serviceCode = "P14090149",
      serviceLevel = "M",
      interval = "2",
      startDate,
    } = req.body;
    if (
      !isPTEnabled &&
      (!accessMode ||
        !zipcode ||
        !addressId ||
        !subDistrict ||
        !region ||
        !serviceCode ||
        !serviceLevel)
    ) {
      return allFieldsRequired(res);
    }

    const transactionId = randomUUID();
    const requestData = {
      referWebSessionID: config.endPoint.referChannel + transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referChannelIP: "127.0.0.1",
      transactionID: transactionId,
      accessMode: accessMode,
      serviceCode: serviceCode,
      serviceLevel: serviceLevel,
      addressId: addressId,
      subDistrict: subDistrict,
      zipcode: zipcode,
      region: region,
      startDate: moment().format("YYYY-MM-DD"),
      interval: interval,
    };

    try {
      logger.info(`getFBBTimeSlotRequestData`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("getFBBTimeSlot request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`getFBBTimeSlotRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.fbb.queryTime,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        try {
          logger.info(`getFBBTimeSlotSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "=======response getFBBTimeSlot=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`getFBBTimeSlot Success Logger Error`, error);
        }
        return res.status(200).json({
          response: response?.data,
          status: response?.data?.resultCode == "20000",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`getFBBTimeSlotError1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("==========getFBBTimeSlot Catch 1=========", error);
        } catch (error) {
          console.log(`getFBBTimeSlot Error Logger Error 1`, error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    console.log("==catch=", e);
    try {
      logger.error(`getFBBTimeSlotError2`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("==========getFBBTimeSlot Catch 2=========", e);
    } catch (error) {
      console.log(`getFBBTimeSlot Error Logger Error 2`, error);
    }
    return res.status(500).json({
      response: null,
      error: "Something happend please try again.",
      status: false,
    });
  }
};

export const addOnTop = async (req, res) => {
  try {
    const { mobileNo, products } = req.body;
    console.log(req.body);
    const transactionId = randomUUID();
    const requestData = {
      referWebSessionID: config.endPoint.referChannel + transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referChannelIP: "127.0.0.1",
      transactionID: transactionId,
      paymentRefNo: transactionId,
      mobileno: mobileNo,
      products: products,
    };

    try {
      logger.info(`addOnTopRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("addOnTop request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`addOnTopRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.onTop.add,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: response?.data?.transactionID,
          resultCode: response?.data?.resultCode,
          resultMessage: response?.data?.resultMessage,
          result: response?.data?.result,
        };
        try {
          logger.info(`addOnTopSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response addOnTop=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`addOnTop Success Logger Error`, error);
        }
        return res.status(200).json({
          response: result,
          status:
            response?.data?.resultMessage?.toLowerCase()?.trim() === "success",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`addOnTopError`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("==========addOnTop Catch 1=========", error);
        } catch (error) {
          console.log(`addOnTop Error Logger Error 1`, error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    console.log("==catch=", e);
    try {
      logger.error(`addOnTopError`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("==========addOnTop Catch 2=========", e);
    } catch (error) {
      console.log(`addOnTop Error Logger Error 2`, error);
    }
    return res.status(500).json({ response: null, error: e, status: false });
  }
};

export const validateOnTop = async (req, res) => {
  try {
    const { mobileNo, products } = req.body;
    if (!isPTEnabled && (!mobileNo || !products)) {
      return allFieldsRequired(res);
    }
    const transactionId = randomUUID();
    const requestData = {
      referWebSessionID: config.endPoint.referChannel + transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referChannelIP: "127.0.0.1",
      transactionID: transactionId,
      paymentRefNo: transactionId,
      mobileno: mobileNo,
      products: products,
    };

    try {
      logger.info(`validateOnTopRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("validateOnTop request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`validateOnTopRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.onTop.validate,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: response?.data?.transactionID,
          resultCode: response?.data?.resultCode,
          resultMessage: response?.data?.resultMessage,
          result: response?.data?.result,
        };
        try {
          logger.info(`validateOnTopSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response validateOnTop=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`validateOnTop Success Logger Error`, error);
        }
        return res.status(200).json({
          response: result,
          status:
            response?.data?.result?.msg?.toLowerCase()?.trim() == "pass" ||
            false,
        });
        // return res.status(200).json({status:true});
      })
      .catch(function (error) {
        try {
          logger.error(`validateOnTopError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========validateOnTop Catch 1=========", error);
        } catch (error) {
          console.log(`validateOnTop Error Logger Error 1`, error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`validateOnTopError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========validateOnTop Catch 2=========", e);
    } catch (error) {
      console.log(`validateOnTop Error Logger Error 2`, error);
    }
    return res.status(500).json({ response: null, error: e, status: false });
  }
};
/*
  Created By : Himanshu && Shravan
  Created At : 21-07-2022
  Description : validate profile by mobile number and birthdate
  Input Params: 
*/

export const validateProfile = async (req, res) => {
  try {
    const {
      mobileNo = "",
      birthDate,
      orderType,
      idCardNo,
      promotionCode,
      byPassDOPAFlag,
      ussdCode = "",
      checkContractFlag = "",
      fbbNo,
      minPackage = "",
      serviceCodeLockHs = "",
    } = req.body;
    if (!isPTEnabled && !orderType) {
      return allFieldsRequired(res);
    }
    const transactionId = randomUUID();
    const requestData = {
      channel: config.endPoint.referChannel,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      transactionID: transactionId,
      orderType: orderType,
      mobileNo: mobileNo,
      idCardNo: idCardNo,
      birthDate: birthDate,
      promotionCode: promotionCode,
      ussdCode: ussdCode,
      checkContractFlag: checkContractFlag,
      fbbNo: fbbNo,
      minPackage: minPackage,
      serviceCode: serviceCodeLockHs,
    };

    try {
      logger.info(`validateProfileRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("validateProfile request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`validateProfileRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.validateProfile,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data:
        process.env.NODE_ENV.trim() === "prod"
          ? requestData
          : {
              ...requestData,
              byPassDOPAFlag: byPassDOPAFlag,
            },
    })
      .then(function (response) {
        // const mockData  = {
        //   "transactionID": "20220221134448406044",
        //   "resultCode": "20000",
        //   "resultMessage": "Success.",
        //   "result": {
        //     "msg": "Topup Complete"
        //   }
        // }

        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          result: response?.data?.result || {},
        };

        // const mockData = {
        //   transactionID: "20140702092500123",
        //   resultCode: "20000",
        //   resultMessage: "Success.",
        // };

        //   const result = {
        //     "transactionID": "20140702092500123",
        //     "resultCode": "20000",
        //     "resultMessage": "Success."
        // }
        try {
          logger.info(`validateProfileSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response validateProfile=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`validateProfile Success Logger Error`, error);
        }
        if (["20000", "21501"].includes(response?.data?.resultCode)) {
          return res.status(200).json({
            response: result,
            status: result.resultMessage?.toLowerCase()?.trim() == "success.",
          });
        } else {
          return res.status(500).json({
            response: result,
            status: false,
          });
        }
      })
      .catch(function (error) {
        try {
          logger.error(`validateProfileError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========validateProfile Catch 1=========", error);
        } catch (error) {
          console.log(`validateProfile Error Logger Error 1`, error);
        }
        return res.status(500).json({
          response: null,
          status: false,
          error: {
            message: error?.response?.data?.message,
            resultCode: error?.response?.status,
          },
        });
      });
  } catch (e) {
    console.log("==catch=", e);
    try {
      logger.error(`validateProfileError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========validateProfile Catch 2=========", e);
    } catch (error) {
      console.log(`validateProfile Error Logger Error 2`, error);
    }
    return res.status(500).json({
      response: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};
export const validateProfileTest = async (req, res, next) => {
  try {
    const {
      mobileNo = "",
      birthDate,
      orderType,
      idCardNo,
      promotionCode,
      byPassDOPAFlag,
      ussdCode = "",
      checkContractFlag = "",
      fbbNo,
      minPackage = "",
    } = req.body;
    if (!isPTEnabled && !orderType) {
      return allFieldsRequired(res);
    }
    const transactionId = randomUUID();
    const requestData = {
      channel: config.endPoint.referChannel,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      transactionID: transactionId,
      orderType: orderType,
      mobileNo: mobileNo,
      idCardNo: idCardNo,
      birthDate: birthDate,
      promotionCode: promotionCode,
      ussdCode: ussdCode,
      checkContractFlag: checkContractFlag,
      fbbNo: fbbNo,
      minPackage: minPackage,
    };

    try {
      logger.info(`validateProfileTestRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log(
        "validateProfileTest request data",
        JSON.stringify(requestData)
      );
    } catch (error) {
      console.log(`validateProfileTestRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.validateProfile,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data:
        process.env.NODE_ENV.trim() === "prod"
          ? requestData
          : {
              ...requestData,
              byPassDOPAFlag: byPassDOPAFlag,
            },
    })
      .then(function (response) {
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          result: response?.data?.result || {},
        };
        try {
          logger.info(`validateProfileTestSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response validateProfileTest=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`validateProfileTest Success Logger Error`, error);
        }
        if (response?.data?.resultCode == "20000") {
          req.validateProfileResponse = result;
          next();
        } else {
          return res.status(200).json({
            response: result,
            status: result.resultMessage?.toLowerCase()?.trim() == "success.",
          });
        }
      })
      .catch(function (error) {
        // req.validateProfileResponse = {
        //   transactionId: "",
        //   resultCode: "50000",
        //   resultMessage: "Fail.",
        //   result: {},
        // };
        // next();
        try {
          logger.info(`validateProfileTestCatch`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========validateProfileTest Catch 1=========", error);
        } catch (error) {
          console.log(`validateProfileTest Error Logger Error 1`, error);
        }
        return res.status(500).json({ response: null, status: false });
      });
  } catch (e) {
    try {
      logger.error(`validateProfileTestError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("=======validateProfileTest Catch 2==========", e);
    } catch (error) {
      console.log(`validateProfileTest Error Logger Error 2`, error);
    }
    return res.status(500).json({
      response: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

export const validateStockAvailability = async (req, res) => {
  try {
    const { matCodeList } = req.body;

    if (!isPTEnabled && !matCodeList) {
      return allFieldsRequired(res);
    }

    const matCodeListArr = Array.isArray(matCodeList)
      ? matCodeList.map((matCode) =>
          typeof matCode == "object" ? matCode : { matCode }
        )
      : matCodeList;

    const transactionId = randomUUID();
    const requestData = {
      transactionID: transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      stockType: "AIS",
      locationCodeSource: "4289",
      locationCodeDest: "",
      subStock: "",
      matCodeList: matCodeListArr,
    };

    try {
      logger.info(`validateStockAvailabilityRequestData`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log(
        "validateStockAvailability request data",
        JSON.stringify(requestData)
      );
    } catch (error) {
      console.log(`validateStockAvailabilityRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.stockAllSummary,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        console.log("stockAvailability response: ", response?.data?.result);
        try {
          logger.info(`validateStockAvailabilitySuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data || "{}"),
          });
          console.log(
            "validateStockAvailability result: ",
            JSON.stringify(response?.data || "{}")
          );
        } catch (error) {
          console.log(`validateStockAvailability Success Logger Error`, error);
        }
        // const mockData  = {
        //   "transactionID": "20220221134448406044",
        //   "resultCode": "20000",
        //   "resultMessage": "Success.",
        //   "result": {
        //     "msg": "Topup Complete"
        //   }
        // }

        let isInStock = false;

        if (response?.data?.result?.listData?.length > 0) {
          isInStock = response?.data?.result?.listData?.[0]?.stockAval >= 1;
        }

        if (isInStock) {
          const result = {
            transactionId: response?.data?.transactionID || "",
            resultCode: response?.data?.resultCode || "50000",
            resultMessage: response?.data?.resultMessage || "Fail.",
            result: "1" || {},
          };
          return res.send({
            response: result,
            status: result.resultMessage?.toLowerCase()?.trim() == "success.",
          });
        } else {
          return res.send({
            response: "3",
            status: "Success",
          });
        }
      })
      .catch(function (error) {
        try {
          logger.error(`validateStockAvailabilityError1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("validateStockAvailability Catch 1: ", error);
        } catch (error) {
          console.log(`validateStockAvailability Error Logger Error 1`, error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
        //return res.send({res:error,status:"fail"})
      });
  } catch (e) {
    try {
      logger.error(`validateStockAvailabilityError2`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("validateStockAvailability Catch 2: ", e);
    } catch (error) {
      console.log(`validateStockAvailability Error Logger Error 2`, error);
    }
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: true,
      error: response,
    });
  }
};

/*
  Created By : Shravan
  Created At : 09-08-2022
  Description : Validate Mobile Port-in
  Input Params: mobileNo, idCardNo
*/

export const validateMobilePortIn = async (req, res) => {
  try {
    console.log("====Apicalled=======");
    const { mobileNo, idCardNo } = req.body;
    if (!isPTEnabled && !mobileNo) {
      return allFieldsRequired(res);
    }
    const transactionId = randomUUID();
    const requestData = {
      referWebSessionID: "WEB20220221134",
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referChannelIP: "127.0.0.1",
      transactionID: transactionId,
      mobileNo: mobileNo,
      idCardNo: idCardNo,
      locationCode: "",
      reasonCode: "",
      userName: "",
    };

    try {
      logger.info(`validateMobilePortInRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log(
        "validateMobilePortIn request data",
        JSON.stringify(requestData)
      );
    } catch (error) {
      console.log(`validateMobilePortInRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.validateMobilePortIn,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          // Commenting below line as result is not being used in FED
          // result: response?.data?.result || {},
        };

        // const result = {
        //   transactionID: "20220221134448406044",
        //   resultCode: "20000",
        //   resultMessage: "Success",
        //   result: {},
        // };
        try {
          logger.info(`validateMobilePortInSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response ValidateMobilePortIn=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`validateMobilePortIn Success Logger Error`, error);
        }
        return res.status(200).json({
          response: result,
          status: result.resultMessage?.toLowerCase()?.trim() == "success",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`validateMobilePortInError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("==========validateMobilePortIn Catch 1=========", error);
        } catch (error) {
          console.log(`validateMobilePortIn Error Logger Error 1`, error);
        }
        return res.status(500).json({ response: null, status: false });
      });
  } catch (e) {
    console.log("==catch=", e);
    try {
      logger.error(`validateMobilePortInError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========validateMobilePortIn Catch 2=========", e);
    } catch (error) {
      console.log(`validateMobilePortIn Error Logger Error 2`, error);
    }
    return res.status(500).json({
      response: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Shravan
  Created At : 12-08-2022
  Description : Get KYC URL
  Input Params: mobileNo, idCardNo, referenceOrderNo, orderCode
*/

export const getKYCUrl = async (req, res) => {
  try {
    const { mobileNo, idCardNo, referenceOrderNo, orderCode, kycLandingURL } =
      req.body;
    if (
      !isPTEnabled &&
      (!mobileNo || !referenceOrderNo || !orderCode || !kycLandingURL)
    ) {
      return allFieldsRequired(res);
    }
    const transactionId = randomUUID();

    const requestData = {
      transactionID: transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referenceOrderNo: referenceOrderNo,
      idCard: idCardNo,
      mobileNo: mobileNo,
      orderCode: orderCode,
      data: {
        redirectURL: `${config.aem.url}${kycLandingURL}`,
      },
    };

    try {
      logger.info(`getKYCUrlRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("====Request getKYCUrl=======", JSON.stringify(requestData));
    } catch (error) {
      console.log(`getKYCUrlRequestData Logger Error`, error);
    }
    try {
      logger.info(`getKYCUrl`, {
        status: StatusType.SUCEESS,
        mobileNo,
        details: config?.endPoint?.getKYCUrl,
      });
    } catch (error) {
      console.log(`getKYCUrl Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.getKYCUrl,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        console.log("====Response getKYCUrl=======", response);
        console.log("====Response Data getKYCUrl=======", response?.data);
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          result: response?.data?.result || {},
        };
        console.log("====Response result getKYCUrl=======", result);

        // const result = {
        //   "transactionID": "20210222102312CREN",
        //   "resultCode": "20000",
        //   "resultMessage": "Success.",
        //   "result": {
        //     "kyc": {
        //       "statusMobileNo": "NONE",
        //       "redirectURL": "https://kycais-iot.mimotech.org/client/callback?token=9FrJvP%2FFZJbRJDFD60P34dqZicYt%2BbhEcW0dR6j3tMB5o7RRlmSX",
        //       "token": "9FrJvP%2FFZJbRJDFD60P34dqZicYt%2BbhEcW0dR6j3tM B5o7RRlmSX"
        //     }
        //   }
        // }
        const logDetails = `${response?.data?.transactionID} ${response?.data?.resultCode} ${response?.data?.resultMessage}`;
        try {
          logger.info(`getKYCUrlResponse`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: logDetails,
          });
        } catch (error) {
          console.log(`getKYCUrlResponse Logger Error`, error);
        }
        try {
          logger.info(`getKYCUrlResponseData`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: response?.data,
          });
        } catch (error) {
          console.log(`getKYCUrlResponseData Logger Error`, error);
        }

        return res.send({
          response: result,
          status: result.resultMessage?.toLowerCase()?.trim() == "success.",
        });
      })
      .catch(function (error) {
        //return res.send({res:error,status:"fail"})
        try {
          logger.error(`getKYCUrlError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: JSON.stringify(error),
          });
          console.log("======getKYCUrlError1=======", error);
        } catch (error) {
          console.log(`getKYCUrlError1 Logger Error`, error);
        }
      });
  } catch (e) {
    try {
      logger.error(`getKYCUrlError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: JSON.stringify(e),
      });
      console.log("=======getKYCUrlError2======", e);
    } catch (error) {
      console.log(`getKYCUrlError2 Logger Error`, error);
    }
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: true,
      error: response,
    });
  }
};

/*
  Created By : Santosh Kumar Divate
  Created At : 18-08-2022
  Description : check customer KYC profile details
  Input Params:  referWebSessionID, referChannel, referChannelIP, mobileNo, chargeType
*/

export const checkKYCProfile = async (req, res) => {
  try {
    const { referChannelIP, mobileNo, chargeType, cartId = "" } = req.body;
    if (!isPTEnabled && (!mobileNo || !chargeType)) {
      return allFieldsRequired(res);
    }
    const transactionId = randomUUID();
    const requestData = {
      referWebSessionID: config.endPoint.referChannel + transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      referChannelIP: referChannelIP || "",
      transactionID: transactionId,
      mobileNo: mobileNo,
      chargeType: chargeType,
    };

    try {
      logger.info(`checkKYCProfileRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log("checkKYCProfile request data", JSON.stringify(requestData));
    } catch (error) {
      console.log(`checkKYCProfileRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.checkKYCProfile,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          result:
            (!cartId
              ? { kycProfileFlag: response?.data?.result?.kycProfileFlag }
              : response?.data?.result) || {},
        };

        // const result = {
        //   "transactionID": "20210222102312CREN",
        //   "resultCode": "20000",
        //   "resultMessage": "Success.",
        //   "result": {
        //     "kycProfileFlag": "Y",
        //   }
        // }
        try {
          logger.info(`checkKYCProfileSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response checkKYCProfile=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`checkKYCProfile Success Logger Error`, error);
        }
        return res.send({
          response: result,
          status: result.resultMessage?.toLowerCase()?.trim() == "success.",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`checkKYCProfileError1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("==========checkKYCProfile Catch 1=========", error);
        } catch (error) {
          console.log(`checkKYCProfile Error Logger Error 1`, error);
        }
        //return res.send({res:error,status:"fail"})
      });
  } catch (e) {
    try {
      logger.error(`checkKYCProfileError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========checkKYCProfile Catch 2=========", e);
    } catch (error) {
      console.log(`checkKYCProfile Error Logger Error 2`, error);
    }
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: true,
      error: response,
    });
  }
};

/*
  Created By : Shravan
  Created At : 16-08-2022
  Description : get customer profile details
  Input Params: mobileNo
*/

export const commandGetCustomerProfile = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    if (!isPTEnabled && !mobileNo) {
      return validate.allFieldsRequired(res);
    }

    const transactionId = Math.floor(Math.random() * 1000) + "_" + Date.now();
    const requestData = {
      transactionID: transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      msisdn: mobileNo,
    };

    try {
      logger.info(`commandGetCustomerProfileRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log(
        "commandGetCustomerProfile request data",
        JSON.stringify(requestData)
      );
    } catch (error) {
      console.log(`commandGetCustomerProfileRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.commandGetCustomerProfile,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          result: response?.data?.result || {},
        };

        // const result = {
        //   transactionID: "getCustomerProfile12345678",
        //   resultCode: "20000",
        //   resultMessage: "Success.",
        //   result: {
        //     transactionID: "getCustomerProfile12345678",
        //     httpStatus: 200,
        //     status: "20000",
        //     description: "SUCCESS",
        //     customerProfileID: 172823282,
        //     msisdn: "065XXXXX56",
        //     caSegment: null,
        //     maSegment: null,
        //     ntype: "3PE",
        //     registerDate: "2020-07-09 00:00:00",
        //     customerType: "I",
        //     birthday: null,
        //     mobileStatus: "Active",
        //     arpu: 0,
        //     billingAccount: "0659333556",
        //     custSubType: null,
        //     language: null,
        //     segmentStartDate: null,
        //     segmentExpiredDate: null,
        //     arpu6m: 0,
        //   },
        // };
        try {
          logger.info(`commandGetCustomerProfileSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "=====response CommandGetCustomerProfile=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`commandGetCustomerProfile Success Logger Error`, error);
        }

        return res.send({
          response: result,
          status: result.resultMessage?.toLowerCase()?.trim() == "success.",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`commandGetCustomerProfileError`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log("====commandGetCustomerProfile catch 1=======", error);
        } catch (error) {
          console.log(`commandGetCustomerProfile Error Logger Error 1`, error);
        }

        return res.send({ res: error, status: "fail" });
      });
  } catch (e) {
    console.log("==catch=", e);
    try {
      logger.error(`commandGetCustomerProfileError`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("=====commandGetCustomerProfile catch 2=======", e);
    } catch (error) {
      console.log(`commandGetCustomerProfile Error Logger Error 2`, error);
    }
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: true,
      error: response,
    });
  }
};

export const validateMobileConvert = async (req, res) => {
  try {
    const { mobileNo } = req.body;
    if (!isPTEnabled && !mobileNo) {
      return validate.allFieldsRequired(res);
    }

    const transactionId = Math.floor(Math.random() * 1000) + "_" + Date.now();
    const requestData = {
      transactionID: transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      mobileno: mobileNo,
    };

    try {
      logger.info(`validateMobileConvertRequestData`, {
        status: StatusType.SUCEESS,
        mobileNo,
        transactionId,
        details: JSON.stringify(requestData),
      });
      console.log(
        "validateMobileConvert request data",
        JSON.stringify(requestData)
      );
    } catch (error) {
      console.log(`validateMobileConvertRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.validateMobileConvert,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionId: response?.data?.transactionID || "",
          resultCode: response?.data?.resultCode || "50000",
          resultMessage: response?.data?.resultMessage || "Fail.",
          result: response?.data?.result || {},
        };

        // const result = {
        //   transactionID: "getCustomerProfile12345678",
        //   resultCode: "20000",
        //   resultMessage: "Success.",
        //   result: {
        //     transactionID: "getCustomerProfile12345678",
        //     httpStatus: 200,
        //     status: "20000",
        //     description: "SUCCESS",
        //     customerProfileID: 172823282,
        //     msisdn: "065XXXXX56",
        //     caSegment: null,
        //     maSegment: null,
        //     ntype: "3PE",
        //     registerDate: "2020-07-09 00:00:00",
        //     customerType: "I",
        //     birthday: null,
        //     mobileStatus: "Active",
        //     arpu: 0,
        //     billingAccount: "0659333556",
        //     custSubType: null,
        //     language: null,
        //     segmentStartDate: null,
        //     segmentExpiredDate: null,
        //     arpu6m: 0,
        //   },
        // };
        try {
          logger.info(`validateMobileConvertSuccess`, {
            status: StatusType.SUCEESS,
            mobileNo,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====response validateMobileConvert=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`validateMobileConvert Success Logger Error`, error);
        }

        return res.send({
          response: result,
          status: result.resultMessage?.toLowerCase()?.trim() == "success.",
        });
      })
      .catch(function (error) {
        try {
          logger.error(`validateMobileConvertError1`, {
            status: StatusType.FAIL,
            mobileNo,
            transactionId,
            details: error,
          });
          console.log(
            "==========validateMobileConvert Catch 1=========",
            error
          );
        } catch (error) {
          console.log(`validateMobileConvert Error Logger Error 1`, error);
        }

        return res.send({ res: error, status: "fail" });
      });
  } catch (e) {
    try {
      logger.error(`validateMobileConvertError2`, {
        status: StatusType.FAIL,
        mobileNo: req.body.mobileNo,
        transactionId,
        details: e,
      });
      console.log("==========validateMobileConvert Catch 2=========", e);
    } catch (error) {
      console.log(`validateMobileConvert Error Logger Error 2`, error);
    }

    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: true,
      error: response,
    });
  }
};

/*
  Created By : Nidhi
  Created At : 06-09-2022
  Description : Cancel order
  Input Params: orderID, userID, reserveID, sourceSystem, channel, cancelReason
*/

// export const cancelOrder = async (req, res) => {
//   try {

//     const { orderID, userID, reserveID, sourceSystem, channel, cancelReason } =
//       req.body;
//     if (
//       !isPTEnabled && (
//         !orderID ||
//         !userID ||
//         !reserveID ||
//         !sourceSystem ||
//         !channel ||
//         !cancelReason
//       )
//     ) {
//       return allFieldsRequired(res);
//     }

//     console.log("====request for cancelOrder api =======", req.body);
//     const transactionId = randomUUID();
//     const requestData = {
//       transactionId: transactionId,
//       orderID,
//       userID,
//       reserveID,
//       sourceSystem,
//       channel,
//       cancelReason,
//       referChannel: isPTEnabled ?
//         config.endPoint.referChannelPerfTest :
//         config.endPoint.referChannel,
//     };

//     try {
//       logger.info(`cancelOrderRequestData`, { status: StatusType.SUCEESS, transactionId, details: JSON.stringify(requestData) });
//       console.log("cancelOrder request data", JSON.stringify(requestData));
//     } catch (error) {
//       console.log(`cancelOrderRequestData Logger Error`, error);
//     }

//     axios({
//       method: "POST",
//       url: config.endPoint.cancelOrder.url,
//       headers: {
//         "Ocp-Apim-Subscription-Key":
//           config.endPoint.cancelOrder.subscription_key,
//         "Ocp-Apim-Trace": true,
//         "Content-Type": "application/json",
//         "X-Content-Type-Options": "nosniff",
//         "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
//       },
//       data: requestData,
//     })
//       .then(function (response) {

//         const result = {
//           transactionId: response?.data?.transactionID || "",
//           resultCode: response?.data?.resultCode || "50000",
//           resultMessage: response?.data?.resultMessage || "Fail.",
//           result: response?.data?.result || {},
//         };
//         try {
//           logger.info(`cancelOrderSuccess`, { status: StatusType.SUCEESS, transactionId, details: JSON.stringify(response?.data) });
//           console.log("====response for cancel order api=======", JSON.stringify(response?.data));
//         } catch (error) {
//           console.log(`cancelOrder Success Logger Error`, error);
//         }

//         return res.send({
//           response: result,
//           status: result.resultMessage?.toLowerCase()?.trim() == "Success",
//         });
//       })
//       .catch(function (error) {
//         try {
//           logger.error(`cancelOrderError1`, { status: StatusType.FAIL, transactionId, details: error });
//           console.log("==========cancelOrder Catch 1=========",error);
//         } catch (error) {
//           console.log(`cancelOrder Error Logger Error 1`, error);
//         }

//         return res.send({ res: error, status: "fail" });
//       });
//   } catch (e) {
//     try {
//       logger.error(`cancelOrderError2`, { status: StatusType.FAIL, transactionId, details: e });
//       console.log("==========cancelOrder Catch 2=========",e);
//     } catch (error) {
//       console.log(`cancelOrder Error Logger Error 2`, error);
//     }

//     return res.send({
//       res: null,
//       err: "Something happend please try again.",
//       status: true,
//       error: response,
//     });
//   }
// };

export const validateStockAvailabilityAllLocation = async (req, res) => {
  try {
    const { requestData, productData, locationData } = req.body;

    if (
      !isPTEnabled &&
      !requestData?.locationCode &&
      !requestData?.matCodeList
    ) {
      return allFieldsRequired(res);
    }

    const transactionId = randomUUID();
    const reqData = {
      transactionID: transactionId,
      referChannel: isPTEnabled
        ? config.endPoint.referChannelPerfTest
        : config.endPoint.referChannel,
      locationCode: "4289",
      locationCodeDest: requestData?.locationCode,
      matCodeList: requestData?.matCodeList,
    };

    try {
      logger.info(`validateStockAvailabilityAllLocationRequestData`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(reqData),
      });
      console.log(
        "validateStockAvailabilityAllLocation request data",
        JSON.stringify(reqData)
      );
    } catch (error) {
      console.log(
        `validateStockAvailabilityAllLocationRequestData Logger Error`,
        error
      );
    }

    axios({
      method: "POST",
      url: config.endPoint.stockAllLocation,
      headers: {
        "Ocp-Apim-Subscription-Key": SubscriptionKey,
        Authorization: `Bearer ${constant.LEGO_AUTH_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: reqData,
    })
      .then(function (response) {
        try {
          logger.info(`validateStockAvailabilityAllLocationSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response stockAvailabilityAllLocation=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(
            `validateStockAvailabilityAllLocation Success Logger Error`,
            error
          );
        }

        let isInStock = false;

        response?.data?.result?.[0]?.ais_store?.length > 0 &&
          response?.data?.result?.[0]?.ais_store?.find((storeData) => {
            if (storeData?.locationCode === locationData?.location_code) {
              isInStock = storeData?.stockAval >= productData?.quantity;
            }
          });

        if (isInStock) {
          const result = {
            transactionId: response?.data?.transactionID || "",
            resultCode: response?.data?.resultCode || "50000",
            resultMessage: response?.data?.resultMessage || "Fail.",
            result: "1" || {},
          };

          return res.send({
            response: result,
            status: result.resultMessage?.toLowerCase()?.trim() == "success.",
          });
        } else {
          //warehouse availability check
          axios({
            method: "GET",
            url: `${config.magento.restApi.url}${productData?.product?.sku}`,
            headers: {
              Authorization: `Bearer ${config.magento.restApi.token}`,
              "Content-Type": "application/json",
              "X-Content-Type-Options": "nosniff",
              "Strict-Transport-Security":
                "max-age=15552000; includeSubDomains",
            },
          })
            .then((response) => {
              console.log(
                "wareHouseStockAvailability response: ",
                response?.data
              );

              let availabilityStatus;
              if (response?.data?.qty >= productData?.quantity) {
                availabilityStatus = "2";
              } else {
                availabilityStatus = "3";
              }
              try {
                logger.info(`wareHouseStockAvailabilitySuccess`, {
                  status: StatusType.SUCEESS,
                  transactionId,
                  details: JSON.stringify(response?.data),
                });
                console.log(
                  "======response wareHouseStockAvailability=======",
                  JSON.stringify(response?.data)
                );
              } catch (error) {
                console.log(
                  `wareHouseStockAvailability Success Logger Error`,
                  error
                );
              }
              return res.send({
                response: availabilityStatus,
                status: true,
              });
            })
            .catch((error) => {
              try {
                logger.info(`wareHouseStockAvailabilityCatch`, {
                  status: StatusType.FAIL,
                  transactionId,
                  details: error,
                });
                console.log(
                  "==========wareHouseStockAvailability Catch =========",
                  error
                );
              } catch (error) {
                console.log(
                  `wareHouseStockAvailability Error Logger Error`,
                  error
                );
              }
              return res
                .status(500)
                .json({ response: null, error: error, status: false });
            });
        }
      })
      .catch(function (error) {
        try {
          logger.info(`stockAvailabilityAllLocationCatch1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log(
            "==========stockAvailabilityAllLocation Catch 1=========",
            error
          );
        } catch (error) {
          console.log(
            `stockAvailabilityAllLocation Error Logger Error 1`,
            error
          );
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
        //return res.send({res:error,status:"fail"})
      });
  } catch (e) {
    try {
      logger.info(`stockAvailabilityAllLocationCatch2`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("==========stockAvailabilityAllLocation Catch 2=========", e);
    } catch (error) {
      console.log(`stockAvailabilityAllLocation Error Logger Error 2`, error);
    }
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: true,
      error: response,
    });
  }
};

export const checkClaimFlag = async (req, res) => {
  const checkMatcodeInList = (matCodeList) => {
    let isMatcodeInList = true;
    matCodeList?.forEach((element) => {
      if (!element?.matCode) {
        isMatcodeInList = false;
      }
    });
    return isMatcodeInList;
  };
  try {
    const { receiptNo, matList, channelType, transactionID } = req.body;
    if (!receiptNo && !channelType && checkMatcodeInList(matList)) {
      return allFieldsRequired(res);
    }

    try {
      logger.info(`checkClaimFlagRequestData`, {
        status: StatusType.SUCEESS,
        transactionID,
        details: JSON.stringify(req.body),
      });
      console.log("checkClaimFlag request data", JSON.stringify(req.body));
    } catch (error) {
      console.log(`checkClaimFlagRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.returnOrClaim.checkClaimFlag,
      headers: {
        "Ocp-Apim-Subscription-Key": constant?.ECLAIM_SUBSCRIPTION_KEY,
        "x-authorization": `Bearer ${constant.ECLAIM_BEARER_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: req.body,
    })
      .then(function (response) {
        try {
          logger.info(`checkClaimFlagSuccess`, {
            status: StatusType.SUCEESS,
            transactionID,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response checkClaimFlag=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`checkClaimFlag Success Logger Error`, error);
        }
        const result = {
          transactionID: transactionID || "",
          resultList: response?.data?.data?.resultList || [],
          resultCode: response?.data?.data?.resultCode || "500000",
          resultMessage: response?.data?.data?.resultDescription || "FAIL",
        };
        return res.send({
          response: result,
          status: response?.data?.data?.resultCode === "20000",
        });
      })
      .catch(function (error) {
        try {
          logger.info(`checkClaimFlagCatch`, {
            status: StatusType.FAIL,
            transactionID,
            details: error,
          });
          console.log("==========checkClaimFlag Catch =========", error);
        } catch (error) {
          console.log(`checkClaimFlag Error Logger Error`, error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.info(`checkClaimFlagCatch2`, {
        status: StatusType.FAIL,
        transactionID,
        details: e,
      });
      console.log("==========checkClaimFlag Catch 2=========", e);
    } catch (error) {
      console.log(`checkClaimFlag Error Logger Error 2`, error);
    }
    return res.send({
      response: "Something happend please try again.",
      error: e,
      status: false,
    });
  }
};

export const getListBom = async (req, res) => {
  try {
    const { matcode, transactionID } = req.body;
    if (!matcode) {
      return allFieldsRequired(res);
    }

    try {
      logger.info(`getListBomRequestData`, {
        status: StatusType.SUCEESS,
        transactionID,
        details: JSON.stringify(req.body),
      });
      console.log("getListBom request data", JSON.stringify(req.body));
    } catch (error) {
      console.log(`getListBomRequestData Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.endPoint.returnOrClaim.listBom,
      headers: {
        "Ocp-Apim-Subscription-Key": constant?.ECLAIM_SUBSCRIPTION_KEY,
        "x-authorization": `Bearer ${constant.ECLAIM_BEARER_TOKEN}`,
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: req.body,
    })
      .then(function (response) {
        try {
          logger.info(`getListBomSuccess`, {
            status: StatusType.SUCEESS,
            transactionID,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "======response getListBom=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log(`getListBom Success Logger Error`, error);
        }
        const result = {
          transactionID: transactionID || "",
          bomList: response?.data?.data?.bomList || [],
          resultCode: response?.data?.data?.resultCode || "500000",
          resultMessage: response?.data?.data?.resultDescription || "FAIL",
        };
        return res.send({
          response: result,
          status: response?.data?.data?.resultCode === "20000",
        });
      })
      .catch(function (error) {
        try {
          logger.info(`getListBomCatch`, {
            status: StatusType.FAIL,
            transactionID,
            details: error,
          });
          console.log("==========getListBom Catch =========", error);
        } catch (error) {
          console.log(`getListBom Error Logger Error`, error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.info(`getListBomCatch2`, {
        status: StatusType.FAIL,
        transactionID,
        details: e,
      });
      console.log("==========getListBom Catch 2=========", e);
    } catch (error) {
      console.log(`getListBom Error Logger Error 2`, error);
    }
    return res.send({
      response: "Something happend please try again.",
      error: e,
      status: false,
    });
  }
};
