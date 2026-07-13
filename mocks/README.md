# 本地启动 mock-server 说明

> 本工程基于第三方工具包 [mihawk](https://github.com/Froguard/mihawk/blob/master/README.md) 启动 mock-server，从而完成对于线上后端接口的 mock 操作

> MockServer 的目的在于，“以一种不依赖后端程序为前提，进行正常的前端逻辑开发和代码调试”，使得前后端在开发阶段进行 `前后分离/解耦`

## 启动

```sh
pnpm run mock
```

> 建议单独的窗口执行，方便和 dev 指令窗口区分开来，混淆在一个窗口不利于排查问题

当成功启动后，控制台会有类似如下的输出，表示成功

```sh
$ pnpm run mock
[mihawk]: ✔ load root-config file: .mihawkrc.ts
[mihawk]: config: {
  host: '0.0.0.0',
  port: 9999,
  mockDir: 'mocks',
  mockDataFileType: 'json',
  mockLogicFileType: 'ts',
  autoCreateMockLogicFile: true,
}
[mihawk]: ✔ Enable typescript mode success! You can write logic in routes.ts, middleware.ts, data/**/*.ts
[mihawk]: ✔ Load routes file success! mocks\routes.ts
[mihawk]: ✔ Load custom middleware file success! mocks\middleware.ts
[mihawk]: 🚀 Start mock-server success!
[mihawk]: Mock directory:  mocks
[mihawk]: Detected-Routes(5): [
  'GET /index',
  'GET /test-*'
]
[mihawk]: Mock Server address:
[mihawk]: - http://0.0.0.0:9999
[mihawk]: - http://192.168.0.223:9999
```

然后访问 http://0.0.0.0:9999 将会看到 demo 接口

```json
{
  "code": 200,
  "data": "Welcome to Mock Server!",
  "msg": "mihawk: Auto init file -> mocks/data/GET/index.json"
}
```

## 配置接口

1. 工程中接口文件，在 mockServer 运行时，如果对应文件不存在，会自动创建，无需人工手动创建。

- 请求 `线上请求 GET /a/b` --> MockServer `mock请求 GET /a/b` --> 文件 `./mocks/data/GET/a/b.json|ts`

```json
{
  "code": 200,
  "data": "Empty Data!",
  "msg": "mihawk: Auto init file -> mocks/data/GET/a/b.json"
}
```

如上，自动创建的 json 文件，内容都比较简单，创建之后，对应的各个字段，需要修改成具体接口的返回 mock 值

2. 需要再本工程中配置一下接口转发，将 /api/xx/x 转到本 mockServer 中

3. 目前的 mock 接口数据配置，应该是不全的，需要按照需求自行补充，以及定期补充

## 接口前缀约定

- `"/api/"` 开头的接口统一表示前端 client 侧依赖的服务接口，本地开发通过 `next.config.ts` 转发到 `http://127.0.0.1:9999`。
- `"/napi/"` 开头的接口统一表示本系统 Next.js nodeServer 对外暴露的接口，不由 `mihawk` 接管。

## 修改 mock 数据

无论修改 mock 对应的 json 数据，还是对应的逻辑代码 ts 文件，mock-server 都会自动重新加载，无需重启指令

## 动态的 mock 数据

以 `GET /rand-num` 为例，可以配置在 `./mocks/data/GET/rand-num.json` 中，写上如下：

```json
{
  "code": 200,
  "data": 123,
  "msg": "You get a random number!"
}
```

此时访问 `GET /rand-num` 会得到固定的 `123` 结果。 然后在 `./mocks/data/GET/rand-num.ts` 中配置逻辑，如下：

```ts
/**
 * mock 逻辑处理函数
 * @param {object} originData 原始数据，即 `./mocks/data/GET/rand-num.json` 中的内容
 * @param {MhkCvtrExtra} extra { url,method,path,query,body }
 * @returns {object} newData
 */
export default async function convertData(
  originData: Record<string, any>,
  extra: Record<string, any>,
) {
  originData.data = Math.floor(Math.random() * 10000); // 生成一个新的数字
  return originData;
}
```

这样访问 `GET /rand-num`，**每次都会返回一个随机数**，而不是固定的 `123`

> 详见 http://0.0.0.0:9999/rand-num

```json
{
  //...
  "data": 7998
  //...
}
```

## 高级使用

### 1、自定义 http 接口响应

对于一些 `非json响应类型` 的接口，可以配置在自定义文件 [./mocks/middleware.ts](./middleware.ts) 中完成复杂逻辑的实现，该文件是一个标准的 `koa中间件` 函数

> 基于中间件完成自定义逻辑，理论上可以实现所有的请求处理，如文件下载，在线文件预览，视频传输等等

> 尽可能采用标准的 json 响应进行前后端接口交互。尽量不要修改 `./mocks/middleware.ts` 文件！

### 2、自定义 Socket 响应

对于 `websocket` 的响应，可以直接在 `mocks/socket.ts` 中完成，该文件是一个 `自定义函数`，格式如下

```ts
import { IncomingMessage } from "http";
import { WsWebSocket, SocketReslrFuncOptions } from "mihawk/com-types";

const isString = (s: unknown): s is string => typeof s === "string";
const isBuffer = (s: unknown): s is Buffer => Buffer.isBuffer(s);

/**
 * 默认需要 export 导出 resolve 函数（格式固定）
 * @param {WS.WebSocket} socket
 * @param {IncomingMessage} request
 */
export default function socketResolver(
  socket: WsWebSocket,
  request: IncomingMessage,
  options?: SocketReslrFuncOptions,
) {
  /*
  常用的参数，用以获取与“链接对象”相关的信息
   */
  const { clientId: cid } = options || {};
  const clientId = cid || request.socket.remoteAddress;

  /*
  自定义逻辑，当 socket 服务端上接收到消息时候的一些处理，即：“如何响应客户端？”
  */
  socket.on("message", (message: any, isBinary: boolean) => {
    // 转换数据格式
    const recived = isString(message)
      ? message
      : isBuffer(message)
        ? message?.toString()
        : JSON.stringify(message);
    console.log(
      "socket:",
      `Received message <= "${recived}"`,
      isBinary ? "binary" : "",
      `from [${clientId}]`,
    );
    // 拼装响应数据
    const msgData = {
      success: true,
      data: `WsServer: I've recived your message(${JSON.stringify(recived)})`,
    };
    console.log("socket:", `Send response to [${clientId}] =>`, msgData);
    // 发送数据
    socket.send(JSON.stringify(msgData));
  });
  //
}
```

> 本工程中，`./mocks/socket.ts` 文件中，已经写好了逻辑，一般情况下不太需要自己改了
