# 项目复盘增强版 V1 设计文档

## 1. 背景与目标

### 1.1 核心问题

当前项目复盘仅作为一个简单的 textarea 表单，缺少以下关键能力：
- 项目与能力的关联（PRD 定义的 `capabilities_used`）
- 复盘后经验提炼与结构化存储（`experience_gained` → Experience 表）
- 复盘后自动分析能力变化（能力影响分析）
- 引导式流程（当前直接跳入 3 个 textarea，无引导）

### 1.2 现状

| 模块 | 状态 | 缺失 |
|------|------|------|
| `Project` 类型 | 有 `retrospective` 字段 | 缺少 `capabilitiesUsed`、`experienceGained` |
| `RetrospectiveModal` | 简单的 3 个 textarea | 无引导、无能力关联、无经验提炼 |
| `projectSlice` | 基本 CRUD | 复盘后无能力联动 |
| PRD 模块四 | 完整定义 | 未实现 |

### 1.3 成功标准

- 项目复盘流程从 1 步 textarea 升级为 4 步引导式向导
- 复盘时可选择涉及的能力（多选，从 Capability 列表）
- 复盘时可提炼经验并自动关联到 Experience 表 + ExperienceCapabilityLink
- 复盘完成后自动计算能力影响并更新 Capability.level
- 新增 ~35 个测试（纯函数 + 组件）
- tsc 0 errors，build success，eslint 0 errors

---

## 2. 架构设计

### 2.1 模块结构

```
src/features/retrospective/
├── types/retrospectiveTypes.ts          # 向导步骤、能力影响等视图类型
├── engine/
│   └── impactAnalysis.ts                # 能力影响分析（纯函数）
├── components/
│   ├── RetrospectiveWizard.tsx          # 主向导容器（4 步骤管理）
│   ├── StepSelectCapabilities.tsx       # 步骤 1：选择涉及的能力
│   ├── StepFreeRetrospective.tsx        # 步骤 2：自由回顾（三段 textarea）
│   ├── StepExtractExperience.tsx        # 步骤 3：提炼经验
│   ├── StepCapabilityPreview.tsx        # 步骤 4：能力变化预览
│   └── WizardProgress.tsx               # 向导进度条（4 步指示器）
└── store/                               # 无独立 slice，复用 projectSlice / capabilitySlice / experienceSlice
```

### 2.2 数据流

```
用户触发复盘 (ProjectCard "复盘" 按钮)
  → 打开 RetrospectiveWizard
  → 步骤 1: 选择能力 → 从 state.capabilities.capabilities 列表多选
  → 步骤 2: 自由回顾 → 输入 whatWentWell / whatWentWrong / nextTime
  → 步骤 3: 提炼经验 → 输入经验描述，可选关联能力（contribution）
  → 步骤 4: 能力变化预览 → 调用 analyzeCapabilityImpact()
  → 用户确认提交
    → dispatch(updateProject({ id, retrospective, capabilitiesUsed, experienceGained }))
    → dispatch(addExperience(...)) × N（每条经验）
    → 对每个受影响的能力：dispatch(updateCapability({ id, currentLevel: newLevel }))
    → 关闭向导
```

### 2.3 类型扩展

```typescript
// src/shared/types/index.ts — Project 新增字段
export interface Project {
  // ... existing fields
  capabilitiesUsed: string[];        // 新增：涉及的能力 ID 列表
  experienceGained: string[];        // 新增：提炼的经验 ID 列表
}
```

---

## 3. 核心模块设计

### 3.1 向导步骤定义（retrospectiveTypes.ts）

```typescript
export type WizardStep = 'capabilities' | 'retrospective' | 'experiences' | 'preview';

export interface WizardStepConfig {
  key: WizardStep;
  label: string;
  stepNumber: number;
}

export interface CapabilityImpact {
  capabilityId: string;
  capabilityName: string;
  oldLevel: number;
  newLevel: number;
  change: number;
  reason: string;
}

export interface RetrospectiveWizardData {
  capabilitiesUsed: string[];                    // 步骤 1
  whatWentWell: string[];                        // 步骤 2
  whatWentWrong: string[];                       // 步骤 2
  nextTime: string[];                             // 步骤 2
  experiences: Array<{                           // 步骤 3
    event: string;
    reflection?: string;
    principle?: string;
    capabilityLinks: Array<{
      capabilityId: string;
      contribution: number;
    }>;
  }>;
  impacts: CapabilityImpact[];                   // 步骤 4（预览）
}
```

