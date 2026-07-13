# AGENTS.md

## 生效范围

这个仓库是一个面向 BFF 场景的 Next.js 前端工程。

## 规则入口（极简版）

- 本文件保留核心红线；详细规则见：
  - `.codex/rules/project.md`
  - `.codex/rules/code-constraints.md`
  - `.codex/rules/delivery-validation.md`

## 关键优先约束

- 依赖和脚本统一使用 `pnpm`。
- 变更范围尽量贴合当前请求，不要扩散到无关内容。
- 尽可能只在提交前统一运行验证（测试/Lint/类型检查/格式检查/构建/专项检查）。
- 中文优先为主导文案，i18n 中保持中英文 key 结构一致。

如需完整规则，请按上述规则文件逐条执行。
