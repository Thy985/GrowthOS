# 项目复盘增强版 V1 — 实施计划

## 阶段 1：数据模型 + 纯函数引擎（~1h）

### 1.1 扩展 Project 类型
- **文件**：`src/shared/types/index.ts`
- **内容**：Project 接口新增 `capabilitiesUsed: string[]` 和 `experienceGained: string[]`
- **验证**：tsc 0 errors

### 1.2 创建 retrospective 类型定义
- **文件**：`src/features/retrospective/types/retrospectiveTypes.ts`
- **内容**：WizardStep、WizardStepConfig、CapabilityImpact、RetrospectiveWizardData

### 1.3 实现能力影响分析引擎
- **文件**：`src/features/retrospective/engine/impactAnalysis.ts`
- **内容**：`analyzeCapabilityImpact()`、`buildReason()` 纯函数
- **测试**：`src/features/retrospective/engine/__tests__/impactAnalysis.test.ts`（~10 个）

---

## 阶段 2：组件实现（~2h）

### 2.1 WizardProgress 组件
- **文件**：`src/features/retrospective/components/WizardProgress.tsx`
- **内容**：4 步进度条，支持点击回退到已完成步骤
- **测试**：渲染、当前步骤高亮、已完成步骤样式

### 2.2 StepSelectCapabilities 组件
- **文件**：`src/features/retrospective/components/StepSelectCapabilities.tsx`
- **内容**：从 Redux 获取能力列表，按 category 分组，多选 checkbox
- **测试**：列表渲染、多选、空状态、验证

### 2.3 StepFreeRetrospective 组件
- **文件**：`src/features/retrospective/components/StepFreeRetrospective.tsx`
- **内容**：3 个 textarea（whatWentWell / whatWentWrong / nextTime），每行一条自动分割
- **测试**：渲染、输入、验证

### 2.4 StepExtractExperience 组件
- **文件**：`src/features/retrospective/components/StepExtractExperience.tsx`
- **内容**：动态经验列表，关联能力选择，contribution 滑块
- **测试**：输入、添加多条、关联能力、验证

### 2.5 StepCapabilityPreview 组件
- **文件**：`src/features/retrospective/components/StepCapabilityPreview.tsx`
- **内容**：能力变化列表，颜色编码，无变化空状态
- **测试**：列表渲染、空状态、颜色

### 2.6 RetrospectiveWizard 容器
- **文件**：`src/features/retrospective/components/RetrospectiveWizard.tsx`
- **内容**：useReducer 管理 4 步状态，步骤切换验证，提交逻辑
- **测试**：步骤前进/后退、状态保持、提交调用

---

## 阶段 3：集成（~1h）

### 3.1 修改 ProjectsPage
- **文件**：`src/features/projects/pages/ProjectsPage.tsx`
- **内容**：替换 RetrospectiveModal → RetrospectiveWizard，更新 handleRetrospective
- **保留旧组件**：RetrospectiveModal 文件保留但不再使用

### 3.2 更新 i18n
- **文件**：`src/shared/i18n/zh-CN.json`、`src/shared/i18n/en-US.json`
- **内容**：新增 retrospective 命名空间下的所有键

### 3.3 验证集成
- 完整 4 步流程手动测试
- 提交后验证 Project.capabilitiesUsed / experienceGained 写入
- 提交后验证 Experience 创建
- 提交后验证 Capability.level 更新

---

## 阶段 4：测试 + 质量门禁（~1h）

### 4.1 运行全量测试
- `npx vitest run` 确认 500+ passed
- 修复失败的旧测试（如有）

### 4.2 质量门禁
- `npx tsc --noEmit` → 0 errors
- `npm run build` → success
- `npm run lint` → 0 errors

---

## 文件变更汇总

| 操作 | 文件 |
|------|------|
| 新增 | `src/features/retrospective/types/retrospectiveTypes.ts` |
| 新增 | `src/features/retrospective/engine/impactAnalysis.ts` |
| 新增 | `src/features/retrospective/engine/__tests__/impactAnalysis.test.ts` |
| 新增 | `src/features/retrospective/components/WizardProgress.tsx` |
| 新增 | `src/features/retrospective/components/StepSelectCapabilities.tsx` |
| 新增 | `src/features/retrospective/components/StepFreeRetrospective.tsx` |
| 新增 | `src/features/retrospective/components/StepExtractExperience.tsx` |
| 新增 | `src/features/retrospective/components/StepCapabilityPreview.tsx` |
| 新增 | `src/features/retrospective/components/RetrospectiveWizard.tsx` |
| 新增 | `src/features/retrospective/components/__tests__/` (各组件测试) |
| 修改 | `src/shared/types/index.ts` (Project 新增 2 字段) |
| 修改 | `src/features/projects/pages/ProjectsPage.tsx` (替换 RetrospectiveModal) |
| 修改 | `src/shared/i18n/zh-CN.json` (新增 retrospective 键) |
| 修改 | `src/shared/i18n/en-US.json` (新增 retrospective 键) |

---

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 旧 RetrospectiveModal 测试失败 | 保留旧组件代码，仅替换引用 |
| Redux 状态更新竞态 | 提交时使用 Promise.all 串行化 async thunk 调用 |
| 大量新组件增加测试时间 | 纯函数测试独立运行，组件测试使用 mock Redux |