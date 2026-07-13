/**
 * @description: mihawk config
 */
const host = "0.0.0.0";
const port = 9999;

//
const config = {
  host,
  port,
  // https: true,
  cors: true,
  cache: true, // 同时控制 mock-logic 和 mock-data 的缓存
  watch: true,
  mockDir: "mocks",
  mockDataFileType: "json",
  mockLogicFileType: "ts",
  autoCreateMockLogicFile: true,
  logConfig: null,
  // socketConfig: {
  //   port,
  //   host,
  //   secure: false,
  //   stomps: false,
  // },
};

export default config;
