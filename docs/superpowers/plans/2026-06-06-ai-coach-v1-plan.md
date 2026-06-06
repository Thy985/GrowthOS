# AI 成长教练 V1 — 实施计划

> 基于设计文档: `/workspace/docs/superpowers/specs/2026-06-06-ai-coach-v1-design.md`
>
> 生成日期: 2026-06-06

## 前置准备

- 所有任务按编号顺序执行（1 → 11），前一个任务的输出是后一个任务的输入
- 每个任务完成后立即运行验证步骤
- 新增的 `src/features/coach/` 目录结构遵循设计文档的约定

---

## 任务 1: 类型定义 (`coachTypes.ts`)

### 输入

- 设计文档 §3 类型定义
- 现有类型: `Experience`, `Capability`, `Principle`, `Project`, `ExperienceCapabilityLink` from `src/shared/types/index.ts`

### 输出

**新文件**: `src/features/coach/types/coachTypes.ts`

内容包含:

```typescript
export interface Insight {
  type: 'stale' | 'growth' | 'pattern' | 'warning';
  icon: string;
  title: string;
  description: string;
  severity: 'info' | 'notice' | 'important';
}

export interface Recommendation {
  icon: string;
  title: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  relatedCapability?: string;
}

export interface CoachDiagnosis {
  summary: string;
  insights: Insight[];
  recommendations: Recommendation[];
  generatedAt: string;
}

export interface CoachState {
  diagnosis: CoachDiagnosis | null;
  lastGeneratedAt: string | null;
}
```

### 验证

- `npx tsc --noEmit` — 编译无错误
- 确认类型与现有 Redux 模式兼容（`CoachState` 可用作 slice 的 state 类型）

---

## 任务 2: 规则定义 (`coachRules.ts`)

### 输入

- 任务 1 输出的类型
- 设计文档 §4.2 规则分类（4 类规则）
- 设计文档 §4.3 Summary 生成逻辑
- 现有类型: `Experience`, `Capability`, `Principle`, `Project`, `ExperienceCapabilityLink`

### 输出

**新文件**: `src/features/coach/engine/coachRules.ts`

纯函数模块，导出以下函数:

```typescript
// 规则 1: 能力停滞检测
export function detectStaleCapabilities(
  capabilities: Capability[],
  experiences: Experience[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Insight[];

// 规则 2: 能力增长检测
export function detectGrowthCapabilities(
  capabilities: Capability[],
  experiences: Experience[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Insight[];

// 规则 3: 经验模式识别
export function detectPatterns(
  experiences: Experience[],
  capabilities: Capability[],
  principles: Principle[],
  projects: Project[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Insight[];

// 规则 4: 建议生成
export function generateRecommendations(
  insights: Insight[],
  capabilities: Capability[],
  projects: Project[],
  principles: Principle[],
  experiences: Experience[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): Recommendation[];

// Summary 生成
export function generateSummary(insights: Insight[]): string;

// 排序工具
export const SEVERITY_ORDER: Record<string, number>;
export const PRIORITY_ORDER: Record<string, number>;
```

关键逻辑:

- `detectStaleCapabilities`: 遍历能力 → 查关联经历的最近 `occurredAt` → 与 `now` 比天数 → >14天生成 `info`, >30天 `notice`, >60天 `important`
- `detectGrowthCapabilities`: 计算当前能力水平 — 30天前的能力水平 → 差值 >5 `info`, >15 `notice`
- `detectPatterns`: 检查 80%+ 经历集中、活跃项目 >3 个、原则 usageCount=0
- `generateRecommendations`: 根据 insights + 原始数据生成 high/medium/low 优先级建议
- `generateSummary`: 按 important > notice > pattern > 默认 优先级从 top insight 生成一句话

所有函数接受 `now?: Date` 参数用于测试时注入时间。

### 验证

- `npx tsc --noEmit` — 编译无错误
- 暂不写测试（任务 10 统一处理引擎/规则测试）

---

## 任务 3: 核心引擎 (`coachEngine.ts`)

### 输入

- 任务 1 输出的类型
- 任务 2 输出的规则函数
- 设计文档 §4.1 核心接口和 §4.4 执行流程

### 输出

**新文件**: `src/features/coach/engine/coachEngine.ts`

