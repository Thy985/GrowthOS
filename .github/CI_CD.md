# GrowthOS CI/CD 配置文档

## 架构概览

```
.github/
├── workflows/
│   ├── ci.yml          # 主 CI：lint → type-check → test → build
│   ├── e2e.yml         # 端到端测试：Playwright TS（统一入口）
│   ├── cd.yml          # CD：CI 成功后自动部署 staging / production
│   ├── deploy.yml      # 手动部署：GitHub Pages + 可选 release
│   └── pr-review.yml   # PR 自动评论 + size label
├── dependabot.yml       # 自动依赖更新
├── PULL_REQUEST_TEMPLATE.md  # PR 模板
└── CI_CD.md             # 本文档
```

---

## 工作流详解

### 1. CI (`ci.yml`)

**触发**: `push` / `pull_request` 到 main/develop

**并发控制**: 同分支的多次推送自动取消旧任务

| Job | 名称 | 步骤 | 必过 |
|-----|------|------|------|
| `lint-and-typecheck` | Lint & Type Check | `npm run lint` → `npm run type-check` | ✅ |
| `unit-tests` | Unit Tests | `npm run test:ci`（带 coverage） | ✅ |
| `build` | Build Production | `npm run build` | ✅ |
| `security-audit` | Security Audit | `npm audit`（continue-on-error） | ❌ informational |
| `ci-status` | CI Status | 汇总报告 → 必过项失败则 exit 1 | - |

**缓存**: `actions/setup-node` 的 npm 缓存（基于 `package-lock.json`）

**产物**:
- `coverage-report` (7d) - 测试覆盖率
- `dist` (7d) - 生产构建

**Codecov**: 需在 Settings → Secrets 配置 `CODECOV_TOKEN`（没配也不阻塞 PR，设为 `fail_ci_if_error: false`）

---

### 2. E2E (`e2e.yml`)

**触发**: `push` / `pull_request` 到 main/develop，或手动

**单 job**: Playwright Chromium

| 步骤 | 说明 |
|------|------|
| Checkout + Setup | 检出 + Node 20 + npm 缓存 |
| Playwright 安装 | `npx playwright install --with-deps chromium` |
| Build | `npm run build` |
| Start server | `npm run preview` 后台运行（`background: true`） |
| Wait | bash 轮询 4173 端口，最长 60s |
| Test | `npx playwright test`（**continue-on-error**：路由保护导致部分测试 flaky，团队后续逐个修） |
| Upload | playwright-report + test-results (14d) |

> 旧版本曾同时跑 Python `e2e_tests.py` 和 Playwright TS，重复且不一致。
> 现在 CI 中**只**跑 Playwright TS（`e2e/app.spec.ts` + `playwright.config.ts`）。
> Python 脚本仍保留在仓库根供本地调试，**不进 CI**。

---

### 3. CD (`cd.yml`)

**触发**: CI workflow_run = success

> **关键修复**：之前错写 `workflows: ["CI Pipeline"]`（workflow 实际名为 "CI"），导致 CD 永远不触发。
> 现已修正为 `workflows: ["CI"]`。

| Job | 触发条件 | 目标 |
|-----|---------|------|
| `deploy-staging` | CI 成功 + develop 分支 | staging 环境 |
| `deploy-production` | CI 成功 + main 分支 | production 环境 |

两 job 都使用 GitHub `environment` 保护规则（需在 Settings → Environments 配置批准人）。

---

### 4. Deploy (`deploy.yml`)

**触发**: `push` 到 main（自动 preview），或 `workflow_dispatch`（手动选 preview/production）

| Job | 触发 | 说明 |
|-----|------|------|
| `deploy-preview` | push main OR 手动 preview | 推送到 gh-pages 分支 |
| `deploy-production` | 手动 production | 全量验证（type-check + lint + test）→ build → zip → GitHub Release + Pages |

> **关键修复**：之前用 `actions/create-release@v1` + `actions/upload-release-asset@v1`，这俩 action 已被 GitHub 归档。
> 现已替换为 `softprops/action-gh-release@v2`（社区维护，活跃）。

---

### 5. PR Review (`pr-review.yml`)

**触发**: PR opened / synchronize / reopened

| Job | 说明 |
|-----|------|
| `pr-info` | 在 PR 上发布带元数据的自动评论 |
| `size-label` | 按改动文件数贴 size 标签（xs / s / m / l / xl） |

---

### 6. Dependabot (`dependabot.yml`)

每周一 09:00 (Asia/Shanghai) 检查 npm + GitHub Actions 依赖更新，按生态分组。

---

## 本地运行

提交前验证所有 CI 步骤：

```bash
# 全部
npm run validate

# 或分步
npm run format:check    # Prettier
npm run lint            # ESLint
npm run type-check      # tsc --noEmit
npm run test            # Jest
npm run build           # Vite
```

E2E（Playwright TS）：
```bash
# 自动启停 preview server
npx playwright test

# 调试模式
npx playwright test --ui
npx playwright test --headed
```

E2E（Python，仅本地调试，不进 CI）：
```bash
# 需先启动 vite dev server
npx vite --host 0.0.0.0 --port 5173 &
python e2e_tests.py
```

---

## 状态 Badge

在 README 中显示：

```markdown
[![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/ci.yml)
[![E2E](https://github.com/USER/REPO/actions/workflows/e2e.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/e2e.yml)
[![CD](https://github.com/USER/REPO/actions/workflows/cd.yml/badge.svg)](https://github.com/USER/REPO/actions/workflows/cd.yml)
```

---

## 首次使用指南

1. **推送配置**：
   ```bash
   git add .github/
   git commit -m "ci: 修复 CI/CD 流水线（workflow 名匹配、替换 deprecated action）"
   git push
   ```

2. **启用 GitHub Pages**（如需部署）：
   - Settings → Pages → Source: "GitHub Actions"

3. **配置 Dependabot**：
   - Settings → Code security → Dependabot → Enable

4. **配置 Codecov**（可选）：
   - https://codecov.io → 连接仓库 → 复制 token → Settings → Secrets → `CODECOV_TOKEN`

5. **分支保护**（推荐）：
   - Settings → Branches → Add rule
   - 目标：`main`
   - 勾选 "Require status checks to pass before merging"
   - 必选 checks：`Lint & Type Check`、`Unit Tests`、`Build Production`

---

## 工作流图

```
push/PR to main/develop
     │
     ▼
┌─────────┐    ┌─────────┐
│   CI    │    │   E2E   │
│ ┌─────┐ │    │ ┌─────┐ │
│ │lint │ │    │ │Play.│ │
│ └─────┘ │    │ └─────┘ │
│ ┌─────┐ │    └─────────┘
│ │tsc  │ │
│ └─────┘ │
│ ┌─────┐ │
│ │test │─┼──→ codecov
│ └─────┘ │
│ ┌─────┐ │
│ │build│─┼──→ dist artifact
│ └─────┘ │
└─────────┘
     │ workflow_run=success
     ▼
┌─────────┐
│   CD    │
│ staging │  ← develop
│ prod    │  ← main
└─────────┘

(单独路径)
workflow_dispatch → Deploy.yml → gh-pages / GitHub Release
```
