# AI 成长教练 V2 — 设计文档

**日期**: 2026-06-07（基于 2026-06-06 版本更新设计决策）
**阶段**: V2 规则引擎增强 + 独立教练页
**范围**: 消费复盘数据 + 4 条新规则 + 独立 /coach 页面 + 可操作推荐 + 结构化摘要 + Action Registry + 成长闭环

---

## 1. 背景与目标

### 1.1 V1 现状

V1 教练引擎是纯规则引擎，包含 3 条规则：

- **停滞检测**（stale）：识别 14/30/60 天未更新的能力
- **增长检测**（growth）：对比 30 天前后的能力等级变化
- **模式检测**（pattern）：经历集中度、过多项目、未使用原则

UI 仅作为 Dashboard 的两个嵌入卡片（CoachDiagnosisCard + CoachRecommendations），无独立页面。

### 1.2 V1 核心缺失

| 问题           | 影响                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| 未消费复盘数据 | 刚完成的复盘增强产出的 `retrospective`、`capabilitiesUsed`、`CapabilityImpact` 完全未被利用 |
| 无趋势分析     | 只能对比 30 天前后，无法看到长期变化曲线                                                    |
| 不可操作       | 推荐只是文字描述，用户不知道点哪里去执行                                                    |
| 无独立页面     | 教练信息散落在 Dashboard，无法深入探索                                                      |
| 摘要过于简陋   | 一句话总结，无法传达多维度的成长状态                                                        |

### 1.3 V2 目标

- 新增 4 条规则消费复盘、趋势、断层、项目健康数据
- 创建独立 `/coach` 页面，Dashboard 保留入口卡片
- 推荐变为可操作的：通过 Action Registry 解耦路由与规则
- 多段落结构化摘要 + 移动优先纵向叙事流
- 推荐生命周期追踪（成长闭环）
- 新增 ~50 个测试
- tsc 0 errors，build success，eslint 0 errors

---

## 2. 架构设计

### 2.1 核心决策：Coach 引擎与页面解耦

V2 将 Coach 引擎作为独立的 Redux slice（`coachSlice`）实现，与 CoachPage 解耦：

```
┌──────────────────────────────────────────────────┐
│  Data Layer (Redux store slices)                 │
│  ├─ experiences / capabilities / projects / ...  │
└──────────────────┬───────────────────────────────┘
                   │ action.fulfilled 触发（listener middleware）
                   ▼
┌──────────────────────────────────────────────────┐
│  Coach Engine (coachSlice + 规则函数)            │
│  ├─ runDiagnosis(state) → 写入 coachSlice        │
│  ├─ 4 条新规则 + V1 三规则                       │
│  └─ 诊断结果 + 7 天 history 存 Store             │
└──────────────────┬───────────────────────────────┘
                   │ selector 读取
                   ▼
┌──────────────────────────────────────────────────┐
│  CoachPage                                       │
│  └─ 只负责渲染（无计算、无闭包缓存）              │
└──────────────────────────────────────────────────┘
```

**刷新策略：B+ 自动重算 + 手动兜底**

- 默认：数据变化（experience/capability/project/retrospective 变更）通过 RTK listener middleware 自动触发 `runDiagnosis`
- 兜底：顶部保留"重新分析"按钮供高级用户/异常恢复
- 顶部文案："AI 成长教练 · 刚刚更新 · [重新分析]"
- 性能：listener middleware 只在 action.fulfilled 后触发，未变化时无重算

### 2.2 数据流

诊断结果存 Store（不在 selector 闭包内缓存），自动重算通过 RTK listener middleware 监听数据源变化触发：

```typescript
// 1. 在 app/store/index.ts 启动 listener middleware
listenerMiddleware.startListening({
  matcher: isAnyOf(
    addExperience.fulfilled, updateExperience.fulfilled, deleteExperience.fulfilled,
    addCapability.fulfilled, updateCapability.fulfilled, deleteCapability.fulfilled,
    addProject.fulfilled, updateProject.fulfilled, deleteProject.fulfilled,
    // retrospective 通过 updateProject 触发
  ),
  effect: (_, api) => {
    api.dispatch(runDiagnosis());
  },
});

// 2. runDiagnosis thunk —— 计算结果直接写入 slice
export const runDiagnosis = (): AppThunk => (dispatch, getState) => {
  dispatch(setAnalyzing(true));
  const state = getState();
  const diagnosis = computeDiagnosisFromState(state);
  dispatch(setDiagnosis(diagnosis));
  dispatch(pushHistorySnapshot(diagnosis));  // 滚动保留最近 7 天
  dispatch(setAnalyzing(false));
  dispatch(setLastAnalyzedAt(new Date().toISOString()));
};

// 3. Selector 只做纯读取，无副作用、无闭包缓存
export const selectCoachDiagnosis = (state: RootState) => state.coach.diagnosis;
export const selectCoachHistory = (state: RootState) => state.coach.history;
```

