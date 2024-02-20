import axios from "axios";
import { allFieldsRequired } from "../utilities/validation.js";
import config from "../config/index.js";
import redisOMClient from "../utilities/redis.js";
import { randomUUID } from "crypto";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";

const logger = new LoggerService('app');

export const login = async (req, res) => {
  try {
    const { code, state, verify_email, ...otherParams } = req.query;
    console.log("login req.query ", JSON.stringify(req.query));
    if (state == "auth") {
      try {
        logger.info(`loginSuccess`, { status: StatusType.SUCEESS, details: 'login success' });
      } catch (error) {
        console.log("login Success logger error ", error);
      }
      return res.status(200).json({ status: true });
    }
    if (!code) {
      return allFieldsRequired(res);
    }

    const queryLogin =
      'aisCustomerAuthentication(authCode:"' +
      code +
      '" action:"login"){token accesstoken expiresIn}';
    const queryLoginLine = `mutation { ${queryLogin}}`;
    const queryLoginStringify = JSON.stringify({ query: queryLoginLine });

    try {
      logger.info(`queryLoginRequestData`, { status: StatusType.SUCEESS, details: queryLoginStringify });
      console.log("queryLogin request data",queryLoginStringify);
    } catch (error) {
      console.log(`queryLoginRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.magento.graphQLApi,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains"
      },
      data: queryLoginStringify,
    })
      .then(async function (response) {
        try {
          logger.info(`loginResponse`, { status: StatusType.SUCEESS, details: `authcode: ${code} - Response: ${JSON.stringify(response?.data)}` });
          console.log("====Login Response =======",JSON.stringify(response?.data));
        } catch (error) {
          console.log("login response logger error", error);
        }
        if (response?.data?.data?.aisCustomerAuthentication == null) {
          try {
            logger.error(`loginError1`, { status: StatusType.FAIL, details: `authcode: ${code} - Response: ${JSON.stringify(response?.data)}` });
            console.log("=====Login Error response 1=======",JSON.stringify(response?.data));

          } catch (error) {
            console.log("login error logger error 1", error);
          }
          return res.status(500).json({
            status: false,
            message: "Something went wrong.Please try again later.",
          });
        }
        const accessToken =
          response?.data?.data?.aisCustomerAuthentication?.accesstoken || "";
        const webToken =
          response?.data?.data?.aisCustomerAuthentication?.token || "";
        const expiryTime =
          response?.data?.data?.aisCustomerAuthentication?.expiresIn || 86400;
        var d;
        d = new Date();
        d.setSeconds(d.getSeconds() + expiryTime);
        const expires = "expires=" + d.toUTCString();
        if(redisOMClient){
          // const redisData = {
          //     accessToken: accessToken,
          //     expiry: expiryTime,
          //     isUserIdle: 0,
          //   };
            await redisOMClient.set(webToken, "1");
            await redisOMClient.expire(webToken, expiryTime);
          try {
            logger.info(`loginRedisSuccess`, { status: StatusType.SUCEESS, details: "Login updated in Redis" });
            console.log("Login updated in Redis");
          } catch (error) {
            console.log("login redis error logger error ", error);
          }
        } else {
          try {
            logger.error(`loginRedisError`, { status: StatusType.FAIL, details: "Redis unavailable" });
            console.log("Redis unavailable");
          } catch (error) {
            console.log("login redis error logger error ", error);
          }
        }

        res.setHeader("set-cookie", [
          "web_token=" +
            webToken +
            "; Path=/; Domain=.ais.th; HttpOnly=true; SameSite=" +
            config.endPoint.admd.sameSite +
            "; Secure; "+expires,
          "accessToken=" +
            accessToken +
            "; Path=/; Domain=.ais.th; HttpOnly=true; SameSite=" +
            config.endPoint.admd.sameSite +
            "; Secure; "+expires,
        ]);
        const profileUrl = config.aem.profile;
        let redirectURL = state != "test" ? state : config.aem.url;
        if (verify_email) {
          redirectURL = profileUrl + "?verify_email=1";
        }
        // logger.info(`login Success`, { status: StatusType.SUCEESS, details: response });
        let redirectURLDecoded = decodeURIComponent(redirectURL);
        if(otherParams && Object.keys(otherParams)?.length) {
          const urlParam = new URLSearchParams(otherParams);
          redirectURLDecoded = `${redirectURLDecoded}&${urlParam.toString()}`
        }
        if(redirectURLDecoded?.startsWith(config.aem.url))
          res.redirect(redirectURLDecoded);
        else 
          res.redirect(config.aem.url);
      })
      .catch(function (error) {
        try {
          logger.error(`loginError2`, { status: StatusType.FAIL, details: error });
          console.log("====Login Error Response 2=======",error);
        } catch (error) {
          console.log("login error logger error 2", error);
        }

        res.redirect(config.endPoint.admd.login+"&state="+state);
        // return res
        //   .status(500)
        //   .json({ status: false, data: null, error: error });

      });
  } catch (e) {
    try {
      logger.error(`loginError3 `, { status: StatusType.FAIL, details: e });
      console.log("====login catch error=======",e);
    } catch (error) {
      console.log("login error logger 3 error ", error);
    }
    return res.status(500).json({ status: false, data: null, error: e });
  }
};

const getCustomerDetails = async (token, callback) => {
  try {
    const query = "customer {firstname lastname }";
    const queryLine = `query { ${query}}`;

    const queryLineStringify = JSON.stringify({ query: queryLine });

    try {
      logger.info(`getCustomerDetailsRequestQuery`, { status: StatusType.SUCEESS, details: queryLineStringify });
      console.log("getCustomerDetails Request Query", queryLineStringify);
    } catch (error) {
      console.log(`getCustomerDetailsRequestQuery Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.magento.graphQLApi,
      headers: {
        Authorization: "Bearer " + token,
        //"Authorization" : "Bearer knn2eaa9fkw9gsi1y2stutmn18igcoav",
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: queryLineStringify,
    })
      .then(function (userResult) {
        try {
          logger.info(`getCustomerDetailsSuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(userResult?.data) });    
          console.log("======response getCustomerDetails=======",JSON.stringify(userResult?.data));
        } catch (error) {
          console.log(`getCustomerDetails Success Logger Error`, error);
        }

        callback(true, userResult?.data?.data?.customer?.firstname || "");
      })
      .catch(function (error) {
        try {
          logger.info(`getCustomerDetailsCatch1`, { status: StatusType.FAIL, details: error });         
          console.log("==========getCustomerDetails Catch 1=========",error);
        } catch (error) {
          console.log(`getCustomerDetails Error Logger Error 1`, error);
        }
        callback(false, "Something Went Wrong!");
      });
  } catch (e) {
    try {
      logger.info(`getCustomerDetailsCatch2`, { status: StatusType.FAIL, details: e });         
      console.log("==========getCustomerDetails Catch 2=========",e);
    } catch (error) {
      console.log(`getCustomerDetails Error Logger Error 2`, error);
    }
    callback(false, "Something Went Wrong!");
  }
};

export const logout = async (req, res) => {
  try {
    const { web_token } = req.cookies;

    const logoutQuery = `mutation { aisCustomerAuthentication( webtoken:"${web_token}" action:"logout" ) {token}}`;

    try {
      logger.info(`logoutQuery`, { status: StatusType.SUCEESS, details: logoutQuery });
      console.log("logoutQuery ", logoutQuery);
    } catch (error) {
      console.log("logoutQuery logger error ", error);
    }

    axios({
      method: "post",
      url: config.magento.graphQLApi,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        Authorization: "Bearer " + web_token,
      },
      data: { query: logoutQuery },
    })
      .then(async function (response) {
        console.log("====logout response status=======",response?.status);
        try {
          logger.info(`logoutResponse`, { status: StatusType.SUCEESS, details: response?.data });
          console.log("====logout response=======",JSON.stringify(response?.data));
        } catch (error) {
          console.log("logoutResponse logger error ", error);
        }
        
        if (response.status == 200) {
          res.setHeader("set-cookie", [
            "web_token=" +web_token +
              "; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; Domain=.ais.th; HttpOnly=true; SameSite=" +
              config.endPoint.admd.sameSite +
              "; Secure;",
          ]);
          // redisClient.exists(web_token, function(err, reply) {
          //     console.log("err",err)
          //     console.log("reply",reply)
          //     if (reply === 1) {
            // redisOMClient.del(web_token);
          //     }
          // });
          if(redisOMClient){
            await redisOMClient.expire(web_token, 1);
            try {
              logger.info(`logoutRedis`, { status: StatusType.SUCEESS, details: "Web Token deleted from Redis" });
              console.log("Web Token deleted from Redis");
            } catch (error) {
              console.log("logout redis logger error");
            }
          } else {
            try {
              logger.error(`logoutRedis`, { status: StatusType.SUCEESS, details: "Redis unavailable while logout" });
              console.log("Redis unavailable while logout");
            } catch (error) {
              console.log("logout redis unavailable logger error");
            }
          }
          try {
            logger.info(`logoutSuccess`, { status: StatusType.SUCEESS, details: response?.data });
          } catch (error) {
            console.log("logoutSuccess logger error ", error);
          }
          
          return res.status(200).json({
            ...response?.data,
            status: true,
          });
        } else {
          try {
            logger.error(`logoutError1`, { status: StatusType.FAIL, details: response?.data });
          } catch (error) {
            console.log("logoutError1 logger error ", error);
          }
          return res.status(403).json({
            ...response?.data,
            status: false,
          });
        }
      })
      .catch(function (error) {
        try {
          logger.error(`logoutError2`, { status: StatusType.FAIL, details: JSON.stringify(error) });
          console.log("====logoutError2=======",error);
        } catch (error) {
          console.log("logoutError2 logger error ", error);
        }
        return res
          .status(500)
          .json({ status: false, data: null, error: error });
      });
  } catch (e) {
    try {
      logger.error(`logoutError3`, { status: StatusType.FAIL, details: JSON.stringify(e) });
      console.log("==logoutError3=", e);
    } catch (error) {
      console.log("logoutError3 logger error ", error);
    }
    return res.status(500).json({ data: null, error: e, status: false });
  }
};

export const changeUserPassword = async (req, res, next) => {
  try {
    const { old_password, new_password, accessToken, lang = "en" } = req.body;
    if (!old_password || !new_password) {
      return allFieldsRequired(res);
    }
    const body = JSON.stringify({
      client_id: config.endPoint.admd.clientId,
      old_password: old_password,
      new_password: new_password,
      access_token: accessToken,
    });
    try {
      logger.info(`changeUserPasswordRequestBody`, { status: StatusType.SUCEESS, details: `Initiating change password request for ${accessToken}` });
    } catch (error) {
      console.log("changeUserPasswordRequestBody logger error ", error);
    }
    
    axios({
      method: "post",
      url: config.endPoint.admd.changePassword,
      headers: {
        "Content-Type": "application/json",
        "X-Tid": "ADMD-202204",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: body,
    })
      .then(function (response) {
        console.log("====response changeUserPassword=======");
        const logDetails = `Status: ${response?.status} `;
        try {
          logger.info(`changeUserPasswordStatus`, { status: StatusType.SUCEESS, details: logDetails });
          console.log("changeUserPassword status ==>", response.status);
        } catch (error) {
          console.log("changeUserPasswordStatus logger error ", error);
        }

        if (response?.status == 200) {
          try {
            logger.info(`changeUserPasswordSuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(response?.data) });
          } catch (error) {
            console.log("changeUserPasswordSuccess logger error ", error);
          }
          return res.send({ status: true });
        } else {
          try {
            logger.error(`changeUserPasswordError1`, { status: StatusType.FAIL, details: response?.data });
          } catch (error) {
            console.log("changeUserPasswordError1 logger error ", error);
          }
          return res.status(500).json({ response: response?.data, status: false });
        }
      })
      .catch(function (error) {
        console.log("====error catch change pass=======");
        const logMessage = `Error: ${error?.message} for Access token: ${accessToken}`;
        try {
          logger.error(`changeUserPasswordError2`, { status: StatusType.FAIL, details: logMessage });
          console.log("changeUserPassword error2 ", logMessage);
        } catch (error) {
          console.log("changeUserPasswordError2 logger error ", logMessage);
        }
        
        return res
          .status(500)
          .json({ response: error, status: false });
      });
  } catch (e) {
    console.log("====error change pass=======");
    const logMessage = `Error: ${e?.message} for Access token: ${req?.body?.accessToken}`;
    try {
      logger.error(`changeUserPasswordError`, { status: StatusType.FAIL, details: logMessage });
      console.log("changeUserPassword error ", logMessage);
    } catch (error) {
      console.log("changeUserPasswordError logger error ", logMessage);
    }
    
    return res.send({ response: e, status: false });
  }
};

