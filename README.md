# GrowthOS - 个人成长追踪系统

## 项目简介

GrowthOS 是一款个人成长追踪系统，旨在帮助用户记录日常活动、追踪技能发展、分析成长数据，通过可视化的成长树来展示个人成长历程。

## 核心功能

### 📝 日常记录
- 记录每日活动、学习内容、心情状态和反思
- 支持使用 #标签 自动关联到成长树节点
- 搜索和过滤记录功能

### 🌳 成长树
- 可视化展示个人成长历程
- 自动根据标签创建和关联节点
- 节点状态管理（活跃、枯萎、死亡）
- 节点详情查看

### 📊 数据分析
- 数据统计和趋势图表
- 情绪分析和标签分布
- AI 分析和建议

### 🎯 目标管理
- 创建和管理个人目标
- 目标进度追踪
- 目标完成情况统计

### ⏰ 提醒功能
- 设置学习和活动提醒
- 提醒历史记录
- 提醒统计分析

### 🔐 安全性
- 本地数据加密存储
- 环境变量管理敏感信息
- 安全的身份验证

### 🌍 国际化
- 支持中英文切换
- 本地化日期和时间格式

### 📱 响应式设计
- 适配桌面、平板和移动设备
- 流畅的用户界面

## 技术栈

### 前端
- React 18
- TypeScript
- Redux Toolkit (状态管理)
- ReactFlow (树可视化)
- Tailwind CSS (样式)
- i18next (国际化)
- CryptoJS (数据加密)

### 构建工具
- Vite
- ESLint
- Jest (测试)

### 数据存储
- 本地存储 (LocalStorage)
- 加密存储

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
   # 或
   yarn install
   ```

3. 配置环境变量
   创建 `.env` 文件并添加以下内容：
   ```
   # 加密密钥
   VITE_ENCRYPTION_KEY=GrowthOS-Secure-Key-2024
   VITE_ENCRYPTION_IV=GrowthOS-IV-2024

   # 其他环境变量
   VITE_APP_NAME=GrowthOS
   VITE_APP_VERSION=1.0.0
   VITE_APP_ENV=development
   ```

4. 启动开发服务器
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

5. 构建生产版本
   ```bash
   npm run build
   # 或
   yarn build
   ```

6. 运行测试
   ```bash
   npm test
   # 或
   yarn test
   ```

## 项目结构

```
/src
  /__tests__          # 测试文件
  /assets             # 静态资源
  /common             # 通用代码
    /contexts         # React 上下文
    /hooks            # 自定义钩子
    /i18n            # 国际化
    /types            # TypeScript 类型定义
    /utils            # 工具函数
  /components         # 组件
    /common           # 通用组件
    /growth-tree      # 成长树相关组件
  /pages              # 页面
    /analytics        # 数据分析
    /auth             # 身份验证
    /dashboard        # 仪表盘
    /goals            # 目标管理
    /growth-tree      # 成长树
    /records          # 记录管理
    /reminders        # 提醒功能
  /store              # Redux 状态管理
    /slices           # Redux Toolkit 切片
  App.tsx             # 应用入口
  main.tsx            # 主文件
  index.css           # 全局样式
  App.css             # 应用样式
```

## 核心概念

### 成长树
成长树是 GrowthOS 的核心概念，它将用户的学习和活动以树状结构可视化展示。每个节点代表一个技能、认知或习惯，节点之间的连接代表它们之间的关系。

### 记录
记录是用户日常活动的记录，包括做了什么、学了什么、心情状态和反思。通过使用 #标签，记录会自动关联到成长树的对应节点。

### 目标
目标是用户设定的个人目标，包括目标描述、目标类型、目标值、开始和结束日期等。系统会追踪目标的进度，并在成长树上显示目标的完成情况。

### 提醒
提醒是用户设置的学习和活动提醒，帮助用户养成良好的习惯，保持学习的连续性。

## 快捷键

- `H` - 回到首页
- `R` - 查看记录列表
- `T` - 查看成长树
- `A` - 查看数据分析
- `?` - 显示/隐藏快捷键帮助
- `Ctrl+K` - 快速搜索
- `Escape` - 关闭弹窗

## 贡献指南

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码规范

- 使用 TypeScript 编写代码
- 遵循 ESLint 规则
- 为组件和函数添加类型注解
- 为关键代码添加注释
- 使用 Prettier 格式化代码

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件

## 联系方式

- 项目链接: [https://github.com/yourusername/growthos](https://github.com/yourusername/growthos)
- 作者: Your Name
- 邮箱: your.email@example.com

---

**开始你的成长之旅！** 🚀