"use strict";
/**
 * GET /api/demo
 * This file isn‘t mandatory. If it is not needed (such as when there is no need to modify response data), it can be deleted directly
 */
import { MhkCvtrExtra } from "mihawk/com-types";

/**
 * Mock data resolve function, the original data source is the JSON file with the same name as this file
 * @param {object} originData (mocks/data/GET/api/demo.json)
 * @param {MhkCvtrExtra} extra { url,method,path,query,body }
 * @returns {object} newData
 */
export default async function convertData(originData: Record<string, any>, extra: MhkCvtrExtra) {
  originData.headers = {
    lang: extra.headers["accept-language"]?.split(",")[0],
    theme: extra.headers["theme"],
  };
  originData.requestedAt = new Date().toISOString();
  return originData;
}
