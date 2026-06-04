# GrowthOS

一个帮助你跟踪个人成长的应用。

## 状态

[![CI](https://img.shields.io/github/actions/workflow/status/USER/REPO/ci.yml?branch=main&label=CI&logo=github)](https://github.com/USER/REPO/actions/workflows/ci.yml)
[![E2E](https://img.shields.io/github/actions/workflow/status/USER/REPO/e2e.yml?branch=main&label=E2E&logo=github)](https://github.com/USER/REPO/actions/workflows/e2e.yml)
[![CD](https://img.shields.io/github/actions/workflow/status/USER/REPO/cd.yml?branch=main&label=CD&logo=github&event=workflow_run)](https://github.com/USER/REPO/actions/workflows/cd.yml)
[![codecov](https://codecov.io/gh/USER/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USER/REPO)

> ⚠️ Badge 链接里的 `USER/REPO` 请替换为实际的 GitHub owner/repo。

## 功能

- 📝 **记录** - 记录您的成长瞬间和心情
- 🎯 **目标** - 设定并追踪您的成长目标
- ⏰ **提醒** - 设置每日提醒，保持记录的习惯
- 📊 **分析** - 查看您的成长趋势和数据可视化
- 🌳 **成长树** - 可视化您的成长历程

## 技术栈

- React 18
- TypeScript
- Redux Toolkit
- React Router
- Tailwind CSS
- Recharts
- Vite
- Jest & Playwright

## 开始使用

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

## 项目结构

```
src/
├── components/     # React 组件
├── pages/          # 页面组件
├── store/          # Redux 状态管理
├── hooks/          # 自定义 Hooks
├── services/       # API 服务
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数
```

## 许可证

MIT