// export const changeUserPassword1 = async (req, res, next) => {
//   try {
//     const { old_password, new_password, accessToken, lang = "en" } = req.body;
//     console.log("==change pass==", req.body);
//     if (!old_password || !new_password) {
//       return allFieldsRequired(res);
//     }

//     const mockResponse = {
//       result_code: "20000",
//       developer_message: "success",
//     };
//     const transactionId = randomUUID();

//     const body = {
//       client_id: config.endPoint.admd.clientId,
//       old_password: old_password,
//       new_password: new_password,
//       access_token: accessToken,
//     };

//     try {
//       logger.info(`changeUserPassword1RequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(body) });
//       console.log("changeUserPassword1 request data",JSON.stringify(body));
//     } catch (error) {
//       console.log(`changeUserPassword1RequestData Logger Error`, error);
//     }

//     const data = await fetch(config.endPoint.admd.changePassword, {
//       method: "post",
//       headers: {
//         "Content-Type": "application/x-www-form-urlencoded",
//         "X-Tid": "ADMD-200924iJ6cngst8Oa",
//         "X-Content-Type-Options": "nosniff",
//         "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
//       },
//       body: body,
//     });
//     console.log(data.json());

//     try {
//       logger.info(`changeUserPassword1Success`, { status: StatusType.SUCEESS, details: JSON.stringify(data) });    
//       console.log("======response changeUserPassword1=======",JSON.stringify(data));
//     } catch (error) {
//       console.log(`changeUserPassword1 Success Logger Error`, error);
//     }

