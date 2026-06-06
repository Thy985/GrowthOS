# GrowthOS V1 开发实施文档

## 0. 目标

将 GrowthOS 从"个人成长记录工具"升级为"个人经验管理系统"，V1 核心交付：

- 新数据模型（experiences / capabilities / principles / projects）
- 经历记录三步引导
- 能力树 CRUD + 能力计算
- 成长画像首页（能力雷达图）
- 数据导出（JSON/CSV）

## 1. 执行顺序

### 阶段 1：类型定义 + 数据层（基础）

```
1.1 shared/types/index.ts → 新增 Experience / Capability / Principle / Project 类型
1.2 features/experiences/store/experienceSlice.ts → slice + thunks
1.3 features/capabilities/store/capabilitySlice.ts → slice + thunks + 能力计算
1.4 features/principles/store/principleSlice.ts → slice + thunks
1.5 features/projects/store/projectSlice.ts → slice + thunks
1.6 app/store/index.ts → 注册所有新 slice
```

### 阶段 2：页面实现

```
2.1 features/dashboard/pages/DashboardPage.tsx → 重写为成长画像首页
2.2 features/experiences/pages/ExperiencesPage.tsx → 经历列表
2.3 features/experiences/pages/NewExperiencePage.tsx → 三步引导
2.4 features/capabilities/pages/CapabilitiesPage.tsx → 能力树
```

### 阶段 3：路由 + 导航

```
3.1 app/router.tsx → 注册新路由
3.2 app/App.tsx → 更新底部 Tab 栏
3.3 shared/i18n/ → 更新国际化文案
```

### 阶段 4：验证

```
4.1 TypeScript 编译
4.2 ESLint
4.3 构建
4.4 提交
```

## 2. 数据模型变更

### 2.1 新增实体

- `Experience` → experiences / reflections / principles
- `Capability` → 能力 + 能力水平 + 成长曲线
- `Principle` → 原则 + 置信度 + 使用统计
- `Project` → 项目 + 复盘

### 2.2 保留兼容

- `Record` → 保留作为原始素材
- `Tree` → 保留作为旧版成长树
- `Goal` → 保留
- `Reminder` → 保留

### 2.3 localStorage key 映射

| 实体               | localStorage key        |
| ------------------ | ----------------------- |
| Experience         | `growthos-experiences`  |
| Capability         | `growthos-capabilities` |
| Principle          | `growthos-principles`   |
| Project            | `growthos-projects`     |
| Capability History | `growthos-cap-history`  |

## 3. 实施细节

### 3.1 能力计算算法

```
level = Σ(基础贡献 × 反思加成 × 原则加成 × 自信度 × 时间衰减)
```

### 3.2 路由变更

| 旧路由     | 新路由           | 优先级 |
| ---------- | ---------------- | ------ |
| `/`        | 保留（重写内容） | P0     |
| `/records` | 保留（兼容）     | P1     |
| -          | `/experiences`   | P0     |
| -          | `/capabilities`  | P0     |
| -          | `/principles`    | P1     |
| -          | `/projects`      | P1     |

### 3.3 底部导航变更

旧：📊仪表盘 / 📝记录 / 🎯目标 / 🌳成长树 / 📈分析
新：🏠首页 / 📝经历 / 🌳能力 / 📁项目 / 👤我的
