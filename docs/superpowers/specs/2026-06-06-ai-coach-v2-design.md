# AI 成长教练 V2 — 设计文档

**日期**: 2026-06-06
**阶段**: V2 规则引擎增强 + 独立教练页
**范围**: 消费复盘数据 + 新规则 + 独立页面 + 可操作推荐

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
- 推荐变为可操作的：每个推荐可点击跳转到对应页面
- 多段落结构化摘要
- 新增 ~30 个测试
- tsc 0 errors，build success，eslint 0 errors

---

## 2. 架构设计

### 2.1 新增规则

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

### 2.2 数据流

```
用户打开 /coach
  → CoachPage 挂载
  → dispatch(runCoachAnalysis())
  → coachEngine.analyze(所有数据)
    → detectStaleCapabilities()
    → detectGrowthCapabilities()
    → detectPatterns()
    → detectRetrospectiveInsights()    ← 新增
    → detectCapabilityTrends()         ← 新增
    → detectExperienceGaps()           ← 新增
    → detectProjectHealth()            ← 新增
    → generateRecommendations()        ← 增强
    → generateSummary()                ← 增强
  → dispatch(setDiagnosis())
  → UI 渲染
```

### 2.3 类型扩展

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

// coachTypes.ts — 扩展 Recommendation
export interface Recommendation {
  icon: string;
  title: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  relatedCapability?: string;
  // V2 新增
  linkTo?: {
    route: string;
    label: string;
  };
  relatedProjectId?: string;
}

// coachTypes.ts — 结构化 Summary
export interface CoachSummary {
  headline: string;
  highlights: string[];
  concerns: string[];
  nextAction: string;
}

// coachTypes.ts — CoachDiagnosis 扩展
export interface CoachDiagnosis {
  summary: CoachSummary;
  insights: Insight[];
  recommendations: Recommendation[];
  generatedAt: string;
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

### 4.1 页面结构

```
CoachPage
├── CoachHeader              # 标题 + 生成时间 + 刷新按钮
│   ├── 标题："AI 成长教练"
│   ├── 生成时间："2 分钟前分析"
│   └── 刷新按钮
├── CoachSummary             # 结构化摘要
│   ├── headline: "你的 TypeScript 能力本月增长显著"
│   ├── highlights: ["TypeScript +15", "已完成 2 次项目复盘"]
│   ├── concerns: ["系统设计 45 天未训练"]
│   └── nextAction: "建议为「系统设计」补充一次实践经历"
├── InsightPanel             # 按类型分组
│   └── InsightGroup (×N)    # 每组折叠/展开
│       └── InsightCard (×N) # 单条洞察
└── RecommendationPanel      # 推荐列表
    └── RecommendationCard (×N)  # 可点击跳转
```

### 4.2 CoachHeader

- 显示 "AI 成长教练" 标题
- 显示最后分析时间（"刚刚"、"5 分钟前"、"1 小时前" 等相对时间）
- 手动刷新按钮
- 如无数据，显示空状态

### 4.3 CoachSummary

- 4 段式结构：headline → highlights → concerns → nextAction
- highlights 使用绿色标记，concerns 使用橙色标记
- nextAction 使用蓝色标记，带箭头图标

### 4.4 InsightPanel

- 按 `type` 分组（stale / growth / pattern / retrospective / trend / gap / project）
- 每组带标题和图标，支持折叠/展开
- InsightCard 复用 V1 样式（颜色编码、图标），添加类型标签

### 4.5 RecommendationPanel + RecommendationCard

- 复用 V1 的优先级颜色编码（高/中/低）
- **核心变化**：每个卡片如果有 `linkTo`，渲染为可点击的 `<Link>` 或 `<button>`，点击跳转到对应路由
- 显示 "去复盘 →"、"去记录 →" 等操作提示

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

## 6. 推荐可操作性

### 6.1 推荐 → 路由映射

| 推荐内容       | linkTo.route                      | linkTo.label |
| -------------- | --------------------------------- | ------------ |
| 复盘某项目     | `/projects`                       | "去复盘"     |
| 记录某能力经历 | `/experiences/new?capability=:id` | "去记录"     |
| 补充能力训练   | `/capabilities`                   | "去管理"     |
| 查看经历详情   | `/experiences`                    | "去回顾"     |
| 实践未使用原则 | `/principles`                     | "去实践"     |

### 6.2 RecommendationCard 渲染

```tsx
{
  rec.linkTo ? (
    <Link to={rec.linkTo.route} className="...">
      {rec.icon} {rec.title}
      <span>{rec.action}</span>
      <span>→ {rec.linkTo.label}</span>
    </Link>
  ) : (
    <div>
      {rec.icon} {rec.title}
    </div>
  );
}
```

---

## 7. Dashboard 集成

- `CoachDiagnosisCard` 保留在 Dashboard，显示 headline + highlights
- `CoachRecommendations` 保留在 Dashboard，显示 top 3 推荐
- 新增底部链接："查看完整报告 →" 导航到 `/coach`

---

## 8. 路由

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

底部导航栏新增教练图标入口（📊 → 🧠）。

---

## 9. 错误处理

| 场景                 | 处理                                                 |
| -------------------- | ---------------------------------------------------- |
| 无任何数据           | CoachPage 显示空状态引导用户创建第一条经历           |
| 分析过程中数据被删除 | 过滤不存在的 capabilityId / experienceId / projectId |
| 缓存失效             | V2 扩展 matcher 监听 projects/ 变更                  |
| Redux state 未初始化 | 每个 selector 返回默认空数组                         |

---

## 10. 测试策略

### 10.1 规则纯函数测试（~15 个）

- `detectRetrospectiveInsights`：有复盘数据、无复盘数据、多项目 pattern、空数组
- `detectCapabilityTrends`：加速期、平台期、退化期、无影响数据
- `detectExperienceGaps`：有断层、无断层、空能力列表
- `detectProjectHealth`：需复盘、空壳项目、已完成未复盘
- `generateSummary`（结构化版）：覆盖所有分支

### 10.2 组件测试（~15 个）

- `CoachPage`：空状态、有数据渲染、刷新按钮、分组折叠
- `CoachHeader`：时间显示、刷新按钮
- `CoachSummary`：4 段渲染、空数据
- `InsightPanel`：分组渲染、折叠展开
- `RecommendationPanel`：可点击推荐、无 linkTo 渲染

---

## 11. 验证标准

| 检查项 | 目标                    |
| ------ | ----------------------- |
| tsc    | 0 errors                |
| build  | success                 |
| tests  | 540+ passed（+30 新增） |
| eslint | 0 errors（新代码）      |

---

## 12. V3 预留

- LLM 集成：当 `coachEngine.ts` 的 `CoachEngine` 接口被实现为异步版本时，可替换为 LLM 调用
- 成长报告生成：定期（每周/每月）自动生成 PDF/Markdown 格式的成长报告
- 推送通知：当检测到重要的 stale/gap 信号时，通过浏览器通知提醒用户
- 历史对比：多期诊断结果对比，追踪长期变化
