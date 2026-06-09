# AI 成长教练 V2 — 实施计划

**日期**: 2026-06-07
**关联 Spec**: `docs/superpowers/specs/2026-06-06-ai-coach-v2-design.md`
**分支**: `trae/solo-agent-4OLdEU`
**目标**: 完整 V2 交付，tsc 0 errors，build success，540+ tests passed

---

## 阶段 1: 类型系统 + Action Registry（基础设施）

### 任务 1.1: 扩展 coachTypes.ts
**文件**: `src/features/coach/types/coachTypes.ts`

- [ ] 添加 `RecommendationStatus` 类型（`pending | in_progress | completed | dismissed`）
- [ ] 重构 `Recommendation` 接口：
  - 移除 `linkTo?: { route: string; label: string }`
  - 添加 `id: string`（稳定标识）
  - 添加 `actionId: string`（引用 registry key）
  - 添加 `actionParams?: Record<string, string>`
  - 添加 `status: RecommendationStatus`
  - 添加 `statusUpdatedAt: string`
  - 添加 `evidence?: string[]`
  - 添加 `sourceRule: string`
- [ ] 重构 `CoachState` 接口：
  - 移除 `lastGeneratedAt`
  - 添加 `diagnosis: CoachDiagnosis | null`
  - 添加 `history: CoachDiagnosis[]`
  - 添加 `lastAnalyzedAt: string | null`
  - 添加 `isAnalyzing: boolean`
  - 添加 `recommendationStatuses: Record<string, { status: RecommendationStatus; updatedAt: string }>`
- [ ] 扩展 `CoachSummary` 添加 `completionRate?: { completedThisWeek: number; totalThisWeek: number }`
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 1.2: 创建 coachActionRegistry.ts
**新文件**: `src/features/coach/actions/coachActionRegistry.ts`

- [ ] 创建 `CoachAction` 接口（`id`, `label`, `route`, `category`, `buildRoute?`, `isCompleted?`）
- [ ] 注册 8 个动作：
  - `review_project`（含 `buildRoute` + `isCompleted`）
  - `record_experience`（含 `buildRoute`）
  - `manage_capability`
  - `review_experiences`
  - `apply_principle`
  - `complete_project`
  - `pause_project`
  - `create_goal`
- [ ] **验证**: `tsc --noEmit` 0 errors

---

## 阶段 2: coachSlice 重构（诊断存 Store）

### 任务 2.1: 重构 coachSlice.ts
**文件**: `src/features/coach/store/coachSlice.ts`

- [ ] 修改 `initialState` 匹配新的 `CoachState`
- [ ] 添加 `reducers`:
  - `setDiagnosis(state, action: PayloadAction<CoachDiagnosis>)`
  - `pushHistorySnapshot(state, action: PayloadAction<CoachDiagnosis>)` — 保留最近 7 条
  - `setAnalyzing(state, action: PayloadAction<boolean>)`
  - `setLastAnalyzedAt(state, action: PayloadAction<string>)`
  - `markRecommendationInProgress(state, action: PayloadAction<string>)` — 已 completed 不覆盖
  - `dismissRecommendation(state, action: PayloadAction<string>)`
- [ ] 移除旧的 `extraReducers`（不再需要监听所有数据源来清空缓存）
- [ ] 重构 `runCoachAnalysis` → `runDiagnosis` thunk:
  - 改为从 `getState()` 读取所有数据源
  - 调用 `computeDiagnosisFromState(state)`（封装在 `coachEngine.ts` 中）
  - 写入 `state.diagnosis`
  - 推入 `state.history`（滚动保留 7 天）
  - 调用自动完成检测（遍历 `coachActionRegistry` 的 `isCompleted`）
  - 设置 `isAnalyzing = false`，`lastAnalyzedAt = now`
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 2.2: 在 store 中注册 listenerMiddleware
**文件**: `src/app/store/index.ts`

- [ ] 添加 `import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'`
- [ ] 创建 `listenerMiddleware`
- [ ] 监听 `addExperience.fulfilled` / `updateExperience.fulfilled` / `deleteExperience.fulfilled`
- [ ] 监听 `addCapability.fulfilled` / `updateCapability.fulfilled` / `deleteCapability.fulfilled`
- [ ] 监听 `addProject.fulfilled` / `updateProject.fulfilled` / `deleteProject.fulfilled`
- [ ] effect 中 `api.dispatch(runDiagnosis())`
- [ ] 将 `listenerMiddleware.middleware` 加入 `configureStore`
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 2.3: 更新 coachSelectors.ts
**文件**: `src/features/coach/utils/coachSelectors.ts`