**关键修订说明：**

之前的草案中 `cachedDiagnosis` 放在 selector 闭包里是反模式：
- Redux selector 已有 `createSelector` 记忆化
- 三处状态（Redux store / dirty 标志 / 闭包缓存）容易不同步
- 无法支持历史诊断、每周报告、诊断对比

改为计算结果存 Store 后，未来接入 `coachState.history`（7 天滚动快照）即可轻松实现。

**手动兜底**：顶部保留"重新分析"按钮 → `dispatch(runDiagnosis())` 强制重算（供高级用户/异常恢复）。

### 2.3 Action Registry（动作注册表）

**为什么需要**：未来会出现"复盘项目 / 记录经历 / 管理能力 / 暂停项目 / 完成项目 / 建立目标"等几十种动作。若每个动作的路由、标签、执行逻辑写在 Recommendation 内部，规则引擎将与 UI 强耦合。加新动作要改 7 条规则 + 路由 + 文案，违反开闭原则。

**设计**：规则引擎只输出 `actionId`，所有动作元信息集中在 `coachActionRegistry.ts`：

```typescript
// src/features/coach/actions/coachActionRegistry.ts

export interface CoachAction {
  id: string;                // 'review_project'
  label: string;             // '去复盘'
  route: string;             // '/projects'
  category: 'project' | 'experience' | 'capability' | 'principle' | 'goal';
  // 可选：执行时携带的上下文（如具体项目 id、capability id）
  buildRoute?: (params: Record<string, string>) => string;
  // 可选：判断该动作是否已完成（用于推荐完成追踪）
  isCompleted?: (state: RootState, params: Record<string, string>) => boolean;
}

export const coachActionRegistry: Record<string, CoachAction> = {
  review_project: {
    id: 'review_project',
    label: '去复盘',
    route: '/projects',
    category: 'project',
    buildRoute: (params) => params.projectId
      ? `/projects/${params.projectId}/retrospect`
      : '/projects',
    isCompleted: (state, params) => {
      const project = state.projects.projects.find(p => p.id === params.projectId);
      return !!project?.retrospective;
    },
  },
  record_experience: {
    id: 'record_experience',
    label: '去记录',
    route: '/experiences/new',
    category: 'experience',
    buildRoute: (params) => params.capabilityId
      ? `/experiences/new?capability=${params.capabilityId}`
      : '/experiences/new',
  },
  manage_capability: {
    id: 'manage_capability',
    label: '去管理',
    route: '/capabilities',
    category: 'capability',
  },
  review_experiences: {
    id: 'review_experiences',
    label: '去回顾',
    route: '/experiences',
    category: 'experience',
  },
  apply_principle: {
    id: 'apply_principle',
    label: '去实践',
    route: '/principles',
    category: 'principle',
  },
  complete_project: { id: 'complete_project', label: '完成项目', route: '/projects', category: 'project' },
  pause_project:    { id: 'pause_project',    label: '暂停项目', route: '/projects', category: 'project' },
  create_goal:      { id: 'create_goal',      label: '建立目标', route: '/goals/new',  category: 'goal' },
  // 未来扩展点：只需在此处加一条
};
```

**规则输出**：

```typescript
// 规则内部不再写 linkTo，只输出 actionId + params
{
  id: 'rec-001',
  actionId: 'review_project',
  actionParams: { projectId: 'p-1' },
  title: '复盘「Flutter 重构」项目',
  priority: 'high',
  evidence: ['活跃 60 天未复盘'],
}

// UI 渲染时通过 registry 解析
const action = coachActionRegistry[rec.actionId];
const href = action.buildRoute?.(rec.actionParams) ?? action.route;
<Link to={href}>{action.label} →</Link>
```

**解耦收益**：
- 加新动作：只在 registry 加一条
- 改路由：只在 registry 改一次
- 多语言：label 从 i18n 注入，registry 只持 id
- 未来接入 LLM：LLM 输出 actionId 即可，不再需要 LLM 知道路由

