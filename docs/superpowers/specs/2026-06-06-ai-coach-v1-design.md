# AI 成长教练 V1 — 规则引擎设计文档

**日期**: 2026-06-06
**阶段**: V1 规则引擎（纯本地，无 LLM）
**范围**: 诊断（能力曲线分析）+ 建议（下一步推荐）

---

## 1. 背景与目标

### 1.1 产品定位

GrowthOS 的核心是"个人经验管理系统"，AI 成长教练是系统的"大脑"。根据 PRD 规划，AI 教练分三个阶段：

| 阶段 | 内容                      | 状态        |
| ---- | ------------------------- | ----------- |
| V1   | 规则引擎（纯本地）        | 🟢 本次实现 |
| V2   | 轻量 LLM（自动提取/推荐） | ⏳ 预留接口 |
| V3   | 深度 AI（经验迁移/预测）  | ⏳ 预留接口 |

### 1.2 本次目标

- 在首页展示**核心诊断**（一句话回答"你正在成为谁"）
- 提供**可执行的建议**（下一步该做什么）
- 完全本地运行，零 API 成本，隐私安全
- 纯规则引擎，但架构预留 V2 LLM 升级路径

---

## 2. 架构设计

### 2.1 模块结构

```
src/features/coach/
├── engine/
│   ├── coachEngine.ts      ← 核心规则引擎（纯函数，对外唯一接口）
│   └── coachRules.ts        ← 规则定义（4 类诊断规则 + 建议生成）
├── store/
│   └── coachSlice.ts        ← Redux slice，缓存分析结果
├── components/
│   ├── CoachDiagnosisCard.tsx    ← 核心诊断卡片（首页顶部展示）
│   └── CoachRecommendations.tsx  ← 替代现有 Recommendations
├── types/
│   └── coachTypes.ts        ← 诊断/建议类型定义
└── utils/
    └── coachSelectors.ts    ← 从 Redux 状态提取数据的 selector
```

### 2.2 数据流

```
DashboardPage 渲染
    ↓
从 Redux 读取 experiences/capabilities/principles/projects
    ↓
CoachDiagnosisCard / CoachRecommendations 调用 coachEngine.analyze()
    ↓
engine.analyze() → 纯函数，输入数据 → 输出 CoachDiagnosis
    ↓
结果缓存到 coachSlice（避免重复计算，30 分钟过期）
    ↓
组件渲染诊断和建议
```

### 2.3 与现有组件的关系

| 现有组件            | 处理方式                                       |
| ------------------- | ---------------------------------------------- |
| `Recommendations`   | 替换为 `CoachRecommendations`                  |
| `InsightCards`      | 保留（显示静态统计：未更新能力、增长最高能力） |
| `RadarChartSection` | 不变                                           |
| `QuickRecordForm`   | 不变                                           |
| `PrinciplesSection` | 不变                                           |

---

## 3. 类型定义

### 3.1 CoachDiagnosis（诊断输出）

```typescript
interface CoachDiagnosis {
  summary: string; // 一句话总结「你正在成为谁」
  insights: Insight[]; // 洞察列表（按严重程度排序）
  recommendations: Recommendation[]; // 建议列表（按优先级排序）
  generatedAt: string; // 生成时间戳
}
```

### 3.2 Insight（洞察）

```typescript
interface Insight {
  type: 'stale' | 'growth' | 'pattern' | 'warning';
  icon: string;
  title: string;
  description: string;
  severity: 'info' | 'notice' | 'important';
}
```

- `stale`: 能力停滞
- `growth`: 能力增长
- `pattern`: 经验模式识别
- `warning`: 需要关注的警告

### 3.3 Recommendation（建议）

```typescript
interface Recommendation {
  icon: string;
  title: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  relatedCapability?: string;
}
```

---

## 4. 规则引擎设计

### 4.1 核心接口

```typescript
export function analyze(
  experiences: Experience[],
  capabilities: Capability[],
  principles: Principle[],
  projects: Project[],
  links: ExperienceCapabilityLink[],
): CoachDiagnosis;
```

纯函数，无副作用。

### 4.2 规则分类

#### 规则 1：能力停滞检测（Stale Capability）

**触发条件**: 某个能力的最近经历发生时间 > N 天

| 阈值    | 严重程度  | 诊断文案                             |
| ------- | --------- | ------------------------------------ |
| > 60 天 | important | 「你的 {能力名} 已 {天数} 天未更新」 |
| > 30 天 | notice    | 「你的 {能力名} 已超过一个月未更新」 |
| > 14 天 | info      | 「你的 {能力名} 两周没有新经历了」   |

**实现逻辑**:

