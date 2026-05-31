# Contributing to GrowthOS

感谢您对 GrowthOS 的关注！我们欢迎各种形式的贡献，包括但不限于：

- 🐛 Bug 修复
- ✨ 新功能开发
- 📚 文档改进
- 🎨 UI/UX 优化
- ⚡ 性能提升
- 🧪 测试完善

## 开发环境设置

### 前置要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 安装步骤

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/growthos.git
   cd growthos
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问应用**
   打开浏览器访问 `http://localhost:5173`

## 开发规范

### Git 工作流

我们采用 Git Flow 分支管理策略：

- `main` - 生产环境分支
- `develop` - 开发环境分支
- `feature/*` - 功能分支
- `fix/*` - 修复分支
- `hotfix/*` - 紧急修复分支

### 分支命名规范

```bash
feature/add-weekly-report
fix/auth-token-refresh
hotfix/security-patch
```

### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (Type)**:
- `feat` - 新功能
- `fix` - Bug 修复
- `docs` - 文档变更
- `style` - 代码格式（不影响功能）
- `refactor` - 代码重构
- `perf` - 性能优化
- `test` - 测试相关
- `build` - 构建系统或依赖变更
- `ci` - CI/CD 配置
- `chore` - 其他变更

**示例**:
```bash
feat(insights): 添加周报生成器
fix(auth): 修复 Token 刷新问题
docs(readme): 更新安装说明
```

### 代码规范

#### TypeScript

- 启用严格模式
- 使用显式类型声明
- 优先使用 `const` 而非 `let`
- 避免使用 `any` 类型

#### React

- 使用函数组件和 Hooks
- 组件文件以 `.tsx` 扩展名
- 自定义 Hooks 以 `use` 开头
- 组件使用 `memo` 进行优化

#### CSS/Tailwind

- 使用 Tailwind CSS 类名
- 遵循设计系统规范
- 避免内联样式（除非动态值）

### 测试要求

- 所有新功能必须包含测试
- 修复 Bug 前应先编写复现测试
- 保持测试覆盖率在 80% 以上

```bash
# 运行所有测试
npm test

# 运行测试并生成覆盖率报告
npm test -- --coverage

# 运行特定测试文件
npm test -- RecordList.test
```

### 代码审查

提交 PR 后，会自动触发以下检查：

- ✅ ESLint 代码检查
- ✅ Prettier 格式检查
- ✅ TypeScript 类型检查
- ✅ 单元测试
- ✅ 构建测试

所有检查通过后，才会进行人工审查。

## 项目结构

```
src/
├── components/        # React 组件
│   ├── common/      # 通用组件
│   └── ai/          # AI 相关组件
├── pages/           # 页面组件
├── store/           # Redux Store
│   └── slices/     # Redux Slices
├── utils/           # 工具函数
├── hooks/           # 自定义 Hooks
├── services/        # 业务服务
├── types/           # TypeScript 类型定义
└── i18n/            # 国际化
```

## API 开发

### RESTful API 规范

- 使用 REST 原则
- 返回统一的响应格式
- 适当的 HTTP 状态码
- API 版本控制（v1, v2）

### 错误处理

```typescript
// 错误响应格式
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## 发布流程

### 版本号规范

我们使用语义化版本 (SemVer)：

- 主版本号：不兼容的 API 变更
- 次版本号：向后兼容的功能新增
- 修订号：向后兼容的问题修复

### 发布步骤

1. 更新 `CHANGELOG.md`
2. 创建 Git Tag
3. GitHub Actions 自动构建和部署
4. 生成 Release Notes

## 获取帮助

- 📖 查看 [Wiki 文档](https://github.com/your-username/growthos/wiki)
- 💬 加入 [Discord 社区](https://discord.gg/growthos)
- 🐛 提交 [Issue](https://github.com/your-username/growthos/issues)
- 📧 联系维护者：maintainer@growthos.example.com

## 行为准则

我们承诺为所有参与者提供一个友好、安全和包容的环境。请阅读我们的 [Code of Conduct](./CODE_OF_CONDUCT.md)。

## 许可证

通过贡献代码，您同意将您的作品按照 [MIT License](./LICENSE) 许可证发布。

---

再次感谢您的贡献！ 🎉
