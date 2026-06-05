# PR1 实施计划:工具基线

- 父 spec:[2026-06-04-growthos-engineering-hygiene-design.md](file:///workspace/docs/superpowers/specs/2026-06-04-growthos-engineering-hygiene-design.md)
- 范围:**零业务改动**。仅接入/替换静态检查、测试、格式化与 git 钩子。
- 风险等级:中(可能一次性暴露 typescript-eslint 历史违规)

## 1. 目标

| ID | 完成判据 |
|---|---|
| PR1-DOD-1 | `npm run lint` 0 警告 0 错误(覆盖 `.ts/.tsx`) |
| PR1-DOD-2 | `npm run typecheck` 0 错误 |
| PR1-DOD-3 | `npm test` 跑通(0 测试通过也算绿) |
| PR1-DOD-4 | `npm run format:check` 0 差异 |
| PR1-DOD-5 | `git commit` 触发 `pre-commit` 钩子跑 lint-staged |
| PR1-DOD-6 | 仓库根无 `.babelrc`、`jest.config.cjs` |

## 2. 步骤(按顺序)

### 步骤 1:准备工作分支

```bash
git checkout -b chore/tooling-baseline
```

### 步骤 2:安装新 devDeps,卸载旧 devDeps

执行前先备份当前 `package.json`:

```bash
cp package.json package.json.bak
```

新装(版本号与 `package-lock.json` 对齐时再锁;若 lockfile 不存在,使用 `npm view <pkg> version` 取最新稳定):

```bash
npm install -D \
  typescript-eslint@latest \
  prettier@latest \
  eslint-config-prettier@latest \
  husky@latest \
  lint-staged@latest \
  vitest@latest \
  @vitest/coverage-v8@latest
```

> 备注:`typescript-eslint` v8+ 已经把解析器与插件合一,使用方不用再单独装 `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`。

卸载:

```bash
npm uninstall jest jest-environment-jsdom @babel/core @babel/preset-env @babel/preset-react @babel/preset-typescript
```

### 步骤 3:删除旧工具配置文件

```bash
rm -f .babelrc jest.config.cjs
```

### 步骤 4:写入新配置文件

**4.1 覆盖** [`.eslintrc.cjs`](file:///workspace/.eslintrc.cjs):

```js
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  settings: { react: { version: 'detect' } },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/consistent-type-imports': 'error',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'import/order': ['warn', { 'newlines-between': 'always', alphabetize: { order: 'asc' } }],
  },
  ignorePatterns: ['dist', 'node_modules', 'coverage', '*.cjs', '*.config.*'],
};
```

> 注意:`typescript-eslint` v8+ 的 flat config 用 `eslint.config.js`,但本计划沿用 legacy `.eslintrc.cjs`,因为现有 `package.json` 注释里也是这套。先用 legacy,后续 PR 再迁 flat config。

**4.2 新建** `.prettierrc`:

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**4.3 新建** `.prettierignore`:

```
node_modules
dist
coverage
package-lock.json
*.min.js
```

**4.4 新建** `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    globals: true,
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/__tests__/**', 'src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/app/main.tsx'],
      thresholds: { lines: 70, branches: 70, functions: 70, statements: 70 },
    },
  },
});
```

**4.5 新建** `src/__tests__/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

> Vitest 0.34+ 推 `import '@testing-library/jest-dom/vitest'` 而不是 `import '@testing-library/jest-dom'`,前者会注册 vitest 的 expect 扩展。

**4.6 初始化 Husky**:

```bash
npx husky init
```

该命令会:
- 在 `package.json` 加 `"prepare": "husky"` 脚本(我们已加,但 husky 也会加;**保留 husky 加的**)
- 创建 `.husky/pre-commit`(空)
- 修改 `.gitignore` 加入 `.husky/_`

**4.7 改写** `.husky/pre-commit`:

```sh
npx lint-staged
```

**4.8 新建** `src/__tests__/basic.test.ts`(占位测试,验证 vitest 能跑):

```ts
import { describe, it, expect } from 'vitest';

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

### 步骤 5:修改 [package.json](file:///workspace/package.json)

**5.1 替换 scripts 段**:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b --noEmit && vite build",
  "preview": "vite preview",
  "lint": "eslint . --max-warnings 0",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write \"**/*.{ts,tsx,json,md,css}\"",
  "format:check": "prettier --check \"**/*.{ts,tsx,json,md,css}\"",
  "typecheck": "tsc -b --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "prepare": "husky"
}
```

**5.2 在 `package.json` 顶层加 `lint-staged` 块**:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

**5.3 删除 `package.json` 中已卸载的 devDeps 行**(npm uninstall 通常会自己删,人工核对一次)。

**5.4 校对依赖版本号**:
- 检查 `i18next`、`react-i18next` 与 `package-lock.json` 的 resolved 一致;若 `i18next: ^26.0.8` 实际无法解析,改用 `npm install i18next@latest` 让 npm 锁住真实最新稳定版。
- 检查 `react`,`react-dom` 主版本一致。

### 步骤 6:修改 [tsconfig.json](file:///workspace/tsconfig.json)

加 `baseUrl` 与 `paths`(为 PR2 准备,本 PR 还不用):

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 步骤 7:修改 [tsconfig.node.json](file:///workspace/tsconfig.node.json)

把 `vitest.config.ts` 纳入 include:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.js", "vitest.config.ts"]
}
```

### 步骤 8:更新 [.gitignore](file:///workspace/.gitignore)

追加(若已存在去重):

```
dist
coverage
.husky/_
```

### 步骤 9:初次跑校验

依次跑:

```bash
npm run lint
npm run typecheck
npm test
npm run format:check
```

**预期问题与处理**:
- typescript-eslint 暴露历史违规:`react-refresh/only-export-components`、`@typescript-eslint/no-explicit-any`、`no-unused-vars` 等。**只修"会让构建失败"的硬错误**(解析错误、import 路径错误),其余违规用 `// eslint-disable-next-line <rule>` 临时压制,挂 TODO 在 PR2 清理。
- `@testing-library/jest-dom/vitest` 找不到:`npm install -D @testing-library/jest-dom` 单独补。
- vitest 报 "Cannot find module 'jsdom'":`npm install -D jsdom`(Vitest 0.34+ 需要显式装 jsdom)。

### 步骤 10:commit

```bash
git add -A
git -c user.email=growthos-dev@local -c user.name="GrowthOS Dev" commit -m "chore(pr1): tooling baseline (eslint+prettier+vitest+husky)"
git push -u origin chore/tooling-baseline
```

> `user.email/user.name` 用一次性注入避免改持久化 git config。

### 步骤 11:打开 PR

PR 标题:`chore(pr1): tooling baseline (eslint+prettier+vitest+husky)`
PR 描述:引用 spec 与本计划链接,贴出 `npm run lint && npm run typecheck && npm test && npm run format:check` 全绿的截图/CI 输出。

## 3. 验收 checklist

- [ ] `npm run lint` 0 警告 0 错误
- [ ] `npm run typecheck` 0 错误
- [ ] `npm test` 全绿(1 个 smoke test)
- [ ] `npm run format:check` 0 差异
- [ ] `npm run build` 成功(可以 typecheck 后跑 vite build)
- [ ] `git commit --allow-empty -m "test"` 触发 pre-commit 钩子
- [ ] `ls .babelrc jest.config.cjs 2>&1` 都是 `No such file`
- [ ] `package.json` 不含 `jest`、`@babel/*` 字段
- [ ] `package.json` 的 `lint` 脚本不再含 `--ext`

## 4. 回滚策略

```bash
git revert <PR1-commit-sha>
# 或
git reset --hard origin/main  # 丢弃整个分支
```

回滚后:
- `package.json` 回到 Babel + Jest
- 工具配置文件 `.eslintrc.cjs`(新)会被覆盖
- `.prettierrc`、`.prettierignore`、`vitest.config.ts` 需手动删除
- `.husky/` 需手动删除

## 5. 失败时的诊断命令

```bash
# 单独跑 lint 看具体违规
npx eslint src --max-warnings 0

# 单独跑 typecheck
npx tsc -b --noEmit

# 单独跑测试
npx vitest run

# 检查 husky 是否安装
npx husky --help

# 验证 husky hook 注册
cat .git/hooks/pre-commit | head -3  # 应指向 .husky 目录
```
