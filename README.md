# GrowthOS - 个人经验管理系统

> **AI 时代知识越来越便宜，经验越来越值钱。**

## 项目简介

GrowthOS 不是另一个笔记软件、Todo 工具或"AI 聊天机器人"。

它是一个**个人经验管理系统（Personal Experience Management System）**，通过把日常**经历**提炼为**经验**、把**经验**沉淀为**能力**、把**能力**汇聚为**人生操作系统**，最终帮助用户回答一个核心问题：

> **"你正在成为谁？"**

### 核心闭环

```
经历 (Experience)   →   反思 (Reflection)   →   抽象 (Abstraction)
   ↓                                              ↓
   事实                                       原则
                                              ↓
迁移到新场景 (Transfer)   ←   形成经验 (Principle)
   ↓
能力提升 (Capability Growth)
   ↓
（回到新的经历）
```

### 核心实体

| 实体                  | 含义                                   |
| --------------------- | -------------------------------------- |
| **经历 (Experience)** | 真实发生过的事件 + 反思 + 抽象出的原则 |
| **能力 (Capability)** | 可迁移、可测量、可成长的核心能力       |
| **项目 (Project)**    | 当前在做的事，是能力成长的载体         |
| **原则 (Principle)**  | 从经历中提炼的可复用经验               |
| **AI 成长教练**       | 分析、诊断、建议、复盘                 |

---

## 与传统工具的差异

| 维度           | 传统笔记软件 | GrowthOS                  |
| -------------- | ------------ | ------------------------- |
| **目标**       | 记录事实     | 把经历变成能力            |
| **首页**       | 今日待办     | 你正在成为谁              |
| **数据模型**   | 记录 + 标签  | 经历 + 能力 + 原则 + 项目 |
| **核心可视化** | 标签云       | 能力雷达图 + 成长曲线     |
| **AI 角色**    | 聊天对象     | 成长教练                  |
| **衡量价值**   | 记录数量     | 提炼的原则数、能力成长    |

---

## 核心功能

### 🌱 成长画像 (Growth Portrait)

- **能力雷达图** — 当前能力 vs 目标能力
- **成长曲线** — 能力随时间的变化
- **核心原则** — 你提炼的最重要的 10 条经验
- **AI 洞察** — 主动诊断、建议、复盘

### 📝 经历记录 (Experience Capture)

- **结构化模板** — 事件 / 反思 / 原则 / 自信度
- **三步引导** — 渐进式填写，降低门槛
- **能力关联** — 每次经历贡献到哪些能力
- **项目绑定** — 经历属于哪个项目

### 🌳 能力树 (Capability Tree)

- **5 大类别** — 思维 / 技能 / 认知 / 体能 / 社交
- **双向操作** — 从能力看经历 / 从经历看能力
- **成长曲线** — 每个能力的长期变化
- **目标设定** — 设定能力目标水平

### 💎 经验库 (Principle Library)

- **原则沉淀** — 从经历中提炼可复用经验
- **迁移路径** — 看原则在不同场景的应用
- **置信度** — 标记对原则的把握程度
- **使用统计** — 哪些原则被反复验证

### 📁 项目复盘 (Project Retrospective)

- **能力成长** — 项目开始 vs 结束的能力变化
- **做得好 / 不好** — 结构化复盘
- **下次怎么做** — 行动项跟踪
- **经验汇总** — 项目相关的原则集合

### 🤖 AI 成长教练 (V2)

- **分析** — 识别用户行为背后的能力变化
- **诊断** — "你的 X 能力已 60 天未更新"
- **建议** — "下一步该做 X"
- **复盘** — 每周/每月自动生成成长报告

---

## 技术栈

### 前端

- **React 18** + **TypeScript** + **Vite 5**
- **Redux Toolkit** 状态管理
- **ReactFlow** 能力树可视化
- **Recharts** 成长曲线图表
- **Tailwind CSS** 样式
- **i18next** 国际化

### 数据存储

- **V1 (现在)**: IndexedDB (dexie.js)
- **V2 (1-2月)**: SQLite WASM (wa-sqlite)
- **V3 (打包 App)**: 原生 SQLite (Capacitor + SQLCipher)

### 隐私与安全

- **本地优先** — 所有数据默认存储在用户设备
- **SHA-256 密码哈希** + 盐
- **AES-GCM 数据加密**
- **可选云端备份**（端到端加密）
- **完全离线可用**

---

## 项目结构

