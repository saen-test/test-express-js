import { constant } from "../../keyVaultConstant.js";

const data = {
  magento: {
    graphQLApi:
      "https://mcstaging2.store.ais.th/graphql",
    restApi: {
      url: "https://mcstaging2.store.ais.th/rest/V1/stockItems/",
      token: constant.MAGENTO_REST_AUTH_TOKEN,
    },
  },
  aem: {
    url: constant.APPLICATION_BASE_URL,
    profile: `${constant.APPLICATION_BASE_URL}/en/profile-page`,
  },
  log: {
    envName: "develop"
  },
  ms: {
    baseUrl: "https://dev-croissant.ais.th/external/dev",
    // reserveOrder: "/ncp-inventory/reserve-order",
    provincesList: "/ncp-shop/ais-shop-master/get-ais-province-code-list",
    storeListByProvince: "/ncp-shop/ais-shop-master/get-shop-list-by-province",
    storeListByLatLong: "/ncp-shop/ais-shop-master/get-shop-list-by-latlong",
    // condoList:
    //   "/ncp-fibre/fetch-condo-data?_limit=0&_offset=0&_sort=name&_order=ASC&_lang=THA",
    modifyOrder: "/ncp-order/modify-order",
    addressByCriteria: "/ncp-address/ais-address/get-data-by-criteria",
  },
  redis: {
    cachePort: constant.REDIS_PORT,
    cacheHostName: constant.REDIS_HOST,
    cachePassword: constant.REDIS_CACHE_KEY,
  },
  endPoint: {
    referChannel: "NCP",
    referChannelPerfTest: "LoadTest",
    validateProfile:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/be/validateProfile/action/validateProfile",
    validateMobilePortIn:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/be-validateMobilePortIn/action/validateMobilePortIn",
    getCustomerProfile:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/ssb-itprofile/querycustomerprofile/action/queryCustomerProfile",
    getPersonalInformation:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/sff/querypersonalinformation/action/queryPersonalInformation",
    // verifyCustomerProfile:
    //   "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-onsbe/nocpbe/staging/gsso-sendOTP/action/queryCustomerProfile",
    commandGetCustomerProfile:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/priv-getcustomerprofile/action/getCustomerProfile",
    validateMobileConvert:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/be-validateMobileConvert/action/validateMobileConvert",
    getNetworkType:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-onsbe/nocpbe/staging/gsso-sendOTP/action/queryNetworkType",
    getKYCUrl:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/ocr1/checkKycStatus/action/getKYCURL",
    checkKYCProfile:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/be-checkkycprofile/action/checkKYCProfile",
    // cancelOrder: {
    //   url: "https://stg-croissant.ais.th/external/stg/ncp-cancel_order/cancelCreateOrder",
    //   subscription_key: constant.MS_OCP_APIM_SUBSCRIPTION_KEY,
    // },
    otp: {
      send: "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-onsbe/nocpbe/staging/gsso-sendOTP/action/sendOTP",
      verify:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-onsbe/nocpbe/staging/gsso-confirmotp/action/confirmOTP",
    },
    fbb: {
      validateMobile:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/fbss-validatemobilefbb/action/validateMobileFBB",
      checkCoveragePort:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/be-checkfbbcoverageport/action/checkFBBCoveragePort",
      getOffer:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/be-getfbboffer/action/getFbbOffer",
      queryTime:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/fbss/queryFBBTimeSlot/action/queryFBBTimeSlot",
    },
    topUp: {
      validate:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-ontbe/nocpbe/staging/be/topup/action/validateTopup",
      add: "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-ontbe/nocpbe/staging/be/topup/action/requestTopup",
    },
    onTop: {
      validate:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-ontbe/nocpbe/staging/be/ont/action/validateOnTop",
      add: "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-ontbe/nocpbe/staging/be/ont/action/addOnTop",
    },
    stockAllSummary:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-onsbe/nocpbe/staging/dt/querystockallsummary/action/queryStockAllSummary",
    stockAllLocation:
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/lego-onsbe/nocpbe/staging/dt/queryStockAllLocation/action/queryStockAllLocation",
    privilege: {
      productDetail:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/privilege-sales-portal-cloud/api/myais/v1/campaign/get-info",
      productList:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/privilege-sales-portal-cloud/api/myais/v1/campaign/get-list",
      activityCategory:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/privilege-sales-portal-cloud/api/serenade/v1/activity/get-category",
      activityCampaign:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/privilege-sales-portal-cloud/api/serenade/v1/activity/get-campaign",
      activityContent:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/privilege-sales-portal-cloud/api/serenade/v1/activity/get-content",
      getToken:
        "https://apim-hubcommon-az-asse-dev-001.azure-api.net/privilege-sales-portal-cloud/api/auth/v1/auth/generate",
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
      "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/priv/querypoint/action/queryPoint",
    admd: {
      changePassword:
        "https://admd-stg.adldigitalservice.com/auth/v3.2/changepassword",
      updateProfile: "https://admd-stg.adldigitalservice.com/auth/v3.2/publicId/info",
      sameSite: "None",
      clientId: constant.ADMD_CLIENT_ID,
      login:
        "https://admd-stg.adldigitalservice.com/auth/v3.2/oauth/authorize?response_type=code&client_id=%2FLp1jncN%2F975w7dahFP8V0slzsMyXhwQJmT%2Bxx7BuYlejhgqxNULUw%3D%3D&scope=profile&redirect_uri=https://dev-croissant.ais.th/external/sit/test/user/auth&template_name=ncp&lang=eng&nonce=2022062001445",
    },
    // aisLogger: "https://dev-croissant.ais.th/external/dev/ncp-logger",
    returnOrClaim : {
      checkClaimFlag : "https://apim-hubcommon-az-asse-dev-001.azure-api.net/dev-mychannel-eclaim-on-prem/api/ncp/checkClaim",
      listBom : "https://apim-hubcommon-az-asse-dev-001.azure-api.net/dev-mychannel-eclaim-on-prem/api/ncp/listBom",
      claimOrderDetail: "https://apim-hubcommon-az-asse-dev-001.azure-api.net/dev-aftersale-claim/aftersale/api/v1/claimncp/claim-order-detail",
      updateClaimOrder: "https://apim-hubcommon-az-asse-dev-001.azure-api.net/dev-aftersale-claim/aftersale/api/v1/claimncp/update-claim-order",
    },
    getDtBearer: "onlinestore",
    getReceiptOrder: "https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-lego-onsbe-v2/nocpbe/staging/dt/requesteReceipt/action/requesteReceipt",
  },
  nbo: {
    getOffer: "https://apim-hubcommon-az-asse-dev-001.azure-api.net/ngcm/mviva_nbo",
    viewOffer: "https://apim-hubcommon-az-asse-dev-001.azure-api.net/ngcm/mviva_offer_view_update",
    authorizedToken: constant.NBO_AUTH_TOKEN,
  },
  mPay: {
    baseUrl: "https://api.stg-paymentgateway.ais.co.th/stg",
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
