# 成长曲线 V1 实施计划

## 任务总览

12 个任务，按依赖顺序执行。每个任务独立可验证。

---

## 任务 1：快照生成引擎（historySnapshot.ts）

**目标**：实现快照生成的纯函数

**文件**：`src/features/growth-curve/engine/historySnapshot.ts`

**函数**：

- `shouldRecordSnapshot(oldLevel, newLevel, lastSnapshot?)` - 判断是否需要记录
- `createSnapshot(capabilityId, level, recordedAt?)` - 创建快照
- `mergeSnapshots(existing, new)` - 合并去重

**关键逻辑**：

- 新能力 → 记录
- level 不变 → 跳过
- level 变化 ≥5 → 记录
- level 变化 <5 但距离上次 >24h → 记录
- 合并时按 recordedAt 升序

**验证**：

- TypeScript 编译通过
- 函数签名清晰

---

## 任务 2：增长分析引擎（growthAnalytics.ts）

**目标**：实现增长分析纯函数

**文件**：`src/features/growth-curve/engine/growthAnalytics.ts`

**函数**：

- `getHistoryInRange(history, range, now?)` - 按时间范围筛选
- `calculateGrowthRate(history, range, now?)` - 计算增长率
- `calculateTotalChange(history)` - 计算总变化量
- `rankByGrowth(capabilities, history, range, now?)` - 排序

**关键逻辑**：

- 时间范围计算：30天/90天/1年/全部
- 增长率 = 范围内 last - first
- 排序按 growthRate 降序
- trend 字段：up/down/stable

**验证**：

- TypeScript 编译通过
- 函数签名清晰

---

## 任务 3：类型定义（growthCurveTypes.ts）

**目标**：定义视图层类型

**文件**：`src/features/growth-curve/types/growthCurveTypes.ts`

**类型**：

- `TimeRange` - '30d' | '90d' | '1y' | 'all'
- `GrowthMetric` - 排行项
- `ChartDataPoint` - 图表数据点
- `SnapshotTrigger` - 快照触发原因

---

## 任务 4：时间范围工具（timeRangeUtils.ts）

**目标**：时间范围计算工具

**文件**：`src/features/growth-curve/utils/timeRangeUtils.ts`

**函数**：

- `getCutoffDate(range, now?)` - 计算起始日期
- `getRangeLabel(range)` - 获取本地化标签
- `isValidRange(range)` - 验证

**依赖**：i18n 翻译 key 预留

---

## 任务 5：快照引擎测试（historySnapshot.test.ts）

**目标**：覆盖快照生成逻辑

**文件**：`src/__tests__/engine/historySnapshot.test.ts`

**测试用例**（~10 个）：

- 新能力（lastSnapshot 为 undefined）→ 记录
- level 不变 → 不记录
- level 变化 ≥5 → 记录
- level 变化 <5 但时间 >24h → 记录
- level 变化 <5 且时间 <24h → 不记录
- level 降低 → 记录（负增长也记录）
- createSnapshot 生成唯一 ID
- createSnapshot 默认时间
- createSnapshot 自定义时间
- mergeSnapshots 排序去重

**验证**：`npm test -- historySnapshot.test.ts` 通过

---

## 任务 6：增长分析测试（growthAnalytics.test.ts）

**目标**：覆盖增长分析逻辑

**文件**：`src/__tests__/engine/growthAnalytics.test.ts`

**测试用例**（~10 个）：

- getHistoryInRange 30 天筛选
- getHistoryInRange 90 天筛选
- getHistoryInRange 1 年筛选
- getHistoryInRange 全部（返回所有）
- getHistoryInRange 空历史
- calculateGrowthRate 2 个快照
- calculateGrowthRate 多个快照（取首末）
- calculateGrowthRate 1 个快照 → 0
- calculateGrowthRate 负增长
- rankByGrowth 排序正确
- rankByGrowth 空能力/空历史
- calculateTotalChange 上升/下降/不变/空

**验证**：`npm test -- growthAnalytics.test.ts` 通过

---

## 任务 7：capabilitySlice 集成快照

**目标**：能力创建/更新时自动记录快照

**文件**：`src/features/capabilities/store/capabilitySlice.ts`

**修改**：

- 在 `addCapability.fulfilled` extraReducer 中追加初始快照
- 在 `updateCapability.fulfilled` extraReducer 中判断并追加新快照
- 同步写入 secureStorage (`CAPABILITY_HISTORY_KEY`)

**关键逻辑**：

- updateCapability 需要返回 oldCapability（用于对比）
- 调用 `shouldRecordSnapshot` 判断
- 生成的快照追加到 state.history
- IndexedDB 同步更新

**验证**：tsc 0 errors

---

## 任务 8：Redux selector（growthCurveSelectors.ts）

**目标**：提供状态查询

**文件**：`src/features/growth-curve/utils/growthCurveSelectors.ts`

**Selectors**：

- `selectCapabilityHistory(state, capabilityId)` - 能力历史
- `selectGrowthRanking` (createSelector) - 增长排行
- `selectCapabilityHistoryInRange` (createSelector) - 时间范围筛选

**关键逻辑**：

- 使用 `EMPTY_ARRAY` 模式避免空数组引用问题
- 依赖 task 1、2 的纯函数

**验证**：tsc 0 errors

---

## 任务 9：组件实现

**目标**：实现所有 UI 组件

**文件**：

- `src/features/growth-curve/components/CapabilityGrowthChart.tsx`
- `src/features/growth-curve/components/GrowthCurveCard.tsx`
- `src/features/growth-curve/components/TopGrowthRanking.tsx`
- `src/features/growth-curve/components/TimeRangeSelector.tsx`
- `src/features/growth-curve/components/GrowthOverviewSection.tsx`

**关键实现**：