```
/src
  /app                 # 应用入口、路由、Store
  /features            # 功能模块
    /auth              # 用户认证
    /dashboard         # 成长画像首页
    /experiences       # 经历记录（待实现）
    /capabilities      # 能力管理（待实现）
    /principles        # 经验库（待实现）
    /projects          # 项目复盘（待实现）
    /growth-tree       # 成长树（兼容旧版）
    /records           # 记录（兼容旧版）
    /goals             # 目标（兼容旧版）
    /reminders         # 提醒（兼容旧版）
    /analytics         # 数据分析
    /theme             # 主题系统
  /shared              # 共享代码
    /components        # 通用组件
    /i18n              # 国际化
    /types             # 类型定义
    /utils             # 工具函数
    /hooks             # 自定义钩子
  /store               # Redux 状态管理
  /__tests__           # 测试文件
```

---

## 安装和使用

### 前提条件

- Node.js 16.0 或更高版本
- npm 或 yarn

### 安装步骤

1. 克隆项目

   ```bash
   git clone https://github.com/yourusername/growthos.git
   cd growthos
   ```

2. 安装依赖

   ```bash
   npm install
   ```

3. 配置环境变量

   ```bash
   # 创建 .env 文件
   VITE_ENCRYPTION_KEY=your-encryption-key
   VITE_APP_NAME=GrowthOS
   VITE_APP_VERSION=2.0.0
   ```

4. 启动开发服务器

   ```bash
   npm run dev
   ```

5. 构建生产版本

   ```bash
   npm run build
   ```

6. 运行测试
   ```bash
   npm test
   ```

---

## 路线图

### ✅ V1（当前 - 4 周）：能力驱动的 MVP

- [x] 基础架构（React + Redux + Vite）
- [x] 用户认证（注册/登录/密码加密）
- [x] 移动端体验（底部导航 / Safe Area）
- [ ] 数据模型重构：experiences / capabilities / principles
- [ ] 能力树 CRUD
- [ ] 经历记录（结构化模板）
- [ ] 基础首页：能力雷达图
- [ ] 数据导出：JSON / CSV

### 📅 V2（1-2 月）：成长画像

- [ ] 成长曲线（能力随时间变化）
- [ ] 经验网络可视化
- [ ] 项目复盘
- [ ] 简单规则引擎报告
- [ ] SQLite WASM 升级

### 📅 V3（3-4 月）：AI 教练

- [ ] LLM 集成（可选）
- [ ] AI 主动诊断
- [ ] 经验迁移推荐
- [ ] 周报 / 月报自动生成

### 📅 V4（5-6 月）：跨设备 + 高级 AI

- [ ] Capacitor 打包移动 App
- [ ] 原生 SQLite + SQLCipher
- [ ] 跨设备同步（可选）
- [ ] 本地 LLM（WebLLM）

---

## 相关文档

- [PRD 产品需求文档](./GrowthOS_PRD.md)
- [技术架构文档](./GrowthOS_Technical_Architecture.md)
- [UI 设计文档](./GrowthOS_UI_Design_Docs.md)

---

## 设计理念

> **大多数人在记录，很少人在成长。**

GrowthOS 的目标是让"成长"这件抽象的事变得**可记录、可追踪、可累积**。

我们不追求：

- ❌ 复杂的 Todo 系统
- ❌ 社交功能
- ❌ 知识图谱
- ❌ AI 聊天界面

我们专注于：

- ✅ 经历 → 反思 → 抽象 → 原则
- ✅ 能力雷达图 + 成长曲线
- ✅ 原则沉淀 + 迁移
- ✅ 项目复盘
- ✅ AI 成长教练

---

## 核心概念

### 经历 (Experience)

不是简单的"日记"，而是结构化的反思模板。每次记录包含：

- **事件** (event) — 客观发生了什么
- **反思** (reflection) — 我学到了什么
- **原则** (principle) — 用一句话总结
- **自信度** (confidence) — 对原则的把握

### 能力 (Capability)

可迁移、可测量、可成长的核心能力。有四要素：

- **名称** — 战略思维、写作能力等
- **类别** — 思维 / 技能 / 认知 / 体能 / 社交
- **当前水平** — 0-100
- **目标水平** — 0-100

### 项目 (Project)

当前在做的事，是能力成长的载体。每个项目结束时有结构化复盘。

### 原则 (Principle)

从经历中提炼的可复用经验。可以跨场景迁移。

---

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

---

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

---

**开始你的成长之旅 —— 看见你正在成为谁。** 🌱
