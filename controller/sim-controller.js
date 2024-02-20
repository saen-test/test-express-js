import config from "../config/index.js";
import axios from "axios";
import { constant } from "../keyVaultConstant.js";
import LoggerService from "../utilities/logger/logger.js";
import { StatusType } from "../utilities/status-enum.js";
import { allFieldsRequired } from "../utilities/validation.js";
import { randomUUID } from "crypto";

const logger = new LoggerService("app");

export const getSimCategoryLists = async (req, res) => {
  const transactionId = randomUUID();
  const promoCodes = req.body.promoCodes;
  const categories = req.body.categories;

  if (!promoCodes || !categories) {
    return allFieldsRequired(res);
  }

  let responseCategory = [];
  const promises = await categories.map(async (category) => {
    const data = JSON.stringify({
      query: `query products($filter: ProductAttributeFilterInput!) {
                        products(filter: $filter) {
                            total_count
                        }
                    }
                `,
      variables: {
        filter: {
          sku: {
            in: promoCodes,
          },
          ais_category_name: {
            eq: category,
          },
        },
      },
    });

    try {
      logger.info(`verifyCategoryListsRequestData`, {
        status: StatusType.SUCEESS,
        details: JSON.stringify(category),
      });
      console.log("verifyCategoryLists request data", JSON.stringify(category));
    } catch (error) {
      console.log(`verifyCategoryListsRequestData Logger Error`, error);
    }
 
    const verifyCategoryListsFn = async () => {
      await axios({
        method: "post",
        url: config.magento.graphQLApi,
        headers: {
          "Content-Type": "application/json",
          "X-Content-Type-Options": "nosniff",
          "Strict-Transport-Security": "max-age=15552000; includeSubDomains",
        },
        data: data,
      })
        .then(async function (response) {
          try {
            logger.info(`verifyCategoryListsGraphqlSuccess`, {
              status: StatusType.SUCEESS,
              transactionId,
              details: JSON.stringify({
                response: response?.data,
              }),
            });
          } catch (error) {
            console.log(
              `verifyCategoryListsGraphqlSuccess Logger Error`,
              error
            );
          }
          if (response?.status == 200 && !response?.data?.errors?.length) {
            let totalCount = response?.data?.data?.products?.total_count;
            console.log(totalCount, category, "category");
            if (totalCount > 0) {
              responseCategory.push({
                ais_category_name: category,
              });
            }
          } else {
            return res.status(500).json({
              error: response?.data?.errors?.[0]?.message,
              status: false,
            });
          }
        })
        .catch(function (e) {
          try {
            logger.info(`verifyCategoryListsError`, {
              status: StatusType.FAIL,
              request: category,
              details: e,
            });
            console.log(
              "======verifyCategoryLists catch=======",
              JSON.stringify(e)
            );
          } catch (error) {
            console.log(`verifyCategoryListsError Logger Error`, error);
          }

          if (e?.status === 502 && retryCount === 0) {
            try {
              logger.info(`verifyCategoryListsGraphqlError`, {
                status: StatusType.FAIL,
                request: category,
                retryCount,
                details: e,
              });
            } catch (error) {
              console.log(
                `verifyCategoryListsGraphqlError Logger Error`,
                error
              );
            }
            retryCount++;
            verifyCategoryListsFn();
          } else {
            return res
              .status(500)
              .json({ status: false, data: null, error: e });
          }
        });
    };
    await verifyCategoryListsFn();
  });
  await Promise.all(promises);
  if (responseCategory.length > 0) {
    return res.status(200).json({
      data: responseCategory,
      status: true,
    });
  } else {
    return res.status(200).json({
      data: [],
      status: true,
    });
  }
};
