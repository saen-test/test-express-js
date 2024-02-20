import axios from "axios";
import config from "../config/index.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";

const logger = new LoggerService("app");

export const addToCart = async (req, res) => {
  try {
    let retryCount = 0;
    const { web_token } = req.cookies;
    const { mobileNo = "", idCardNo = "" } = req?.body;
    const addToCartInfo = JSON.parse(JSON.stringify(req?.body?.addToCartInfo));
    const {
      cartItems = [],
      aisOtpMobileNumber = "",
      aisNationalId = "",
    } = addToCartInfo;
    const { ais_mobile_number = "" } = cartItems?.[0];
    console.log("req?.validateProfileResponse: ", req?.validateProfileResponse);
    console.log("idCardNo: ", idCardNo);
    console.log("mobileNo: ", mobileNo);
    console.log("aisOtpMobileNumber: ", aisOtpMobileNumber);
    console.log("aisNationalId: ", aisNationalId);
    console.log("ais_mobile_number: ", ais_mobile_number);

    const authorisedUser =
      (mobileNo &&
        (mobileNo == aisOtpMobileNumber || mobileNo == ais_mobile_number)) ||
      (idCardNo && idCardNo == aisNationalId);

    if (!web_token || !authorisedUser) {
      return res.status(401).json({
        error: "User not authorised",
        status: false,
        statusCode: "401",
      });
    }
    let data = JSON.stringify({
      query: `mutation addProductsToCart($cartItems:[CartItemInput!]!$clearCart:Int!$aisOtpMobileNumber:String!$aisTransferPin:String!$aisNationalId:String!$aisDob:String!$aisValidateProfileResult:String$ais_cloneprofile_flag:Int!$ais_kycprofile_flag:String){addProductsToCart(cartItems:$cartItems clearCart:$clearCart aisOtpMobileNumber:$aisOtpMobileNumber aisTransferPin:$aisTransferPin aisNationalId:$aisNationalId aisDob:$aisDob aisValidateProfileResult:$aisValidateProfileResult ais_cloneprofile_flag:$ais_cloneprofile_flag ais_kycprofile_flag:$ais_kycprofile_flag){user_errors{code message __typename}cart{id checkout_time_limit email items{id __typename ais_item_max_sale_qty uid ais_mobile_number deposit_inc_vat ais_sim_type ais_order_code ais_prebooking_flag quantity product{name display_name sku mat_code primary_sku campaign brand device_model stock_status price_exc_vat primary_image_url capacity_config_label capacity_config color_config_label url_key product_subtype type_of_product duration_contract campaign_code pre_booking_item pre_order_delivery_date1 pre_order_date1 pre_order_delivery_date2 pre_order_date2 product_subtype color_code color capacity __typename}...on BundleCartItem{bundle_options{uid label type values{id label price quantity name sku mat_code primary_image_url type_of_product price_exc_vat campaign_code duration_contract capacity_config_label color_config_label product_subtype pre_order_delivery_date1 pre_order_date1 pre_order_delivery_date2 pre_order_date2 __typename}__typename}__typename}prices{price{value currency __typename}row_total{value currency __typename}total_item_discount{value currency __typename}discounts{amount{value currency __typename}label __typename}__typename}}applied_coupons{code __typename}prices{grand_total{value currency __typename}discounts{amount{value __typename}label __typename}__typename}shipping_addresses{firstname lastname company street city region{code label __typename}postcode telephone house_number floor_number ais_address_type juristic_name ais_email branch_code sub_distict building identification_number moo village room soi country{code label __typename}available_shipping_methods{amount{currency value __typename}available carrier_code carrier_title error_message method_code method_title price_excl_tax{value currency __typename}price_incl_tax{value currency __typename}__typename}selected_shipping_method{amount{value currency __typename}carrier_code carrier_title method_code method_title __typename}__typename}billing_address{firstname lastname company street city region{code label __typename}postcode telephone house_number floor_number ais_address_type juristic_name ais_email sub_distict building identification_number moo village room soi country{code label __typename}__typename}available_payment_methods{code title payment_retry_limit instructions sort_order max_order_total min_order_total image bank_websites{bank_code bank_abbr bank_logo bank_abbr_spdp bank_abbr_lego bank_desc_tha bank_desc_eng __typename}__typename}aispoints{ais_points_value_redeemed ais_points_phone_number ais_points __typename}ais_otp_mobile_number ais_transfer_pin ais_dob ais_validate_profile_result ais_advance_amt ais_national_id ais_ekyc_results ais_registered_address __typename}__typename}}`,
      variables: JSON.parse(JSON.stringify(req?.body?.addToCartInfo)),
    });

    const addToCartFn = () => {
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
          console.log(
            "====addToCartMagentoresponse=======",
            JSON.stringify(response?.data)
          );
          if (response?.status == 200 && !response?.data?.errors?.length) {
            let result = {
              status: true,
              validateProfileResponse: req?.validateProfileResponse,
              addToCartResponse: response?.data,
            };
            logger.info(`addToCartMagentoResponseSuccess`, {
              status: StatusType.SUCEESS,
              details: JSON.stringify(result),
            });
            console.log('addToCartMagentoResponseSuccess: ', JSON.stringify(result));
            return res.status(200).json(result);
          } else {
            return res.status(500).json({
              error: response?.data?.errors?.[0]?.message,
              status: false,
            });
          }
        })
        .catch(function (error) {
          console.log("====addToCartMagentoCatch=======", error);
          logger.error(`addToCartMagentoResponseFail`, {
            status: StatusType.FAIL,
            details: JSON.stringify(error || {}),
          });
          if (error?.status === 502 && retryCount === 0) {
            console.log("graphql catch", error?.status, retryCount);
            retryCount++;
            addToCartFn();
          } else {
            return res
              .status(500)
              .json({ status: false, data: null, error: error });
          }
        });
    };
    addToCartFn();
  } catch (err) {
    console.log("====addToCartCatch=======", err);
    logger.error(`addToCartFail`, {
      status: StatusType.FAIL,
      details: JSON.stringify(err || {}),
    });
    return res
      .status(401)
      .json({ error: "User not authorised", status: false, statusCode: "401" });
  }
};
