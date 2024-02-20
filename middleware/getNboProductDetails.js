import axios from "axios";
import config from "../config/index.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";

const logger = new LoggerService("app");

export const getNBOProductDetails = async (req, res) => {
  try {
    const { web_token } = req.cookies;
    const { getNBOOfferResponse = [] } = req;
    const staticProducts = JSON.parse(req?.query?.staticProducts);

    let productDetails = [];
    getNBOOfferResponse?.mVivaNextBestOffers?.offers?.forEach((offer) => {
      let model_dt = offer?.nbo_field_details?.find((x) =>
        x?.offer_parameter_name?.includes("model")
      )?.offer_parameter_value;
      let brand = offer?.nbo_field_details?.find((x) =>
        x?.offer_parameter_name?.includes("brand")
      )?.offer_parameter_value;
      let trade_sku = offer?.nbo_field_details?.find((x) =>
        x?.offer_parameter_name?.includes("trade")
      )?.offer_parameter_value;
      let tariff_sku = offer?.nbo_field_details?.find((x) =>
        x?.offer_parameter_name?.includes("promo_offering")
      )?.offer_parameter_value;

      if (![model_dt, brand].some((v) => v === "")) {
        let productDetailWithValue = {
          model_dt: model_dt,
          brand: brand,
          trade_sku: trade_sku ? "D" + trade_sku : "",
          tariff_sku: tariff_sku,
          sku: "",
          ais_nbo_id: offer?.id,
        };
        productDetails.push(productDetailWithValue);
      }
    });
    let i = 0;
    while (productDetails.length < 4) {
      let productDetailWithoutValue = {
        model_dt: "",
        brand: "",
        tariff_sku: "",
        trade_sku: "",
        sku: staticProducts[i],
        ais_nbo_id: "",
      };
      productDetails.push(productDetailWithoutValue);
      i++;
    }

    try {
      logger.info(`getNBOProductDetailsStaticProducts`, {
        status: StatusType.SUCEESS,
        details: JSON.stringify(staticProducts),
      });
      logger.info(`getNBOProductDetailsFilter`, {
        status: StatusType.SUCEESS,
        details: JSON.stringify(productDetails),
      });
      console.log(
        "====getNBOProductDetails staticProducts=======",
        JSON.stringify(staticProducts)
      );
      console.log(
        "====getNBOProductDetails productDetails filter=======",
        JSON.stringify(productDetails)
      );
    } catch (error) {
      console.log("getNBOProductDetails request logger error ", error);
    }

    let data = JSON.stringify({
      query: `query ($filter : [NboProductDetailsInput]!) { nboProductDetails(filter : $filter) { items { sku type_of_product name thumbnail_url min_bundle_price url_subdirectory_1 url_subdirectory_2 brand recommended_item new_item pre_booking_item color_codes capacity_variants price color_id capacity_id campaign_id campaign_code campaign_sku trade_id trade_sku tariff_id tariff_sku model_dt ais_nbo_id } } }`,
      variables: JSON.parse(
        JSON.stringify({
          filter: productDetails,
        })
      ),
    });

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
          logger.info(`getNBOProductDetailsResponse`, {
            status: StatusType.SUCEESS,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====getNBOProductDetails Success response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log("getNBOProductDetails Success logger error ", error);
        }
        if (response?.status == 200 && !response?.data?.errors?.length) {
          let result = {
            status: true,
            response: response?.data,
          };
          return res.status(200).json(result);
        } else {
          return res.status(500).json({
            error: response?.data?.errors?.[0]?.message,
            status: false,
          });
        }
      })
      .catch(function (error) {
        try {
          logger.error(`getNBOProductDetailsError`, {
            status: StatusType.FAIL,
            details: error,
          });
          console.log("====getNBOProductDetails error=======", error);
        } catch (error) {
          console.log("getNBOProductDetails Error logger error ", error);
        }
        return res
          .status(500)
          .json({ status: false, data: null, error: error });
      });
  } catch (err) {
    try {
      logger.error(`getNBOProductDetailsCatch`, {
        status: StatusType.FAIL,
        details: JSON.stringify(err),
      });
      console.log("====getNBOProductDetails error catch=======", err);
    } catch (error) {
      console.log("getNBOProductDetails Error logger error catch ", error);
    }
    return res.status(500).json({ status: false, data: null });
  }
};
