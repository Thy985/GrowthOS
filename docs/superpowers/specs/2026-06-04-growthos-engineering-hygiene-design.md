# GrowthOS 工程卫生重构设计

- 日期:2026-06-04
- 状态:设计中(待用户审阅)
- 范围:工程卫生(TS/JS 统一、ESLint、测试、目录组织)
- 非范围:安全/认证/存储真实改造、AI 文档脱节、PWA、README 模板字段、i18n 实际挂载

## 1. 目标与非目标

### 1.1 目标(in-scope)

1. 删除 `src/components/` 下 3 对 `.jsx`/`.tsx` 双胞胎:
   - `ErrorBoundary.jsx` / `ErrorBoundary.tsx`
   - `KeyboardShortcutsHelp.jsx` / `KeyboardShortcutsHelp.tsx`
   - `Tutorial.jsx` / `Tutorial.tsx`
2. 删除 `src/__tests__/components/RecordList.test.jsx`(保留 `.test.tsx`)。
3. 删除 `src/pages/Home.jsx`(并入 `features/dashboard/pages/HomePage.tsx`)。
4. 把项目从"分类型目录"重排为 `src/features/<domain>/` 领域化目录;`src/common/`、`src/store/` 拆开内聚到各 feature。
5. 引入并配置以下工具链:
   - `@typescript-eslint`(解析器 + 插件)
   - `prettier` + `eslint-config-prettier`
   - `husky` + `lint-staged`
   - `vitest` + `@vitest/coverage-v8`(替代 `jest` + Babel)
6. 提升测试覆盖到 line/branch ≥ 70%(针对 store、utils、所有 page、核心组件)。
7. 修正 `package.json` 中:
   - `lint` 脚本使其覆盖 `.ts/.tsx`
   - `i18next` 等疑似被乱填的版本号,与 lockfile 对齐
   - 新增 `typecheck`/`format`/`format:check`/`test`/`test:coverage`/`prepare` 脚本
8. 接入 `tsconfig` 的 `paths` 别名 + Vite/Vitest alias,统一 `@/...` 引用。
9. `growthSlice.ts` 拆为 `recordsSlice.ts` + `treeSlice.ts`(records、tags → records;trees → tree)。

### 1.2 非目标(out-of-scope)

- 不修加密/认证真实安全(密钥硬编码、IV 静态、`process.env` 取错、纯前端"登录")。
- 不引入真实后端或 BaaS;`secureStorage` 业务行为保留。
- 不动 `LocalStorage` 数据存储方案(后续单独 PR)。
- 不动 `public/manifest.json` 与 `public/service-worker.js`(没注册就没注册,本 PR 不假装支持 PWA)。
- 不动 README 中"AI 分析"的话术(可单独 PR 处理文档与实现的脱节)。
- 不补 i18n 实际挂载逻辑(本 PR 保持现状)。
- 不改 `i18next` 的依赖选择(只校版本号)。
- 不引入 `redux-persist`(存储方案未动)。

## 2. 架构与目录结构

### 2.1 目标目录布局