1. 对每个能力，找到关联的最近经历的 `occurredAt`
2. 计算与当前时间的天数差
3. 如果 > 14 天，生成对应严重程度的洞察

#### 规则 2：能力增长检测（Growth Detection）

**触发条件**: 能力在 30 天内有明显增长

| 变化值  | 严重程度 | 诊断文案                                           |
| ------- | -------- | -------------------------------------------------- |
| > 15 分 | notice   | 「你的 {能力名} 本月增长 {变化值} 分，势头很好！」 |
| > 5 分  | info     | 「你的 {能力名} 本月增长 {变化值} 分，继续保持」   |

**实现逻辑**:

1. 计算每个能力的当前水平
2. 计算 30 天前的水平（过滤掉 30 天前的经历后重新计算）
3. 差值 > 5 时生成洞察

#### 规则 3：经验模式识别（Pattern Recognition）

**触发条件**: 最近 30 天内的经历分布呈现明显模式

| 模式                    | 诊断文案                                         |
| ----------------------- | ------------------------------------------------ |
| 80%+ 经历集中在一个能力 | 「本月你 {比例}% 经历都贡献给了 {能力名}」       |
| 同时活跃项目 > 3 个     | 「你有 {数量} 个项目在进行中，注意合理分配精力」 |
| 有原则但 usageCount = 0 | 「你有 {数量} 条原则从未在实践中使用」           |

#### 规则 4：建议生成（Recommendation Generation）

**优先级排序**:

| 优先级 | 触发条件               | 建议文案                                               |
| ------ | ---------------------- | ------------------------------------------------------ |
| HIGH   | 能力停滞 > 60 天       | 「记录「{能力名}」相关经历，该能力已 {天数} 天未更新」 |
| HIGH   | 项目活跃 > 30 天未复盘 | 「复盘「{项目名}」项目，已活跃 {天数} 天」             |
| MEDIUM | 能力增长最快           | 「继续保持「{能力名}」的增长势头」                     |
| MEDIUM | 新项目无经历           | 「开始记录「{项目名}」的相关经历」                     |
| LOW    | 有原则未实践           | 「尝试运用「{原则内容}」」                             |
| LOW    | 默认                   | 「记录新经历，开始你的成长之旅」                       |

### 4.3 Summary 生成逻辑

从最重要的洞察生成一句话总结：

```
优先级：
1. 如果有 important 级别的停滞能力 → 「你的 {能力名} 已 {天数} 天未更新，是时候补充新经历了」
2. 如果有 notice 级别的增长 → 「你的 {能力名} 本月增长 {变化值} 分，继续保持这个势头」
3. 如果有 pattern 洞察 → 「本月你的经历主要围绕 {能力名} 展开」
4. 无数据 → 「记录第一条经历，开始你的成长之旅」
```

### 4.4 规则执行流程

```
analyze() {
  1. 运行所有诊断规则 → 生成 insights[]
  2. insights 按 severity 排序（important > notice > info）
  3. 基于 insights 生成 recommendations[]
  4. recommendations 按 priority 排序（high > medium > low）
  5. 从 top insight 生成 summary
  6. 返回 CoachDiagnosis
}
```

---

## 5. 缓存策略

### 5.1 coachSlice 状态

```typescript
interface CoachState {
  diagnosis: CoachDiagnosis | null;
  lastGeneratedAt: string | null;
}
```

### 5.2 缓存过期策略

- **缓存有效期**: 30 分钟
- **触发重新计算的条件**:
  - 缓存不存在
  - 缓存超过 30 分钟
  - 用户新增/删除/修改了经历、能力、原则、项目（通过 Redux action 监听）

### 5.3 监听 action

```typescript
extraReducers: (builder) => {
  // 数据变化时清除缓存
  builder.addMatcher(
    (action) =>
      action.type.startsWith('experiences/') ||
      action.type.startsWith('capabilities/') ||
      action.type.startsWith('principles/') ||
      action.type.startsWith('projects/'),
    (state) => {
      state.diagnosis = null;
      state.lastGeneratedAt = null;
    },
  );
};
```

---

## 6. 组件设计

### 6.1 CoachDiagnosisCard

**位置**: 首页顶部（Greeting 下方，雷达图上方）

**布局**:

```
┌─────────────────────────────────────────────────┐
│ 🧠 成长诊断                                      │
├─────────────────────────────────────────────────┤
│ [大字体] 你的系统设计能力本月增长 13 分！           │
│                                                  │
│ ──────────────────────────────────────────────  │
│ ⚠️  你的战略思维已 62 天未更新                     │
│ 📈 你的沟通能力本月增长 8 分                       │
│ 🔍 本月你 75% 经历都贡献给了系统设计能力            │
└─────────────────────────────────────────────────┘
```

