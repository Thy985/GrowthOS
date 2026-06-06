# PR2 实施计划:目录与类型迁移

- 父 spec:[2026-06-04-growthos-engineering-hygiene-design.md](file:///workspace/docs/superpowers/specs/2026-06-04-growthos-engineering-hygiene-design.md)
- 前置:PR1 已合并(main 分支)
- 范围:目录重排为 `src/{app,shared,features}/`;删除 5 个 `.jsx` 双胞胎;`growthSlice` 拆为 `recordsSlice` + `treeSlice`
- 风险等级:高(批量重命名 + slice 拆分)

## 1. 目标

| ID | 完成判据 |
|---|---|
| PR2-DOD-1 | `src/` 下无 `.jsx` 文件 |
| PR2-DOD-2 | 目录结构与 spec §2.1 一致 |
| PR2-DOD-3 | `npm run lint` 0 错误 |
| PR2-DOD-4 | `npm run typecheck` 0 错误 |
| PR2-DOD-5 | `npm test` 仍绿(无新增测试) |
| PR2-DOD-6 | `npm run build` 成功 |
| PR2-DOD-7 | `grep -r "state.growth" src/` 0 行 |
| PR2-DOD-8 | 7 个 page 在 `npm run dev` 下可访问,主路径无 console 错误 |

## 2. 步骤(按顺序)

### 阶段 A:分支与基线

```bash
git checkout main && git pull
git checkout -b refactor/directory-migration
npm ci
```

### 阶段 B:`growthSlice` 拆分的"零破坏"准备

这一步的目的:**先让 `recordsSlice` 与 `treeSlice` 并存,旧 `useSelector` 仍能工作**,为后续逐步替换争取安全网。

**B1. 新建** `src/features/records/store/recordsSlice.ts`(空壳):

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Record, Tag } from '../../../shared/types';

export interface RecordsState {
  records: Record[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
}

const initialState: RecordsState = {
  records: [],
  tags: [],
  isLoading: false,
  error: null,
};

const recordsSlice = createSlice({
  name: 'records',
  initialState,
  reducers: {
    // 阶段 B:reducer 暂空,后续阶段 C 注入
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoading } = recordsSlice.actions;
export default recordsSlice.reducer;
```

**B2. 新建** `src/features/growth-tree/store/treeSlice.ts`(空壳):

```ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Tree } from '../../../shared/types';

export interface TreeState {
  trees: Tree[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TreeState = {
  trees: [],
  isLoading: false,
  error: null,
};

const treeSlice = createSlice({
  name: 'tree',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setLoading } = treeSlice.actions;
export default treeSlice.reducer;
```

**B3. 修改** [src/store/index.ts](file:///workspace/src/store/index.ts) 暂不动(本阶段还引用旧 growthSlice)。

**B4. 验证**:

```bash
npm run typecheck  # 应通过
npm run build      # 应成功
```

### 阶段 C:文件搬迁(纯移动 + import 修复,单 commit)

按 spec §4.2 的映射表逐个移动。**策略:用 `git mv` 保持 blame 链,先 git mv 再改 import 路径**。

**C1. 应用级文件**:

```bash
mkdir -p src/app/store src/app/providers

git mv src/App.tsx src/app/App.tsx
git mv src/main.tsx src/app/main.tsx
git mv src/store/index.ts src/app/store/index.ts
```

**C2. shared 目录文件**:

```bash
mkdir -p src/shared/components/common \
         src/shared/hooks \
         src/shared/i18n \
         src/shared/types \
         src/shared/utils

git mv src/components/common/Badge.jsx      src/shared/components/common/Badge.tsx
git mv src/components/common/Button.jsx     src/shared/components/common/Button.tsx
git mv src/components/common/Card.jsx       src/shared/components/common/Card.tsx
git mv src/components/common/Input.jsx      src/shared/components/common/Input.tsx
git mv src/components/common/Select.jsx     src/shared/components/common/Select.tsx
git mv src/components/common/Textarea.jsx   src/shared/components/common/Textarea.tsx
git mv src/components/common/index.ts       src/shared/components/common/index.ts

git mv src/components/ErrorBoundary.tsx           src/shared/components/ErrorBoundary.tsx
git mv src/components/KeyboardShortcutsHelp.tsx   src/shared/components/KeyboardShortcutsHelp.tsx
git mv src/components/Tutorial.tsx                src/shared/components/Tutorial.tsx

git mv src/common/hooks/useKeyboardShortcuts.ts   src/shared/hooks/useKeyboardShortcuts.ts
git mv src/common/i18n/en-US.json                 src/shared/i18n/en-US.json
git mv src/common/i18n/zh-CN.json                 src/shared/i18n/zh-CN.json
git mv src/common/i18n/index.ts                   src/shared/i18n/index.ts
git mv src/common/types/index.ts                  src/shared/types/index.ts
git mv src/common/utils/encryption.ts             src/shared/utils/encryption.ts
git mv src/common/utils/secureStorage.ts          src/shared/utils/secureStorage.ts
git mv src/common/utils/errorHandler.ts           src/shared/utils/errorHandler.ts
git mv src/common/utils/logger.ts                 src/shared/utils/logger.ts
git mv src/common/utils/recordUtils.tsx           src/shared/utils/recordUtils.tsx
```

**C3. feature 目录文件**:

```bash
mkdir -p src/features/auth/{pages,store,contexts,components} \
         src/features/records/{pages,store} \
         src/features/growth-tree/{pages,store,components} \
         src/features/goals/{pages,store,utils} \
         src/features/reminders/pages \
         src/features/analytics/pages \
         src/features/dashboard/pages \
         src/features/theme/{store,contexts}

# auth
git mv src/pages/auth/index.tsx                       src/features/auth/pages/LoginPage.tsx
git mv src/store/slices/authSlice.ts                  src/features/auth/store/authSlice.ts
git mv src/common/contexts/AuthContext.tsx           src/features/auth/contexts/AuthContext.tsx

# records
git mv src/pages/records/index.tsx                    src/features/records/pages/RecordsPage.tsx

# growth-tree
git mv src/pages/growth-tree/index.tsx                src/features/growth-tree/pages/GrowthTreePage.tsx
git mv src/components/growth-tree/AIGardener.jsx      src/features/growth-tree/components/AIGardener.tsx
git mv src/components/growth-tree/NodeDetails.jsx     src/features/growth-tree/components/NodeDetails.tsx
git mv src/components/growth-tree/TreeVisualization.jsx src/features/growth-tree/components/TreeVisualization.tsx
git mv src/components/growth-tree/UncategorizedNodes.jsx src/features/growth-tree/components/UncategorizedNodes.tsx
git mv src/components/growth-tree/index.ts            src/features/growth-tree/components/index.ts

# goals
git mv src/pages/goals/index.tsx                      src/features/goals/pages/GoalsPage.tsx
git mv src/store/slices/goalSlice.ts                  src/features/goals/store/goalSlice.ts
git mv src/common/utils/goalUtils.ts                  src/features/goals/utils/goalUtils.ts

# reminders
git mv src/pages/reminders/index.tsx                  src/features/reminders/pages/RemindersPage.tsx
git mv src/store/slices/reminderSlice.ts              src/features/reminders/store/reminderSlice.ts

# analytics
git mv src/pages/analytics/index.tsx                  src/features/analytics/pages/AnalyticsPage.tsx

# dashboard
git mv src/pages/dashboard/index.tsx                  src/features/dashboard/pages/DashboardPage.tsx
git mv src/pages/Home.jsx                             src/features/dashboard/pages/HomePage.tsx

# theme
git mv src/store/slices/themeSlice.ts                 src/features/theme/store/themeSlice.ts
git mv src/common/contexts/ThemeContext.tsx           src/features/theme/contexts/ThemeContext.tsx
```

**C4. 删除 .jsx 双胞胎**:

```bash
git rm src/components/ErrorBoundary.jsx
git rm src/components/KeyboardShortcutsHelp.jsx
git rm src/components/Tutorial.jsx
git rm src/pages/Home.jsx
```

**C5. 清理空目录**:

```bash
rmdir src/components/common src/components/growth-tree src/components
rmdir src/pages/auth src/pages/records src/pages/growth-tree src/pages/goals \
      src/pages/reminders src/pages/analytics src/pages/dashboard src/pages
rmdir src/store/slices src/store
rmdir src/common/contexts src/common/hooks src/common/i18n src/common/types \
      src/common/utils src/common
rmdir src/__tests__/components
```

**C6. 把所有 `.jsx` 改为 `.tsx`**(本步骤独立 commit):

```bash
# 已在上一步 git mv 时完成;此处查漏
find src -name "*.jsx" -print
# 期望:0 行
```

若 C1-C4 中漏了 `.jsx → .tsx`,本步骤补:

```bash
# 仅在确实有残留时执行
# 例: git mv src/.../SomeComponent.jsx src/.../SomeComponent.tsx
```

**C7. 提交"纯移动"commit**:

```bash
git add -A
git -c user.email=growthos-dev@local -c user.name="GrowthOS Dev" commit -m "refactor(pr2): relocate files into src/{app,shared,features}"
```

> 这次 commit **故意不带 import 路径修正**——让 git diff 干净,reviewer 能看清"哪些文件被搬了"。

### 阶段 D:批量修正 import 路径(单 commit)

由于仓库当前还引用旧路径,`npm run build` 会一片红。本阶段做替换。

**D1. 用 `sed` 做相对路径批量替换**(风险高,先在 IDE 一次性预览再应用):

```bash
# 预览(不写盘)
grep -rn "from '\.\./\.\./common/" src/ | head -20
grep -rn "from '\.\./\.\./store/" src/ | head -20
grep -rn "from '\.\./\.\./components/" src/ | head -20
grep -rn "from '\.\./\.\./pages/" src/ | head -20
```

针对每个文件,人工调整相对路径(从 `src/app/` 或 `src/features/<x>/` 的视角重新计算)。**建议使用 IDE 的"Move file with refactor"自动更新引用**,而不是 sed 替换。

**D2. 修正 `src/app/store/index.ts` 的 reducer 路径**:

```ts
import { configureStore } from '@reduxjs/toolkit';
import recordsReducer from '../../features/records/store/recordsSlice';
import treeReducer from '../../features/growth-tree/store/treeSlice';
import authReducer from '../../features/auth/store/authSlice';
import themeReducer from '../../features/theme/store/themeSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import growthReducer from '../../store/slices/growthSlice'; // 阶段 D 暂留;阶段 E 删

export const store = configureStore({
  reducer: {
    records: recordsReducer,
    tree: treeReducer,
    auth: authReducer,
    theme: themeReducer,
    goal: goalReducer,
    reminder: reminderReducer,
    growth: growthReducer, // 阶段 D 暂留
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

**D3. 验证阶段 D 后的可编译性**:

```bash
npm run typecheck
```

把剩下的 import 错误逐个修(可能 50+ 个文件)。每修一批跑一次 `npm run typecheck`。

**D4. 提交**:

```bash
git add -A
git -c user.email=growthos-dev@local -c user.name="GrowthOS Dev" commit -m "refactor(pr2): update all import paths to new feature folders"
```

### 阶段 E:`growthSlice` 拆分为 `recordsSlice` + `treeSlice`

**E1. 把 `records`/`tags` 状态与 reducer 从 `growthSlice.ts` 移到 `recordsSlice.ts`**:

读 [src/store/slices/growthSlice.ts](file:///workspace/src/store/slices/growthSlice.ts) 全文,识别:
- 属于 records/tags 的 initialState 字段
- 属于 records/tags 的 reducer
- 属于 records/tags 的 thunk(`loadData` 中的 records、tags 加载,`addRecord` 等)

把它们原样迁移到 `src/features/records/store/recordsSlice.ts`,**不要顺手改业务行为**(本 PR 不动业务)。

**E2. 把 `trees` 状态与 reducer 移到 `treeSlice.ts`**。

**E3. 修改 `src/app/store/index.ts`** 去掉 `growth` reducer:

```ts
export const store = configureStore({
  reducer: {
    records: recordsReducer,
    tree: treeReducer,
    auth: authReducer,
    theme: themeReducer,
    goal: goalReducer,
    reminder: reminderReducer,
  },
});
```

**E4. 删除** `src/store/slices/growthSlice.ts`(已搬到对应 feature):

```bash
git rm src/store/slices/growthSlice.ts
```

**E5. 替换所有 `useSelector` 调用方**:

```bash
# 找出所有用到 state.growth.records 的地方
grep -rn "state\.growth\.records" src/
grep -rn "state\.growth\.trees" src/
grep -rn "state\.growth\.tags" src/
```

对每个文件,按规则替换:
- `state.growth.records` → `state.records.records`
- `state.growth.tags` → `state.records.tags`
- `state.growth.trees` → `state.tree.trees`
- `state.growth.isLoading` → `state.records.isLoading`(针对 records 页面)或 `state.tree.isLoading`(针对 growth-tree 页面)
- 旧 thunk 调用 `dispatch(loadData())` 拆为 `dispatch(loadRecords())` + `dispatch(loadTrees())`

**E6. 验证**:

```bash
npm run typecheck
npm run build
npm run dev   # 手动走查 7 个 page
```

**E7. 提交**:

```bash
git add -A
git -c user.email=growthos-dev@local -c user.name="GrowthOS Dev" commit -m "refactor(pr2): split growthSlice into recordsSlice and treeSlice"
```

### 阶段 F:补全类型注解

`git mv` 不动内容,`.jsx → .tsx` 需要补类型。

**F1. 找出所有 `any` 与隐式 `any`**:

```bash
npm run lint  # 暴露 @typescript-eslint/no-explicit-any
```

**F2. 逐文件加类型**,重点:
- `src/shared/utils/recordUtils.tsx`(组件返回,需要 React 类型)
- `src/features/dashboard/pages/HomePage.tsx`(原 .jsx,几乎肯定有隐式 any)
- `src/features/growth-tree/components/*.tsx`(原 .jsx)

**F3. 提交**:

```bash
git add -A
git -c user.email=growthos-dev@local -c user.name="GrowthOS Dev" commit -m "refactor(pr2): add explicit types to migrated .tsx files"
```

### 阶段 G:app/router.tsx 集中路由(可选,但建议)

**G1. 新建** `src/app/router.tsx`:

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Auth } from '../features/auth/pages/LoginPage';
import { RecordsPage } from '../features/records/pages/RecordsPage';
import { GrowthTreePage } from '../features/growth-tree/pages/GrowthTreePage';
import { GoalsPage } from '../features/goals/pages/GoalsPage';
import { RemindersPage } from '../features/reminders/pages/RemindersPage';
import { AnalyticsPage } from '../features/analytics/pages/AnalyticsPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { HomePage } from '../features/dashboard/pages/HomePage';

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/auth', element: <Auth /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/records', element: <RecordsPage /> },
  { path: '/growth-tree', element: <GrowthTreePage /> },
  { path: '/goals', element: <GoalsPage /> },
  { path: '/reminders', element: <RemindersPage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;
```

**G2. 改写** `src/app/App.tsx` 使用 `AppRouter`(原 `<Routes>` 块删掉,改 import `AppRouter`)。

**G3. 验证路由表无遗漏**:

```bash
npm run build
npm run dev  # 走查 7 个 path
```

**G4. 提交**:

```bash
git add -A
git -c user.email=growthos-dev@local -c user.name="GrowthOS Dev" commit -m "refactor(pr2): extract router config to app/router.tsx"
```

### 阶段 H:清理与验证

**H1. 删除空目录**:

```bash
# 检查所有空目录
find src -type d -empty -print
# 一一删除
```

**H2. 跑全量校验**:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run format:check
```

**H3. 手工走查 7 个 page**:登录、注册、记录列表、添加记录、成长树、目标、提醒、分析、设置主题。

**H4. 残留检查**:

```bash
grep -rn "state\.growth" src/ && echo "FAIL: 残留 growth state" || echo "OK"
grep -rn "from.*common/" src/ && echo "FAIL: 残留 common 引用" || echo "OK"
grep -rn "from.*store/slices" src/ && echo "FAIL: 残留旧 store 路径" || echo "OK"
find src -name "*.jsx" && echo "FAIL: 残留 jsx" || echo "OK"
ls .babelrc jest.config.cjs 2>&1 | grep -q "No such" && echo "OK" || echo "FAIL"
```

**H5. 提交(若有清理)**:

```bash
git add -A
git -c user.email=growthos-dev@local -c user.name="GrowthOS Dev" commit -m "chore(pr2): cleanup after migration"
```

## 3. PR 提交策略

PR2 内部建议 5~6 个 commit,顺序与上面阶段对应:

1. `refactor(pr2): relocate files into src/{app,shared,features}`
2. `refactor(pr2): update all import paths to new feature folders`
3. `refactor(pr2): split growthSlice into recordsSlice and treeSlice`
4. `refactor(pr2): add explicit types to migrated .tsx files`
5. `refactor(pr2): extract router config to app/router.tsx`
6. `chore(pr2): cleanup after migration`(可选)

## 4. 验收 checklist

- [ ] `find src -name "*.jsx" -print` 输出 0 行
- [ ] `grep -r "state.growth" src/` 输出 0 行
- [ ] `grep -r "from.*common/" src/` 输出 0 行
- [ ] `grep -r "from.*store/slices" src/` 输出 0 行
- [ ] `npm run lint` 0 错误
- [ ] `npm run typecheck` 0 错误
- [ ] `npm test` 全绿(无新增测试)
- [ ] `npm run build` 成功
- [ ] `npm run dev` 下 7 个 page 可访问
- [ ] `npm run format:check` 0 差异
- [ ] 旧 `Home.jsx`、`ErrorBoundary.jsx`、`KeyboardShortcutsHelp.jsx`、`Tutorial.jsx` 已从 git 树消失(`git log --diff-filter=D --name-only --all | grep -E '\.jsx$' | sort -u`)

## 5. 回滚策略

```bash
git revert <PR2-merge-commit>
```

回滚后:
- 文件路径恢复(因为 `git mv` 是 rename,revert 可逆)
- `growthSlice` 恢复
- 新增的 `recordsSlice` / `treeSlice` 删除
- `app/router.tsx` 删除

## 6. 失败时的诊断命令

```bash
# 找出残留的旧引用
grep -rn "state\.growth" src/
grep -rn "from.*'\.\./\.\./common/" src/
grep -rn "from.*'\.\./\.\./store/slices/" src/

# 找出 import 路径断裂的具体行
npm run typecheck 2>&1 | head -50

# 找出 build 失败的 page
npm run build 2>&1 | tail -50
```