**CapabilityGrowthChart**：

- Recharts LineChart
- 空状态："还没有成长记录"
- Tooltip 显示日期 + 等级
- 按时间范围 prop 过滤

**GrowthCurveCard**：

- 能力名 + 当前等级 + 目标 + 增长率（带箭头）
- 颜色：up=green, down=red, stable=gray
- 嵌入小 sparkline

**TopGrowthRanking**：

- Top 5 列表
- 每项：排名 + 名称 + 增长率 + sparkline
- 支持时间切换
- 空状态

**TimeRangeSelector**：

- 按钮组：30天/90天/1年/全部
- 受控组件

**GrowthOverviewSection**：

- 标题："成长轨迹"
- 内嵌 TopGrowthRanking
- 时间范围 state 内部管理

**验证**：

- tsc 0 errors
- 组件可正常渲染

---

## 任务 10：组件测试

**目标**：覆盖所有 UI 组件

**文件**：

- `src/__tests__/components/CapabilityGrowthChart.test.tsx`
- `src/__tests__/components/GrowthCurveCard.test.tsx`
- `src/__tests__/components/TopGrowthRanking.test.tsx`

**测试用例**（~10 个）：

**CapabilityGrowthChart**（3 个）：

- 空状态渲染
- 单一能力展示
- 多数据点渲染

**GrowthCurveCard**（3 个）：

- 空状态
- 增长卡片（绿色箭头）
- 下降卡片（红色箭头）

**TopGrowthRanking**（4 个）：

- 空状态
- Top 5 展示
- 时间范围切换
- 排序正确

**验证**：`npm test -- components/CapabilityGrowth` 通过

---

## 任务 11：i18n 翻译 + 首页集成

**目标**：完成中英文翻译，集成到首页

**文件**：

- `src/shared/i18n/zh-CN.json` - 新增 `growthCurve` 段
- `src/shared/i18n/en-US.json` - 新增 `growthCurve` 段
- `src/features/dashboard/pages/DashboardPage.tsx` - 集成

**翻译 keys**：

- `growthCurve.title` - "成长轨迹"
- `growthCurve.topGrowth` - "增长排行"
- `growthCurve.emptyState` - "还没有成长记录，开始记录经历吧"
- `growthCurve.range.30d` - "30天"
- `growthCurve.range.90d` - "90天"
- `growthCurve.range.1y` - "1年"
- `growthCurve.range.all` - "全部"
- `growthCurve.trend.up` - "增长"
- `growthCurve.trend.down` - "下降"
- `growthCurve.trend.stable` - "持平"

**集成**：

- 在 CoachRecommendations 下方添加 `<GrowthOverviewSection defaultRange="30d" />`

**验证**：tsc 0 errors，DashboardPage 正常渲染

---

## 任务 12：集成测试 + 全量验证

**目标**：验证整个功能

**文件**：

- 新增 `src/__tests__/integration/capabilityHistory.test.ts`（或扩展现有测试）

**测试用例**（~5 个）：

- addCapability → history 长度 +1（含初始快照）
- updateCapability level 变化 → history 长度 +1
- updateCapability level 不变 → history 长度不变
- deleteCapability → history 中该能力的所有快照被删除
- selector 正确返回排序结果

**全量验证**：

- `npm run typecheck` (tsc) → 0 errors
- `npm run build` → success
- `npm test` → 500+ passed
- `npm run lint` → 0 errors

**最终检查清单**：

- [ ] 创建能力后 history 包含初始快照
- [ ] 等级变化时 history 增加新快照
- [ ] 等级不变时 history 不增加
- [ ] 时间范围切换正确筛选
- [ ] 首页成长轨迹区块显示 Top 5
- [ ] 能力卡片底部 sparkline 正常
- [ ] 删除能力时级联清理历史

---

## 任务依赖关系

```
任务 1（快照引擎）
  ↓
任务 3（类型）
  ↓
任务 4（时间工具）
  ↓
任务 5（快照测试）
任务 2（分析引擎）
  ↓
任务 6（分析测试）
  ↓
任务 7（slice 集成）
  ↓
任务 8（selector）
  ↓
任务 9（组件）
  ↓
任务 10（组件测试）
  ↓
任务 11（i18n + 集成）
  ↓
任务 12（集成测试 + 验证）
```

任务 5 和任务 6 可并行。

---

## 验证节点

| 任务 | 验证方式                                                 |
| ---- | -------------------------------------------------------- |
| 1-4  | tsc 0 errors                                             |
| 5-6  | 单元测试通过（20 个）                                    |
| 7-8  | tsc 0 errors                                             |
| 9    | tsc 0 errors，组件可渲染                                 |
| 10   | 组件测试通过（10 个）                                    |
| 11   | tsc 0 errors，DashboardPage 正常                         |
| 12   | 全部检查通过：tsc 0, build success, 500+ tests, eslint 0 |

---

## 风险与对策

| 风险                                        | 对策                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| updateCapability payload 不含 oldCapability | 修改 thunk payload 返回 { oldCapability, newCapability, capabilities } |
| 历史记录写入和 capabilities 顺序冲突        | 先更新 capabilities，再追加 history                                    |
| 时间范围边界（如跨年）                      | 使用本地日期计算 + Date.UTC 比较                                       |
| IndexedDB 写入失败                          | 静默失败，不影响 UI 渲染                                               |
| selector 返回新数组导致重渲染               | 使用 createSelector 缓存                                               |

---

## 交付物

- 5 个新组件
- 2 个引擎模块（~10 个纯函数）
- 2 个 selector
- 1 个时间工具
- 1 个类型定义
- 4 个测试文件（~40 个测试）
- 1 个 slice 集成修改
- 1 个首页集成修改
- 2 个 i18n 修改

总计：~13 个新增/修改文件
