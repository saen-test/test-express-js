import axios from "axios";
import { allFieldsRequired } from "../utilities/validation.js";
import config from "../config/index.js";
import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";
import { getTokenFromStorage } from "./generate-token.js";

const logger = new LoggerService("app");

/*
  Created By : Vanita Khamkar
  Created At : 06-07-2022
  Description : get product details for AIS Point,saranade,privilege products
  Input Params: catName,channel,ip,id
*/

export const getPrivilegeInfo = async (req, res) => {
  try {
    const { ip, channel, id, catName = "", url } = req.body;
    const { privilege } = config.endPoint;
    if (!ip || !channel || !url) {
      return allFieldsRequired(res);
    }
    let userName = privilege.privilege.userName;
    let userPass = privilege.privilege.password;
    let displayChannel = privilege.privilege.displayName;
    if (channel?.toLowerCase()?.trim() == "point") {
      userName = privilege.point.userName;
      userPass = privilege.point.password;
      displayChannel = privilege.point.displayName;
    } else if (channel?.toLowerCase()?.trim() == "serenade") {
      userName = privilege.serenade.userName;
      userPass = privilege.serenade.password;
      displayChannel = privilege.serenade.displayName;
    }
    const transactionId = Math.floor(Math.random() * 1000) + "_" + Date.now();
    const requestData = {
      transactionID: transactionId,
      username: userName,
      password: userPass,
      ipAddress: ip,
      pageNumber: "",
      resultPerPage: "",
      sortBy: "privCategory",
      sortType: "",
      privDesc: "",
      privCategory: catName ? catName : "",
      privCode: "",
      locationName: "",
      categoryType: channel ? channel : "",
      privilegeInfoId: "",
      priorityChannel: "",
      displayChannel: displayChannel,
      url: url,
    };

    const logRequestData = {
      transactionID: transactionId,
      username: userName,
      ipAddress: ip,
      pageNumber: "",
      resultPerPage: "",
      sortBy: "privCategory",
      sortType: "",
      privDesc: "",
      privCategory: catName ? catName : "",
      privCode: "",
      locationName: "",
      categoryType: channel ? channel : "",
      privilegeInfoId: "",
      priorityChannel: "",
      displayChannel: displayChannel,
      url: url,
    };
    console.log(
      "getPrivilegeInfo lego request body ",
      JSON.stringify(req.body)
    );

    let token = await getTokenFromStorage(channel);

    try {
      logger.info(`getPrivilegeInfoLegoRequestData`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(logRequestData),
      });
      console.log(
        "getPrivilegeInfoLego request data",
        JSON.stringify(logRequestData)
      );
    } catch (error) {
      console.log(`getPrivilegeInfoLegoRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: privilege.productDetail,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: "2020010114253096800000002",
          pageNumber: response.data?.pageNumber || 0,
          totalPage: response.data?.totalPage || 0,
          resultPerPgae: response.data?.resultPerPage || 0,
          resultAvailable: response.data?.resultAvailable || 0,
          totalResultReturned: response.data?.totalResultReturned || 0,
          data: response.data?.privilegeInfoArr,
        };

        try {
          logger.info(`getPrivilegeInfoSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====getPrivilegeInfo response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log("getPrivilegeInfoSuccess Success logger error ", error);
        }
        return res.status(200).json({ response: result, status: true });
      })
      .catch(function (error) {
        try {
          logger.error(`getPrivilegeInfoError`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("====getPrivilegeInfo error=======", error);
        } catch (error) {
          console.log("getPrivilegeInfo Error logger error ", error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`getPrivilegeInfoErrorCatch`, {
        status: StatusType.FAIL,
        transactionId,
        details: JSON.stringify(e),
      });
      console.log("====getPrivilegeInfo error catch=======", e);
    } catch (error) {
      console.log("getPrivilegeInfo Error logger error catch ", error);
    }
    return res.send({
      response: null,
      error: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Vanita Khamkar
  Created At : 06-07-2022
  Description : get plp list for AIS Point,saranade,privilege
  Input Params: pageNumber,channel,ip,catId
*/

export const getPrivilegeCompact = async (req, res) => {
  try {
    const {
      pageNumber,
      channel,
      ip,
      catId,
      sortBy = 1,
      sortType = "asc",
      resultPerPage,
    } = req.body;
    if (!ip || !channel || !catId || !pageNumber) {
      return allFieldsRequired(res);
    }
    const { privilege } = config.endPoint;
    const transactionId = Math.floor(Math.random() * 1000) + "_" + Date.now();
    let userName = privilege.privilege.userName;
    let userPass = privilege.privilege.password;
    let webChannel = privilege.privilege.webChannel;
    if (channel?.toLowerCase()?.trim() == "point") {
      userName = privilege.point.userName;
      userPass = privilege.point.password;
      webChannel = privilege.point.webChannel;
    } else if (channel?.toLowerCase()?.trim() == "serenade") {
      userName = privilege.serenade.userName;
      userPass = privilege.serenade.password;
      webChannel = privilege.serenade.webChannel;
    }
    const requestData = {
      transactionID: transactionId,
      username: userName,
      password: userPass,
      ipAddress: ip,
      pageNumber: pageNumber,
      resultPerPage: resultPerPage,
      categoryId: catId,
      categoryType:
        channel?.toLowerCase()?.trim() == "serenade" ? "PRIVILEGE" : channel,
      search: "",
      sortBy: sortBy,
      sortType: sortType,
      incMerchant: "",
      channel: webChannel,
    };

    const logRequestData = {
      transactionID: transactionId,
      username: userName,
      ipAddress: ip,
      pageNumber: pageNumber,
      resultPerPage: resultPerPage,
      categoryId: catId,
      categoryType:
        channel?.toLowerCase()?.trim() == "serenade" ? "PRIVILEGE" : channel,
      search: "",
      sortBy: sortBy,
      sortType: sortType,
      incMerchant: "",
      channel: webChannel,
    };

    let token = await getTokenFromStorage(channel);

    try {
      logger.info(`getPrivilegeCompactRequestData`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(logRequestData),
      });
      console.log(
        "getPrivilegeCompact lego request body ",
        JSON.stringify(logRequestData)
      );
    } catch (error) {
      console.log(`getPrivilegeCompactRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.privilege.productList,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: response.data.transactionID,
          count: response.data?.count || 0,
          data: response.data?.privilegeArr,
        };
        try {
          logger.info(`getPrivilegeCompactSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====getPrivilegeCompactSuccess response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log("getPrivilegeCompact Success logger error ", error);
        }
        return res.status(200).json({ response: result, status: true });
      })
      .catch(function (error) {
        try {
          logger.error(`getPrivilegeInfoError1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("getPrivilegeInfo error ", error);
        } catch (error) {
          console.log("getPrivilegeInfo Error logger error 1", error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`getPrivilegeInfoError`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("getPrivilegeInfo catch", e);
    } catch (error) {
      console.log("getPrivilegeInfo Error logger error  2", error);
    }
    return res.status(500).json({
      response: null,
      error: "Something happend please try again.",
      status: false,
    });
  }
};

export const getAllCategory = async (req, res) => {
  try {
    // const {emailId,mobileNo,channel} = req.body;
    // if(!emailId || !mobileNo || !channel){
    //     return validate(res);
    // }
    // axios({
    //     method: 'post',
    //     url : 'TBD',
    //     headers:{
    //         'Ocp-Apim-Subscription-Key':constant.LEGO_SUBSCRIPTION_KEY,
    //         'Authorization': `Bearer ${constant.LEGO_AUTH_TOKEN}`
    //     },
    //     data :{
    // "transactionID": "20200222153012384954574",
    // "username": "userxxx",
    // "password": "passwordxxx",
    // "ipAddress": "10.104.140.111"
    // }
    // })
    // .then(function (response) {
    // console.log("====response=======");
    // console.log(response);
    const mockData = {
      transactionID: "20200222153012384954574",
      httpStatus: 200,
      status: "20000",
      description: "SUCCESS",
      categoryArr: [
        {
          category_id: 117,
          category: "AIS Points",
          category_th: "เอไอเอส พ้อยท์",
          type: 0,
          category_type: null,
          display_channel: null,
          category_en_desc: null,
          category_th_desc: null,
          category_icon: "CategoryIcon06062560_110336_b1ca65.png",
          category_image: "CategoryImg_06062560_110336_b1ca65.jpg",
          category_url: null,
          mobile_icon_active: "Img_110336_b1ca64.jpg",
          mobile_icon_inactive: "Img_06062560_b1ca65.jpg",
          serenade_icon_active: "Img_110336_b1ca64.jpg",
          serenade_icon_inactive: "Img_06062560_b1ca65.jpg",
          privilege_icon_active: "Img_110336_b1ca64.jpg",
          privilege_icon_inactive: "Img_06062560_b1ca65.jpg",
          category_msg_en: "Img_110336_b1ca64.jpg",
          category_msg_th: "Img_06062560_b1ca65.jpg",
        },
        {
          category_id: 97,
          category: "AIS Rewards",
          category_th: "เอไอเอส รีวอร์ด",
          type: 0,
          category_type: "PRIVILEGE",
          display_channel: null,
          category_en_desc: null,
          category_th_desc: null,
          category_icon: null,
          category_image: null,
          category_url: null,
          mobile_icon_active: "Img_110336_b1ca64.jpg",
          mobile_icon_inactive: "Img_06062560_b1ca65.jpg",
          serenade_icon_active: "Img_110336_b1ca64.jpg",
          serenade_icon_inactive: "Img_06062560_b1ca65.jpg",
          privilege_icon_active: "Img_110336_b1ca64.jpg",
          privilege_icon_inactive: "Img_06062560_b1ca65.jpg",
          category_msg_en: "Img_110336_b1ca64.jpg",
          category_msg_th: "Img_06062560_b1ca65.jpg",
        },
      ],
    };

    const result = {
      transactionID: "20200222153012384954574",
      data: mockData.categoryArr,
    };
    return res.send({ response: result, status: true });
    // })
    // .catch(function (error) {
    //     console.log("====error=======");
    //     console.log(error);
    //     //return res.send({res:error,status:"fail"})
    // });
  } catch (e) {
    console.log("==catch=", e);
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

export const getCategory = async (req, res) => {
  try {
    // const {emailId,mobileNo,channel} = req.body;
    // if(!emailId || !mobileNo || !channel){
    //     return validate(res);
    // }
    // const transactionId = Math.floor(Math.random() * 1000)+"_"+Date.now();
    // axios({
    //     method: 'post',
    //     url : 'https://apim-hubcommon-az-asse-dev-001.azure-api.net/croissant-prcpriv-be/PrivApiRestful/v1.0/getCategory',
    //     headers:{
    //         'Ocp-Apim-Subscription-Key':constant.LEGO_SUBSCRIPTION_KEY,
    //         'Authorization': `Bearer ${constant.LEGO_AUTH_TOKEN}`
    //     },
    //     data :{
    //         "transactionID": "2020010114253096800000002",
    //         "username": "userxxx",
    //         "password":"passwordxxx",
    //         "ipAddress": "10.10.10.50",
    //         "pageNumber": 1,
    //         "resultPerPage": 10,
    //         "categoryId": null,
    //         "categoryType": "",
    //         "search": "",
    //         "sortBy": null,
    //         "sortType": "",
    //         "incMerchant": ""
    //         }
    // })
    // .then(function (response) {
    // console.log("====response=======");
    // console.log(response);
    const mockData = {
      transactionID: "2020010114253096800000002",
      httpStatus: 200,
      status: "20000",
      description: "SUCCESS",
      count: 2,
      privilegeArr: [
        {
          privInfoId: "11112",
          points: "2",
          brandNameEN: "AMAZON",
          brandNameTH: "AMAZON",
          featureEN: "discount 10% per piece",
          featureTH: "discount 10% per piece",
          image: "ama_20200402_1548014565.png",
          campaignType: "CAMPAIGN",
          ussdNo: "*550*333*1#",
          url: "cafe50",
        },
        {
          privInfoId: "12344",
          points: "10",
          brandNameEN: "cefe",
          brandNameTH: "cefe",
          featureEN: "discount 15% per piece",
          featureTH: "discount 15% per piece",
          image: "cf_20200402_4941564650.png",
          campaignType: "CAMPAIGN",
          ussdNo: "*550*333*2#",
          url: "15peroff",
        },
      ],
    };

    const result = {
      transactionID: "2020010114253096800000002",
      count: 2,
      data: mockData.privilegeArr,
    };
    return res.send({ response: result, status: true });
    // })
    // .catch(function (error) {
    //     console.log("====error=======");
    //     console.log(error);
    //     //return res.send({res:error,status:"fail"})
    // });
  } catch (e) {
    console.log("==catch=", e);
    return res.send({
      res: null,
      err: "Something happend please try again.",
      status: false,
    });
  }
};

/*
  Created By : Natnisha Tieosuwan
  Created At : 06-01-2023
  Description : get activity category for AIS serenade exculsive activity
  Input Params: ip
*/
export const getActivityCategory = async (req, res) => {
  try {
    const { ip } = req.body;
    if (!ip) {
      return allFieldsRequired(res);
    }
    const { privilege } = config.endPoint;
    const transactionId = Math.floor(Math.random() * 1000) + "_" + Date.now();
    const userName = privilege.serenade.userName;
    const userPass = privilege.serenade.password;
    const webChannel = privilege.serenade.webChannel;
    const requestData = {
      transactionID: transactionId,
      username: userName,
      password: userPass,
      ipAddress: ip,
    };

    const logRequestData = {
      transactionID: transactionId,
      username: userName,
      ipAddress: ip,
    };

    let token = await getTokenFromStorage('serenade');

    try {
      logger.info(`getActivityCategoryRequestData`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(logRequestData),
      });
      console.log(
        "getActivityCategory request data",
        JSON.stringify(logRequestData)
      );
    } catch (error) {
      console.log(`getActivityCategoryRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.privilege.activityCategory,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: response?.data?.transactionID,
          count: response?.data?.totalCat || 0,
          data: response?.data?.acCatArr,
        };
        try {
          logger.info(`getActivityCategorySuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====getActivityCategorySuccess response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log("getActivityCategory Success logger error ", error);
        }

        return res.status(200).json({ response: result, status: true });
      })
      .catch(function (error) {
        try {
          logger.error(`getActivityCategoryError1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("getActivityCategory Error ", error);
        } catch (error) {
          console.log("getActivityCategory Error logger error 1", error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`getActivityCategoryError2`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("getActivityCategoryError catch", e);
    } catch (error) {
      console.log("getActivityCategory Error logger error 2", error);
    }
    return res.status(500).json({
      response: null,
      error: "Something happend please try again.",
      status: false,
    });
  }
};
/*
  Created By : Natnisha Tieosuwan
  Created At : 06-01-2023
  Description : get activity campaign list for AIS serenade exculsive activity
  Input Params: catId,ip
*/
export const getActivityCampaign = async (req, res) => {
  try {
    const { ip, catId } = req.body;
    if (!ip || !catId) {
      return allFieldsRequired(res);
    }
    const { privilege } = config.endPoint;
    const transactionId = Math.floor(Math.random() * 1000) + "_" + Date.now();
    const userName = privilege.serenade.userName;
    const userPass = privilege.serenade.password;
    const requestData = {
      transactionID: transactionId,
      username: userName,
      password: userPass,
      ipAddress: ip,
      catId: catId,
    };

    const logRequestData = {
      transactionID: transactionId,
      username: userName,
      ipAddress: ip,
      catId: catId,
    };

    let token = await getTokenFromStorage('serenade');

    try {
      logger.info(`getActivityCampaignRequestData`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(logRequestData),
      });
      console.log(
        "getActivityCampaign request data",
        JSON.stringify(logRequestData)
      );
    } catch (error) {
      console.log(`getActivityCampaignRequestData Logger Error`, error);
    }
    axios({
      method: "post",
      url: config.endPoint.privilege.activityCampaign,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: response?.data?.transactionID,
          data: response?.data?.actArr,
        };
        try {
          logger.info(`getActivityCampaignSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: response?.data,
          });
          console.log(
            "====getActivityCampaignSuccess response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log("getActivityCampaign Success logger error ", error);
        }
        return res.status(200).json({ response: result, status: true });
      })
      .catch(function (error) {
        try {
          logger.error(`getActivityCampaignError1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("====getActivityCampaign error=======", error);
        } catch (error) {
          console.log("getActivityCampaign Error logger error 1", error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`getActivityCampaignError2`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("getActivityCampaign catch", e);
    } catch (error) {
      console.log("getActivityCampaign Error logger error 2", error);
    }
    return res.status(500).json({
      response: null,
      error: "Something happend please try again.",
      status: false,
    });
  }
};
/*
  Created By : Natnisha Tieosuwan
  Created At : 06-01-2023
  Description : get activity content for AIS serenade exculsive activity
  Input Params: actId,ip
*/
export const getActivityContent = async (req, res) => {
  try {
    const { ip, actId } = req.body;
    if (!ip || !actId) {
      return allFieldsRequired(res);
    }
    const { privilege } = config.endPoint;
    const transactionId = Math.floor(Math.random() * 1000) + "_" + Date.now();
    const userName = privilege.serenade.userName;
    const userPass = privilege.serenade.password;
    const requestData = {
      transactionID: transactionId,
      username: userName,
      password: userPass,
      ipAddress: ip,
      actId: actId,
    };
    const logRequestData = {
      transactionID: transactionId,
      username: userName,
      ipAddress: ip,
      actId: actId,
    };
    console.log(
      "getActivityContent lego request body ",
      JSON.stringify(req.body)
    );

    let token = await getTokenFromStorage('serenade');

    try {
      logger.info(`getActivityContentRequestData`, {
        status: StatusType.SUCEESS,
        transactionId,
        details: JSON.stringify(logRequestData),
      });
      console.log(
        "getActivityContent request data",
        JSON.stringify(logRequestData)
      );
    } catch (error) {
      console.log(`getActivityContentRequestData Logger Error`, error);
    }

    axios({
      method: "post",
      url: config.endPoint.privilege.activityContent,
      headers: {
        "Ocp-Apim-Subscription-Key": constant.LEGO_SUBSCRIPTION_KEY,
        Authorization: `Bearer ${token}`,
        "X-Content-Type-Options": "nosniff",
        "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
      },
      data: requestData,
    })
      .then(function (response) {
        const result = {
          transactionID: response?.data?.transactionID,
          data: response?.data,
        };
        try {
          logger.info(`getActivityContentSuccess`, {
            status: StatusType.SUCEESS,
            transactionId,
            details: JSON.stringify(response?.data),
          });
          console.log(
            "====getActivityContentSuccess response=======",
            JSON.stringify(response?.data)
          );
        } catch (error) {
          console.log("getActivityContent Success logger error ", error);
        }
        return res.status(200).json({ response: result, status: true });
      })
      .catch(function (error) {
        try {
          logger.error(`getActivityContentError1`, {
            status: StatusType.FAIL,
            transactionId,
            details: error,
          });
          console.log("====getActivityContentError error=======", error);
        } catch (error) {
          console.log("getActivityContent Error logger error 1", error);
        }
        return res
          .status(500)
          .json({ response: null, error: error, status: false });
      });
  } catch (e) {
    try {
      logger.error(`getActivityContentError2`, {
        status: StatusType.FAIL,
        transactionId,
        details: e,
      });
      console.log("getActivityContentError catch", e);
    } catch (error) {
      console.log("getActivityContent Error logger error 2", error);
    }
    return res.status(500).json({
      response: null,
      error: "Something happend please try again.",
      status: false,
    });
  }
};
