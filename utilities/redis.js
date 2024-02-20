import redis from "redis";
import { Client } from 'redis-om';
import config from "../config/index.js";

let redisClient;
let redisOMClient;
try{
        
    redisClient = await redis.createClient({
        url: 'rediss://'+config.redis.cacheHostName+":"+config.redis.cachePort,
        password: config.redis.cachePassword,        
    });
    await redisClient.connect();
    redisOMClient = await new Client().use(redisClient);
    // await redisOMClient.open('rediss://'+cacheHostName+':'+cachePort);

    const aString = await redisOMClient.execute(['PING']);
    console.log(aString);

    // const data = {
    //     accessToken:"TestToken",
    //     webToken:"TestWebToken",
    //     isUserIdle:false,
    //     expiry:new Date(),
    // }

    // const a0= await redisOMClient.set("web_token",JSON.stringify(data),{EX: 300});
    // const a1= await redisOMClient.set("web_token1",JSON.stringify(data));
    // const a2= await redisOMClient.setx("web_token2",300,JSON.stringify(data));
    // const a5= await redisOMClient.setx("web_token5",600,JSON.stringify(data));
    // const a3= await redisOMClient.set("web_token3",JSON.stringify(data),{EX: 300000});
    // const a4= await redisOMClient.set("web_token4",JSON.stringify(data),{EX: 300000,NX: true});
    // redisOMClient.expire("web_token1",300000);
    // redisOMClient.remove("web_token");
    
    // const anOBJ = await redisOMClient.get("web_token");
    // console.log("Test get",anOBJ);
    


await redisClient.on('error', (error) => {
    // handle error here
    console.log("Errror ",error);
});


 // Simple PING command
 console.log("\nCache command: PING");
 console.log("Cache response : " + await redisClient.ping());

// Print redis errors to the console
await redisClient.on('error', (err) => {
    console.log("Error " , err);
});

}
catch(e){
    console.log("==catch==",new Date(),e)
}


export const getAccessTokenFromCache = async(token) =>{
    try{
        console.log("==getAccessTokenFromCache==",token);
        const cacheValue =await redisOMClient.get(token);
        console.log("cacheValue ", cacheValue);
        // const cacheData = JSON.parse(cacheValue);
        // console.log("=cacheData len=",cacheData, Object.keys(cacheData).length);
        // let response;
        // if( Object.keys(cacheData).length > 0){
        //     response= {
        //         ...cacheData
        //     };
        // }
        // return response; 
        return cacheValue;    
    }catch(err){
        console.log("AccessTokenFromCache Error :",err);
        return null
    }
}

export const getUserValidity = async(req,res,next) =>{
    try{
        console.log("==getUserValidity==",new Date().getTime());
        const {web_token, accessToken} =req.cookies;
        if(!web_token || !accessToken) {
            return res.status(403).json({
                status:false,
                message:"Unauthorized"
            })
        }
        const cacheData = await getAccessTokenFromCache(web_token);
        if(!cacheData){
            // console.log("==expiry==",(parseInt(cacheData.expiry) > parseInt(new Date().getTime())));
            // if(cacheData.isUserIdle == '1' || parseInt(cacheData.expiry) > parseInt(new Date().getTime()) ){
            return res.status(403).json({
                status:false,
                message:"Unauthorized"
            })
            // }
        }
        req.body.accessToken = accessToken;
        next();
            
    }catch(err){
        console.log("getUserValidity Error :",err);
        return res.status(500).json({
            status:false,
            message:"Something went wrong !!"
        })
    }
}

export default redisOMClient;
  