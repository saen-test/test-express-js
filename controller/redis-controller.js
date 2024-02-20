// import redisOMClient from "../utilities/redis.js";
// import LoggerService from "../utilities/logger/logger.js";

// const logger = new LoggerService('app');

// export const setRedis = async (req, res) => {
//   try {
//     console.log("setRedis request data", JSON.stringify(req.body));
//     const { key, value = {}, expiryTime = 60 } = req.body;

//     const redisData = JSON.stringify({
//       ...value,
//       expiry: expiryTime
//     });
//     console.log("set Redis data", redisData);

//     if(redisOMClient){
//         console.log("redisOMClient available");
//         await redisOMClient.set(key, redisData);
//         const redisDataStored = await redisOMClient.get(key);
//         console.log("set Redis data 2 ", redisDataStored);
//         return res.status(200).json({ response: redisDataStored, status: true });
//     }
    
//     return res.status(200).json({ status: false, message: "Redis unavailable" });
//   } catch (e) {
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };

// export const setRedisWithExpiry = async (req, res) => {
//   try {
//     console.log("setRedisWithExpiry request data", JSON.stringify(req.body));
//     const { key, value = {}, expiryTime = 60 } = req.body;

//     const redisData = JSON.stringify({
//       ...value,
//       expiry: expiryTime
//     });
//     console.log("set Redis with expiry data", redisData);

//     if(redisOMClient){
//         console.log("redisOMClient available");
//         await redisOMClient.set(key, redisData);
//         await redisOMClient.expire(key, expiryTime)
//         const redisDataStored = await redisOMClient.get(key);
//         console.log("set Redis with expiry data - redisDataStored ", redisDataStored);
//         return res.status(200).json({ response: redisDataStored, status: true });
//     }
    
//     return res.status(200).json({ status: false, message: "Redis unavailable" });
//   } catch (e) {
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };

// export const setRedisWithExpiryCommand = async (req, res) => {
//   try {
//     console.log("setRedisWithExpiry request data", JSON.stringify(req.body));
//     const { key, value = {}, expiryTime = 60 } = req.body;

//     const redisData = JSON.stringify({
//       ...value,
//       expiry: expiryTime
//     });
//     console.log("set Redis with expiry data", redisData);

//     if(redisOMClient){
//         console.log("redisOMClient available");
//         await redisOMClient.set(key, redisData);
//         await redisOMClient.execute(['EXPIRE', key, expiryTime]);
//         const redisDataStored = await redisOMClient.get(key);
//         console.log("set Redis with expiry data - redisDataStored ", redisDataStored);
//         return res.status(200).json({ response: redisDataStored, status: true });
//     }
    
//     return res.status(200).json({ status: false, message: "Redis unavailable" });
//   } catch (e) {
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };

// export const checkRedis = async (req, res) => {
//   try {
//     console.log("checkRedis request data ", JSON.stringify(req.body));
//     const { key } = req.body;
//     console.log("checkRedis request data key ", key)

//     if(redisOMClient){
//         console.log("redisOMClient available");
//         const exists = await redisOMClient.exists(key);
//         console.log("exists? ", exists);
//         const existsExecute = await redisOMClient.execute(['EXISTS', key]);
//         console.log("execute-exists? ", existsExecute);
    
//         return res.status(200).json({ status: true, existsExecute, exists });
//     }
    
//     return res.status(200).json({ status: false, message: "Redis unavailable" });
//   } catch (e) {
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };

// export const getRedis = async (req, res) => {
//   try {
//     console.log("getRedis request data", JSON.stringify(req.body));
//     const { key } = req.body;

//     if(redisOMClient){
//         console.log("redisOMClient available");
//         const redisDataStored = await redisOMClient.get(key);
//         console.log("getRedis response data  ", JSON.stringify(redisDataStored));
//         return res.status(200).json({ response: redisDataStored, status: true });
//     }
//     return res.status(200).json({ status: false, message: "Redis unavailable" });
//   } catch (e) {
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };

// export const updateRedis = async (req, res) => {
//   try {
//     console.log("update Redis request data", JSON.stringify(req.body));
//     const { key, value = {}, expiryTime = 60 } = req.body;

//     const redisData = JSON.stringify({
//       ...value,
//       expiry: expiryTime
//     });
//     console.log("update Redis with expiry data", redisData);

//     if(redisOMClient){
//         console.log("redisOMClient available");
//         const redisDataStored = await redisOMClient.get(key);
//         console.log("updateRedis existing data  ", JSON.stringify(redisDataStored));
//         if(redisDataStored) {
//           console.log("data available in redis");
//           const timeBefore = new Date();
//           const remainingExpiryTime = await redisOMClient.ttl(key);
//           console.log("remainingExpiryTime ", remainingExpiryTime);
//           await redisOMClient.set(key, redisData);
//           const timeBetween = new Date();
//           await redisOMClient.expire(key, remainingExpiryTime);
//           const timeAfter = new Date();
//           return res.status(200).json({
//             timeAfter, timeBefore, timeBetween,
//             redisDataStored, redisData, remainingExpiryTime, status: true 
//           });
//         }
//         console.log("data not available in redis");
//         await redisOMClient.set(key, redisData);
//         return res.status(200).json({ redisDataStored, redisData, status: true });
//     }
//     return res.status(200).json({ status: false, message: "Redis unavailable" });
//   } catch (e) {
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };

// export const removeRedis = async (req, res) => {
//   try {
//     console.log("remove Redis request data", JSON.stringify(req.body));
//     const { key } = req.body;

//     if(redisOMClient){
//       console.log("redisOMClient available");
//       await redisOMClient.expire(key, 0.1);
//       console.log("key removed");
//       return res.status(200).json({ status: true });
//     }
//     return res.status(200).json({ status: false, message: "Redis unavailable" });
//   } catch (e) {
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };

// export const deleteRedis = async (req, res) => {
//   try {
//     console.log("delete Redis request data", JSON.stringify(req.body));
//     const { key } = req.body;

//     if(redisOMClient){
//       console.log("redisOMClient available");
//       await redisOMClient.expire(key, 1);
//       console.log("key deleted");
//       return res.status(200).json({ status: true });
//     }
//     return res.status(200).json({ status: false, message: "Redis unavailable" });
//   } catch (e) {
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };