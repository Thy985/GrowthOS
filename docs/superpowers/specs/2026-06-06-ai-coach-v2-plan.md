# AI 成长教练 V2 — 实施计划

## 阶段 1：类型 + 引擎核心（~1.5h）

### 1.1 扩展 coachTypes

- **文件**：`src/features/coach/types/coachTypes.ts`
- **内容**：
  - `InsightType` 新增 `'retrospective' | 'trend' | 'gap' | 'project'`
  - `Recommendation` 新增 `linkTo?: { route: string; label: string }` 和 `relatedProjectId?: string`
  - 新增 `CoachSummary` 接口（headline / highlights / concerns / nextAction）
  - `CoachDiagnosis.summary` 从 `string` 改为 `CoachSummary`
  - 新增 `InsightGroup` 类型（type + label + insights）
- **验证**：tsc 0 errors（需同步适配所有引用 `CoachDiagnosis.summary` 的代码）

### 1.2 新增 4 条规则

- **文件**：`src/features/coach/engine/coachRules.ts`
- **内容**：
  - `detectRetrospectiveInsights(projects: Project[], capabilities: Capability[])` — 复盘洞察
  - `detectCapabilityTrends(capabilities: Capability[], projects: Project[])` — 能力趋势
  - `detectExperienceGaps(capabilities: Capability[], links: ExperienceCapabilityLink[])` — 经验断层
  - `detectProjectHealth(projects: Project[], experiences: Experience[])` — 项目健康
- **测试**：`src/features/coach/engine/__tests__/coachRulesV2.test.ts`（~15 个）

### 1.3 适配 coachEngine

- **文件**：`src/features/coach/engine/coachEngine.ts`
- **内容**：在 `analyze()` 中调用 4 条新规则，合并结果
- **测试**：`src/features/coach/engine/__tests__/coachEngineV2.test.ts`（~5 个集成测试）

### 1.4 适配 generateSummary 和 generateRecommendations

- **文件**：`src/features/coach/engine/coachRules.ts`
- **内容**：
  - `generateSummary()` 改为返回 `CoachSummary` 结构
  - `generateRecommendations()` 为新规则生成推荐，填充 `linkTo`

---

## 阶段 2：UI 组件（~2h）

### 2.1 CoachHeader 组件

- **文件**：`src/features/coach/components/CoachHeader.tsx`
- **内容**：标题 + 相对时间 + 刷新按钮 + 空状态
- **测试**：时间显示、刷新按钮回调

### 2.2 CoachSummarySection 组件

- **文件**：`src/features/coach/components/CoachSummarySection.tsx`
- **内容**：4 段式渲染（headline / highlights / concerns / nextAction），颜色编码
- **测试**：有数据渲染、空数据 "暂无分析"

### 2.3 InsightPanel 组件

- **文件**：`src/features/coach/components/InsightPanel.tsx`
- **内容**：按 type 分组，每组折叠/展开，复用 InsightCard 样式
- **测试**：分组渲染、折叠切换、空列表

### 2.4 RecommendationPanel 组件

- **文件**：`src/features/coach/components/RecommendationPanel.tsx`
- **内容**：推荐列表，linkTo → `<Link>` 可点击跳转
- **测试**：可点击推荐、无 linkTo 渲染、空列表

### 2.5 CoachPage 页面

- **文件**：`src/features/coach/pages/CoachPage.tsx`
- **内容**：组合 CoachHeader + CoachSummarySection + InsightPanel + RecommendationPanel
- **测试**：空状态、有数据全渲染、刷新按钮触发重新分析

---

## 阶段 3：集成（~1h）

### 3.1 适配现有 V1 页面和 store

- **CoachDiagnosisCard**：适配 `CoachSummary` 新结构（取 headline + highlights）
- **CoachRecommendations**：适配 `linkTo` 渲染（如存在则包装为 Link）
- **coachSlice**：扩展 `extraReducers.matcher` 监听 `projects/` 变更使缓存失效

### 3.2 路由

- **文件**：`src/app/router.tsx`
- **内容**：新增 `const CoachPage = lazy(() => import('...'))` 和 `<Route path="coach">`

### 3.3 App.tsx 底部导航

- **文件**：`src/app/App.tsx`
- **内容**：BottomNav 新增教练导航项

### 3.4 Dashboard 链接

- **文件**：`src/features/dashboard/pages/DashboardPage.tsx`
- **内容**：底部新增 "查看完整报告 →" 链接

### 3.5 i18n

- **文件**：`src/shared/i18n/zh-CN.json` / `en-US.json`
- **内容**：新增 `coach.` 命名空间下的键（summary / trends / gaps / page 标题等）

### 3.6 修复 V1 → V2 的破坏性变更

- `CoachDiagnosis.summary: string` → `CoachSummary`：同步所有引用处
- 现有测试适配新类型

---

## 阶段 4：测试 + 质量门禁（~1h）

### 4.1 运行全量测试

- `npx vitest run` 确认 540+ passed
- 修复所有失败的旧测试

### 4.2 质量门禁

- `npx tsc --noEmit` → 0 errors
- `npm run build` → success
- `npm run lint` → 0 errors（新代码）

---

## 文件变更汇总

| 操作 | 文件                                                                                |
| ---- | ----------------------------------------------------------------------------------- |
| 新增 | `src/features/coach/pages/CoachPage.tsx`                                            |
| 新增 | `src/features/coach/components/CoachHeader.tsx`                                     |
| 新增 | `src/features/coach/components/CoachSummarySection.tsx`                             |
| 新增 | `src/features/coach/components/InsightPanel.tsx`                                    |
| 新增 | `src/features/coach/components/RecommendationPanel.tsx`                             |
| 新增 | `src/features/coach/engine/__tests__/coachRulesV2.test.ts`                          |
| 新增 | `src/features/coach/engine/__tests__/coachEngineV2.test.ts`                         |
| 新增 | `src/__tests__/pages/CoachPage.test.tsx`                                            |
| 新增 | `src/__tests__/components/CoachSummarySection.test.tsx`                             |
| 新增 | `src/__tests__/components/InsightPanel.test.tsx`                                    |
| 修改 | `src/features/coach/types/coachTypes.ts`                                            |
| 修改 | `src/features/coach/engine/coachRules.ts`（+4 规则 + 增强 summary/recommendations） |
| 修改 | `src/features/coach/engine/coachEngine.ts`（集成新规则）                            |
| 修改 | `src/features/coach/store/coachSlice.ts`（扩展 matcher）                            |
| 修改 | `src/features/coach/components/CoachDiagnosisCard.tsx`（适配新 summary）            |
| 修改 | `src/features/coach/components/CoachRecommendations.tsx`（适配 linkTo）             |
| 修改 | `src/features/dashboard/pages/DashboardPage.tsx`（添加链接）                        |
| 修改 | `src/app/router.tsx`（新增 /coach 路由）                                            |
| 修改 | `src/app/App.tsx`（底部导航新增教练入口）                                           |
| 修改 | `src/shared/i18n/zh-CN.json` / `en-US.json`                                         |
| 修改 | `src/__tests__/`（适配 V1 测试到 V2 类型）                                          |
