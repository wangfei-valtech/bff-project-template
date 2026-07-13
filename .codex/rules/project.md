# 项目基础规则

## 生效范围

- 这个仓库是一个面向 BFF 场景的 Next.js 前端工程。
- 目标是以最小改动完成需求，并保持可维护性与一致性。

## 技术栈

- 框架：Next.js
- 语言：TypeScript
- 包管理：pnpm
- 路由：App Router
- 组件：shadcn/ui 风格组件
- 样式：TailwindCSS
- 多语言：react-i18next、i18next
- 状态管理：Jotai
- 请求状态：TanStack React Query
- 新手引导：driver.js
- 工具库：es-toolkit、ahooks
- 测试：Vitest、React Testing Library
- 规范：ESLint、Prettier
- 提交校验：Husky、lint-staged、commitlint

## 项目结构

- `src/app` 放置 App Router 路由、布局、providers 和全局样式。
- `src/components/ui` 放置 shadcn/ui 风格的基础组件。
- `src/core` 放置共享状态和应用级逻辑。
- `src/core/state` 下的每个状态文件应遵循单一职责原则，同一文件内聚焦一类高相关性的 `atom` 状态逻辑，避免把无关状态混在同一文件维护。
- `src/i18n` 放置多语言初始化和翻译资源。
- `src/lib` 放置通用工具，例如请求封装和静态资源路径工具。
- `src/test` 放置 Vitest 公共测试 setup。

## 常用命令

```bash
pnpm install
pnpm dev
pnpm mock
pnpm test
pnpm build
pnpm lint
pnpm typecheck
pnpm format
pnpm format:check
```

## 接口约定

- `/api/` 开头的接口统一表示前端 client 侧依赖的服务接口，开发环境下由 `next.config.ts` 转发到 `mihawk` mockServer。
- `/napi/` 开头的接口统一表示本系统 Next.js nodeServer 对外提供的接口。

## 运行与环境说明

- 项目使用 Next.js App Router，并在开发和生产构建中显式使用 webpack。
- 功能示例页位于 `/demo`，首页 `/` 是简洁欢迎页。
- 语言和主题状态通过 app providers 与 localStorage 进行共享。
- 生产环境下的静态资源继续沿用 `src/lib/assets.ts` 和 `next.config.ts` 中的 CDN 感知方案。
- 本地开发时需要同时启动 `pnpm dev` 和 `pnpm mock`，分别负责 Next.js server 和 `mihawk` mockServer。
- MockServer 使用说明见 [./mocks/README.md](./mocks/README.md)。
