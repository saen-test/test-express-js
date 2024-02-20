import axios from "axios";
import { constant } from "../../keyVaultConstant.js";
import config from "../../config/index.js";
import crypto from  "crypto";

const API_VERSION = '2016-04-01';

export class AISLogEvents {
  onAisLog(aisLog) {
    this.callNcpLogger(aisLog);
  }
  
  onAisError(aisLog) {
    this.callNcpLogger(aisLog);
  }
  
  async callNcpLogger(logDetails = {}) {
    console.log("logDetails ", logDetails);
    try {
      let logDetailsValue = logDetails.details;
      // Convert details field into string
      if (logDetailsValue instanceof Error)
        logDetails.details = logDetailsValue.toString();
      if (logDetailsValue instanceof Object)
        logDetails.details = JSON.stringify(logDetailsValue);

      // Check if timeStamp field empty if empty assign new Date()
      if (!logDetails.timeStamp) {
        Object.assign(logDetails, { timeStamp: new Date().toISOString() });
      }
      console.log("logDetails ", logDetails)
      const logData = [];
      logData.push(logDetails);
      await this.addLogToAzure(
        `NCP_MS_Log_${config.log.envName}`,
        logData,
        '',
      );
    } catch (e) {
      console.log("==== callNcpLogger catch error=======");
      console.log(e);
    }
  }

  async addLogToAzure(logType, logs, timeGenerated) {
    try {
      const postPayload = JSON.stringify(logs);
      const contentLength = Buffer.byteLength(postPayload, 'utf8');
      const gmtTime = new Date().toUTCString();
      const stringToHash = [
        'POST',
        contentLength,
        'application/json',
        `x-ms-date:${gmtTime}`,
        '/api/logs',
      ].join('\n');
      const signature = crypto
        .createHmac('sha256', Buffer.from(constant.LOG_SHARED_KEY, 'base64'))
        .update(stringToHash, 'utf8')
        .digest('base64');
      const authorization = `SharedKey ${constant.LOG_WORKSPACE_ID}:${signature}`;
      const headers = {
        'Content-Type': 'application/json',
        Authorization: authorization,
        'Log-Type': logType,
        'x-ms-date': gmtTime,
      };
      if (timeGenerated) {
        headers['time-generated-field'] = timeGenerated;
      }
      const url = `https://${constant.LOG_WORKSPACE_ID}.ods.opinsights.azure.com/api/logs?api-version=${API_VERSION}`;
      const res = await axios({
        method: "post",
        url,
        headers,
        data: postPayload,
      });
      return res;
    } catch (e) {
      console.log("==== addLogAnalytics catch error=======");
      console.log(e);
      const errorData = JSON.stringify({
        message: e?.message,
        method: 'addLogToAzure',
      });
      throw Error(errorData);
    }
  }
}