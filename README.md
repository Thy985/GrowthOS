# GrowthOS - 个人成长追踪系统

<div align="center">

![GrowthOS Logo](https://img.shields.io/badge/GrowthOS-v1.0.0-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2-61dafb?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178c6?style=flat-square&logo=typescript)
![Capacitor](https://img.shields.io/badge/Capacitor-8.3-53b8e5?style=flat-square&logo=capacitor)

**一款专注于个人成长追踪的移动应用，帮助你记录、学习、反思与成长。**

[功能规格](./docs/SPEC.md) · [架构设计](./docs/ARCHITECTURE.md) · [开发指南](./docs/DEVELOPMENT.md) · [数据存储](./docs/DATABASE.md)

</div>

---

## 1. 项目简介

GrowthOS 是一款采用纯前端架构的个人成长追踪应用，通过可视化技能树、每日记录、目标管理和智能提醒等功能，帮助用户系统化地追踪和管理个人成长轨迹。

### 1.1 核心特性

| 特性 | 描述 |
|------|------|
| 🌳 技能成长树 | 可视化技能树，直观展示技能掌握程度 |
| 📝 每日记录 | 记录每日活动、学习内容和反思 |
| 🎯 目标管理 | 设定目标并追踪进度 |
| ⏰ 智能提醒 | 自定义提醒，不错过任何重要事项 |
| 📊 数据分析 | 统计成长数据，展示进步轨迹 |
| 🏆 成就徽章 | 完成里程碑解锁成就徽章 |
| 🌙 深色模式 | 支持深色模式，保护眼睛 |

### 1.2 技术栈

**前端框架**
- React 18.2 + TypeScript 5.3
- Vite 5.0 (构建工具)
- Redux Toolkit 2.11 (状态管理)
- React Router 6.22 (路由)
- Tailwind CSS 3.4 (样式)

**移动端**
- Capacitor 8.3 (跨平台打包)
- @capacitor-community/sqlite (本地数据库)

**可视化**
- ReactFlow 11.8 (技能树可视化)
- Recharts 2.10 (数据图表)

**国际化**
- i18next 26.0 (国际化)

---

## 2. 项目结构

```
growthos/
├── docs/                    # 项目文档
│   ├── ARCHITECTURE.md      # 架构设计文档
│   ├── DATABASE.md          # 数据存储设计文档
│   ├── DEVELOPMENT.md       # 开发指南
│   └── SPEC.md              # 功能规格文档
├── src/                     # 源代码
│   ├── common/              # 公共模块
│   │   └── services/        # 服务层 (V2)
│   ├── components/          # React 组件
│   │   ├── common/          # 通用组件
│   │   └── growth-tree/      # 技能树组件
│   ├── constants/           # 常量定义
│   ├── contexts/            # React Context
│   ├── hooks/               # 自定义 Hooks
│   ├── i18n/                # 国际化资源
│   ├── pages/               # 页面组件
│   ├── store/               # Redux Store
│   │   └── slices/          # Redux Slices
│   ├── types/               # TypeScript 类型
│   └── utils/               # 工具函数
├── android/                 # Android 原生项目
├── public/                  # 静态资源
├── capacitor.config.json    # Capacitor 配置
├── vite.config.js           # Vite 配置
└── package.json             # 项目依赖
```

---

## 3. 快速开始

### 3.1 环境要求

- Node.js >= 18.0
- npm >= 9.0
- Android Studio (Android 构建)
- Xcode (iOS 构建，仅 macOS)

### 3.2 安装依赖

```bash
npm install
```

### 3.3 开发模式

```bash
# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

### 3.4 构建生产版本

```bash
# 构建 Web 应用
npm run build

# 同步到 Android
npx cap sync android

# 使用 Android Studio 打开 android/ 目录构建 APK
```

---

## 4. 功能模块

### 4.1 认证模块

- 用户注册（邮箱 + 密码）
- 用户登录
- 会话管理
- 密码安全存储（SHA-256 哈希）

### 4.2 成长树模块

- 创建/编辑/删除技能树
- 添加/编辑/删除节点
- 节点类型：技能、习惯、知识
- 掌握程度追踪（0-100%）
- 父子节点关系管理

### 4.3 每日记录模块

- 创建每日记录
- 记录内容：活动、学习、反思
- 情绪选择（很好/一般/不太好）
- 标签管理
- 历史记录查看

### 4.4 目标管理模块

- 创建目标（标题、描述、目标值）
- 设定时间范围
- 进度追踪
- 状态管理（进行中/已完成/已取消）

### 4.5 提醒模块

- 创建提醒（标题、日期、时间）
- 关联目标
- 完成状态管理
- 提醒列表

### 4.6 数据分析

- 本周记录统计
- 连续记录天数
- 成长进度
- 情绪分布
- 成就徽章系统

---

## 5. 数据存储

GrowthOS 采用本地优先的存储策略：

- **Web 平台**：LocalStorage
- **移动端**：SQLite（通过 @capacitor-community/sqlite）

详细数据模型请参阅 [DATABASE.md](./docs/DATABASE.md)

---

## 6. 移动端打包

### 6.1 Android

```bash
# 1. 添加 Android 平台
npx cap add android

# 2. 构建 Web 应用
npm run build

# 3. 同步到 Android
npx cap sync android

# 4. 使用 Android Studio 打开并构建
open android/
```

### 6.2 iOS

```bash
# 1. 添加 iOS 平台
npx cap add ios

# 2. 构建 Web 应用
npm run build

# 3. 同步到 iOS
npx cap sync ios

# 4. 使用 Xcode 打开并构建
open ios/
```

---

## 7. 测试

```bash
# 运行单元测试
npm run test

# 运行测试并监控
npm run test -- --watch
```

---

## 8. 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 使用 Conventional Commits 提交规范

---

## 9. 许可证

本项目仅供个人学习使用。

---

## 10. 联系方式

如有问题或建议，请通过项目 Issues 反馈。

---

<div align="center">

**GrowthOS - 陪你一起成长**

</div>
