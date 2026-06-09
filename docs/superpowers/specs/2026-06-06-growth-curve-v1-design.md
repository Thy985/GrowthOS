# 成长曲线 V1 设计文档

## 1. 背景与目标

### 1.1 核心问题

回答 PRD 核心问题：**"我比三个月前强在哪里？"**

### 1.2 现状

- `CapabilityHistory` 类型已定义在 `src/shared/types/index.ts`
- `capabilitySlice` 已有 `history` 字段和 IndexedDB 存储逻辑
- **缺失**：能力更新时未记录历史快照、无成长曲线图表、无增长分析

### 1.3 成功标准

- 能力每次等级变化自动记录快照
- 首页展示 Top 5 增长能力排行 + 整体成长概览
- 能力详情页展示完整成长曲线（30天/90天/全部）
- 新增 ~40 个测试（纯函数 + 组件 + 集成）

---

## 2. 架构设计

### 2.1 模块结构

```
src/features/growth-curve/
├── types/growthCurveTypes.ts              # 视图类型定义（TimeRange、GrowthMetric 等）
├── engine/
│   ├── historySnapshot.ts                 # 快照生成逻辑（纯函数）
│   └── growthAnalytics.ts                 # 增长分析（纯函数）
├── store/                                 # 无独立 slice，复用 capabilitySlice.history
├── utils/
│   ├── growthCurveSelectors.ts            # Redux selector
│   └── timeRangeUtils.ts                  # 时间范围工具
└── components/
    ├── CapabilityGrowthChart.tsx          # 单能力成长曲线图
    ├── GrowthCurveCard.tsx                # 增长率卡片
    ├── TopGrowthRanking.tsx               # Top 5 增长排行
    ├── TimeRangeSelector.tsx              # 时间范围选择器
    └── GrowthOverviewSection.tsx          # 首页整体成长概览区块
```

### 2.2 数据流

```
能力创建 (addCapability)
  → createInitialSnapshot → 记录 { capabilityId, level: 0, recordedAt }

能力更新 (updateCapability)
  → 对比新旧 currentLevel
  → level 变化 → shouldRecordSnapshot → createSnapshot → 写入 history
  → level 未变 → 跳过（去重）

能力删除 (deleteCapability)
  → 级联删除关联历史（已实现）
```

---

## 3. 核心模块设计

### 3.1 快照生成（historySnapshot.ts）

**纯函数，可独立测试，无副作用。**

```typescript
// 判断是否需要记录快照
function shouldRecordSnapshot(
  oldLevel: number,
  newLevel: number,
  lastSnapshot?: CapabilityHistory,
): boolean {
  // 新能力
  if (!lastSnapshot) return true;

  // level 未变
  if (oldLevel === newLevel) return false;

  // level 变化 > 5 或 超过 24 小时
  const levelChanged = Math.abs(oldLevel - newLevel) >= 5;
  const timePassed = Date.now() - new Date(lastSnapshot.recordedAt).getTime() > 24 * 60 * 60 * 1000;

  return levelChanged || timePassed;
}

// 创建快照记录
function createSnapshot(
  capabilityId: string,
  level: number,
  recordedAt?: string,
): CapabilityHistory {
  return {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    capabilityId,
    level,
    recordedAt: recordedAt || new Date().toISOString(),
  };
}
```

### 3.2 增长分析（growthAnalytics.ts）

**纯函数，可独立测试，无副作用。**

```typescript
// 按时间范围筛选历史
function getHistoryInRange(
  history: CapabilityHistory[],
  range: TimeRange,
  now?: Date,
): CapabilityHistory[] {
  const cutoff = getCutoffDate(range, now);
  return history.filter((h) => new Date(h.recordedAt) >= cutoff);
}

// 计算增长率（指定时间范围内的变化）
function calculateGrowthRate(history: CapabilityHistory[], range: TimeRange, now?: Date): number {
  const rangeHistory = getHistoryInRange(history, range, now);
  if (rangeHistory.length < 2) return 0;

  const first = rangeHistory[0].level;
  const last = rangeHistory[rangeHistory.length - 1].level;
  return last - first;
}

// 计算总变化量
function calculateTotalChange(history: CapabilityHistory[]): number {
  if (history.length < 2) return 0;
  return history[history.length - 1].level - history[0].level;
}

// 按增长排序能力
interface GrowthMetric {
  capabilityId: string;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  growthRate: number;
  trend: 'up' | 'down' | 'stable';
}

function rankByGrowth(
  capabilities: Capability[],
  history: CapabilityHistory[],
  range: TimeRange,
  now?: Date,
): GrowthMetric[] {
  return capabilities
    .map((cap) => ({
      capabilityId: cap.id,
      name: cap.name,
      category: cap.category,
      currentLevel: cap.currentLevel,
      targetLevel: cap.targetLevel,
      growthRate: calculateGrowthRate(
        history.filter((h) => h.capabilityId === cap.id),
        range,
        now,
      ),
    }))
    .map((m) => ({
      ...m,
      trend: m.growthRate > 0 ? 'up' : m.growthRate < 0 ? 'down' : 'stable',
    }))
    .sort((a, b) => b.growthRate - a.growthRate);
}
```

### 3.3 类型定义（growthCurveTypes.ts）

```typescript
export type TimeRange = '30d' | '90d' | '1y' | 'all';

export interface GrowthMetric {
  capabilityId: string;
  name: string;
  category: string;
  currentLevel: number;
  targetLevel: number;
  growthRate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ChartDataPoint {
  date: string;
  level: number;
}

export type SnapshotTrigger = 'create' | 'manual_update' | 'auto_recalculate';
```

### 3.4 Selector 设计（growthCurveSelectors.ts）

```typescript
// 获取能力历史记录
export const selectCapabilityHistory = (
  state: RootState,
  capabilityId: string,
): CapabilityHistory[] => state.capabilities.history.filter((h) => h.capabilityId === capabilityId);

// 获取排序后的增长指标
export const selectGrowthRanking = createSelector(
  [
    (state: RootState) => state.capabilities.capabilities,
    (state: RootState) => state.capabilities.history,
    (_state: RootState, range: TimeRange) => range,
  ],
  (capabilities, history, range) => {
    return rankByGrowth(capabilities, history, range);
  },
);

// 获取指定能力 + 时间范围的历史
export const selectCapabilityHistoryInRange = createSelector(
  [
    (state: RootState, capabilityId: string) => state.capabilities.history,
    (_state: RootState, _capabilityId: string, range: TimeRange) => range,
    (state: RootState, capabilityId: string) =>
      state.capabilities.history.filter((h) => h.capabilityId === capabilityId),
  ],
  (history, range, capHistory) => {
    return getHistoryInRange(capHistory, range);
  },
);
```

---

## 4. 组件设计

### 4.1 CapabilityGrowthChart.tsx

**单能力成长曲线图。**

- 使用 Recharts LineChart
- X 轴：日期（>30 个数据点时按周聚合）
- Y 轴：能力等级 0-100
- 工具提示：日期、等级、增长率
- 空状态："还没有成长记录"
- 支持传入 `timeRange` prop（默认 '30d'）

### 4.2 GrowthCurveCard.tsx

**增长率卡片。**

- 显示：能力名 + 当前等级 + 目标等级 + 增长率（带箭头和颜色）
- 内嵌小型折线图（sparkline，100x40px）
- 趋势颜色：up → green, down → red, stable → gray
- 点击跳转能力详情页

### 4.3 TopGrowthRanking.tsx

**Top 5 增长排行。**

- 列表展示，每项显示排名 + 能力名 + 增长率 + sparkline
- 支持时间范围切换（30天/90天/全部）
- 空状态："还没有成长记录，开始记录经历吧"

### 4.4 TimeRangeSelector.tsx

**时间范围选择器。**

- 按钮组：30天 / 90天 / 1年 / 全部
- 受控组件，value + onChange 模式

### 4.5 GrowthOverviewSection.tsx

**首页整体成长概览区块。**

位置：DashboardPage 中 CoachRecommendations 下方

内容：

- 标题："成长轨迹"
- TopGrowthRanking（Top 5）
- 快速切换时间范围

---

## 5. 集成方案

### 5.1 capabilitySlice 集成

**修改** `src/features/capabilities/store/capabilitySlice.ts`：

在 `updateCapability.fulfilled` 的 extraReducer 中：

- 对比新旧 `currentLevel`
- 调用 `shouldRecordSnapshot()` 判断是否需要记录
- 如果需要 → 生成快照并追加到 history
- 更新 Redux 状态 `state.history`

**在 `addCapability.fulfilled` 中**：

- 添加初始快照 `{ capabilityId: new.id, level: new.currentLevel, recordedAt: now }`

### 5.2 首页集成

**修改** `src/features/dashboard/pages/DashboardPage.tsx`：

在 CoachRecommendations 下方添加：

```tsx
<GrowthOverviewSection defaultRange="30d" />
```

### 5.3 能力卡片集成

**修改** `src/features/capabilities/pages/CapabilitiesPage.tsx` 的 CardView：

在每个能力卡片底部添加小型 sparkline（仅当有历史记录时）。

---

## 6. 错误处理

| 场景               | 处理策略                                     |
| ------------------ | -------------------------------------------- |
| 历史记录为空       | 显示空状态："还没有成长记录，开始记录经历吧" |
| 能力已删除         | 级联删除历史（已实现）                       |
| 时间范围无数据     | 显示 "该范围内无变化"                        |
| 旧用户迁移         | 首次更新能力时自动创建初始快照               |
| 数据异常（无日期） | 过滤掉无效快照，不影响正常数据               |

---

## 7. 测试策略

### 7.1 纯函数测试（~20 个）

- `shouldRecordSnapshot`：新能力、level 不变、level 变化 ≥5、level 变化 <5 但时间 >24h、边界值
- `createSnapshot`：基本创建、自定义时间
- `getHistoryInRange`：30天、90天、1年、全部、无数据、空历史
- `calculateGrowthRate`：2 个快照、多个快照、0 增长、负增长、1 个快照
- `calculateTotalChange`：上升、下降、不变、空
- `rankByGrowth`：排序正确、空能力、空历史

### 7.2 组件测试（~10 个）

- CapabilityGrowthChart：空状态、单能力展示、多时间范围
- GrowthCurveCard：空状态、增长卡片、下降卡片
- TopGrowthRanking：空状态、Top 5 展示、时间切换

### 7.3 集成测试（~5 个）

- addCapability → 创建初始快照
- updateCapability level 变化 → 记录新快照
- updateCapability level 不变 → 不记录
- deleteCapability → 级联删除历史
- selector 正确性

---

## 8. 验证标准

| 检查项   | 目标                                                                     |
| -------- | ------------------------------------------------------------------------ |
| tsc      | 0 errors                                                                 |
| build    | success                                                                  |
| tests    | 500+ passed（+40 新增）                                                  |
| eslint   | 0 errors                                                                 |
| 功能验证 | 创建能力显示初始快照、更新等级记录历史、重复等级不记录、时间范围切换正确 |

---

## 9. V2 预留

- 经验触发器：自动标注哪些经历导致能力跃迁
- 多能力对比：同时展示 3-5 条曲线
- 预测模型：基于历史趋势预测未来等级
- 周报/月报：自动生成成长报告