```typescript
import type { CoachDiagnosis, Insight, Recommendation } from '../types/coachTypes';
import type {
  Experience,
  Capability,
  Principle,
  Project,
  ExperienceCapabilityLink,
} from '../../../shared/types';
import {
  detectStaleCapabilities,
  detectGrowthCapabilities,
  detectPatterns,
  generateRecommendations,
  generateSummary,
} from './coachRules';

export function analyze(
  experiences: Experience[],
  capabilities: Capability[],
  principles: Principle[],
  projects: Project[],
  links: ExperienceCapabilityLink[],
  now?: Date,
): CoachDiagnosis;
```

执行流程:

1. 运行规则 1 → 收集 stale insights
2. 运行规则 2 → 收集 growth insights
3. 运行规则 3 → 收集 pattern insights
4. 合并所有 insights 并按 severity 排序 (important > notice > info)
5. 基于 insights 生成 recommendations
6. recommendations 按 priority 排序 (high > medium > low)
7. 从 top insight 生成 summary
8. 返回 `{ summary, insights, recommendations, generatedAt: (now || new Date()).toISOString() }`

同时导出 `CoachEngine` interface (V2 预留):

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

### 验证

- `npx tsc --noEmit` — 编译无错误

---

## 任务 4: Redux Slice (`coachSlice.ts`)

### 输入

- 任务 1 输出的 `CoachState` 类型
- 任务 3 输出的 `analyze()` 函数
- 现有 Redux 模式参考: `src/features/capabilities/store/capabilitySlice.ts`
- 现有 store 注册: `src/app/store/index.ts`
- 现有 action 前缀: `experiences/`, `capabilities/`, `principles/`, `projects/`
- 设计文档 §5 缓存策略

### 输出

**新文件**: `src/features/coach/store/coachSlice.ts`

```typescript
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CoachState, CoachDiagnosis } from '../types/coachTypes';
import { analyze } from '../engine/coachEngine';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 分钟

const initialState: CoachState = {
  diagnosis: null,
  lastGeneratedAt: null,
};

export const coachSlice = createSlice({
  name: 'coach',
  initialState,
  reducers: {
    setDiagnosis(state, action: PayloadAction<CoachDiagnosis>) { ... },
    clearDiagnosis(state) { ... },
    invalidateCache(state) { ... },
  },
  extraReducers: (builder) => {
    // 监听数据变化自动清除缓存
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
  },
});

export const { setDiagnosis, clearDiagnosis, invalidateCache } = coachSlice.actions;
export default coachSlice.reducer;
```

**修改文件**: `src/app/store/index.ts`

- import `coachReducer`
- 在 `configureStore` reducer 对象中添加 `coach: coachReducer`

### 验证

- `npx tsc --noEmit` — 编译无错误
- 确认 store 注册后应用能正常构建: `npx vite build --mode development`

---

## 任务 5: Redux Selectors (`coachSelectors.ts`)

### 输入

- 任务 4 输出的 coach slice
- 现有 Redux RootState 类型: `src/app/store/index.ts`

### 输出

**新文件**: `src/features/coach/utils/coachSelectors.ts`

```typescript
import type { RootState } from '../../../app/store';
import type { CoachDiagnosis } from '../types/coachTypes';

export const selectCoachDiagnosis = (state: RootState): CoachDiagnosis | null =>
  state.coach.diagnosis;

export const selectIsCoachCacheValid = (state: RootState): boolean => {
  const { diagnosis, lastGeneratedAt } = state.coach;
  if (!diagnosis || !lastGeneratedAt) return false;
  const age = Date.now() - new Date(lastGeneratedAt).getTime();
  return age < 30 * 60 * 1000; // 30 分钟
};

export const selectCoachInsights = (state: RootState) => state.coach.diagnosis?.insights ?? [];

export const selectCoachRecommendations = (state: RootState) =>
  state.coach.diagnosis?.recommendations ?? [];
```

### 验证

- `npx tsc --noEmit` — 编译无错误

---

## 任务 6: CoachDiagnosisCard 组件

### 输入

- 任务 5 输出的 selectors
- 设计文档 §6.1 组件布局
- 现有项目组件模式: `React.memo`、`useTranslation`、Tailwind CSS
- DashboardPage 布局参考: `src/features/dashboard/pages/DashboardPage.tsx`

### 输出

**新文件**: `src/features/coach/components/CoachDiagnosisCard.tsx`