### 2.4 新增规则

共 7 条规则（V1 3 条保留 + V2 4 条新增）：

| #   | 类型          | 函数                                   | 数据源                                        | 触发条件                                         |
| --- | ------------- | -------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| 1   | stale         | `detectStaleCapabilities`              | Capability + Link + Experience                | 能力关联的最新经历超过阈值天数                   |
| 2   | growth        | `detectGrowthCapabilities`             | Capability + Link + Experience                | 30 天前后能力等级差值超过阈值                    |
| 3   | pattern       | `detectPatterns`                       | Experience + Capability + Principle + Project | 经历集中度 > 80%、项目 > 3 个、未使用原则        |
| 4   | retrospective | **新增** `detectRetrospectiveInsights` | Project.retrospective + capabilitiesUsed      | 复盘数据存在时分析 whatWentWell/Wrong 跨项目模式 |
| 5   | trend         | **新增** `detectCapabilityTrends`      | CapabilityImpact（复盘产出的影响数据）        | 多期复盘后追踪能力等级变化方向                   |
| 6   | gap           | **新增** `detectExperienceGaps`        | Capability + ExperienceCapabilityLink         | 存在从未关联任何经历的能力                       |
| 7   | project       | **新增** `detectProjectHealth`         | Project + Experience                          | 活跃 > 30 天未复盘、无关联经验的项目             |

### 2.5 类型扩展

```typescript
// coachTypes.ts — 扩展 Insight.type
export type InsightType =
  | 'stale'
  | 'growth'
  | 'pattern'
  | 'warning'
  | 'retrospective'
  | 'trend'
  | 'gap'
  | 'project';

// coachTypes.ts — Recommendation（V2 重构：基于 Action Registry）
export type RecommendationStatus =
  | 'pending'      // 规则刚产出，用户未处理
  | 'in_progress'  // 用户点击进入 action 页面（通过 navigation signal 检测）
  | 'completed'    // action 已完成（registry.isCompleted 返回 true）
  | 'dismissed';   // 用户主动忽略

export interface Recommendation {
  id: string;            // 'rec-001'，稳定 id（用于追踪生命周期）
  actionId: string;      // 引用 coachActionRegistry 中的 key
  actionParams?: Record<string, string>;  // 动作上下文（如 {projectId: 'p-1'}）
  title: string;         // 教练文案
  action: string;        // 副标题/行动描述
  icon: string;
  priority: 'high' | 'medium' | 'low';
  relatedCapability?: string;
  relatedProjectId?: string;
  // V2 新增：去重证据（被合并的其它规则）
  evidence?: string[];
  // V2 新增：生命周期追踪（成长闭环）
  status: RecommendationStatus;
  statusUpdatedAt: string;  // ISO 时间戳
  // 关联到原始 rule（用于追溯 & A/B）
  sourceRule: string;       // 'stale' | 'project' | 'gap' | ...
}

// coachTypes.ts — 结构化 Summary
export interface CoachSummary {
  headline: string;
  highlights: string[];
  concerns: string[];
  nextAction: string;
  // V2 新增：完成率（成长闭环指标）
  completionRate?: {
    completedThisWeek: number;
    totalThisWeek: number;
  };
}

// coachTypes.ts — CoachDiagnosis 扩展
export interface CoachDiagnosis {
  summary: CoachSummary;
  insights: Insight[];
  recommendations: Recommendation[];
  generatedAt: string;
}

// coachTypes.ts — Coach 引擎状态（V2 重构：诊断结果存 Store）
export interface CoachState {
  diagnosis: CoachDiagnosis | null;
  history: CoachDiagnosis[];   // 最近 7 天的诊断快照（V3 用于报告/对比）
  lastAnalyzedAt: string | null;
  isAnalyzing: boolean;
  // 推荐的持久化状态（跨 diagnosis 复用，key = recommendation.id）
  recommendationStatuses: Record<string, {
    status: RecommendationStatus;
    updatedAt: string;
  }>;
}
```

---

## 3. 新规则详细设计

### 3.1 规则 4：复盘洞察（detectRetrospectiveInsights）

