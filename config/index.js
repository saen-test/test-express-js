import localConfig from "./env/local.js";
import devConfig from "./env/dev.js";
import stageConfig from "./env/stage.js";
import uatConfig from "./env/uat.js";
import prodConfig from "./env/prod.js";

const env = process.env.NODE_ENV ? process.env.NODE_ENV.trim() : 'dev';
let conf ;
switch (env) {
  case "local":
    conf = localConfig;
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
    break;
  case "dev":
    conf = devConfig;
    break;
  case "sit":
    conf = stageConfig;
    break;
  case "preprod":
    conf = uatConfig;
    break;
  case "prod":
    conf = prodConfig;
    break;
}

export default {
  ...conf,
};
