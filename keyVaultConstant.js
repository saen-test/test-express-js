import * as dotenv from 'dotenv';

if(process.env.NODE_ENV === "local") {
  dotenv.config();
}

export const constant = {
  LEGO_SUBSCRIPTION_KEY: process.env["LEGO_SUBSCRIPTION_KEY"], // lego-subscription-key-fed
  // LEGO_SUBSCRIPTION_KEY_2: process.env["LEGO_SUBSCRIPTION_KEY_2"], // lego-subscription-key-fed-2
  LEGO_AUTH_TOKEN: process.env["LEGO_AUTH_TOKEN"], // lego-auth-token / lego-auth-token-sit /lego-auth-token-uat
  MS_OCP_APIM_SUBSCRIPTION_KEY: process.env["MS_OCP_APIM_SUBSCRIPTION_KEY"], // ms-ocp-apim-subscription-key / ms-ocp-apim-subscription-key-sit / ms-ocp-apim-subscription-key-uat
  // MS_TRANSACTION_ID: process.env["MS_TRANSACTION_ID"], // ms-transaction-id
  // GOOGLE_MAP_KEY: process.env["GOOGLE_MAP_KEY"], // google-map /google-map-sit / google-map-uat
  REDIS_PORT: process.env["REDIS_PORT"], // redis-port/  redis-port-sit / redis-port-uat
  REDIS_HOST: process.env["REDIS_HOST"], // redis-cache-host-name / redis-cache-host-name-sit / redis-cache-host-name-uat
  REDIS_CACHE_KEY: process.env["REDIS_CACHE_KEY"],//  redis-cache-key-fed / redis-cache-key-fed-sit / redis-cache-key-fed-uat
  PRV_POINT_USER: process.env["PRV_POINT_USER"], // prv-point-user-dev / prv-point-user-sit / prv-point-user-uat
  PRV_POINT_PASS: process.env["PRV_POINT_PASS"],// prv-point-pass-dev / prv-point-pass-sit / prv-point-pass-uat
  PRV_PRIVILEGE_USER: process.env["PRV_PRIVILEGE_USER"], // prv-privilege-user/ prv-privilege-user-sit/ prv-privilege-user-uat
  PRV_PRIVILEGE_PASS: process.env["PRV_PRIVILEGE_PASS"], // prv-privilege-pass-dev / prv-privilege-pass-sit / prv-privilege-pass-uat
  PRV_SERENADE_USER: process.env["PRV_SERENADE_USER"], // prv-serenade-user-dev / prv-serenade-user-sit/ prv-serenade-user-uat
  PRV_SERENADE_PASS: process.env["PRV_SERENADE_PASS"], // prv-serenade-pass-dev / prv-serenade-pass-sit / prv-serenade-pass-uat
  ADMD_CLIENT_ID: process.env["ADMD_CLIENT_ID"], // admd-client-id 
  MPAY_TOPUP_MERCHANT_ID: process.env["MPAY_TOPUP_MERCHANT_ID"], // mpay-topup-merchant-id / mpay-topup-merchant-id-sit/ mpay-topup-merchant-id-uat
  MPAY_TOPUP_MERCHANT_NAME: process.env["MPAY_TOPUP_MERCHANT_NAME"], // mpay-topup-merchant-name /mpay-topup-merchant-name-sit/ mpay-topup-merchant-name-uat
  MPAY_TOPUP_SERVICE_ID: process.env["MPAY_TOPUP_SERVICE_ID"], // mpay-topup-service-id / mpay-topup-service-id-sit / mpay-topup-service-id-uat
  MPAY_TOPUP_SERVICE_KEY: process.env["MPAY_TOPUP_SERVICE_KEY"], // mpay-topup-service-key / mpay-topup-service-key-sit / mpay-topup-service-key-uat
  MPAY_STORE_MERCHANT_ID: process.env["MPAY_STORE_MERCHANT_ID"], // mpay-merchant-id/ /mpay-merchant-id-sit / mpay-merchant-id-uat
  MPAY_STORE_MERCHANT_NAME: process.env["MPAY_STORE_MERCHANT_NAME"], // mpay-merchant-name/ mpay-merchant-name-sit / mpay-merchant-name-uat
  MPAY_STORE_SERVICE_ID: process.env["MPAY_STORE_SERVICE_ID"], // mpay-store-service-id / mpay-store-service-id-sit / mpay-store-service-id-uat
  MPAY_STORE_SERVICE_KEY: process.env["MPAY_STORE_SERVICE_KEY"], // mpay-store-service-key / mpay-store-service-key-sit / mpay-store-service-key-uat
  MAGENTO_REST_AUTH_TOKEN: process.env["MAGENTO_REST_AUTH_TOKEN"], // magento-rest-auth-token-fed-dev / magento-rest-auth-token-fed-sit / magento-rest-auth-token-fed-uat
  MY_POD_NAMESPACE: process.env["MY_POD_NAMESPACE"], // my-pod-namespace
  MY_POD_NAME: process.env["MY_POD_NAME"], // my-pod-name
  MY_POD_IP: process.env["MY_POD_IP"], // my-pod-ip
  PERFORMANCE_TESTING_ENABLED: process.env["PERFORMANCE_TESTING_ENABLED"], // performance-testing-enabled-dev / performance-testing-enabled-sit / performance-testing-enabled-uat
  APPLICATION_BASE_URL: process.env["APPLICATION_BASE_URL"],
  LOG_WORKSPACE_ID: process.env["LOG_WORKSPACE_ID"], // log-analytics-workspace-id
  LOG_SHARED_KEY: process.env["LOG_SHARED_KEY"], // log-analytics-primary-key
  CLAIM_NCP_ID: process.env["CLAIM_NCP_ID"], //x-claimncp-client-id-dev, x-claimncp-client-id-sit, x-claimncp-client-id-uat 
  ECLAIM_BEARER_TOKEN : process.env["ECLAIM_BEARER_TOKEN"], // eclaim-bearer-token-dev, eclaim-bearer-token-sit, eclaim-bearer-token-uat/
  ECLAIM_SUBSCRIPTION_KEY : process.env["ECLAIM_SUBSCRIPTION_KEY"], // eclaim-subscription-key-dev, eclaim-subscription-key-sit, eclaim-subscription-key-uat,eclaim-subscription-key-prod/
  UPLOAD_ECLAIM_AZURE_BLOB_SAS_URL : process.env["UPLOAD_ECLAIM_AZURE_BLOB_SAS_URL"], // upload-eclaim-azure-blob-sas-url-dev, upload-eclaim-azure-blob-sas-url-sit, upload-eclaim-azure-blob-sas-url-uat/
  UPLOAD_ECLAIM_AZURE_BLOB_CONTAINER_NAME : process.env["UPLOAD_ECLAIM_AZURE_BLOB_CONTAINER_NAME"], // upload-eclaim-azure-blob-container-name-dev, upload-eclaim-azure-blob-container-name-sit, upload-eclaim-azure-blob-container-name-uat/
  NBO_AUTH_TOKEN: process.env["NBO_AUTH_TOKEN"], // nbo-auth-token
  FILE_ENCRYPTION_KEY : process.env["FILE_ENCRYPTION_KEY"], //file-encryption-key-dev,file-encryption-key-sit, file-encryption-key-uat/
  IV_ENCRYPTION_KEY : process.env["IV_ENCRYPTION_KEY"], //iv-encryption-key-dev,iv-encryption-key-sit, iv-encryption-key-uat/
  IV_ENCRYPTION_IV : process.env["IV_ENCRYPTION_IV"], //iv-encryption-iv-dev, iv-encryption-iv-sit, iv-encryption-iv-uat/
};
