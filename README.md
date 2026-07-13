# bff-project-template

Backend for Frontend 场景下的前端工程，基于 Next.js、TypeScript、TailwindCSS、shadcn/ui 风格组件和 pnpm 初始化。

## 技术栈

- 服务框架：Next.js App Router
- 开发语言：TypeScript
- 包管理：pnpm
- 样式方案：TailwindCSS
- 组件方案：shadcn/ui 风格组件
- 多语言：react-i18next、i18next
- 状态管理：Jotai
- 请求状态：TanStack React Query
- 新手引导：driver.js
- 工具包：es-toolkit、ahooks
- 单元测试：Vitest、React Testing Library
- 代码规范：ESLint、Prettier
- 提交校验：Husky、lint-staged、commitlint

## 环境要求

- Node.js 22 或更高版本
- pnpm 10 或更高版本

```bash
node -v
pnpm -v
```

## 安装依赖

```bash
pnpm install
```

## 本地启动

本地开发需要同时启动两个进程：

```bash
pnpm dev
pnpm mock
```

建议分开两个终端窗口执行。

其中：

- `pnpm dev` 启动 Next.js server。
- `pnpm mock` 启动 `mihawk` mockServer。

浏览器访问时，前端请求会通过 `next.config.ts` 在开发环境下转发到 `http://127.0.0.1:9999`。

如果只想启动 Next.js 页面，可以单独执行：

```bash
pnpm dev
```

启动后访问：

```text
http://localhost:3000
```

## 生产构建与启动

```bash
pnpm build
pnpm start
```

## 常用命令

```bash
pnpm test          # Vitest 单元/组件测试
pnpm test:watch    # Vitest watch 模式
pnpm lint          # ESLint 检查
pnpm typecheck     # TypeScript 类型检查
pnpm format        # Prettier 格式化
pnpm format:check  # Prettier 格式检查
pnpm build         # 生产构建
```

## 模板能力清单

- App Router 页面基础结构：首页 `/` 和功能示例页 `/demo`。
- Client providers：React Query、Jotai、i18n、主题、toast 和版本更新检测。
- 多语言：内置中文、英文资源，并持久化当前语言。
- 主题切换：支持浅色、深色、跟随系统，并持久化当前主题。
- 请求封装：统一注入当前语言和主题 headers。
- MockServer：本地开发下 `/api/*` 由 `next.config.ts` 转发到 `mihawk`。
- NodeServer API：`/napi/*` 用于本工程 Next.js server 对外提供接口。
- 版本更新检测：基于构建时注入的 git commit sha 生成页面 etag，并在检测到新版本时提示刷新。
- 测试能力：使用 Vitest、React Testing Library 和 jsdom 覆盖工具函数、状态、UI 组件、route handler 和客户端逻辑。
- 工程规范：ESLint、Prettier、Husky、lint-staged、commitlint 和 VS Code 保存时自动修复配置。

## 环境变量

项目使用 `.env`、`.env.development`、`.env.production` 区分不同环境配置。

```bash
NEXT_PUBLIC_APP_NAME=bff-project-template
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_CDN_ORIGIN=https://cdn.example.com
```

说明：

- `NEXT_PUBLIC_APP_NAME`：应用名称。
- `NEXT_PUBLIC_API_BASE_URL`：接口基础路径，默认留空；示例代码显式请求 `/api/*`。
- `NEXT_PUBLIC_CDN_ORIGIN`：生产环境 CDN 域名前缀。

当 `NODE_ENV=production` 且配置了 `NEXT_PUBLIC_CDN_ORIGIN` 时，Next.js 的 `/_next/static` 静态资源会通过 `assetPrefix` 自动拼接 CDN 前缀。

如果使用 `public` 目录下的静态资源，请通过 `src/lib/assets.ts` 中的 `assetUrl()` 获取路径，确保生产环境也能拼接 CDN 前缀。

`NEXT_PUBLIC_GIT_COMMIT_SHA` 由 `next.config.ts` 在构建时注入，优先读取 `VERCEL_GIT_COMMIT_SHA`、`GITHUB_SHA`、`COMMIT_SHA`，否则回退到本地 `git rev-parse HEAD`。它会用于页面 etag、版本更新检测和 `/napi/version`。

## 接口约定

- `"/api/"` 开头的接口统一表示前端 client 侧依赖的服务接口，开发环境下由 `next.config.ts` 转发到 `http://127.0.0.1:9999` 的 `mihawk` mockServer。
- `"/napi/"` 开头的接口统一表示本系统 Next.js nodeServer 对外提供的接口。

已内置的 NodeServer API：

- `GET /napi/health-check`：返回 `{ "status": "ok" }`。
- `GET /napi/version`：返回 `{ "sha": "<NEXT_PUBLIC_GIT_COMMIT_SHA>" }`，当 sha 不可用时返回 `"unknown"`。

MockServer 使用说明见 [mocks/README.md](./mocks/README.md)。

## 命名规范

- 新增文件命名统一使用 kebab-case：仅允许小写字母、数字和横线连字符 `-`，不允许出现大写字母。仓库根目录中由工具或社区约定的固定文件名除外，例如 `README.md`、`AGENTS.md`。

## 测试约定

- Vitest 配置位于 `vitest.config.ts`。
- 测试公共 setup 位于 `src/test/setup.ts`。
- 测试文件优先放在被测代码旁边，命名为 `*.test.ts` 或 `*.test.tsx`。
- 每次新增的模块代码，除开 RSC 服务端组件不太方便做单元测试的之外，其余尽可能都加上对应的测试文件。

## 页面说明

- `/`：欢迎页，展示工程模板简介和进入 demo 的入口。
- `/demo`：功能示例页，包含以下能力：

- 中文、英文多语言切换。
- 浅色、深色、跟随系统主题切换。
- 请求封装自动注入 `lang` 和 `theme` headers。
- driver.js 新手引导。
- Jotai、React Query、ahooks、es-toolkit 基础使用。
- 版本更新 toast 可在开发环境通过 `/demo?mock-version-update=1` 触发验证。

语言请求头规则：

- 默认中文时不写入 `headers.lang`。
- 切换为英文后写入 `headers.lang = en-US`。

主题请求头规则：

- 请求时根据当前解析后的主题写入 `headers.theme`。

## 提交规范

项目配置了 Husky、lint-staged 和 commitlint。

执行 `git commit` 时会自动：

- 对 staged 文件执行 ESLint 和 Prettier 检查/修复。
- 校验 commit message 是否符合 Conventional Commits 规范。

示例：

```bash
git commit -m "feat: init frontend template"
git commit -m "fix: update request headers"
git commit -m "docs: update readme"
```

## 目录说明

```text
src/app              Next.js App Router 入口
src/components/ui    shadcn/ui 风格基础组件
src/core             全局状态等核心代码
src/i18n             多语言初始化
src/lib              通用工具、请求封装、静态资源路径工具
src/test             Vitest 公共测试 setup
mocks                mihawk MockServer 配置、数据和自定义中间件
```
