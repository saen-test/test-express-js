import config from "../config/index.js";
import axios from "axios";
import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";
import { allFieldsRequired } from "../utilities/validation.js";
import { randomUUID } from "crypto";

const logger = new LoggerService("app");
let dataShopMs = [];

const getMsHeaderConfig = () =>
  axios.create({
    baseURL: config?.ms?.baseUrl,
    timeout: 30000,
    withCredentials: true,
    headers: {
      "Ocp-Apim-Subscription-Key": constant.MS_OCP_APIM_SUBSCRIPTION_KEY,
      "Ocp-Apim-Trace": true,
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
      "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
    },
  });

const getDataFromMs = async (req, res, url, msName) => {
  try {
    logger.info(`${msName}RequestData`, {
      status: StatusType.SUCEESS,
      transactionId: req?.body?.transactionID,
      details: JSON.stringify(req.body),
    });
    console.log(`${msName} request data`, JSON.stringify(req.body));
  } catch (error) {
    console.log(`${msName}RequestData Logger Error`, error);
  }
  await getMsHeaderConfig()
    .request({
      url,
      method: "POST",
      data: {
        // transactionID: constant.MS_TRANSACTION_ID,
        ...req.body,
      },
    })
    .then((resp) => {
      const logDetails = `${resp?.data?.transactionID} ${resp?.data?.resultCode} ${resp?.data?.resultMessage}`;
      try {
        logger.info(`${msName}Success`, {
          status: StatusType.SUCEESS,
          transactionId: req?.body?.transactionID,
          details: logDetails,
        });
        console.log(`${msName} success `, logDetails);
      } catch (error) {
        console.log(`${msName} success logger error `, error);
      }

      return res.status(200).json({ data: resp.data, status: true });
    })
    .catch((err) => {
      try {
        logger.error(`${msName}Error`, {
          status: StatusType.FAIL,
          transactionId: req?.body?.transactionID,
          details: err,
        });
        console.log(`${msName} error `, err);
      } catch (error) {
        console.log(`${msName} error logger error `, error);
      }

      return res.status(500).json({ error: err, status: false, data: null });
    });
};

export const getDataShopFromMs = async () => {
  const req = {
    body: {
      transactionID: randomUUID(),
      language: "th",
    },
  };
  const msName = "getProvincesList";
  try {
    logger.info(`${msName}RequestData`, {
      status: StatusType.SUCEESS,
      transactionId: req?.body?.transactionID,
      details: JSON.stringify(req.body),
    });
    console.log(`${msName} request data`, JSON.stringify(req.body));
  } catch (error) {
    console.log(`${msName}RequestData Logger Error`, error);
  }
  await getMsHeaderConfig()
    .request({
      url: config?.ms?.provincesList,
      method: "POST",
      data: {
        // transactionID: constant.MS_TRANSACTION_ID,
        ...req.body,
      },
    })
    .then((resp) => {
      const logDetails = `${resp?.data?.transactionID} ${resp?.data?.resultCode} ${resp?.data?.resultMessage}`;
      try {
        logger.info(`${msName}Success`, {
          status: StatusType.SUCEESS,
          transactionId: req?.body?.transactionID,
          details: logDetails,
        });
        console.log(`${msName} success `, logDetails);
      } catch (error) {
        console.log(`${msName} success logger error `, error);
      }

      dataShopMs = {
        data: resp.data,
        status: true,
      };

      // return res.status(200).json({ data: resp.data, status: true });
    })
    .catch((err) => {
      try {
        logger.error(`${msName}Error`, {
          status: StatusType.FAIL,
          transactionId: req?.body?.transactionID,
          details: err,
        });
        console.log(`${msName} error `, err);
      } catch (error) {
        console.log(`${msName} error logger error `, error);
      }

      // return res.status(500).json({ error: err, status: false, data: null });
      dataShopMs = {
        data: [],
        status: false,
      };
    });
};

export const getProvincesList = async (req, res) => {
  // getDataFromMs(req, res, config?.ms?.provincesList, "getProvincesList");
  if (dataShopMs?.data?.resultCode?.toString() === "20000") {
    return res.status(200).json(dataShopMs);
  } else {
    await getDataShopFromMs();
    return res.status(200).json(dataShopMs);
  }
};

export const getStoreListByProvince = async (req, res) =>
  getDataFromMs(
    req,
    res,
    config?.ms?.storeListByProvince,
    "getStoreListByProvince"
  );

export const getStoreListByLatLong = async (req, res) =>
  getDataFromMs(
    req,
    res,
    config?.ms?.storeListByLatLong,
    "getStoreListByLatLong"
  );

export const getCondoList = async (req, res) =>
  getDataFromMs(req, res, config?.ms?.condoList, "getCondoList");

export const modifyOrder = async (req, res) =>
  getDataFromMs(req, res, config?.ms?.modifyOrder, "modifyOrder");

export const getAddressByCriteria = async (req, res) => {
  const { criteriaField, criteriaValue } = req.body;
  if (!criteriaField || !criteriaValue) {
    return allFieldsRequired(res);
  }
  return getDataFromMs(
    req,
    res,
    config?.ms?.addressByCriteria,
    "getAddressByCriteria"
  );
};
