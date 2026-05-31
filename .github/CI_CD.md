# GrowthOS CI/CD 配置文档

## 架构概览

```
.github/
├── workflows/
│   ├── ci.yml          # 主 CI：lint → type-check → test → build
│   ├── e2e.yml         # E2E 测试：Playwright 端到端测试
│   └── deploy.yml      # CD：部署到 GitHub Pages
├── dependabot.yml       # 自动依赖更新
└── PULL_REQUEST_TEMPLATE.md  # PR 模板
```

---

## 工作流详解

### 1. CI (`ci.yml`)

**触发**: `push` / `pull_request` 到 main/master/develop 分支

**并发控制**: 同一分支的多次推送取消旧任务

| Job | 名称 | 步骤 |
|-----|------|------|
| `lint` | 代码规范检查 | Prettier 格式检查 → ESLint 检查 |
| `type-check` | TypeScript 类型检查 | `tsc --noEmit` |
| `test` | 单元测试 | Jest + 覆盖率报告 |
| `build` | 构建 | Vite 生产构建 + 产物上传 |

**缓存**: 使用 `actions/setup-node` 的 npm 缓存加速安装

**产物**:
- `coverage-report` - 测试覆盖率报告（保留 7 天）
- `dist` - 生产构建产物（保留 7 天）

---

### 2. E2E Tests (`e2e.yml`)

**触发**: `push` / `pull_request` 到 main/master/develop 分支，或手动触发

**超时**: 15 分钟

| 步骤 | 说明 |
|------|------|
| Checkout + Setup | 检出代码，安装 Node.js |
| npm ci | 安装依赖 |
| Playwright 安装 | 安装 Chromium 浏览器及系统依赖 |
| 启动服务 | Vite dev server + 健康检查 |
| 运行测试 | `python e2e_tests.py` |
| 截图上传 | E2E 测试截图（保留 7 天） |
| 报告上传 | 测试报告（保留 7 天） |

---

### 3. Deploy (`deploy.yml`)

**触发**: `push` 到 main/master，或手动触发

**权限**: `contents: read`, `pages: write`, `id-token: write`

| Job | 说明 |
|-----|------|
| `build` | Vite 生产构建 → 上传 Pages Artifact |
| `deploy` | 部署到 GitHub Pages |

> **注意**: 部署需要仓库 Settings > Pages 中启用 GitHub Pages，Source 选择 "GitHub Actions"。

---

### 4. Dependabot (`dependabot.yml`)

**更新频率**: 每周一 09:00 (北京时间)

| 生态 | 目录 | PR 限制 |
|------|------|---------|
| npm | `/` | 10 |
| GitHub Actions | `/` | 无限制 |

**依赖分组**（减少 PR 数量）:
- `react` - React 核心及相关类型
- `redux` - Redux Toolkit + React-Redux
- `testing` - Testing Library + Jest
- `vite` - Vite 及相关插件
- `eslint` - ESLint 及相关插件

---

## 本地运行

在提交前验证所有 CI 步骤：

```bash
# 验证全部
npm run validate

# 或分步运行
npm run format:check    # Prettier 格式检查
npm run lint            # ESLint
npm run type-check      # TypeScript 类型检查
npm run test            # Jest 单元测试
npm run build           # Vite 构建
```

E2E 测试：
```bash
# 启动服务器 + 运行测试
python /data/user/skills/webapp-testing/scripts/with_server.py \
  --server "npx vite --host 0.0.0.0 --port 5173" \
  --port 5173 \
  -- python e2e_tests.py
```

---

## 状态 Badge

将以下 badge 添加到 README：

```markdown
[![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)
[![E2E](https://github.com/USER/REPO/actions/workflows/e2e.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/e2e.yml)
[![Deploy](https://github.com/USER/REPO/actions/workflows/deploy.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/deploy.yml)
```

---

## 首次使用指南

1. **推送配置文件**:
   ```bash
   git add .github/
   git commit -m "ci: 添加 CI/CD 工作流配置"
   git push
   ```

2. **启用 GitHub Pages** (如需部署):
   - Settings → Pages → Source: "GitHub Actions"

3. **启用 Dependabot**:
   - Settings → Code security → Dependabot → Enable

4. **配置分支保护** (推荐):
   - Settings → Branches → Add rule
   - 目标: `main`
   - 勾选: "Require status checks to pass before merging"
   - 选择: `lint`, `type-check`, `test`, `build`

---

## 工作流图

```
push/PR to main
     │
     ▼
┌─────────┐    ┌───────────┐
│   CI    │    │    E2E    │
│  ┌────┐ │    │ ┌───────┐ │
│  │lint│ │    │ │Playwr.│ │
│  └────┘ │    │ └───────┘ │
│  ┌────┐ │    └───────────┘
│  │type│ │
│  └────┘ │
│  ┌────┐ │
│  │test│ │
│  └────┘ │
│  ┌────┐ │
│  │bld │─┼──→ artifact (dist)
│  └────┘ │
└─────────┘
     │ (仅 main 分支)
     ▼
┌─────────┐
│ Deploy  │
│ ┌─────┐ │
│ │Pages│ │
│ └─────┘ │
└─────────┘
```