组件行为:

1. 从 Redux 读取 `experiences`, `capabilities`, `principles`, `projects`, `links`
2. 调用 `analyze()` 获取诊断结果
3. 显示 `summary` (大字体)
4. 显示 `insights` 列表 (按 severity 排列)
5. 无数据时显示空状态: "记录第一条经历后，成长教练会为你生成诊断。"

Props: 无（组件自行从 Redux 读取所需数据）

使用 `React.memo` 包裹。

布局:

```
┌─────────────────────────────────────────────────┐
│ 🧠 成长诊断                                      │
├─────────────────────────────────────────────────┤
│ [大字体] summary                                  │
│                                                  │
│ ──────────────────────────────────────────────  │
│ [icon] insight.title                             │
│ [icon] insight.title                             │
└─────────────────────────────────────────────────┘
```

### 验证

- `npx tsc --noEmit` — 编译无错误
- 暂不写测试（任务 11 统一处理组件测试）

---

## 任务 7: CoachRecommendations 组件

### 输入

- 任务 5 输出的 selectors
- 设计文档 §6.2 组件布局
- 现有 Recommendations 组件 (`DashboardPage.tsx` 中的 `Recommendations`)

### 输出

**新文件**: `src/features/coach/components/CoachRecommendations.tsx`

组件行为:

1. 从 Redux 读取数据，调用 `analyze()` 获取建议
2. 最多显示 5 条建议
3. 按 priority 分组 (HIGH/MEDIUM/LOW)
4. 无数据时显示空状态

Props: 无（组件自行从 Redux 读取所需数据）

使用 `React.memo` 包裹。

### 验证

- `npx tsc --noEmit` — 编译无错误
- 暂不写测试（任务 11 统一处理组件测试）

---

## 任务 8: 集成到 DashboardPage

### 输入

- 任务 6 输出的 `CoachDiagnosisCard` 组件
- 任务 7 输出的 `CoachRecommendations` 组件
- 当前 `DashboardPage.tsx` 内容
- 设计文档 §2.3 与现有组件的关系

### 修改文件

**文件**: `src/features/dashboard/pages/DashboardPage.tsx`

变更:

1. import `CoachDiagnosisCard` from `../../coach/components/CoachDiagnosisCard`
2. import `CoachRecommendations` from `../../coach/components/CoachRecommendations`
3. 在 Greeting section 之后、RadarChartSection 之前插入 `<CoachDiagnosisCard />`
4. 将底部的 `<Recommendations ... />` 替换为 `<CoachRecommendations />`（移除旧的 Recommendations 组件定义及其 props 传递）
5. 移除不再使用的 Recommendations 组件定义（约 70 行代码）

保持不变的组件:

- `InsightCards` (保留)
- `RadarChartSection` (不变)
- `QuickRecordForm` (不变)
- `PrinciplesSection` (不变)

### 验证

- `npx tsc --noEmit` — 编译无错误
- `npx vite build --mode development` — 构建成功

---

## 任务 9: 国际化 (i18n)

### 输入

- 所有规则中需要翻译的文案 key
- 设计文档 §7 国际化约定
- 现有 i18n 文件: `src/shared/i18n/zh-CN.json`, `src/shared/i18n/en-US.json`

### 修改文件

**文件 1**: `src/shared/i18n/zh-CN.json`
**文件 2**: `src/shared/i18n/en-US.json`

在两个文件中新增 `coach` section:

```json
"coach": {
  "title": "成长诊断",
  "emptyMessage": "记录第一条经历后，成长教练会为你生成诊断。",
  "recommendationsTitle": "推荐下一步",
  "emptyRecommendations": "暂无推荐建议",
  "priorityHigh": "高优先级",
  "priorityMedium": "中优先级",
  "priorityLow": "低优先级",
  "insight": {
    "stale": "你的 {{name}} 已 {{days}} 天未更新",
    "staleShort": "你的 {{name}} 已超过一个月未更新",
    "staleMild": "你的 {{name}} 两周没有新经历了",
    "growth": "你的 {{name}} 本月增长 {{change}} 分，势头很好！",
    "growthMild": "你的 {{name}} 本月增长 {{change}} 分，继续保持",
    "patternConcentrated": "本月你 {{percent}}% 经历都贡献给了 {{name}}",
    "patternManyProjects": "你有 {{count}} 个项目在进行中，注意合理分配精力",
    "patternUnusedPrinciples": "你有 {{count}} 条原则从未在实践中使用"
  },
  "recommend": {
    "record": "记录「{{name}}」相关经历",
    "recordAction": "该能力已 {{days}} 天未更新",
    "retrospect": "复盘「{{name}}」项目",
    "retrospectAction": "已活跃 {{days}} 天",
    "continueGrowth": "继续保持「{{name}}」的增长势头",
    "startProject": "开始记录「{{name}}」的相关经历",
    "applyPrinciple": "尝试运用「{{content}}」",
    "default": "记录新经历，开始你的成长之旅"
  },
  "summary": {
    "stale": "你的 {{name}} 已 {{days}} 天未更新，是时候补充新经历了",
    "growth": "你的 {{name}} 本月增长 {{change}} 分，继续保持这个势头",
    "pattern": "本月你的经历主要围绕 {{name}} 展开",
    "default": "记录第一条经历，开始你的成长之旅"
  }
}
```

同时在规则函数和组件中，将硬编码中文替换为 `t()` 调用。

### 验证

- `npx tsc --noEmit` — 编译无错误
- 检查 JSON 格式: `npx prettier --check src/shared/i18n/*.json`

---

## 任务 10: 规则引擎和 Slice 测试

### 输入

- 任务 2 输出的 `coachRules.ts`
- 任务 3 输出的 `coachEngine.ts`
- 任务 4 输出的 `coachSlice.ts`
- 任务 5 输出的 `coachSelectors.ts`
- 现有测试模式: `src/__tests__/store/capabilitySlice.test.ts`
- 测试 setup: `src/__tests__/setup.ts`

### 输出

**新文件**: `src/__tests__/engine/coachEngine.test.ts`

- 测试 `analyze()` 的输入输出
- 测试边界情况: 空数据、只有经历、只有能力、全量数据
- 测试多规则组合
- 测试缓存时间戳

**新文件**: `src/__tests__/engine/coachRules.test.ts`

- 规则 1: 测试 >14天、>30天、>60天 阈值触发
- 规则 2: 测试增长 >5、>15 阈值触发
- 规则 3: 测试 80%+ 集中、>3 活跃项目、原则未使用
- 规则 4: 测试各优先级建议生成
- 测试 `generateSummary()` 各分支

**新文件**: `src/__tests__/store/coachSlice.test.ts`

- 测试初始状态
- 测试 `setDiagnosis` / `clearDiagnosis` / `invalidateCache` action
- 测试 `extraReducers` matcher 监听数据变化自动清除缓存

### 验证

- `npx vitest run src/__tests__/engine/` — 引擎/规则测试通过
- `npx vitest run src/__tests__/store/coachSlice.test.ts` — slice 测试通过
- 目标覆盖率: 规则引擎 90%+

### 测试数据说明

使用 `now` 参数注入固定时间，避免测试依赖系统时钟。构造以下测试 fixtures:

- 能力列表 (含最近/很久未更新的能力)
- 经历列表 (含不同 `occurredAt` 时间戳)
- 经历-能力关联
- 原则列表 (含 usageCount=0 的)
- 项目列表 (含多个 active 状态的)

---

## 任务 11: 组件测试

### 输入

- 任务 6 输出的 `CoachDiagnosisCard.tsx`
- 任务 7 输出的 `CoachRecommendations.tsx`
- 现有组件测试模式: `src/__tests__/components/Button.test.tsx`
- 测试库: `@testing-library/react` + Vitest

### 输出

**新文件**: `src/__tests__/components/CoachDiagnosisCard.test.tsx`

- 测试无数据空状态渲染
- 测试有数据时 summary + insights 渲染
- 测试使用 `React.memo`

**新文件**: `src/__tests__/components/CoachRecommendations.test.tsx`

- 测试无数据空状态渲染
- 测试有数据时建议列表渲染
- 测试最多显示 5 条
- 测试优先级分组显示

### 验证

- `npx vitest run src/__tests__/components/CoachDiagnosisCard.test.tsx` — 通过
- `npx vitest run src/__tests__/components/CoachRecommendations.test.tsx` — 通过
- 目标覆盖率: 组件 70%+

---

## 任务 12: 集成测试和全量验证

### 输入

