"use strict";
/**
 * GET /api/health
 * This file isn‘t mandatory. If it is not needed (such as when there is no need to modify response data), it can be deleted directly
 */
import { MhkCvtrExtra } from "mihawk/com-types";

/**
 * Mock data resolve function, the original data source is the JSON file with the same name as this file
 * @param {object} originData (mocks/data/GET/api/health.json)
 * @param {MhkCvtrExtra} _extra { url,method,path,query,body }
 * @returns {object} newData
 */
export default async function convertData(originData: Record<string, any>, _extra: MhkCvtrExtra) {
  return originData;
}