```typescript
// 输入：projects（含 retrospective 和 capabilitiesUsed）
// 分析：
//   1. 跨项目提取所有 whatWentWell 中的关键词
//   2. 统计哪些能力在 whatWentWell 中出现频率高 → 正面信号
//   3. 统计哪些能力在 whatWentWrong 中出现频率高 → 需关注
//   4. 如果多次复盘中同一能力的 nextTime 建议重复出现 → 模式未改进

// 输出：Insight[]
//   type: 'retrospective'
//   severity: 'info' | 'notice'
```

**规则示例：**

- "你的「系统设计」能力在 3 个项目复盘中都被提及为做得好的方面" → info
- "「状态管理」在 2 次复盘改进项中重复出现，建议重点突破" → notice
- "你在复盘中多次提到'提前评审'，已形成可迁移经验" → info

### 3.2 规则 5：能力趋势（detectCapabilityTrends）

```typescript
// 输入：capabilities + capabilitiesUsed（从 Project） + CapabilityImpact（从复盘）
// 分析：
//   1. 计算每个能力近期的 growthRate（相邻两次复盘间的等级变化）
//   2. 如果 growthRate 持续为正 → 加速期
//   3. 如果 growthRate 连续为 0 → 平台期
//   4. 如果 growthRate 为负 → 退化期

// 输出：Insight[]
//   type: 'trend'
//   severity: 'info' | 'notice' | 'important'
```

**规则示例：**

- "你的「编程」能力连续 3 期稳定增长，处于加速期" → info
- "「系统设计」已连续 2 期等级未变化，可能进入平台期" → notice
- "「测试」能力等级出现下降，建议增加相关实践" → important

### 3.3 规则 6：经验断层（detectExperienceGaps）

```typescript
// 输入：capabilities + links
// 分析：
//   1. 找出所有 capabilities 中有哪些从未出现在任何 links 中
//   2. 即创建了能力但没有关联任何经历

// 输出：Insight[]
//   type: 'gap'
//   severity: 'info' | 'notice'
```

**规则示例：**

- "你的「沟通表达」能力创建后从未关联任何经历" → info
- "你有 3 个能力（沟通表达、团队协作、项目管理）处于未训练状态" → notice

### 3.4 规则 7：项目健康（detectProjectHealth）

```typescript
// 输入：projects + experiences
// 分析：
//   1. 活跃项目中，startDate > 30 天且无 retrospective → 建议复盘
//   2. 活跃项目中，无任何关联 experience → 可能是空壳项目
//   3. completed 项目无 retrospective → 完成时未复盘

// 输出：Insight[]
//   type: 'project'
//   severity: 'info' | 'notice' | 'important'
```

**规则示例：**

- "「Flutter 重构」活跃 45 天未复盘，建议进行回顾" → important
- "「性能优化项目」已完成但缺少复盘记录" → notice

---

## 4. 教练页设计（CoachPage.tsx）

### 4.1 页面结构（单列纵向流）

```
CoachPage
├── CoachHeader              # 标题 + 生成时间 + 刷新按钮
│   ├── 标题："AI 成长教练"
│   ├── 生成时间："刚刚更新"
│   └── [重新分析] 按钮
├── CoachSummary             # 移动优先纵向 4 段
│   ├── Headline（占 40% 视觉权重）
│   ├── Growth Section（占 20%）
│   ├── Concern Section（占 25%）
│   └── Next Action Bar（占 15%）
├── TopRecommendationCard    # 最重要行动（Hero Card）
│   └── 高优先级唯一一条
├── OtherRecommendations     # 其它建议（Compact List）
│   └── RecommendationListItem × 4
├── InsightPanel             # 折叠手风琴
│   └── InsightGroup (×N)    # 每组可折叠
│       └── InsightCard (×N)
└── (空态时显示 3 步引导检查清单)
```

### 4.2 CoachHeader

- 显示 "AI 成长教练" 标题
- 显示最后分析时间（"刚刚"、"3 秒前"、"5 分钟前" 等相对时间）
- "重新分析"按钮：兜底使用，正常情况下不需要点
- 空态时不显示此 header

### 4.3 CoachSummary — 移动优先纵向

采用纵向叙事流而不是左右双列，因为移动端最终会堆叠，不如从一开始就是纵向：

```
┌─────────────────────────────────┐
│ 系统设计停滞，TS 持续增长       │  ← Headline（占 40% 视觉权重）
└─────────────────────────────────┘

📈 正在成长
────────────────────
+ TypeScript 本月 +15
+ 已完成 2 次高质量复盘            ← Growth Section（占 20%）

⚠️ 需要关注
────────────────────
系统设计已 60 天未训练
沟通表达从未关联经历              ← Concern Section（占 25%）

🎯 下一步
────────────────────
为「系统设计」安排一次实践        ← Next Action Bar（占 15%）
```

