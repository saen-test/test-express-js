import winston from 'winston';
import { AISLogEvents } from '../ais-logger-service/ais-logger-service.js';
import { maskMobileNo } from '../util.js';
import { appConstant } from '../../appConstants.js';

const aisLogEvents = new AISLogEvents('app');

const dateFormat = () => {
    return new Date(Date.now()).toUTCString()
}

export default class LoggerService {
    constructor(route) {
        this.log_data = null
        this.route = route
        const logger = winston.createLogger({
            transports: [
                new winston.transports.Console()
            ],
            format: winston.format.printf((info) => {
                let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${route}.log | ${info.message}`;
                return message
            })
        });
        this.logger = logger
    }

    setLogData(log_data) {
        this.log_data = log_data
    }

    async info(message, aisLog) {
        this.logger.log('info', message, { aisLog });
        const processedAisLog = this.preProcessData(message, aisLog);
        aisLogEvents.onAisLog(processedAisLog);
    }

    async error(message, aisLog) {
        this.logger.log('error', message, { aisLog });
        const processedAisLog = this.preProcessData(message, aisLog);
        aisLogEvents.onAisError(processedAisLog);
    }

    async debug(message, aisLog) {
        this.logger.log('debug', message, { aisLog });
    }

    async warn(message, aisLog) {
        this.logger.log('warn', message, { aisLog });
    }

    async verbose(message, aisLog) {
        this.logger.log('verbose', message, { aisLog });
    }

    preProcessData(message, aisLog) {
        let updateAisLog = { status: aisLog.status };
        updateAisLog.processName = 'APP';
        updateAisLog.subFunction = message && message.split(' ')[0];
        updateAisLog.server = `${appConstant.MY_POD_NAMESPACE} | `
            + `${appConstant.MY_POD_NAME} | ${appConstant.MY_POD_IP}`;
        updateAisLog = { ...updateAisLog, ...aisLog };
        if (updateAisLog.mobileNo) {
            updateAisLog.mobileNo = maskMobileNo(updateAisLog.mobileNo);
        }

        if (updateAisLog.details) {
            if (updateAisLog.details instanceof Error) {
                updateAisLog.details = updateAisLog.details.toString();
            }
        }

        return updateAisLog;
    }
}
