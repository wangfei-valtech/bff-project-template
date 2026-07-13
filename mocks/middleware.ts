"use strict";
// import fs from 'fs';
// import path from 'path';
import Compose from "koa-compose";
import Router from "@koa/router";
// import type { Context: KoaContext, Next: KoaNext, Middleware: KoaMiddleware } from "koa"; // need koa@v2.0.0+ (eg: koa@^2.15.3)
import type { KoaContext, KoaNext } from "mihawk/com-types";

// init a koa-router instance
const router = new Router();

/*
// @ts-expect-error mihawk 运行时会提供 router 的完整类型能力，这里只做本地编译兜底。
router.get('/api/demo', async (ctx: KoaContext) => {
  ctx.status = 200;
  ctx.type = 'application/json';
  ctx.body = {
    headers: {
      lang: ctx.get('lang') || ctx.get('accept-language') || 'zh-CN',
      theme: ctx.get('theme') || 'system',
    },
    ok: true,
    requestedAt: new Date().toISOString(),
  };
});
*/

// define your each custom routes

// ...

/**
 * exports a default middleware
 * - use koa-compose to compose all routes middleware
 */
export default Compose([
  async function log(ctx: KoaContext, next: KoaNext) {
    const { ip, url, method, disableLogPrint } = ctx;
    if (!disableLogPrint) {
      console.log(`\n${method.toUpperCase()} ${url},`, `Visited by addr(${ip})`);
    }
    await next();
  },
  router.routes(), //
  router.allowedMethods(),
]);