- [ ] 移除 `CACHE_TTL_MS` 和 `selectIsCoachCacheValid`
- [ ] `selectCoachDiagnosis` 保持纯读取 `state.coach.diagnosis`
- [ ] 添加 `selectCoachHistory(state) => state.coach.history`
- [ ] 添加 `selectCoachIsAnalyzing(state) => state.coach.isAnalyzing`
- [ ] 添加 `selectCoachLastAnalyzedAt(state) => state.coach.lastAnalyzedAt`
- [ ] 添加 `selectRecommendationStatuses(state) => state.coach.recommendationStatuses`
- [ ] **验证**: `tsc --noEmit` 0 errors

---

## 阶段 3: 规则引擎增强（actionId 输出 + dedup + completionRate）

### 任务 3.1: 更新 coachEngine.ts
**文件**: `src/features/coach/engine/coachEngine.ts`

- [ ] 抽取 `computeDiagnosisFromState(state: RootState): CoachDiagnosis` 函数
- [ ] 在每个推荐上填充 `actionId` + `actionParams` + `sourceRule`
- [ ] 调用 `deduplicateRecommendations()` 对推荐去重
- [ ] 在 `computeDiagnosisFromState` 末尾添加自动完成检测：
  - 遍历 `state.coach.recommendationStatuses` 恢复历史 status
  - 调用 `coachActionRegistry[actionId].isCompleted?.(state, params)` 标记 completed
- [ ] 在 `generateSummary` 中计算 `completionRate`
- [ ] **验证**: 现有测试继续通过

### 任务 3.2: 更新 coachRules.ts — 推荐路由改为 actionId
**文件**: `src/features/coach/engine/coachRules.ts`

- [ ] 更新 `generateRecommendations` 函数：
  - 输出 `actionId` 替代 `linkTo`
  - 输出 `actionParams` 替代硬编码路由
  - 添加 `sourceRule` 字段（标识规则来源）
  - 添加 `id` 字段（稳定标识符，格式：`rec-{sourceRule}-{projectId/capabilityId}`）
- [ ] 添加 `deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[]` 函数：
  - 按 `${actionId}:${JSON.stringify(actionParams)}` 分组
  - 组内取最高优先级
  - 被合并的 rules 写入 `evidence` 数组
  - 保留最高优先级条目的 `id`
- [ ] **验证**: 现有测试继续通过（可能需要更新期望值）

---

## 阶段 4: CoachPage 组件重写（单列纵向流）

### 任务 4.1: 创建 EmptyStateChecklist.tsx
**新文件**: `src/features/coach/components/EmptyStateChecklist.tsx`

- [ ] 3 步引导检查清单：能力 → 经历 → 复盘
- [ ] 每步可勾选（从 Redux 读取数据是否存在）
- [ ] 点击跳转到对应页面
- [ ] 全部完成时调用 `onComplete` 回调
- [ ] i18n 支持
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.2: 创建 TopRecommendationCard.tsx（Hero）
**新文件**: `src/features/coach/components/TopRecommendationCard.tsx`

- [ ] 接收 `rec: Recommendation` prop
- [ ] 通过 `coachActionRegistry[rec.actionId]` 解析路由
- [ ] 渲染完整卡片：图标 + 标题 + 行动描述 + 跳转按钮
- [ ] 高优先级视觉权重：突出背景色 + 大字号
- [ ] `<Link to={href}>` 包裹整个卡片
- [ ] 显示 `evidence` 注解（如存在）
- [ ] 显示 `RecommendationStatusBadge` 状态徽章
- [ ] i18n 支持
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.3: 创建 OtherRecommendations.tsx（Compact List）
**新文件**: `src/features/coach/components/OtherRecommendations.tsx`

- [ ] 接收 `recs: Recommendation[]` prop
- [ ] 紧凑列表渲染：状态图标 + 标题 + 跳转链接
- [ ] 点击时 `dispatch(markRecommendationInProgress(rec.id))`
- [ ] `pending` 状态显示"忽略"按钮（`dispatch(dismissRecommendation(rec.id))`）
- [ ] 已 `completed` 的推荐不展示
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.4: 创建 RecommendationStatusBadge.tsx
**新文件**: `src/features/coach/components/RecommendationStatusBadge.tsx`