//     return res.status(200).json({ response: mockResponse, status: true });
//   } catch (e) {
//     try {
//       logger.info(`changeUserPassword1Catch`, { status: StatusType.FAIL,  details: e });         
//       console.log("==========changeUserPassword1 Catch =========",e);
//     } catch (error) {
//       console.log(`changeUserPassword1 Error Logger Error`, error);
//     }
//     return res.status(500).json({ response: null, error: e, status: false });
//   }
// };
export const addPublicInfo = async (req, res, next) => {
  try {
    const { first_name, last_name, email, accessToken } = req.body;
    console.log("==addPublicInfo  ==", req.body);
    if (!first_name || !last_name || !email) {
      return allFieldsRequired(res);
    }
    const mockResponse = {
      result_code: "20000",
      developer_message: "success",
    };

    const reqData = {
      client_id: config.endPoint.admd.clientId,
      first_name: first_name,
      last_name: last_name,
      email_contact: email,
      access_token: accessToken,
    };

    try {
      logger.info(`addPublicInfoRequestData`, { status: StatusType.SUCEESS, details: JSON.stringify(reqData) });
      console.log("addPublicInfo request data",JSON.stringify(reqData));
    } catch (error) {
      console.log(`addPublicInfoRequestData Logger Error`, error);
    }

    axios({
      method: "put",
      url: config.endPoint.admd.updateProfile,
      headers: {
        "X-Tid": "ADMD-200924iJ6cngst8Oa",
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: reqData,
    })
      .then(function (response) {
        const logDetails = `${response?.data?.result_code} ${response?.data?.developer_message}`;
        if (response?.data?.result_code == "20000") {
          try {
            logger.info(`addPublicInfoSuccess`, { status: StatusType.SUCEESS, details: logDetails });
            console.log("====addPublicInfoSuccess=======",logDetails);
          } catch (error) {
            console.log("addPublicInfo Success logger error ", error);
          }
          
          return res.status(200).json({ response: response?.data, status: true });
        } else {
          try {
            logger.error(`addPublicInfoError1`, { status: StatusType.FAIL, details: logDetails });
            console.log("==========addPublicInfo Error 1 =========",logDetails);
          } catch (error) {
            console.log("addPublicInfo Error logger error 1 ", error);
          }
          return res.status(500).json({ response: response?.data, status: false });
        }
      })
      .catch(function (error) {
        try {
          logger.error(`addPublicInfoError2`, { status: StatusType.FAIL, details: error });
          console.log("==== addPublicInfo error 2=======",error);
        } catch (error) {
          console.log("addPublicInfo Error logger error 2 ", error);
        }
        return res.status(500).json({ response: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`addPublicInfoError3`, { status: StatusType.FAIL, details: e });
      console.log("====addPublicInfo error 3=======",e);
    } catch (error) {
      console.log("addPublicInfo Error logger error 3 ", error);
    }
    
    return res.status(500).json({ response: e, error: e, status: false });
  }
};

export const setUserActivity = async (req, res) => {
  try {
    const { web_token } = req.cookies;
    if (!web_token) {
      return allFieldsRequired(res);
    }

    const queryLine = `mutation { aisCustomerStatusUpdate( action:0 ) {message}}`;

    try {
      logger.info(`setUserActivityRequestQuery`, { status: StatusType.SUCEESS, details: queryLine });
      console.log("setUserActivity request query",queryLine);
    } catch (error) {
      console.log(`setUserActivityRequestQuery Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.magento.graphQLApi,
      headers: {
        "Content-Type": "application/json",
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        "Authorization": "Bearer " + web_token,
      },
      data: { query: queryLine },
    })
    .then(async function (response) {
      if(response.status == 200 && !response?.data?.errors?.length){
        try {
          logger.info(`setUserActivityMagentoupdateSuccess`, { status: StatusType.SUCEESS, details: JSON.stringify(response?.data) });
          console.log("====setUserActivity Magento response=======",JSON.stringify(response?.data));
        } catch (error) {
          console.log("setUserActivity logger error 1", error);
        }

        if(redisOMClient){
          await redisOMClient.expire(web_token, 1);
          try {
            logger.info(`setUserActivitySuccess`, { status: StatusType.SUCEESS, details: "Redis update Success" });
            console.log("Redis updated for setUserActivity");
          } catch (error) {
            console.log("setUserActivity logger error 2 ", error);
          }
          
        } else {
          try {
            logger.info(`setUserActivityError1`, { status: StatusType.FAIL, details: "Redis update Failed" });
            console.log("Redis unavailable for setUserActivity");
          } catch (error) {
            console.log("setUserActivity logger error 3 ", error);
          }
          
          return res.status(500).json({status:false,error:{"message": "Failed"}});
        }
        return res.status(200).json({
          status: true,
        });
      }else{
        try {
          logger.info(`setUserActivityError2`, { status: StatusType.FAIL, details: response?.data?.errors?.[0]?.message });
          console.log("====setUserActivity error=======");
        } catch (error) {
          console.log("setUserActivity logger error 4 ", error);
        }
        
        return res.status(500).json({
          ...response?.data,
          status:false
        });
      }
    })
    .catch(function (error) {
      try {
        logger.info(`setUserActivityError3`, { status: StatusType.FAIL, details: JSON.stringify(error || {}) });
        console.log("====setUserActivity catch 1=======",error);
      } catch (error) {
        console.log("setUserActivity logger error 5", error);
      }
      
      return res.status(500).json({status:false,data:null,error:error});
    });

    // const logoutQuery = 'aisCustomerAuthentication(webtoken:"'+token+'" action:"logout"  ) {token accesstoken}';
    // const queryLine = `mutation { ${logoutQuery}}`;

    // const queryLineStringify = JSON.stringify({ query: queryLine });
    //     console.log(queryLineStringify);
    // axios({
    //     method: "post",
    //     url: config.magento.graphQLApi,
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": 'Bearer '+token
    //     },
    //     data: queryLineStringify
    // })
    // .then(function (response) {
    //     console.log("====response=======");
    //     console.log(response);
    //     if(response.status == 200){
    //         return res.status(200).json({
    //             ...response?.data,
    //             status:true
    //         });
    //     }else{
    //         return res.status(403).json({
    //             ...response?.data,
    //             status:false
    //         });
    //     }
    // })
    // .catch(function (error) {
    //   console.log("====error=======");
    //   console.log(error);
    //      return res.status(500).json({status:false,data:null,error:error});
    // });
  } catch (e) {
    try {
      logger.error(`setUserActivityError4`, { status: StatusType.FAIL, details: e });
      console.log("===setUserActivity catch 2===", e);
    } catch (error) {
      console.log("setUserActivity Error logger error 6", error);
    }
    
    return res.status(500).json({ data: null, error: e, status: false });
  }
};

/* deprecated */
export const setTokensInCache = async (req, res) => {
  try {
    const { authCode, webToken, accessToken } = req.body;
    if (!authCode || !webToken || !accessToken) {
      return allFieldsRequired(res);
    }
    // redisClient.HSET(token, ['isUserIdle', '1']);
    try {
      logger.info(`setTokensInCacheSuccess`, { status: StatusType.SUCEESS, details: true });
      console.log("setTokensInCache req body ",JSON.stringify(req.body));
    } catch (error) {
      console.log("setTokensInCache Success logger error ", error);
    }
    
    return res.status(200).json({
      status: true,
    });
    // const logoutQuery = 'aisCustomerAuthentication(webtoken:"'+token+'" action:"logout"  ) {token accesstoken}';
    // const queryLine = `mutation { ${logoutQuery}}`;

    // const queryLineStringify = JSON.stringify({ query: queryLine });
    //     console.log(queryLineStringify);
    // axios({
    //     method: "post",
    //     url: config.magento.graphQLApi,
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": 'Bearer '+token
    //     },
    //     data: queryLineStringify
    // })
    // .then(function (response) {
    //     console.log("====response=======");
    //     console.log(response);
    //     if(response.status == 200){
    //         return res.status(200).json({
    //             ...response?.data,
    //             status:true
    //         });
    //     }else{
    //         return res.status(403).json({
    //             ...response?.data,
    //             status:false
    //         });
    //     }
    // })
    // .catch(function (error) {
    //   console.log("====error=======");
    //   console.log(error);
    //      return res.status(500).json({status:false,data:null,error:error});
    // });
  } catch (e) {
    try {
      logger.error(`setTokensInCacheError`, { status: StatusType.FAIL, details: e });
      console.log("====setTokensInCache catch====", e);
    } catch (error) {
      console.log("setTokensInCache Error logger error ", error);
    }
    
    return res.status(500).json({ data: null, error: e, status: false });
  }
};
/* deprecated */
export const validateToken = async (req, res) => {
  try {
    const { authCode, webToken, accessToken } = req.body;
    if (!authCode || !webToken) {
      return allFieldsRequired(res);
    }

    res.setHeader("set-cookie", [
      "web_token=" +
        webToken +
        "; Domain=.ais.th; HttpOnly=true; SameSite=None; Secure",
    ]);
    try {
      logger.info(`validateTokenSuccess`, { status: StatusType.SUCEESS, details: true });
      console.log("validateToken req body", JSON.stringify(req.body));
    } catch (error) {
      console.log("validateToken Success logger error ", error);
    }
    
    return res.status(200).json({
      status: true,
    });
  } catch (e) {
    try {
      logger.error(`validateTokenError`, { status: StatusType.FAIL, details: e });
      console.log("====validateToken catch====", e);
    } catch (error) {
      console.log("validateToken Error logger error ", error);
    }
    
    return res.status(500).json({ data: null, error: e, status: false });
  }
};
/* deprecated */
export const readCookie = async (req, res) => {
  try {

    // redisClient.HSET(token, ['isUserIdle', '1']);
    try {
      logger.info(`readCookieSuccess`, { status: StatusType.SUCEESS, details: true });
    } catch (error) {
      console.log("readCookie Success logger error ", error);
    }
    return res.status(200).json({
      status: true,
    });
  } catch (e) {
    try {
      logger.error(`readCookieError`, { status: StatusType.FAIL, details: e });
      console.log("====readCookie catch====", e);
    } catch (error) {
      console.log("readCookie Error logger error ", error);
    }
    
    return res.status(500).json({ data: null, error: e, status: false });
  }
};