### 4.4 TopRecommendationCard（Hero）

- 仅展示 1 条最高优先级推荐
- 完整卡片：图标 + 标题 + 行动描述 + 跳转按钮
- 高优先级视觉权重：突出背景色 + 大字号
- 点击跳转：通过 `coachActionRegistry[rec.actionId].buildRoute(rec.actionParams)` 解析路径，`<Link>` 包裹整个卡片
- 状态徽章：右上角显示 lifecycle status（pending/in_progress/completed/dismissed）

### 4.5 OtherRecommendations（Compact List）

- Top 2-5 推荐以紧凑列表展示
- 单行：状态图标 + 标题 + 跳转链接
- 低视觉权重，与 Hero Card 形成对比
- 已 `completed` 的推荐不展示在主列表（迁移到"已完成的成长"折叠区）

### 4.6 InsightPanel — 折叠手风琴

```
📊 Insights (6)               [展开全部 / 折叠全部]
▶ Stale (2)                    ← 默认折叠
▼ Growth (1)                   ← 默认展开（包含重要洞察）
  · TypeScript +15 [信息]
▶ Trend (1) · Gap (1) · Project (1) · Pattern (0)
```

- 默认状态：仅第一个含重要洞察的组展开
- 每组标题可点击展开/折叠
- "展开全部 / 折叠全部"按钮置顶
- InsightCard 复用 V1 样式（颜色编码、图标），添加类型标签

### 4.7 推荐去重策略

当多条规则指向同一动作时（同一 `actionId` + 同一 `actionParams`），保留最高优先级，被合并的规则作为 `evidence` 注解：

```typescript
// 输入
[
  { id: '1', priority: 'high',   actionId: 'review_project', actionParams: {projectId: 'p-1'}, title: '复盘 Flutter 重构',   sourceRule: 'stale' },
  { id: '2', priority: 'medium', actionId: 'review_project', actionParams: {projectId: 'p-1'}, title: '项目健康警告',         sourceRule: 'project' },
]

// 输出
{
  id: '1',
  priority: 'high',
  actionId: 'review_project',
  actionParams: { projectId: 'p-1' },
  title: '复盘 Flutter 重构',
  evidence: ['项目活跃 90 天未复盘（stale）', '已完成但缺少复盘记录（project）'],
  sourceRule: 'stale',
}
```

实现：`deduplicateRecommendations(recommendations)` 函数，dedup key 为 `${actionId}:${JSON.stringify(actionParams)}`，组内取最高优先级。`id` 沿用最高优先级条目的 id（保持稳定，便于追踪 lifecycle status）。

### 4.8 空态（cold start）

```
┌─────────────────────────────────┐
│ 开启你的成长教练                │
│                                 │
│ 步骤 1/3                       │
│ ☐ 创建你的第一个能力            │
│ ☐ 记录第一段经历               │
│ ☐ 完成第一次复盘               │
│                                 │
│ [从步骤 1 开始 →]              │
└─────────────────────────────────┘
```

- 3 步引导检查清单：能力 → 经历 → 复盘
- 每步可勾选，可点击跳转到对应页面
- 完成全部 3 步后自动进入正常 Coach 视图

> **A/B 测试预留（V3 验证）**：真实用户通常更容易回答"今天做了什么"（经历优先）而不是"我有哪些能力"（能力优先）。V2 暂采用能力→经历→复盘顺序（与 Dashboard 现有 onboarding 一致，避免分裂）。V3 需 A/B 验证两种顺序的首次完成率：
> - 顺序 A：能力 → 经历 → 复盘（V2 现有）
> - 顺序 B：经历 → 能力 → 复盘（待验证，预期首次完成率更高）

---

## 5. 摘要增强

### 5.1 V1 → V2 对比

```
V1: "你的「系统设计」已 60 天未更新，是时候补充新经历了"

V2:
{
  headline: "系统设计停滞，TypeScript 持续增长",
  highlights: ["TypeScript 本月 +15 分", "完成了 2 次高质量复盘"],
  concerns: ["系统设计已 60 天未训练", "沟通表达从未关联经历"],
  nextAction: "建议为「系统设计」安排一次实践练习"
}
```

### 5.2 生成逻辑