```
src/
  app/                                # 应用级
    App.tsx                           # 由 src/App.tsx 迁入
    main.tsx                          # 由 src/main.tsx 迁入
    router.tsx                        # createBrowserRouter 路由表(从 App.tsx 拆出)
    providers/                        # Redux Provider, ErrorBoundary, ThemeProvider 等
    store/
      index.ts                        # configureStore + RootState + AppDispatch
      hooks.ts                        # typed useAppDispatch / useAppSelector
  shared/                             # 跨 feature 共享
    components/
      common/                         # Badge, Button, Card, Input, Select, Textarea
      ErrorBoundary.tsx
      KeyboardShortcutsHelp.tsx
      Tutorial.tsx
      index.ts
    hooks/
      useKeyboardShortcuts.ts
    i18n/
      en-US.json, zh-CN.json, index.ts
    types/
      index.ts
    utils/
      encryption.ts
      secureStorage.ts
      errorHandler.ts
      logger.ts
      recordUtils.tsx                 # 跨域引用,放 shared
  features/
    auth/
      pages/LoginPage.tsx
      store/authSlice.ts
      contexts/AuthContext.tsx
      components/                     # (如 LoginForm, RegisterForm)
      types.ts
      index.ts
    records/
      pages/RecordsPage.tsx
      store/recordsSlice.ts           # 从 growthSlice 拆出 records + tags
      types.ts
    growth-tree/
      pages/GrowthTreePage.tsx
      store/treeSlice.ts              # 从 growthSlice 拆出 trees
      components/                     # AIGardener, NodeDetails, TreeVisualization, UncategorizedNodes
      types.ts
    goals/
      pages/GoalsPage.tsx
      store/goalSlice.ts
      utils/goalUtils.ts              # 仅本 feature 引用,放 feature 内
      types.ts
    reminders/
      pages/RemindersPage.tsx
      store/reminderSlice.ts
    analytics/pages/AnalyticsPage.tsx
    dashboard/
      pages/DashboardPage.tsx
      pages/HomePage.tsx              # 由 src/pages/Home.jsx 迁入并转 .tsx
    theme/
      store/themeSlice.ts
      contexts/ThemeContext.tsx

src/__tests__/                        # Vitest 统一入口
  setup.ts                            # @testing-library/jest-dom 注册、jsdom 配置
  shared/
    utils/encryption.test.ts
    utils/secureStorage.test.ts
    utils/logger.test.ts
    utils/errorHandler.test.ts
    utils/goalUtils.test.ts
    utils/recordUtils.test.tsx
  features/
    auth/store/authSlice.test.ts
    records/store/recordsSlice.test.ts
    growth-tree/store/treeSlice.test.ts
    goals/store/goalSlice.test.ts
    reminders/store/reminderSlice.test.ts
    theme/store/themeSlice.test.ts
    auth/pages/LoginPage.test.tsx
    records/pages/RecordsPage.test.tsx
    growth-tree/pages/GrowthTreePage.test.tsx
    growth-tree/components/TreeVisualization.test.tsx
    growth-tree/components/NodeDetails.test.tsx
    growth-tree/components/AIGardener.test.tsx
    growth-tree/components/UncategorizedNodes.test.tsx
  components/                         # 与源码共置的测试中较小组
    RecordList.test.tsx               # 删除 .jsx 双胞胎
```

### 2.2 关键设计选择

1. **`growthSlice` 拆为 `recordsSlice + treeSlice`**:现状 1 个 slice 管 `records`/`tags`/`trees` 三类状态,违反"一个 slice = 一个领域状态"。拆完每个 slice 的 reducer 集合小、可单独测,`growth-tree` 页面不再依赖 `records` 字段,耦合面下降。
2. **`shared/utils` 与 `features/<x>/utils` 分层**:`recordUtils.tsx` 跨域引用,放 `shared/utils/`;`goalUtils.ts` 暂放 `features/goals/utils/`,若发现跨域引用再上移。
3. **`app/router.tsx` 集中路由**:把 `App.tsx` 中的 `<Routes>` 迁入,只搬运不改正;键盘快捷键保持现状。
4. **`src/__tests__/` 与源码共置思想**:避免"测试在另一个宇宙",但本目录结构以 Vitest 风格组织,每文件单一关注点。
5. **删除清单**:`Home.jsx`、`ErrorBoundary.jsx`、`KeyboardShortcutsHelp.jsx`、`Tutorial.jsx`、`RecordList.test.jsx`、所有同名 `.jsx` 引用。

## 3. 工具栈与配置

### 3.1 新增 devDeps

- `@typescript-eslint/parser`、`@typescript-eslint/eslint-plugin`
- `eslint-plugin-react-hooks`(已存在则保留)
- `prettier`、`eslint-config-prettier`
- `husky`、`lint-staged`
- `vitest`、`@vitest/coverage-v8`、`@testing-library/jest-dom`

具体版本号与 `package-lock.json` 对齐时再锁(本设计不指定精确 patch)。

### 3.2 删除 devDeps

- `jest`、`jest-environment-jsdom`
- `@babel/core`、`@babel/preset-env`、`@babel/preset-react`、`@babel/preset-typescript`
- 删 `.babelrc`、`jest.config.cjs`

### 3.3 `.eslintrc.cjs`(核心)

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

### 3.4 `.prettierrc`

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

### 3.5 Husky + lint-staged

`.husky/pre-commit`:

```sh
npx lint-staged
```

