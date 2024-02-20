import axios from "axios";
import config from "../config/index.js";
import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";
import { nboMockRes } from "../utilities/nboMockRes.js";
import { allFieldsRequired } from "../utilities/validation.js";
import { getCurrentDateFormatted } from "../utilities/util.js";

const logger = new LoggerService("app");

/*
  Created By : Shravan
  Created On : 01-08-2023
  Description : get NBO recommended products
  Input Params: owner
*/

export const getNBOOffer = async (req, res, next) => {
  try {
    const mobileNo = req?.userMobileNo?.replace(/\D/g, "");
    if (mobileNo?.slice(0, 1) == "0") {
      mobileNo = "66" + mobileNo?.slice(1);
    }
    const requestParams = {
      owner: mobileNo,
      container_type: 1,
      quad_level: 3,
      channel_name: "NCP",
      product_category: "best_hs",
    };

    try {
      logger.info(`getNBOOfferRequestParams`, {
        status: StatusType.SUCEESS,
        details: JSON.stringify(requestParams),
      });
      console.log("getNBOOffer request params ", JSON.stringify(requestParams));
    } catch (error) {
      console.log(`getNBOOfferRequestParams Logger Error`, error);
    }

    axios({
      method: "get",
      url: config.nbo.getOffer,
      headers: {
        "Content-Type": "application/json",
        authorizedToken: constant.NBO_AUTH_TOKEN,
      },
      data: {},
      params: requestParams,
    })
      .then(function (response) {
        try {
          logger.info(`getNBOOfferSuccess`, {
            status: StatusType.SUCEESS,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====getNBOOffer Success response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log("getNBOOffer Success logger error ", error);
        }
        req.getNBOOfferResponse = response?.data;
        next();
      })
      .catch(function (error) {
        try {
          logger.error(`getNBOOfferError`, {
            status: StatusType.FAIL,
            details: error,
          });
          console.log("====getNBOOffer error=======", error);
        } catch (error) {
          console.log("getNBOOffer Error logger error ", error);
        }
        // req.getNBOOfferResponse = nboMockRes;
        next();
      });
  } catch (e) {
    try {
      logger.error(`getNBOOfferErrorCatch`, {
        status: StatusType.FAIL,
        details: JSON.stringify(e),
      });
      console.log("====getNBOOffer error catch=======", e);
    } catch (error) {
      console.log("getNBOOffer Error logger error catch ", error);
    }
    // req.getNBOOfferResponse = nboMockRes;
    next();
  }
};

/*
  Created By : Shravan
  Created On : 09-08-2023
  Description : NBO Offer View and Update
  Input Params: id
*/

export const viewNBOOffer = async (req, res) => {
  try {
    const mobileNo = req?.userMobileNo?.replace(/\D/g, "");
    const { offerId } = req.body;
    if (mobileNo?.slice(0, 1) == "0") {
      mobileNo = "66" + mobileNo?.slice(1);
    }
    if (!offerId) {
      return allFieldsRequired(res);
    }

    const requestData = {
      owner: mobileNo,
      action: "2",
      datetime: getCurrentDateFormatted(),
      offer_info: {
        offers: [
          {
            id: offerId,
            product_category: "best_hs",
            channel_contact: "NCP",
            sub_channel_contact: "",
            category_type: "1",
          },
        ],
      },
      additional_fields: {
        values: {},
      },
    };

    try {
      logger.info(`viewNBOOfferRequestData`, {
        status: StatusType.SUCEESS,
        details: JSON.stringify(requestData),
      });
      console.log("viewNBOOffer request params ", JSON.stringify(requestData));
    } catch (error) {
      console.log(`viewNBOOfferRequestParams Logger Error`, error);
    }

    axios({
      method: "POST",
      url: config.nbo.viewOffer,
      headers: {
        "Content-Type": "application/json",
        authorizedToken: constant.NBO_AUTH_TOKEN,
      },
      data: requestData,
    })
      .then(function (response) {
        try {
          logger.info(`viewNBOOfferSuccess`, {
            status: StatusType.SUCEESS,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====viewNBOOffer Success response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log("viewNBOOffer Success logger error ", error);
        }
        return res.send({
          response: response?.data,
        });
      })
      .catch(function (error) {
        try {
          logger.error(`viewNBOOfferError`, {
            status: StatusType.FAIL,
            details: error,
          });
          console.log("====viewNBOOffer error=======", error);
        } catch (error) {
          console.log("viewNBOOffer Error logger error ", error);
        }
        return res.status(500).json({ status: false, data: null });
      });
  } catch (e) {
    try {
      logger.error(`viewNBOOfferErrorCatch`, {
        status: StatusType.FAIL,
        details: JSON.stringify(e),
      });
      console.log("====viewNBOOffer error catch=======", e);
    } catch (error) {
      console.log("viewNBOOffer Error logger error catch ", error);
    }
    return res.status(500).json({ status: false, data: null });
  }
};