- [ ] 接收 `status: RecommendationStatus` prop
- [ ] 4 种状态视觉差异：pending（灰色点）、in_progress（蓝色旋转）、completed（绿色 ✓）、dismissed（灰色 ✗）
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.5: 创建 CompletedGrowth.tsx
**新文件**: `src/features/coach/components/CompletedGrowth.tsx`

- [ ] 底部"已完成的成长"折叠区
- [ ] 显示最近 4 周 `status === 'completed'` 的推荐
- [ ] 默认折叠
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.6: 重写 CoachPage.tsx（单列纵向流）
**文件**: `src/features/coach/pages/CoachPage.tsx`

- [ ] 新的页面结构：
  ```
  CoachHeader
  CoachSummary（含 completionRate 进度条）
  TopRecommendationCard（Hero）
  OtherRecommendations（Compact List）
  InsightPanel（折叠手风琴）
  CompletedGrowth（已完成的成长）
  EmptyStateChecklist（空态时）
  ```
- [ ] 空态判断逻辑：检查 capabilities + experiences + projects 是否为空
  - 全空 → 显示 EmptyStateChecklist
  - 有数据但无 diagnosis → 显示 loading
  - 有 diagnosis → 正常视图
- [ ] 移除 `useEffect` 中的 `runCoachAnalysis` 调用（listenerMiddleware 自动触发）
- [ ] 页面初始加载时，如果 `diagnosis === null`，dispatch `runDiagnosis()`
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.7: 更新 CoachHeader.tsx
**文件**: `src/features/coach/components/CoachHeader.tsx`

- [ ] 使用 `selectCoachIsAnalyzing` 替代旧逻辑
- [ ] 使用 `selectCoachLastAnalyzedAt` 替代 `lastGeneratedAt`
- [ ] 刷新按钮文案："重新分析"（兜底使用）
- [ ] 显示更新文案："AI 成长教练 · 刚刚更新 · [重新分析]"
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.8: 更新 CoachSummarySection.tsx（移动优先纵向）
**文件**: `src/features/coach/components/CoachSummarySection.tsx`

- [ ] 改为移动优先纵向 4 段布局：Headline → Growth → Concern → Next Action
- [ ] 如 `completionRate` 存在，顶部显示"本周执行力"进度条
- [ ] 视觉权重：Headline 40% / Growth 20% / Concern 25% / Next Action 15%
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.9: 更新 InsightPanel.tsx（折叠手风琴增强）
**文件**: `src/features/coach/components/InsightPanel.tsx`

- [ ] 添加"展开全部 / 折叠全部"按钮
- [ ] 默认状态：仅第一个含重要洞察的组展开
- [ ] 保持现有分组渲染逻辑
- [ ] **验证**: `tsc --noEmit` 0 errors

### 任务 4.10: 废弃旧 RecommendationPanel.tsx
**文件**: `src/features/coach/components/RecommendationPanel.tsx`

- [ ] 保留但不再被 CoachPage 引用（Dashboard 的 CoachRecommendations 仍使用）
- [ ] 更新内部逻辑：如果 `rec.linkTo` 不存在，尝试通过 `actionId` 解析（向后兼容）
- [ ] **验证**: `tsc --noEmit` 0 errors

---

## 阶段 5: i18n 翻译

### 任务 5.1: 添加中文翻译
**文件**: `src/shared/i18n/zh-CN.json`

- [ ] 添加 `coach.actions` 对象，覆盖所有 8 个 actionId 的 label
- [ ] 添加 `coach.actions.{id}.label` 每个翻译
- [ ] 添加 `coach.emptyState` 相关 key（3 步检查清单）
- [ ] 添加 `coach.metrics` 相关 key（"本周执行力"）
- [ ] 添加 `coach.status` 相关 key（pending/in_progress/completed/dismissed）
- [ ] 添加 `coach.expandAll` / `coach.collapseAll`
- [ ] 添加 `coach.completedGrowth` （"已完成的成长"）
- [ ] 添加 `coach.retry` （"重新分析"）
- [ ] 添加 `coach.updated`（"刚刚更新"）
- [ ] **验证**: JSON 格式正确

### 任务 5.2: 添加英文翻译
**文件**: `src/shared/i18n/en-US.json`

- [ ] 同步所有 zh-CN.json 中新增的 key
- [ ] **验证**: JSON 格式正确