- headline：取最重要的一条 insight 作为一句话总结
- highlights：取 growth + retrospective insight 中的正面信号
- concerns：取 stale + gap + important 级别的负面信号
- nextAction：取最高优先级的推荐 action

---

## 6. 推荐可操作性（基于 Action Registry）

### 6.1 推荐 → 动作映射

**V2 重构**：规则引擎只输出 `actionId + actionParams`，UI 通过 `coachActionRegistry` 解析（详见 §2.3）。不再有 `Recommendation.linkTo` 字段。

| 规则场景             | actionId              | actionParams 示例                       |
| -------------------- | --------------------- | --------------------------------------- |
| 复盘某项目           | `review_project`      | `{ projectId: 'p-1' }`                  |
| 记录某能力经历       | `record_experience`   | `{ capabilityId: 'c-3' }`               |
| 补充能力训练         | `manage_capability`   | `{ capabilityId: 'c-3' }`（可选）        |
| 查看经历详情         | `review_experiences`  | `{}`                                    |
| 实践未使用原则       | `apply_principle`     | `{}`                                    |
| 完成项目             | `complete_project`    | `{ projectId: 'p-1' }`                  |
| 暂停项目             | `pause_project`       | `{ projectId: 'p-1' }`                  |
| 建立目标             | `create_goal`         | `{}`                                    |

**加新动作的标准流程**（解耦收益）：

1. 在 `coachActionRegistry.ts` 中加一条记录（路由 + 标签 + `isCompleted`）
2. 规则函数返回 `actionId` 引用
3. 翻译：在 i18n 中加 `coach.actions.<id>` 键

无需修改：UI 渲染代码、deduplicate 函数、§6.2 / §6.3 的 Link 渲染。

### 6.2 TopRecommendationCard 渲染

```tsx
import { coachActionRegistry } from '../actions/coachActionRegistry';

function TopRecommendationCard({ rec }: { rec: Recommendation }) {
  const action = coachActionRegistry[rec.actionId];
  const href = action?.buildRoute?.(rec.actionParams) ?? action?.route ?? '#';
  const label = t(`coach.actions.${rec.actionId}.label`, action?.label ?? '查看');

  return (
    <Link to={href} className={`hero-rec-card priority-${rec.priority} status-${rec.status}`}>
      <span className="hero-icon">{rec.icon}</span>
      <h3>{rec.title}</h3>
      <p>{rec.action}</p>
      <span className="hero-button">{label} →</span>
      {rec.evidence && rec.evidence.length > 0 && (
        <div className="hero-evidence">依据：{rec.evidence.join(' / ')}</div>
      )}
      <RecommendationStatusBadge status={rec.status} />
    </Link>
  );
}
```

### 6.3 OtherRecommendations 渲染

```tsx
function OtherRecommendations({ recs }: { recs: Recommendation[] }) {
  return (
    <ul className="rec-list">
      {recs.map((rec) => {
        const action = coachActionRegistry[rec.actionId];
        const href = action?.buildRoute?.(rec.actionParams) ?? action?.route ?? '#';
        const label = t(`coach.actions.${rec.actionId}.label`, action?.label ?? '查看');
        return (
          <li key={rec.id} className={`rec-item status-${rec.status}`}>
            <Link to={href} onClick={() => dispatch(markRecommendationInProgress(rec.id))}>
              <span className="rec-status-icon">
                {rec.status === 'completed' ? '✓' : rec.status === 'in_progress' ? '◐' : rec.icon}
              </span>
              <span className="rec-title">{rec.title}</span>
              <span className="rec-link">{label} →</span>
            </Link>
            {rec.status === 'pending' && (
              <button onClick={() => dispatch(dismissRecommendation(rec.id))} className="rec-dismiss">
                忽略
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
```

### 6.4 推荐生命周期（成长闭环）

**状态机**：

```
        ┌──────────────┐
        │   pending    │ ←── 规则产出 / 上次 dismissed 后重新触发
        └──────┬───────┘
               │ 用户点击进入 action 页面
               ▼
        ┌──────────────┐
        │ in_progress  │
        └──────┬───────┘
               │
       ┌───────┴───────┐
       ▼               ▼
┌─────────────┐   ┌─────────────┐
│  completed  │   │  dismissed  │
└─────────────┘   └──────┬──────┘
   ↑                      │ 同 sourceRule 再次触发
   │                      ▼
   │              ┌──────────────┐
   └──────────────│   pending    │
                  └──────────────┘
```

