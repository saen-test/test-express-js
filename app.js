import createError from "http-errors";

import express from "express";
import session from "express-session";

import path from "path";
import cookieParser from "cookie-parser";
import logger from "morgan";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
const app = express();
import indexRouter from "./routes/index.js";
import usersRouter from "./routes/user.js";
import privilegeRouter from "./routes/privilege.js";
import paymentRouter from "./routes/payment.js";
import orderRouter from "./routes/order.js";
import simRouter from "./routes/sim.js";
import { fileURLToPath } from "url";
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";
import redisClient from "./utilities/redis.js";
import azureRouter from "./routes/azure.js";
import fileUpload from "express-fileupload";
import { getTokenFromStorage } from "./controller/generate-token.js";
import { getDataShopFromMs } from "./controller/ms-controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const options = {
  origin: "*",
};
app.use(cors(options));
// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  fileUpload({
    limits: {
      fileSize: 6 * 1024 * 1024, // 6 MB
    },
    abortOnLimit: true,
  })
);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minutes
  max: 50000, // max 50000 requests per windowMs
});

// apply rate limiter to all requests
app.use(limiter);

app.use("/", indexRouter);
app.use("/user", usersRouter);
app.use("/privilege", privilegeRouter);
app.use("/payment", paymentRouter);
app.use("/order", orderRouter);
app.use("/azure", azureRouter);
app.use("/sim", simRouter);

app.use(function (req, res, next) {
  redisClient();
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

// key vault
try {
  const credential = new DefaultAzureCredential({
    managedIdentityClientId: "b560d078-f44d-4bf3-8548-16b38a2e4ba8",
  });

  // const keyVaultName = process.env["KEY_VAULT_NAME"];
  const url = "https://kvcroissantazassedev001.vault.azure.net/";

  const client = new SecretClient(url, credential);
  // console.log(client);
  // Create a secret
  // The secret can be a string of any kind. For example,
  // a multiline text block such as an RSA private key with newline characters,
  // or a stringified JSON object, like `JSON.stringify({ mySecret: 'MySecretValue'})`.

  // Read the secret we created
  const secret = await client.getSecret("React-Key");
  // console.log("secret: ", secret);
} catch (e) {
  // console.log("==error key vault=========");
  // console.log(e);
}

await getTokenFromStorage("privilege");
await getDataShopFromMs();
console.log("app is running on..." + process.env.NODE_ENV);

export default app;
