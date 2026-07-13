# 本工程接口说明

本工程采用 `mihawk` 作为 `mockServer` 对接口进行本地研发时候的模拟，而 `mockjs` 仅仅是作为数据的生成器，并不做接口拦截

## 为什么不使用 `mockjs` 去拦截本地请求？

如下，mockjs 自带了一种能力，通过劫持 xhr 对象，或者 fetch 等原生对象，达到对于请求的拦截

```ts
// 1. 拼装假数据
const data: any[] = [];
new Array(30).fill(undefined).forEach((item, index) => {
  data.push({
    key: index + 4 + "",
    firstName: "Joe" + index,
    lastName: "Black" + index,
    age: 32 + index,
    address: "Sidney No. 1 Lake Park" + index,
    tags: ["cool", "teacher"],
  });
});

// 2.拦截请求
/**
 * 通过 MockJs.mock()
 * - 原理是函数内部会通过劫持 xhr 对象，或者 fetch 对象，拦截请求，并返回模拟数据
 */
mock.mock(/\/api\/\/business\/list*/, "get", (config: any) => {
  const jsonParams = config.url.split("?")[1];
  const params = qs.parse(jsonParams);
  return intercepter("GET /api/business/list*", data, params);
});
```

这种方法也能达到目的，但是存在一些致命问题，在浏览器端`并没有真正的发起一次完整链路的网络请求`

- 1、`mockjs` 拦截的请求，无法在浏览器中查看，只能通过 `network` 查看，而 `mihawk` 则可以同时查看 `network` 和 `console`
- 2、由于没有真实的发起完整请求，那么本地代理 `devServer` 也不会正常
- 3、`mock.mock(...)` 这种代码需要 `注入到源码` 中，一不小心就会提交到线上环境

综上，本工程采用`非注入式`方式，通过 `mihawk` 拦截请求，并返回模拟数据

```sh
# 本地开发时
 ____________            ______________             ______________
|   本地请求  |    --->   |  devServer  |    --->   |  mockServer  |
 ------------            --------------            ---------------

# 线上真实环境
 ____________            __________________
|   本地请求  |    --->   |  backendServer  |
 ------------            ------------------
```

这样有一个好处，无论时`本地环境`还是`生产环境`，对于前端的业务代码层，是完全保持一致的

## Mockjs 需要去掉么？和 Mihawk 冲突么？

并不冲突，可以同时使用，因为两者专注的点不一样

- Mihawk 专注于实现一个模拟后端服务的 MockServer，以及对于一些特殊复杂接口的处理，内部可以采用 koa ，erpress 等工具进行接口处理
- Mockjs 则专注于数据的生产，比如模拟一些动态的临时生成的数据

可以在 Mihawk 的接口响应代码中，采用 Mockjs 进行数据的生成

## 如何使用 mihawk ？

- 本工程说明文档 详见 [mocks/README.md](../mocks/README.md)
- 官网详见 [mihawk](https://github.com/Froguard/mihawk)

## 接口前缀约定

- `"/api/"` 开头的接口，表示前端 client 侧依赖的服务接口。开发环境下由 `next.config.ts` 统一转发到 `http://127.0.0.1:9999`，由 `mihawk` 提供 mock 能力。
- `"/napi/"` 开头的接口，表示本系统 Next.js nodeServer 自己对外暴露的接口，不走 `mihawk` 进行 mock。