**状态转移触发点**：

| 转移                  | 触发方式                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `pending` → `in_progress` | 用户点击推荐链接，进入 action 路由（router location 变化时检测）                                  |
| `in_progress` → `completed` | `runDiagnosis` 检测到 `coachActionRegistry[actionId].isCompleted?.(state, params) === true`     |
| 任意 → `dismissed`    | 用户点击"忽略"按钮（`dispatch(dismissRecommendation(id))`）                                        |
| `dismissed` → `pending` | 同 `sourceRule` 在新一次 `runDiagnosis` 重新触发（dismissed 状态保留 7 天内不重提）                |
| `completed` → `pending` | 罕见：用户撤销了 action 行为（如删除了刚加的复盘）                                                |

**Slice 实现**：

```typescript
// coachSlice.ts
state: {
  // ... 已有字段
  recommendationStatuses: Record<string, { status: RecommendationStatus; updatedAt: string }>,
}

reducers: {
  markRecommendationInProgress: (state, action: PayloadAction<string>) => {
    const id = action.payload;
    if (state.recommendationStatuses[id]?.status !== 'completed') {
      state.recommendationStatuses[id] = { status: 'in_progress', updatedAt: new Date().toISOString() };
    }
  },
  dismissRecommendation: (state, action: PayloadAction<string>) => {
    state.recommendationStatuses[action.payload] = { status: 'dismissed', updatedAt: new Date().toISOString() };
  },
}
```

**自动完成检测**（在 `runDiagnosis` 末尾）：

```typescript
// 在 computeDiagnosisFromState 内部，对每条产出的 Recommendation：
rec.status = state.coach.recommendationStatuses[rec.id]?.status ?? 'pending';
const action = coachActionRegistry[rec.actionId];
if (action?.isCompleted?.(state, rec.actionParams ?? {})) {
  rec.status = 'completed';
}
```

**显示规则**：

- 主列表（TopRecommendationCard + OtherRecommendations）只显示 `status !== 'completed'`
- 底部"已完成的成长"折叠区显示 `status === 'completed'`（最近 4 周）
- 已 `dismissed` 7 天内的不重提

### 6.5 成长闭环指标

`CoachSummary.completionRate` 字段记录用户执行力：

```typescript
{
  completionRate: {
    completedThisWeek: 3,    // 本周内标记为 completed 的推荐数
    totalThisWeek: 5,        // 本周内产出的总推荐数
    // → 60% 完成率
  }
}
```

显示在 CoachSummary 顶部：

```
本周执行力 ████████░░ 60%（3/5）
```

完成率作为 `CoachSummary` 第一个高亮，引导用户行为闭环：Coach 不是只"看"，是驱动"做"。

---

## 7. Dashboard 集成

- `CoachDiagnosisCard` 保留在 Dashboard，显示 headline + highlights（精简版）
- `CoachRecommendations` 保留在 Dashboard，显示 top 3 推荐（紧凑列表）
- 底部链接："查看完整报告 →" 导航到 `/coach`

---

## 8. 路由与导航

```tsx
// router.tsx 新增
const CoachPage = lazy(() => import('../features/coach/pages/CoachPage.tsx'));

<Route
  path="coach"
  element={
    <ProtectedRoute>
      <CoachPage />
    </ProtectedRoute>
  }
/>;
```

底部导航栏已有 🧠 coach 入口，V1 已添加但未实现独立页面，V2 将其指向 `/coach`。

---

## 9. 错误处理

| 场景                 | 处理                                                 |
| -------------------- | ---------------------------------------------------- |
| 无任何数据           | CoachPage 显示 3 步引导检查清单（空态）              |
| 分析过程中数据被删除 | 过滤不存在的 capabilityId / experienceId / projectId |
| 数据变化自动重算失败 | listenerMiddleware 失败时 `isAnalyzing` 仍为 true，下次 `runDiagnosis` 调用会重试 |
| Redux state 未初始化 | 每个 selector 返回默认空数组 / null                  |
| 局部计算超时         | 上次结果保留 + 提示"分析中..."                       |

---

## 10. 测试策略

### 10.1 规则纯函数测试（~15 个）

