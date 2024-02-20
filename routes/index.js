
import {
  getCustomerProfile,
  getPersonalInformation,
  // verifyCustomerProfile,
  sendOTPCmd,
  validateOTPCmd,
  getQueryPoint,
  validateFiberFBB,
  getFBBOffer,
  checkFiberFBBCoveragePort,
  getFBBTimeSlot,
  getNetworkType,
  validateTopUp,
  requestTopUp,
  addOnTop,
  validateOnTop,
  validateProfile,
  validateProfileTest,
  validateStockAvailability,
  validateMobilePortIn,
  getKYCUrl,
  checkKYCProfile,
  commandGetCustomerProfile,
  validateMobileConvert,
  validateStockAvailabilityAllLocation,
  checkClaimFlag,
  getListBom
} from "../controller/lego-controller.js";
import {addPublicInfo,changeUserPassword}  from'../controller/andromeda-controller.js';
import {
  getProvincesList,
  getStoreListByProvince,
  getStoreListByLatLong,
  getCondoList,
  modifyOrder,
  getAddressByCriteria
} from "../controller/ms-controller.js";
import config from '../config/index.js';
import express from 'express';
import redisOMClient from '../utilities/redis.js';
const router = express.Router();
import {getAccessTokenFromCache, getUserValidity} from '../utilities/redis.js'
import { verifyUser } from "../middleware/verifyUser.js";
import { addToCart } from "../middleware/addToCart.js";
import { getUserMobileNo } from "../middleware/getUserMobileNo.js";
import { getNBOOffer, viewNBOOffer } from "../controller/nbo-controller.js";
import { getNBOProductDetails } from "../middleware/getNboProductDetails.js";

import { rateLimit } from "express-rate-limit";
import { rateLimitConstant } from "../appConstants.js";

// set up rate limiter: maximum of five requests every two minutes
// const limiter = rateLimit({
//   windowMs: rateLimitConstant.WINDOW_MS, // limit time frame to 2 min
//   max: rateLimitConstant.MAX, // max requests allowed
//   message: rateLimitConstant.MESSAGE, // custom error message to be sent
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// router.get('/home',async function(req, res, next) {
//   const data =await getAccessTokenFromCache('web_token');
//   console.log(data);
//  return res.send({name:'cks',...data,...req.query});
// });


// router.get('/sit', function(req, res, next) {
//   return res.send({name:'sit',...req.query,...config});
// });
 

// router.get('/uat', function(req, res, next) {
//   return res.send({name:'uat',...req.query,...config});
// });


// router.get('/home1', function(req, res, next) {
//   const {code,state="",verify_email=""} = req.query;
//   res.send({name:'cks',...req.query});
//   // get subscription key
//   // validate web token
//   // make api call
// });



router.get('/redis',async function(req, res, next) {
  
  const value = await redisOMClient.get(req.query.key);
  console.log(value);
  res.send({name:'redis',key:value});
  
});

router.get('/remove',async function(req, res, next) {
  res.clearCookie("web_token",{domain:".ais.th",path:"/"});
  res.clearCookie("web_token");
  await redisOMClient.delete("web_token1");
  res.send({name:'remove'});
});

// router.get('/magento', function(req, res, next) {
//   // console.log(config);
//   console.log(req.query);
//   return  res.status(200).setHeader('set-cookie', [
//       'web_token='+req.query.webToken+'; Path=/; Domain=.ais.th; HttpOnly=true; SameSite=None; Secure',
//   ]).json({name:'magento'});
//   //return res.status(200).json({name:'magento'});
//   // get subscription key
//   // validate web token
//   // make api call
// });

router.post('/change-password',changeUserPassword) ;
router.post('/add-public-info',addPublicInfo) ;
router.post('/get-customer-profile', verifyUser, getCustomerProfile) ;
router.post('/get-customer-information', verifyUser, getPersonalInformation) ;
router.post('/command-get-customer-profile',commandGetCustomerProfile) ;

// // lego api
router.post('/send-otp',sendOTPCmd) ;
router.post('/confirm-otp',validateOTPCmd) ;
router.post('/get-points',getQueryPoint) ;
router.post('/confirm-otp-get-points',validateOTPCmd, getQueryPoint) ;
// // Fiber
router.post('/validate-fbb',validateFiberFBB) ;
router.post('/get-fbb-offer',getFBBOffer) ;
router.post('/check-fbb-coverage',checkFiberFBBCoveragePort) ;
router.post('/get-fbb-time-slots',getFBBTimeSlot) ;
// //Tariff
router.post("/check-network", getNetworkType);
router.post("/validate-topUp", validateTopUp);
router.post("/request-topUp", requestTopUp);
// add on 
router.post("/add-onTop", addOnTop);
router.post("/validate-onTop", validateOnTop);

router.post("/validate-profile", validateProfile);
router.post("/validate-profile-test", validateProfileTest, addToCart);
router.post("/validate-mobile-port-in", validateMobilePortIn);
// KYC
router.post("/get-kyc-url", getKYCUrl);
router.post("/check-kyc-profile", verifyUser, checkKYCProfile);
// router.post("/cancel-order", cancelOrder);

router.post('/validate-stock-all-summary',validateStockAvailability) ;
router.post('/validate-mobile-convert',validateMobileConvert) ;
router.post('/validate-stock-all-location',validateStockAvailabilityAllLocation) ;

router.post('/get-provinces-list', getProvincesList);
router.post('/get-shop-list-by-province', getStoreListByProvince);
router.post('/get-shop-list-by-latlong', getStoreListByLatLong);
router.post('/get-condo-list', getCondoList);
router.post('/modify-order', getUserValidity, modifyOrder);
router.post('/get-address-by-criteria', getAddressByCriteria);
router.post('/return-or-claim/check-claim-flag',checkClaimFlag);
router.post('/return-or-claim/list-bom',getListBom);

router.get("/get-nbo-offer", getUserMobileNo, getNBOOffer, getNBOProductDetails);
router.post("/view-nbo-offer", getUserMobileNo, viewNBOOffer);

export default router;