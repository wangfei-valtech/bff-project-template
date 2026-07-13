# 代码约束与质量基线

## 依赖与变更策略

- 依赖和脚本统一使用 `pnpm`。
- 保持 `package.json` 和 `pnpm-lock.yaml` 一致。
- 对 `html-to-image`、`xlsx`、PDF 生成或解析等体积较大且仅局部页面使用的第三方包，优先通过动态 `import()` 在用户交互时按需加载为独立异步 chunk；必要时可在 hover、focus 或 touch 时预加载，并应从全局公共 `vendor` 分包规则中排除，避免所有页面加载。完成后需通过生产构建产物或 manifest 确认其未进入全局公共 chunk。
- 文件修改优先使用 `apply_patch`。
- 变更范围尽量贴合当前请求，不要扩散到无关内容。
- 每次修改或新增代码时，同步检查相关注释是否需要更新或新增，确保注释准确、有效且不过期。

## 命名与复用约束

- 所有导出函数（包括默认导出的页面、布局和组件）都必须在声明前添加准确、有效的中文 JSDoc 注释。
- 所有语言包 JSON 文件统一放在 `src/i18n/resources`，并使用对应语言代码作为文件名；这是文件名全小写规则的例外，例如 `zh-CN.json`、`en-US.json`。
- 所有新增文件命名统一使用 kebab-case：仅允许小写字母、数字和横线连字符 `-`，不允许出现大写字母。仓库根目录中由工具或社区约定的固定文件名除外，例如 `README.md`、`AGENTS.md`。
- `src/core/state` 的状态文件按职责拆分，尽量只放置同一领域、关联度高的 atom/state 逻辑；新增状态优先创建独立文件，而非在既有文件堆砌不相关状态。

## 国际化约束（合并）

- 新增或修改多语言 key 时，必须确保 `resources` 下每个语言资源文件具有同构的 key 结构，并执行 `pnpm i18ncheck` 验证。
- 多语言 key 应按可复用语义组织：先检索既有 key 再新增；按钮、状态、语言、应用、请求、主题等通用文案优先放在 `common`、`actions`、`language`、`app`、`request`、`theme` 等公共顶层域。
- 当同一语义文案在两个及以上位置使用时，提升到合适公共顶层域并统一替换；避免在不同语义场景中强行复用。

## 提交流程约束

- pre-commit 会运行 `lint-staged`。
- commit message 需通过 `commitlint` 校验。
- 提交信息遵循 Conventional Commits，例如 `feat: add demo page`。