- `detectRetrospectiveInsights`：有复盘数据、无复盘数据、多项目 pattern、空数组
- `detectCapabilityTrends`：加速期、平台期、退化期、无影响数据
- `detectExperienceGaps`：有断层、无断层、空能力列表
- `detectProjectHealth`：需复盘、空壳项目、已完成未复盘
- `generateSummary`（结构化版）：覆盖所有分支
- `deduplicateRecommendations`：同 `actionId + actionParams` 合并、最高优先级保留、evidence 注解、id 稳定性

### 10.2 Action Registry 测试（~8 个）

- `coachActionRegistry`：所有 entry 都有 `id` / `label` / `route` / `category`
- `buildRoute`：有 params 时拼接、无 params 时回退到 route
- `isCompleted`：返回 true / false / undefined
- 路由拼接到 react-router 的可用路径（snapshot test）
- 未知 actionId 容错（不应崩溃）
- i18n key 完整性：所有 `coach.actions.<id>.label` 都在 en-US.json / zh-CN.json 中

### 10.3 组件测试（~15 个）

- `CoachPage`：空态、有数据渲染、刷新按钮、分组折叠
- `CoachHeader`：时间显示、刷新按钮
- `CoachSummary`：4 段纵向渲染、completionRate 进度条、空数据
- `TopRecommendationCard`：Hero 卡片渲染、可点击跳转、status 徽章
- `OtherRecommendations`：Compact List 渲染、"忽略"按钮、已 completed 不显示
- `InsightPanel`：分组渲染、默认折叠/展开、全部展开/折叠
- `EmptyStateChecklist`：3 步引导
- `RecommendationStatusBadge`：4 种 status 视觉差异

### 10.4 Slice 集成测试（~5 个）

- `coachSlice`：`runDiagnosis` thunk 写入 `state.diagnosis`、正确 push 到 `history`、长度上限 7
- `markRecommendationInProgress`：从 pending → in_progress、已 completed 不变
- `dismissRecommendation`：任意状态 → dismissed
- `listenerMiddleware`：action.fulfilled 后自动触发 runDiagnosis（mock store 测试）
- `selectCoachDiagnosis`：纯读取，无副作用

### 10.5 生命周期与闭环测试（~5 个）

- 推荐 `pending` → `in_progress`（dispatch 模拟）
- 推荐 `in_progress` → `completed`（`runDiagnosis` 中 `isCompleted` 返回 true）
- 推荐 dismissed 7 天内不再重提（mock Date.now）
- `completionRate` 计算正确：本周 completed / 本周 total
- 已 completed 的推荐不进入主列表渲染

---

## 11. 验证标准

| 检查项 | 目标                    |
| ------ | ----------------------- |
| tsc    | 0 errors                |
| build  | success                 |
| tests  | 540+ passed（+50 新增） |
| eslint | 0 errors（新代码）      |

---

## 12. V3 预留

> V2 引入的 4 个架构扩展点已为 V3 留好接口，V3 不需要重写 V2 代码。

- **A/B 测试空态 onboarding 顺序**：在 4.8 节已标注，V3 验证
  - 顺序 A：能力 → 经历 → 复盘（V2 现有）
  - 顺序 B：经历 → 能力 → 复盘（预期首次完成率更高）
  - 指标：首次完成 3 步 onboarding 的转化率、用户次日留存

- **LLM 集成**：`coachActionRegistry` 已解耦，V3 接入 LLM 时只需让 LLM 输出 `actionId`（无需 LLM 知道路由）
- **成长报告生成**：`coachState.history`（7 天滚动快照）已为 V3 周报/月报做好数据准备
- **历史对比**：`history` 数组支持任意两期诊断 diff，追踪长期变化
- **推送通知**：`Recommendation.status === 'important'` 触发浏览器通知（V2 不做）
- **完成率排行榜**（社交化）：`completionRate` 可作为个人成就指标

---

## 13. V2 架构决策总结

V2 在 V1 基础上做了 4 个关键架构升级，每个都为了长期可维护性：

| #   | 决策                          | 解决的问题                                          |
| --- | ----------------------------- | --------------------------------------------------- |
| 1   | **Action Registry**           | 规则与 UI/路由解耦，加新动作零侵入                  |
| 2   | **诊断结果存 Store**          | 避免 selector 闭包缓存与 Redux/dirty 三者不同步     |
| 3   | **空态顺序预留 A/B 测试**     | 经验优先（经历→能力）可能比能力优先转化率更高       |
| 4   | **推荐生命周期 + 成长闭环**   | Recommendation 不再是一次性，可追踪完成率与成长趋势 |