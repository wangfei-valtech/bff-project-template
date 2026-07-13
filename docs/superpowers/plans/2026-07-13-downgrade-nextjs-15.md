# Next.js 15 Downgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Downgrade the project from Next.js 16.2.10 to the latest supported Next.js 15 patch while preserving App Router behavior and the remaining dependency versions.

**Architecture:** Keep the existing App Router application and webpack customization unchanged. Align `next` and `eslint-config-next` at 15.5.20, remove Next.js 16-only CLI flags, regenerate the pnpm lockfile, and document the exact framework and CDN build-time configuration.

**Tech Stack:** Next.js 15.5.20, React 19.2.7, TypeScript 6.0.2, pnpm 10.28.1, Vitest, ESLint 9

## Global Constraints

- Preserve the existing App Router structure and application behavior.
- Keep React and all unrelated dependency versions unchanged.
- Continue using webpack, which is the default bundler in Next.js 15.5.20.
- Use pnpm for dependency and validation commands.
- Do not commit or push changes without explicit user authorization.

---

### Task 1: Align Next.js dependencies and CLI scripts

**Files:**

- Modify: `package.json`
- Modify: `eslint.config.mjs`
- Modify: `tsconfig.json`
- Modify: `next-env.d.ts`
- Create: `src/types/styles.d.ts`

**Interfaces:**

- Consumes: Existing `pnpm dev`, `pnpm build`, and ESLint workflows.
- Produces: Next.js 15.5.20 development, production build, and lint integration.

- [ ] **Step 1: Replace the framework versions**

Set both packages to the same patch version:

```json
"next": "15.5.20",
"eslint-config-next": "15.5.20"
```

- [ ] **Step 2: Remove unsupported CLI flags**

Next.js 15 uses webpack by default and does not expose the Next.js 16 `--webpack` flag:

```json
"dev": "next dev",
"build": "next build"
```

- [ ] **Step 3: Adapt framework-generated configuration**

Load the Next.js 15 legacy ESLint shareable configs through `FlatCompat`, remove the Next.js 16-only `.next/dev/types` references, and declare CSS side-effect imports for TypeScript 6:

```js
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const eslintConfig = [...compat.extends("next/core-web-vitals", "next/typescript")];
```

```ts
declare module "*.css";
```

### Task 2: Update production defaults and documentation

**Files:**

- Modify: `.env.production`
- Modify: `README.md`
- Modify: `.codex/rules/project.md`

**Interfaces:**

- Consumes: `NEXT_PUBLIC_CDN_ORIGIN` during `next build`.
- Produces: A safe production default and accurate Next.js 15/webpack documentation.

- [ ] **Step 1: Remove the non-functional CDN placeholder**

Keep the production default empty so local or unconfigured production builds do not reference a nonexistent CDN:

```dotenv
NEXT_PUBLIC_CDN_ORIGIN=
```

- [ ] **Step 2: Document the framework version and CDN injection point**

State that the template uses Next.js 15.5.20 with App Router, and show CDN configuration as a deployment-time value rather than a committed fake hostname.

- [ ] **Step 3: Correct the webpack rule wording**

Document that Next.js 15 defaults to webpack and that Turbopack is not enabled by the project scripts.

### Task 3: Regenerate dependency state

**Files:**

- Modify: `pnpm-lock.yaml`

**Interfaces:**

- Consumes: Updated exact versions in `package.json`.
- Produces: Installed Next.js 15.5.20 packages and a matching frozen lockfile.

- [ ] **Step 1: Install with pnpm**

Run:

```bash
pnpm install
```

Expected: installation completes without peer dependency errors and updates `pnpm-lock.yaml` to Next.js 15.5.20.

### Task 4: Validate the downgrade

**Files:**

- Test: Existing files under `src/**/*.test.ts` and `src/**/*.test.tsx`

**Interfaces:**

- Consumes: Installed Next.js 15.5.20 dependency graph.
- Produces: Evidence that tests, linting, type checking, formatting, and production compilation remain valid.

- [ ] **Step 1: Run the test suite**

```bash
pnpm test
```

Expected: all existing tests pass.

- [ ] **Step 2: Run static validation**

```bash
pnpm lint
pnpm typecheck
pnpm format:check
```

Expected: every command exits successfully.

- [ ] **Step 3: Run the production build**

```bash
pnpm build
```

Expected: Next.js reports version 15.5.20 and completes the App Router production build successfully.
