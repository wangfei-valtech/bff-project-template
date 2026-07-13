# 交付验证

## 基础验证原则

- 尽可能只在提交前统一运行测试、Lint、类型检查、格式检查、构建及专项检查（如 `pnpm i18ncheck`）。如果当前提交前已经完成且之后代码未变化，则不要重复运行。
- 每次在提交代码修改之前，必须跑一遍 `pnpm test`，全量通过后再继续提交。
- 如果只改 `md` 等非代码文件或 `./mocks` 等 mock 用文件，可跳过 `pnpm test`。
- 在较大修改前，执行 `pnpm test`、`pnpm lint`、`pnpm typecheck`、`pnpm format:check` 和 `pnpm build`。

## 模块级验证

- 除 RSC 服务端组件不太方便做单测的情况外，新增模块尽可能补对应测试文件。