### 3.2 能力影响分析（impactAnalysis.ts）

**纯函数，可独立测试，无副作用。**

```typescript
// 计算每个被选择的能力的等级变化
function analyzeCapabilityImpact(
  capabilitiesUsed: string[],
  capabilities: Capability[],
  whatWentWell: string[],
  whatWentWrong: string[],
): CapabilityImpact[] {
  const capMap = new Map(capabilities.map(c => [c.id, c]));
  const impacts: CapabilityImpact[] = [];

  for (const capId of capabilitiesUsed) {
    const cap = capMap.get(capId);
    if (!cap) continue;

    // 基础增长：每个使用的能力 +3
    let change = 3;

    // 什么做得好 → 额外奖励
    if (whatWentWell.length > 0) change += Math.min(whatWentWell.length, 3);

    // 什么做得不好 → 增长减半
    if (whatWentWrong.length > 0) change = Math.max(1, Math.floor(change / 2));

    const newLevel = Math.min(100, cap.currentLevel + change);

    impacts.push({
      capabilityId: cap.id,
      capabilityName: cap.name,
      oldLevel: cap.currentLevel,
      newLevel,
      change: newLevel - cap.currentLevel,
      reason: buildReason(cap.name, change, whatWentWell.length, whatWentWrong.length),
    });
  }

  return impacts;
}

function buildReason(
  name: string,
  change: number,
  wellCount: number,
  wrongCount: number,
): string {
  const parts: string[] = [];
  if (wellCount > 0) parts.push(`复盘中有 ${wellCount} 条正面回顾`);
  if (wrongCount > 0) parts.push(`${wrongCount} 条改进项`);
  parts.push(`能力等级 +${change}`);
  return parts.join('，');
}
```

### 3.3 向导容器（RetrospectiveWizard.tsx）

**状态管理：**

```typescript
// 内部使用 useReducer 管理 4 步间的状态
const [wizardData, dispatch] = useReducer(wizardReducer, initialWizardData);
const [currentStep, setCurrentStep] = useState<WizardStep>('capabilities');
```

**步骤切换逻辑：**

```
capabilities → retrospective (验证：至少选 1 个能力)
retrospective → experiences (验证：至少填 1 个区块)
experiences → preview (验证：至少 1 条经验)
preview → 提交 (确认能力变化)
```

**提交逻辑：**

```typescript
const handleSubmit = useCallback(async () => {
  // 1. 更新 Project（写入 retrospective + capabilitiesUsed + experienceGained）
  const expIds = await createExperiences(wizardData.experiences);
  dispatch(updateProject({
    id: project.id,
    retrospective: { whatWentWell, whatWentWrong, nextTime },
    capabilitiesUsed: wizardData.capabilitiesUsed,
    experienceGained: expIds,
  }));

  // 2. 更新能力等级
  for (const impact of wizardData.impacts) {
    if (impact.change > 0) {
      dispatch(updateCapability({ id: impact.capabilityId, currentLevel: impact.newLevel }));
    }
  }

  onClose();
}, [wizardData, project.id, dispatch, onClose]);
```

---

## 4. 组件设计

### 4.1 WizardProgress.tsx

**向导进度条。**

- 4 个步骤圆点 + 连线
- 当前步骤高亮（indigo 实心），已完成步骤绿色勾，未完成步骤灰色空心
- 步骤名称：选择能力 → 自由回顾 → 提炼经验 → 确认变化
- 点击已完成步骤可回退

### 4.2 StepSelectCapabilities.tsx

**步骤 1：选择涉及的能力。**

- 从 Redux 获取 `state.capabilities.capabilities`
- 按 category 分组展示（mind / skill / cognition / body / social）
- 每项：checkbox + 能力名 + 当前等级徽章
- 已选计数显示在顶部
- 验证：至少选 1 个
- 空状态：如无能力，提示"请先在能力管理中创建能力"

### 4.3 StepFreeRetrospective.tsx

**步骤 2：自由回顾。**

- 保留现有 3 个 textarea 设计（whatWentWell / whatWentWrong / nextTime）
- 改进：每个区块独立展示（非全部堆叠），每行一条自动分割
- 添加字数提示和行数提示
- 验证：至少 1 个区块有内容

### 4.4 StepExtractExperience.tsx

**步骤 3：提炼经验。**

- 列表形式，默认 1 条经验输入框
- 每条经验：事件描述（必填）、反思（可选）、原则（可选）
- 每条经验可关联能力（多选，从步骤 1 选中的能力中选，contribution 滑块 0-1）
- 支持"添加更多经验"按钮
- 验证：至少 1 条经验且 event 非空