---

## 阶段 6: Dashboard 集成

### 任务 6.1: 更新 Dashboard 中的 Coach 卡片
**文件**: `src/features/dashboard/pages/DashboardPage.tsx`

- [ ] 确认 `CoachDiagnosisCard` 显示 headline + highlights（精简版）
- [ ] 确认 `CoachRecommendations` 显示 top 3 推荐（紧凑列表）
- [ ] 添加底部链接："查看完整报告 →" 导航到 `/coach`
- [ ] **验证**: `tsc --noEmit` 0 errors

---

## 阶段 7: 测试

### 任务 7.1: Action Registry 测试
**新文件**: `src/__tests__/actions/coachActionRegistry.test.ts`

- [ ] 所有 entry 都有 `id` / `label` / `route` / `category`
- [ ] `buildRoute` 有 params 时拼接、无 params 时回退到 route
- [ ] `isCompleted` 返回 true / false / undefined
- [ ] 未知 actionId 容错（不应崩溃）

### 任务 7.2: coachRules 测试扩展
**文件**: `src/__tests__/engine/coachRules.test.ts`

- [ ] `deduplicateRecommendations`：同 actionId+params 合并、最高优先级保留、evidence 注解、id 稳定性
- [ ] 更新现有推荐测试的期望值（actionId 替代 linkTo）

### 任务 7.3: coachSlice 测试扩展
**文件**: `src/__tests__/store/coachSlice.test.ts`

- [ ] `runDiagnosis` thunk 写入 `state.diagnosis`、正确 push 到 `history`、长度上限 7
- [ ] `markRecommendationInProgress`：从 pending → in_progress、已 completed 不变
- [ ] `dismissRecommendation`：任意状态 → dismissed
- [ ] `selectCoachDiagnosis`：纯读取，无副作用

### 任务 7.4: 生命周期与闭环测试
**新文件**: `src/__tests__/store/coachLifecycle.test.ts`

- [ ] 推荐 `pending` → `in_progress`（dispatch 模拟）
- [ ] 推荐 `in_progress` → `completed`（`runDiagnosis` 中 `isCompleted` 返回 true）
- [ ] 推荐 dismissed 7 天内不再重提（mock Date.now）
- [ ] `completionRate` 计算正确：本周 completed / 本周 total
- [ ] 已 completed 的推荐不进入主列表渲染

### 任务 7.5: 组件测试
**新文件**: `src/__tests__/components/CoachPage-v2.test.tsx`

- [ ] `CoachPage`：空态、有数据渲染、刷新按钮、分组折叠
- [ ] `EmptyStateChecklist`：3 步引导
- [ ] `TopRecommendationCard`：Hero 卡片渲染、可点击跳转、status 徽章
- [ ] `OtherRecommendations`：Compact List 渲染、"忽略"按钮、已 completed 不显示
- [ ] `RecommendationStatusBadge`：4 种 status 视觉差异
- [ ] `CoachSummary`：completionRate 进度条
- [ ] `CoachHeader`：刷新按钮、isAnalyzing 状态

---

## 阶段 8: 最终验证

### 任务 8.1: 全面验证
- [ ] `tsc --noEmit` → 0 errors
- [ ] `npm run build` → success
- [ ] `npm test` → 540+ passed（+50 新增）
- [ ] `npm run lint` → 0 errors（新代码）

---

## 任务依赖关系

```
阶段 1 (类型 + Registry) ──→ 阶段 2 (Slice 重构) ──→ 阶段 3 (引擎增强)
                                                          │
阶段 4 (组件重写) ←───────────────────────────────────────┘
     │
     ├──→ 阶段 5 (i18n)
     └──→ 阶段 6 (Dashboard 集成)
     
阶段 7 (测试) ←── 所有阶段完成后
阶段 8 (验证) ←── 阶段 7 完成
```

## 风险点

| 风险 | 影响 | 缓解 |
| ---- | ---- | ---- |
| 现有测试依赖旧 `Recommendation` 格式 | 测试失败 | 在阶段 3 更新测试期望值 |
| `listenerMiddleware` 可能触发循环 | 无限重算 | 在 effect 中加防抖（debounce 500ms） |
| 现有组件引用旧 `CoachState` 字段 | tsc 报错 | 每个阶段末尾验证 tsc |
| 底部导航栏 coach 入口已存在 | 路由冲突 | 确认 `/coach` 路由已存在，无需新建 |