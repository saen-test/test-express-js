import express from 'express';
const router = express.Router();
import {login,logout,addPublicInfo,changeUserPassword,setUserActivity,setTokensInCache,validateToken,readCookie}  from'../controller/andromeda-controller.js';
import {getUserValidity} from '../utilities/redis.js';
// import {setRedis, setRedisWithExpiry, setRedisWithExpiryCommand, checkRedis, getRedis, updateRedis, deleteRedis, removeRedis} from '../controller/redis-controller.js';

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/home', function(req, res, next) {
  res.send('user home page called');
});

//  ADMD
router.get('/auth',login) ;
router.get('/logout',logout) ;
router.post('/change-password',getUserValidity,changeUserPassword) ;
// router.post('/change-password1',getUserValidity,changeUserPassword1) ; // to test
router.post('/add-public-info',getUserValidity,addPublicInfo) ;
router.post('/set-activity',setUserActivity);
router.post('/set-tokens',setTokensInCache);
router.get('/set-tokens',setTokensInCache);
router.post('/validate-user',validateToken);
router.post('/read-cookie',readCookie);

// router.post('/set-redis', setRedis);
// router.post('/set-redis-with-expiry', setRedisWithExpiry);
// router.post('/set-redis-with-expiry-command', setRedisWithExpiryCommand);
// router.post('/check-redis', checkRedis);
// router.post('/get-redis', getRedis);
// router.post('/update-redis', updateRedis);
// router.post('/delete-redis', deleteRedis);
// router.post('/remove-redis', removeRedis);

export default router;