`package.json` 内:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```

### 3.6 `vitest.config.ts`

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

### 3.7 `tsconfig.json`

保持 `strict + noUnusedLocals + noUnusedParameters + noFallthroughCasesInSwitch`,新增:

```json
"baseUrl": ".",
"paths": { "@/*": ["src/*"] }
```

### 3.8 `package.json` scripts

```json
{
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
}
```

`lint` 脚本移除 `--ext`(由 ESLint 自身 glob 决定)。

## 4. 迁移映射表(逐 PR)

### 4.1 PR1 工具基线(零业务改动)

**新增文件**:
- `.eslintrc.cjs`(覆盖)
- `.prettierrc`、`.prettierignore`
- `vitest.config.ts`
- `src/__tests__/setup.ts`(空架子:`import '@testing-library/jest-dom';`)
- `.husky/pre-commit`(可随后 `husky init` 自动生成)
- `.github/workflows/ci.yml`(如已存在则覆盖;不存在则新建)

**修改文件**:
- `package.json`:替换 scripts;新增 devDeps;删除旧 devDeps
- `tsconfig.json`:加 `baseUrl`、`paths`
- `tsconfig.node.json`:把 `vitest.config.ts` 纳入 include
- `.gitignore`:加入 `coverage/`、`dist/`(若已有则去重)

**删除文件**:
- `.babelrc`
- `jest.config.cjs`

**验收**:
- `npm run lint` 报零(`.ts/.tsx` 现在被扫,如出现违规立即修)
- `npm run typecheck` 报零
- `npm test` 跑空(0 测试通过)
- `npm run format:check` 报零
- `git commit` 触发 `pre-commit` 钩子跑 lint-staged

### 4.2 PR2 目录与类型迁移

**删除文件**:
- `src/components/ErrorBoundary.jsx`
- `src/components/KeyboardShortcutsHelp.jsx`
- `src/components/Tutorial.jsx`
- `src/__tests__/components/RecordList.test.jsx`
- `src/pages/Home.jsx`

**文件搬迁**(纯路径移动,内含 import 路径调整):

| 原路径 | 新路径 |
|---|---|
| `src/App.tsx` | `src/app/App.tsx` |
| `src/main.tsx` | `src/app/main.tsx` |
| `src/store/index.ts` | `src/app/store/index.ts` |
| `src/store/slices/authSlice.ts` | `src/features/auth/store/authSlice.ts` |
| `src/store/slices/growthSlice.ts` | **拆**:`src/features/records/store/recordsSlice.ts` + `src/features/growth-tree/store/treeSlice.ts` |
| `src/store/slices/goalSlice.ts` | `src/features/goals/store/goalSlice.ts` |
| `src/store/slices/reminderSlice.ts` | `src/features/reminders/store/reminderSlice.ts` |
| `src/store/slices/themeSlice.ts` | `src/features/theme/store/themeSlice.ts` |
| `src/pages/auth/index.tsx` | `src/features/auth/pages/LoginPage.tsx` |
| `src/pages/records/index.tsx` | `src/features/records/pages/RecordsPage.tsx` |
| `src/pages/growth-tree/index.tsx` | `src/features/growth-tree/pages/GrowthTreePage.tsx` |
| `src/pages/goals/index.tsx` | `src/features/goals/pages/GoalsPage.tsx` |
| `src/pages/reminders/index.tsx` | `src/features/reminders/pages/RemindersPage.tsx` |
| `src/pages/analytics/index.tsx` | `src/features/analytics/pages/AnalyticsPage.tsx` |
| `src/pages/dashboard/index.tsx` | `src/features/dashboard/pages/DashboardPage.tsx` |
| `src/components/growth-tree/*` | `src/features/growth-tree/components/*` |
| `src/components/common/*` | `src/shared/components/common/*` |
| `src/components/ErrorBoundary.tsx` | `src/shared/components/ErrorBoundary.tsx` |
| `src/components/KeyboardShortcutsHelp.tsx` | `src/shared/components/KeyboardShortcutsHelp.tsx` |
| `src/components/Tutorial.tsx` | `src/shared/components/Tutorial.tsx` |
| `src/common/contexts/AuthContext.tsx` | `src/features/auth/contexts/AuthContext.tsx` |
| `src/common/contexts/ThemeContext.tsx` | `src/features/theme/contexts/ThemeContext.tsx` |
| `src/common/hooks/useKeyboardShortcuts.ts` | `src/shared/hooks/useKeyboardShortcuts.ts` |
| `src/common/i18n/*` | `src/shared/i18n/*` |
| `src/common/types/index.ts` | 拆:`src/shared/types/index.ts`(共享类型)+ 各 `features/<x>/types.ts` |
| `src/common/utils/encryption.ts` | `src/shared/utils/encryption.ts` |
| `src/common/utils/secureStorage.ts` | `src/shared/utils/secureStorage.ts` |
| `src/common/utils/errorHandler.ts` | `src/shared/utils/errorHandler.ts` |
| `src/common/utils/logger.ts` | `src/shared/utils/logger.ts` |
| `src/common/utils/recordUtils.tsx` | `src/shared/utils/recordUtils.tsx` |
| `src/common/utils/goalUtils.ts` | `src/features/goals/utils/goalUtils.ts` |

**`growthSlice` 拆分规则**(核心改造):
- `records`、`tags` → `recordsSlice`
- `trees` → `treeSlice`
- 对应的 `loadData` thunk 拆为 `loadRecords`、`loadTrees`
- `addRecord` 等所有 action 按归属归位
- `useSelector` 调用方批量替换:`state.growth.records` → `state.records.records`、`state.growth.trees` → `state.tree.trees`

**`app/router.tsx` 新建**:`createBrowserRouter`,把 `App.tsx` 中的 `<Routes>` 迁入(行为零变)。

**验收**:
- `npm run lint`、`npm run typecheck` 双零
- `npm test` 仍是 0 测试通过(本 PR 不补测试,留给 PR3)
- `npm run build` 产物可启动,`npm run dev` 可访问主要页面
- `git log --stat` 看到 import 路径批量更新、文件批量重命名
- `grep -r "state.growth" src/` 返回 0 行(本 PR 收尾前手工核验)

### 4.3 PR3 覆盖率拉升

**新增测试文件**(详见第 2 节测试树):
- `src/shared/utils/{encryption,secureStorage,logger,errorHandler,goalUtils,recordUtils}.test.{ts,tsx}`
- `src/features/<x>/store/<x>Slice.test.ts`(6 个 slice,含拆出的 records/tree)
- `src/features/<x>/pages/<x>Page.test.tsx`(7 个 page)
- `src/features/growth-tree/components/{TreeVisualization,NodeDetails,AIGardener,UncategorizedNodes}.test.tsx`
- `src/shared/components/{ErrorBoundary,KeyboardShortcutsHelp,Tutorial}.test.tsx`
- `src/shared/components/common/{Button,Input,Select,Textarea,Card,Badge}.test.tsx`
- `src/__tests__/components/RecordList.test.tsx` 跟着已删 .jsx 重新写(覆盖率和组件 import 都对齐)

**测试方法学**:
- **store**:`vitest` + 内存 `localStorage` mock,验证 action + thunk + reducer
- **utils**:`describe('encrypt/decrypt round-trip')`、`describe('secureStorage.setItem/getItem')`,边界值覆盖
- **page**:`@testing-library/react` 渲染 + 交互,关键路径(登录提交、添加记录、节点点击)写集成测试
- **component**:纯 props / 事件 / 快照(用 `toMatchSnapshot` 而非 `react-test-renderer`,对齐 Vitest 推荐)

**覆盖率门槛(逐步抬升)**:本 PR 多次小步提交,中间 commit 可不达 70%,但**合并前最后一次** commit 必须 line/branch ≥ 70%。

**验收**:
- `npm run test:coverage` 输出 line/branch ≥ 70% 的总体/分文件报告
- `npm run lint && npm run typecheck && npm run test:coverage && npm run build` 全绿

## 5. 验收标准与里程碑

### 5.1 项目级"完成"(DoD)

- [ ] `npm run lint` 0 警告 0 错误(覆盖 `.ts/.tsx`)
- [ ] `npm run typecheck` 0 错误
- [ ] `npm run format:check` 0 差异
- [ ] `npm test` 全部通过,**line/branch/functions/statements 均 ≥ 70%**
- [ ] `npm run build` 产物可启动,无 `tsc` 警告残留
- [ ] `git commit` 触发 `pre-commit` 钩子自动 lint+format
- [ ] `src/` 下不存在 `.jsx` 文件(允许 `.tsx`)
- [ ] 旧的 `Home.jsx`、`ErrorBoundary.jsx`、`KeyboardShortcutsHelp.jsx`、`Tutorial.jsx`、`RecordList.test.jsx` 全部从 git 历史中消失
- [ ] 仓库根目录不再有 `.babelrc`、`jest.config.cjs`
- [ ] `tsconfig.strict` 通过,无 `any`(迁移中暴露的 `any` 必须替换为具体类型或 `unknown` + 收窄)
- [ ] `i18next` 依赖版本号与 lockfile 一致
- [ ] `package.json` 的 `lint` 脚本不再使用 `--ext`

### 5.2 PR 级里程碑

| PR | 合并条件 |
|---|---|
| PR1 | 工具链跑通;CI 三步(空跑)绿;无业务文件被改 |
| PR2 | 功能无回归(可手动走查 7 个 page);`useSelector` import 全部正确;`growthSlice` 拆完后,旧 `state.growth.*` 引用 0 残留 |
| PR3 | 覆盖率门槛达成;page 级测试至少覆盖每页 1 条主路径(登录/添加记录/切主题/...) |

### 5.3 风险登记与回滚策略

每个 PR 都可独立 `git revert`;不跨 PR 累积 commit。详见第 6 节。

## 6. 风险与回滚

### 6.1 风险 1:PR1 接入 typescript-eslint 时大量历史违规一次性暴露

- 表现:`npm run lint` 红成一片,PR 无法合。
- 缓解:在 PR1 内**只修**"真正会让构建失败"的硬错误(解析失败、import 路径错误),其余历史违规(比如 prop-types、未使用变量)分到后续小 PR 修。给 `.eslintrc` 加 `// eslint-disable-next-line` 比硬塞进 PR1 干净。
- 回滚:`git revert PR1` 回到 Babel+Jest 旧链。

### 6.2 风险 2:PR2 文件批量重命名导致 git blame 失效

- 表现:开发历史追溯困难,code review 时 reviewer 看不出"这行是新写的还是搬的"。
- 缓解:在 PR2 内部**先纯移动 + import 修复**(单 commit),**再类型注解与 `growthSlice` 拆分**(单 commit);git 用 `git log --follow <file>` 仍可追溯。
- 回滚:`git revert PR2`,但保留 PR1;重新规划时改用 IDE 的 "Rename with refactor" 而非"删除 + 新建"。

### 6.3 风险 3:`growthSlice` 拆分后 `useSelector` 漏改

- 表现:运行时 `Cannot read properties of undefined (reading 'records')`,页面空白。
- 缓解:
  1. PR2 中**先建空壳** `recordsSlice` + `treeSlice`(只导出空 reducer),把 `growthSlice` 改为**重新导出 `recordsSlice` 与 `treeSlice` 组合**,让 `useSelector` 双链路都先活;
  2. 第二步再**逐个文件**把 `useSelector(state => state.growth.records)` 改为 `state.records.records`,改完一处跑 `npm run build` 与 `npm test`;
  3. 第三步删 `growthSlice` 旧字段。
- 验证手段:`grep -r "state.growth" src/` 必须返回 0 行(本 PR 收尾前手工核验)。
- 回滚:任一中间步骤未通过,`git reset` 回到该 commit 之前。

### 6.4 风险 4:PR3 覆盖率门槛到不了 70%

- 表现:`vitest --coverage` 拒收合并。
- 缓解:
  1. PR3 拆为多个 commit,**先为 utils + store 补测试**(这两个最容易冲高,通常能到 50%+);
  2. **再为 page 主路径补测试**(补到 65%~70%);
  3. **最后为边缘组件**(Button、Badge 等展示组件)补快照测试,顶到 70% 门槛。
  4. 如仍达不到,**调低门槛到 65%**(变更 `vitest.config.ts` 中的 `thresholds`,但需在 PR3 描述里写明"为何达不到 70% 与下一 PR 的提升计划")。
- 回滚:回退到 PR2 终态,覆盖率门槛作为"待 PR4 达到"。

### 6.5 风险 5:Husky + lint-staged 在 Windows / WSL 上 hook 不触发

- 表现:开发者本机 `git commit` 不跑 lint。
- 缓解:在 README 增加"在 Windows 上需要 `git config core.hooksPath .husky` 的回退说明";`husky` v9+ 默认走 `core.hooksPath`。
- 回滚:删除 `.husky/` 与 `lint-staged` 配置,改靠 CI 兜底。

### 6.6 风险 6:`tsconfig` 改 `paths` 后 Vite alias 没同步

- 表现:`tsc` 编译过,`vite dev` 解析失败。
- 缓解:在 PR1 同时改 `tsconfig.json` + `vitest.config.ts`(或 `vite.config.ts`)的 `resolve.alias`,`npm run build` 与 `npm run dev` 双跑验证。
- 回滚:删除 `paths` 与 `alias`,改用相对路径(代价:diff 变更面更大,放到下一个 PR)。