- 所有上述任务的输出
- 现有集成测试: `src/__tests__/pages/DashboardPage.test.tsx`

### 修改文件

**文件**: `src/__tests__/pages/DashboardPage.test.tsx`

- 更新测试以适配新的 Coach 组件集成
- 测试 CoachDiagnosisCard 在 DashboardPage 中的渲染
- 测试 CoachRecommendations 替换原有 Recommendations

### 全量验证命令 (按顺序执行)

1. `npx tsc --noEmit` — TypeScript 类型检查通过
2. `npx vitest run` — 所有测试通过
3. `npx vite build --mode development` — 构建成功
4. `npx eslint .` — 无 lint 错误

---

## 文件变更清单

### 新增文件 (11 个)

| #   | 文件路径                                                 | 对应任务 |
| --- | -------------------------------------------------------- | -------- |
| 1   | `src/features/coach/types/coachTypes.ts`                 | 1        |
| 2   | `src/features/coach/engine/coachRules.ts`                | 2        |
| 3   | `src/features/coach/engine/coachEngine.ts`               | 3        |
| 4   | `src/features/coach/store/coachSlice.ts`                 | 4        |
| 5   | `src/features/coach/utils/coachSelectors.ts`             | 5        |
| 6   | `src/features/coach/components/CoachDiagnosisCard.tsx`   | 6        |
| 7   | `src/features/coach/components/CoachRecommendations.tsx` | 7        |
| 8   | `src/__tests__/engine/coachEngine.test.ts`               | 10       |
| 9   | `src/__tests__/engine/coachRules.test.ts`                | 10       |
| 10  | `src/__tests__/store/coachSlice.test.ts`                 | 10       |
| 11  | `src/__tests__/components/CoachDiagnosisCard.test.tsx`   | 11       |
| 12  | `src/__tests__/components/CoachRecommendations.test.tsx` | 11       |

### 修改文件 (4 个)

| #   | 文件路径                                         | 变更内容                              | 对应任务 |
| --- | ------------------------------------------------ | ------------------------------------- | -------- |
| 1   | `src/app/store/index.ts`                         | 注册 coachReducer                     | 4        |
| 2   | `src/features/dashboard/pages/DashboardPage.tsx` | 集成 Coach 组件，替换 Recommendations | 8        |
| 3   | `src/shared/i18n/zh-CN.json`                     | 新增 coach 翻译 key                   | 9        |
| 4   | `src/shared/i18n/en-US.json`                     | 新增 coach 翻译 key                   | 9        |
| 5   | `src/__tests__/pages/DashboardPage.test.tsx`     | 更新集成测试                          | 12       |

---

## 任务依赖图

```
任务 1 (types)
  └─→ 任务 2 (rules)
        └─→ 任务 3 (engine)
              └─→ 任务 4 (slice)
                    └─→ 任务 5 (selectors)
                          └─→ 任务 6 (DiagnosisCard) ─┐
                          └─→ 任务 7 (Recommendations)┘
                                                        └─→ 任务 8 (DashboardPage 集成)
  └─→ 任务 9 (i18n) ─── 与任务 2-7 并行，在它们完成后统一修改

任务 1-9 全部完成后:
  └─→ 任务 10 (引擎/slice 测试)
  └─→ 任务 11 (组件测试)
        └─→ 任务 12 (集成测试 + 全量验证)
```

## 执行顺序总结

| 步骤 | 任务                | 预计复杂度 | 关键依赖          |
| ---- | ------------------- | ---------- | ----------------- |
| 1    | 类型定义            | 低         | 无                |
| 2    | 规则定义            | 中         | 类型定义          |
| 3    | 核心引擎            | 低         | 规则定义          |
| 4    | Redux Slice         | 中         | 类型、引擎        |
| 5    | Selectors           | 低         | Slice             |
| 6    | DiagnosisCard       | 中         | Selectors + i18n  |
| 7    | Recommendations     | 中         | Selectors + i18n  |
| 8    | DashboardPage 集成  | 低         | 组件 6、7         |
| 9    | i18n 翻译           | 中         | 规则/组件文案确定 |
| 10   | 引擎/slice 测试     | 高         | 规则、引擎、Slice |
| 11   | 组件测试            | 高         | 组件 6、7         |
| 12   | 集成测试 + 全量验证 | 中         | 所有前述任务      |
