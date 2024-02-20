import LoggerService from "./logger/logger.js";
import { StatusType } from "./status-enum.js";

const logger = new LoggerService('app');

export const allFieldsRequired = async function(res) {

    logger.setLogData(res);
    logger.info(`allFieldsRequiredFail`, { status: StatusType.FAIL, details: res });
    return res.status(202).json({
        message : "Please enter all required fields.",
        status:false
    })

}
export const validateEmail = function (account) {
    if (account.length > 1000) {
        throw new Error("Input too long");
    }
    const validate = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return validate.test(String(account).toLowerCase());
}