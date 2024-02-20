import * as dotenv from 'dotenv';

if(process.env.NODE_ENV === "local") {
  dotenv.config();
}

export const rateLimitConstant = {
  WINDOW_MS: 1 * 60 * 1000, // limit time frame
  MAX: 50, // max requests allowed
  MESSAGE: {
    status: "error",
    message: "You have exceeded the allowed request limit",
  }, // custom error message to be sent
};

export const appConstant = {
  MY_POD_NAMESPACE: process.env["MY_POD_NAMESPACE"], // my-pod-namespace
  MY_POD_NAME: process.env["MY_POD_NAME"], // my-pod-name
  MY_POD_IP: process.env["MY_POD_IP"], // my-pod-ip
};