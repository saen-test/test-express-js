import { constant } from "../../keyVaultConstant.js";

const data = {
  magento: {
    graphQLApi: "https://mcprod.store.ais.th/graphql",
    restApi: {
      url: "https://mcprod.store.ais.th/rest/V1/stockItems/",
      token: constant.MAGENTO_REST_AUTH_TOKEN,
    },
  },
  aem: {
    url: constant.APPLICATION_BASE_URL,
    profile: `${constant.APPLICATION_BASE_URL}/en/profile-page`,
  },
  log: {
    envName: "prod",
  },
  ms: {
    baseUrl: "https://croissant.ais.th/external",
    // reserveOrder: "/ncp-inventory/reserve-order",
    provincesList: "/ncp-shop/ais-shop-master/get-ais-province-code-list",
    storeListByProvince: "/ncp-shop/ais-shop-master/get-shop-list-by-province",
    storeListByLatLong: "/ncp-shop/ais-shop-master/get-shop-list-by-latlong",
    // condoList:
    //   "/ncp-fibre/fetch-condo-data?_limit=0&_offset=0&_sort=name&_order=ASC&_lang=THA",
    modifyOrder: "/ncp-modify-order/modify-order",
    addressByCriteria: "/ncp-address/ais-address/get-data-by-criteria",
  },
  redis: {
    cachePort: constant.REDIS_PORT,
    cacheHostName: constant.REDIS_HOST,
    cachePassword: constant.REDIS_CACHE_KEY,
  },
  endPoint: {
    referChannel: "NCP",
    validateProfile:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/be/validateProfile/action/validateProfile",
    validateMobilePortIn:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/be-validateMobilePortIn/action/validateMobilePortIn",
    getCustomerProfile:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/ssb-itprofile/querycustomerprofile/action/queryCustomerProfile",
    getPersonalInformation:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/sff/querypersonalinformation/action/queryPersonalInformation",
    // verifyCustomerProfile:
    //   "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-onsbe/nocpbe/staging/gsso-sendOTP/action/queryCustomerProfile",
    commandGetCustomerProfile:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/priv-getcustomerprofile/action/getCustomerProfile",
    validateMobileConvert:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/be-validateMobileConvert/action/validateMobileConvert",
    getNetworkType:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/ssbItProfile/queryNetworkType/action/queryNetworkType",
    getKYCUrl:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/ocr1/checkKycStatus/action/getKYCURL",
    checkKYCProfile:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/be-checkkycprofile/action/checkKYCProfile",
    // cancelOrder: {
    //   url: "https://stg-croissant.ais.th/external/stg/ncp-cancel_order/cancelCreateOrder",
    //   subscription_key: constant.MS_OCP_APIM_SUBSCRIPTION_KEY,
    // },
    otp: {
      send: "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/gsso-sendOTP/action/sendOTP",
      verify:
        "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/gsso-confirmotp/action/confirmOTP",
    },
    fbb: {
      validateMobile:
        "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/fbss-validatemobilefbb/action/validateMobileFBB",
      checkCoveragePort:
        "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/be-checkfbbcoverageport/action/checkFBBCoveragePort",
      getOffer:
        "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/be-getfbboffer/action/getFbbOffer",
      queryTime:
        "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/fbss/queryFBBTimeSlot/action/queryFBBTimeSlot",
    },
    topUp: {
      validate:
        "https://prodoncloudapim.azure-api.net/croissant-lego-ontbe/nocpbe/be/topup/action/validateTopup",
      add: "https://prodoncloudapim.azure-api.net/croissant-lego-ontbe/nocpbe/be/topup/action/requestTopup",
    },
    onTop: {
      validate:
        "https://prodoncloudapim.azure-api.net/croissant-lego-ontbe/nocpbe/be/ont/action/validateOnTop",
      add: "https://prodoncloudapim.azure-api.net/croissant-lego-ontbe/nocpbe/be/ont/action/addOnTop",
    },
    stockAllSummary:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/dt/querystockallsummary/action/queryStockAllSummary",
    stockAllLocation:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/dt/queryStockAllLocation/action/queryStockAllLocation",
    privilege: {
      productDetail:
        "https://prodoncloudapim.azure-api.net/privilege-sales-portal/api/myais/v1/campaign/get-info",
      productList:
        "https://prodoncloudapim.azure-api.net/privilege-sales-portal/api/myais/v1/campaign/get-list",
      activityCategory:
        "https://prodoncloudapim.azure-api.net/privilege-sales-portal/api/serenade/v1/activity/get-category",
      activityCampaign:
        "https://prodoncloudapim.azure-api.net/privilege-sales-portal/api/serenade/v1/activity/get-campaign",
      activityContent:
        "https://prodoncloudapim.azure-api.net/privilege-sales-portal/api/serenade/v1/activity/get-content",
      getToken:
        "https://prodoncloudapim.azure-api.net/privilege-sales-portal/api/auth/v1/auth/generate",
      point: {
        userName: constant.PRV_POINT_USER,
        password: constant.PRV_POINT_PASS,
        displayName: "",
        webChannel: "WEB360",
      },
      privilege: {
        userName: constant.PRV_PRIVILEGE_USER,
        password: constant.PRV_PRIVILEGE_PASS,
        displayName: "privilege",
        webChannel: "WebPrivilege",
      },
      serenade: {
        userName: constant.PRV_SERENADE_USER,
        password: constant.PRV_SERENADE_PASS,
        displayName: "serenade",
        webChannel: "WebSerenade",
      },
    },
    queryPoint:
      "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/priv/querypoint/action/queryPoint",
    admd: {
      changePassword: "https://digital-id.ais.th/auth/v3.2/changepassword",
      updateProfile: "https://digital-id.ais.th/auth/v3.2/publicId/info",
      sameSite: "Strict",
      clientId: constant.ADMD_CLIENT_ID,
      login:
        "https://digital-id.ais.th/auth/v3.2/oauth/authorize?response_type=code&client_id=%2FLp1jncN%2F975w7dahFP8V0slzsMyXhwQJmT%2Bxx7BuYlejhgqxNULUw%3D%3D&scope=profile&redirect_uri=https://croissant.ais.th/external/app/user/auth&template_name=ncp&nonce=2022062001445",
    },
    // aisLogger: "https://croissant.ais.th/external/ncp-logger",
    returnOrClaim: {
      checkClaimFlag:
        "https://prodoncloudapim.azure-api.net/mychannel-eclaim-on-prem/api/ncp/checkClaim",
      listBom:
        "https://prodoncloudapim.azure-api.net/mychannel-eclaim-on-prem/api/ncp/listBom",
      claimOrderDetail:
        "https://prodoncloudapim.azure-api.net/aftersale-claim/aftersale/api/v1/claimncp/claim-order-detail",
      updateClaimOrder:
        "https://prodoncloudapim.azure-api.net/aftersale-claim/aftersale/api/v1/claimncp/update-claim-order",
    },
    getDtBearer: "onlinestore",
    getReceiptOrder: "https://prodoncloudapim.azure-api.net/croissant-lego-onsbe/nocpbe/dt/requesteReceipt/action/requesteReceipt",
  },
  nbo: {
    getOffer: "https://prodoncloudapim.azure-api.net/ngcm/mviva_nbo",
    viewOffer:
      "https://prodoncloudapim.azure-api.net/ngcm/mviva_offer_view_update",
    authorizedToken: constant.NBO_AUTH_TOKEN,
  },
  mPay: {
    baseUrl: "https://api.paymentgateway.ais.co.th/prod",
    topUp: {
      merchantId: constant.MPAY_TOPUP_MERCHANT_ID,
      merchantName: constant.MPAY_TOPUP_MERCHANT_NAME,
      serviceId: constant.MPAY_TOPUP_SERVICE_ID,
      secretKey: constant.MPAY_TOPUP_SERVICE_KEY,
    },
    storePurchasing: {
      merchantId: constant.MPAY_STORE_MERCHANT_ID,
      merchantName: constant.MPAY_STORE_MERCHANT_NAME,
      serviceId: constant.MPAY_STORE_SERVICE_ID,
      secretKey: constant.MPAY_STORE_SERVICE_KEY,
    },
  },
};
export default data;