**无数据状态**:

```
┌─────────────────────────────────────────────────┐
│ 🧠 成长诊断                                      │
├─────────────────────────────────────────────────┤
│ 记录第一条经历后，成长教练会为你生成诊断。          │
└─────────────────────────────────────────────────┘
```

### 6.2 CoachRecommendations

**位置**: 替代现有 `Recommendations` 组件

**布局**:

```
┌─────────────────────────────────────────────────┐
│ 🎯 推荐下一步                                     │
├─────────────────────────────────────────────────┤
│ 🔴 HIGH                                         │
│ 📝 记录「战略思维」相关经历                        │
│    该能力已 62 天未更新                            │
├─────────────────────────────────────────────────┤
│ 🟡 MEDIUM                                       │
│ 🎯 复盘「个人博客」项目                            │
│    项目已活跃 30 天尚未复盘                        │
├─────────────────────────────────────────────────┤
│ 🟢 LOW                                          │
│ 💎 尝试运用「提前锁定需求范围」                    │
│    这条原则已 14 天未使用                          │
└─────────────────────────────────────────────────┘
```

**最多显示 5 条**，按优先级分组。

---

## 7. 国际化

所有诊断文案和建议文案使用 `i18next` 翻译 key：

```typescript
// 示例
t('coach.insight.stale', '你的 {{name}} 已 {{days}} 天未更新', { name, days });
t('coach.recommend.record', '记录「{{name}}」相关经历', { name });
```

新增翻译 key 到 `zh-CN.json` 和 `en-US.json` 的 `coach` section。

---

## 8. V2 预留接口

### 8.1 Engine 接口抽象

```typescript
export interface CoachEngine {
  analyze(
    experiences: Experience[],
    capabilities: Capability[],
    principles: Principle[],
    projects: Project[],
    links: ExperienceCapabilityLink[],
  ): CoachDiagnosis | Promise<CoachDiagnosis>;
}
```

当前实现 `RuleBasedCoachEngine`，V2 可新增 `LLMBasedCoachEngine`，通过配置切换。

### 8.2 V2 升级路径

- `coachRules.ts` 中的规则定义保持不变，作为 LLM prompt 的参考
- `coachEngine.ts` 替换为 LLM API 调用
- 组件和缓存逻辑不需要修改

---

## 9. 测试策略

### 9.1 单元测试

| 测试目标                | 覆盖内容                        |
| ----------------------- | ------------------------------- |
| `coachRules.ts`         | 每条规则的触发条件和输出        |
| `coachEngine.analyze()` | 输入输出边界情况、多规则组合    |
| `coachSlice`            | 缓存过期、action 监听、状态更新 |
| `coachSelectors`        | 从 Redux 状态正确提取数据       |

### 9.2 集成测试

- DashboardPage 集成 Coach 组件后的渲染测试
- 无数据状态、有数据状态、缓存命中/未命中状态

### 9.3 目标测试覆盖率

- 规则引擎: 90%+（纯函数，容易覆盖）
- 组件: 70%+

---

## 10. 变更清单

### 新增文件

| 文件                                                     | 说明           |
| -------------------------------------------------------- | -------------- |
| `src/features/coach/types/coachTypes.ts`                 | 类型定义       |
| `src/features/coach/engine/coachRules.ts`                | 规则定义       |
| `src/features/coach/engine/coachEngine.ts`               | 核心引擎       |
| `src/features/coach/store/coachSlice.ts`                 | Redux slice    |
| `src/features/coach/utils/coachSelectors.ts`             | Redux selector |
| `src/features/coach/components/CoachDiagnosisCard.tsx`   | 诊断卡片组件   |
| `src/features/coach/components/CoachRecommendations.tsx` | 推荐组件       |
| `src/__tests__/engine/coachEngine.test.ts`               | 引擎测试       |
| `src/__tests__/engine/coachRules.test.ts`                | 规则测试       |
| `src/__tests__/store/coachSlice.test.ts`                 | Store 测试     |
| `src/__tests__/components/CoachDiagnosisCard.test.tsx`   | 组件测试       |
| `src/__tests__/components/CoachRecommendations.test.tsx` | 组件测试       |

### 修改文件

| 文件                                             | 说明                                  |
| ------------------------------------------------ | ------------------------------------- |
| `src/app/store/index.ts`                         | 注册 coachReducer                     |
| `src/features/dashboard/pages/DashboardPage.tsx` | 集成 Coach 组件，替换 Recommendations |
| `src/shared/i18n/zh-CN.json`                     | 新增 coach 翻译 key                   |
| `src/shared/i18n/en-US.json`                     | 新增 coach 翻译 key                   |