### 4.5 StepCapabilityPreview.tsx

**步骤 4：能力变化预览。**

- 列表展示每个受影响的能力
- 每项：能力名 + 旧等级 → 新等级（箭头动画）+ 变化量 + 原因
- 变化量颜色：正数绿色、零灰色
- 如无变化，显示"本次复盘未产生能力等级变化"
- 用户可在此步确认或返回修改

---

## 5. 集成方案

### 5.1 类型修改

**修改** `src/shared/types/index.ts`：

在 `Project` 接口中新增：
```typescript
capabilitiesUsed: string[];    // 涉及的能力 ID
experienceGained: string[];    // 关联的经验 ID
```

### 5.2 ProjectsPage.tsx 修改

- 将 `RetrospectiveModal` 替换为 `RetrospectiveWizard`
- `handleRetrospective` 改为接收完整 `RetrospectiveWizardData`
- 提交时依次调用 `updateProject`、`addExperience`、`updateCapability`

### 5.3 projectSlice.ts 修改

无需修改 thunk 签名（`updateProject` 已接受 `Partial<Project>`）。但 `loadData` 序列化需要兼容新增字段。

### 5.4 i18n 新增键

```json
{
  "retrospective": {
    "wizardTitle": "项目复盘",
    "step1": "选择能力",
    "step1Desc": "选择本项目中使用到的能力",
    "step2": "自由回顾",
    "step2Desc": "回顾做得好的、需要改进的、下次注意的",
    "step3": "提炼经验",
    "step3Desc": "把复盘发现转化为可复用的经验",
    "step4": "确认变化",
    "step4Desc": "预览本次复盘对能力的影响",
    "complete": "完成复盘",
    "noCapabilities": "暂无能力，请先在能力管理中创建",
    "selectedCount": "已选 {{count}} 项",
    "experienceEvent": "经验描述",
    "experienceEventPlaceholder": "例如：通过充分的代码评审发现了3个潜在bug",
    "addMoreExperience": "添加更多经验",
    "impactTitle": "能力变化预览",
    "noImpact": "本次复盘未产生能力等级变化",
    "levelChange": "+{{change}}",
    "backToEdit": "返回修改",
    "confirmSubmit": "确认提交"
  }
}
```

---

## 6. 错误处理

| 场景 | 处理策略 |
|------|----------|
| 无可用能力 | 步骤 1 显示空状态，阻止继续 |
| 复盘数据为空 | 步骤 2 验证至少 1 个区块有内容 |
| 经验 event 为空 | 步骤 3 逐条验证 |
| 能力已被删除 | 过滤不存在的 capabilityId |
| 经验创建失败 | 回滚已创建的经验（按顺序删除） |
| 能力更新失败 | 记录日志，不阻断复盘提交 |

---

## 7. 测试策略

### 7.1 纯函数测试（~10 个）

- `analyzeCapabilityImpact`：正常场景、无能力、空复盘、边界值（level 达 100 上限）、负变化场景
- 所有判断分支覆盖

### 7.2 组件测试（~15 个）

- `WizardProgress`：4 步渲染、当前步骤高亮、已完成步骤样式
- `StepSelectCapabilities`：能力列表渲染、多选、验证、空状态
- `StepFreeRetrospective`：3 个 textarea 渲染、输入、验证
- `StepExtractExperience`：经验输入、添加多条、关联能力、验证
- `StepCapabilityPreview`：影响列表渲染、无变化空状态、变化量颜色

### 7.3 集成测试（~10 个）

- 完整 4 步流程：选择能力 → 回顾 → 提炼经验 → 预览 → 提交
- 提交后 Project 包含 capabilitiesUsed 和 experienceGained
- 提交后 Experience 正确创建并关联 Project
- 提交后 Capability.level 正确更新
- 步骤间前进/后退状态保持

---

## 8. 验证标准

| 检查项 | 目标 |
|--------|------|
| tsc | 0 errors |
| build | success |
| tests | 500+ passed（+35 新增） |
| eslint | 0 errors |
| 功能验证 | 4 步流程完整、能力关联正确、经验创建正确、能力等级更新正确 |

---

## 9. V2 预留

- AI 教练消费复盘洞察：将复盘结果输入 coachEngine，生成个性化建议
- 复盘后自动生成项目总结报告
- 复盘历史对比：查看同一能力在多个项目复盘中的变化趋势
- 团队复盘：多人协作复盘