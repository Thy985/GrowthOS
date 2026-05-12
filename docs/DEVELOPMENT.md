# GrowthOS 开发指南

## 1. 开发环境

### 1.1 环境要求

| 软件 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | >= 18.0 | JavaScript 运行时 |
| npm | >= 9.0 | 包管理器 |
| Git | 最新版 | 版本控制 |

### 1.2 可选软件

| 软件 | 用途 |
|------|------|
| Android Studio | Android 构建 |
| Xcode | iOS 构建（仅 macOS） |
| VS Code | 推荐编辑器 |

### 1.3 环境变量

创建 `.env` 文件：

```env
# 示例环境变量（当前版本暂不需要）
VITE_APP_TITLE=GrowthOS
```

---

## 2. 项目初始化

### 2.1 克隆项目

```bash
git clone <repository-url>
cd growthos
```

### 2.2 安装依赖

```bash
npm install
```

### 2.3 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

---

## 3. 开发规范

### 3.1 代码规范

#### 3.1.1 TypeScript 规范

- 启用严格模式
- 禁止使用 `any` 类型
- 使用显式类型声明
- 优先使用接口而非类型别名

```typescript
// ✅ 正确
interface User {
  id: string;
  name: string;
}

// ❌ 错误
const user: any = {};
```

#### 3.1.2 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `UserProfile.tsx` |
| 函数 | camelCase | `getUserById()` |
| 常量 | UPPER_SNAKE | `MAX_RETRY_COUNT` |
| 类型 | PascalCase | `UserState` |
| 文件 | kebab-case | `user-service.ts` |
| CSS 类 | kebab-case | `user-card` |

#### 3.1.3 导入顺序

```typescript
// 1. React 核心
import { useState, useEffect } from 'react';

// 2. 第三方库
import { useDispatch, useSelector } from 'react-redux';

// 3. 本地模块
import { authService } from '@/common/services';
import { UserCard } from '@/components';

// 4. 类型导入
import type { User } from '@/types';
```

### 3.2 Git 提交规范

使用 Conventional Commits：

```
<type>(<scope>): <subject>

[可选 body]

[可选 footer]
```

#### 类型说明

| 类型 | 描述 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档更新 |
| style | 代码格式（不影响功能） |
| refactor | 重构（不影响功能） |
| test | 测试相关 |
| chore | 构建/工具相关 |

#### 示例

```bash
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(records): correct date formatting issue"
git commit -m "docs: update README installation steps"
```

---

## 4. 开发流程

### 4.1 功能开发

```bash
# 1. 创建功能分支
git checkout -b feature/add-goal-progress

# 2. 编写代码

# 3. 运行测试
npm run test

# 4. 代码检查
npm run lint

# 5. 提交代码
git add .
git commit -m "feat(goals): add progress tracking"
```

### 4.2 Bug 修复

```bash
# 1. 创建修复分支
git checkout -b fix/reminder-notification

# 2. 修复 bug

# 3. 添加测试
npm run test

# 4. 提交
git commit -m "fix(reminders): correct notification timing"
```

### 4.3 代码审查

提交前检查：
- [ ] 类型定义完整
- [ ] 无 `any` 类型
- [ ] 错误处理完善
- [ ] 测试覆盖
- [ ] 文档更新（如需要）

---

## 5. 组件开发

### 5.1 创建新组件

```tsx
// src/components/common/MyButton.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface MyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function MyButton({
  variant = 'primary',
  className,
  children,
  ...props
}: MyButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 5.2 组件导出

在 `src/components/common/index.ts` 中导出：

```typescript
export { MyButton } from './MyButton';
```

---

## 6. 服务层开发

### 6.1 创建新服务

```typescript
// src/common/services/itemServiceV2.ts
import type { Item, CreateItemDTO, UpdateItemDTO } from '@/types';
import { STORAGE_KEYS } from '@/constants';
import { getFromStorage, setToStorage } from '@/utils/secureStorage';
import { ValidationError, NotFoundError } from '@/utils/errorHandler';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function createItem(dto: CreateItemDTO): Promise<Item> {
  if (!dto.name?.trim()) {
    throw new ValidationError('名称不能为空', 'name');
  }

  const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS) || [];
  const newItem: Item = {
    id: generateId(),
    ...dto,
    createdAt: new Date().toISOString()
  };

  items.push(newItem);
  setToStorage(STORAGE_KEYS.ITEMS, items);
  return newItem;
}

export async function updateItem(id: string, dto: UpdateItemDTO): Promise<Item> {
  const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS) || [];
  const index = items.findIndex(item => item.id === id);

  if (index === -1) {
    throw new NotFoundError(`项目 ${id} 不存在`);
  }

  const updatedItem = {
    ...items[index],
    ...dto,
    updatedAt: new Date().toISOString()
  };

  items[index] = updatedItem;
  setToStorage(STORAGE_KEYS.ITEMS, items);
  return updatedItem;
}

export async function deleteItem(id: string): Promise<void> {
  const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS) || [];
  const filtered = items.filter(item => item.id !== id);
  setToStorage(STORAGE_KEYS.ITEMS, filtered);
}

export async function getItemById(id: string): Promise<Item | null> {
  const items = getFromStorage<Item[]>(STORAGE_KEYS.ITEMS) || [];
  return items.find(item => item.id === id) || null;
}

export async function getAllItems(): Promise<Item[]> {
  return getFromStorage<Item[]>(STORAGE_KEYS.ITEMS) || [];
}
```

### 6.2 服务使用

```typescript
// 在 Redux Slice 中使用
import { createAsyncThunk } from '@reduxjs/toolkit';
import * as itemService from '@/common/services/itemServiceV2';

export const fetchItems = createAsyncThunk(
  'item/fetchItems',
  async () => {
    return await itemService.getAllItems();
  }
);
```

---

## 7. Redux 开发

### 7.1 创建 Slice

```typescript
// src/store/slices/itemSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Item, ItemState } from '@/types';
import * as itemService from '@/common/services/itemServiceV2';

const initialState: ItemState = {
  items: [],
  isLoading: false,
  error: null
};

export const fetchItems = createAsyncThunk(
  'item/fetchItems',
  async (_, { rejectWithValue }) => {
    try {
      return await itemService.getAllItems();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '获取失败');
    }
  }
);

export const createItem = createAsyncThunk(
  'item/createItem',
  async (dto: CreateItemDTO, { rejectWithValue }) => {
    try {
      return await itemService.createItem(dto);
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '创建失败');
    }
  }
);

const itemSlice = createSlice({
  name: 'item',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action: PayloadAction<Item[]>) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearError } = itemSlice.actions;
export default itemSlice.reducer;
```

### 7.2 注册 Slice

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import growthReducer from './slices/growthSlice';
import goalReducer from './slices/goalSlice';
import reminderReducer from './slices/reminderSlice';
import themeReducer from './slices/themeSlice';
import itemReducer from './slices/itemSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    growth: growthReducer,
    goal: goalReducer,
    reminder: reminderReducer,
    theme: themeReducer,
    item: itemReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

## 8. 页面开发

### 8.1 创建新页面

```tsx
// src/pages/items/index.tsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchItems, createItem } from '@/store/slices/itemSlice';
import type { RootState, AppDispatch } from '@/store';
import { ItemCard } from '@/components';

export function ItemsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { items, isLoading, error } = useSelector(
    (state: RootState) => state.item
  );

  useEffect(() => {
    dispatch(fetchItems());
  }, [dispatch]);

  const handleCreate = async () => {
    await dispatch(createItem({ name: '新项目' }));
  };

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">项目列表</h1>
      <button onClick={handleCreate} className="btn-primary">
        创建项目
      </button>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {items.map(item => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
```

### 8.2 添加路由

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ItemsPage } from '@/pages/items';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/items" element={<ItemsPage />} />
        {/* ... */}
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 9. 测试开发

### 9.1 单元测试

```typescript
// src/utils/__tests__/format.test.ts
import { formatDate, calculateStreak } from '../format';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('2024-01-15');
  });
});

describe('calculateStreak', () => {
  it('should return 0 for empty array', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('should calculate streak correctly', () => {
    const dates = ['2024-01-01', '2024-01-02', '2024-01-03'];
    expect(calculateStreak(dates)).toBe(3);
  });
});
```

### 9.2 组件测试

```tsx
// src/components/__tests__/Button.test.tsx
import { render, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with text', () => {
    const { getByText } = render(<Button>点击我</Button>);
    expect(getByText('点击我')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    const { getByText } = render(<Button onClick={handleClick}>点击我</Button>);
    fireEvent.click(getByText('点击我'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 9.3 运行测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test -- --watch

# 覆盖率
npm run test -- --coverage
```

---

## 10. 构建和部署

### 10.1 Web 构建

```bash
# 开发构建
npm run build

# 预览生产构建
npm run preview
```

### 10.2 Android 构建

```bash
# 添加 Android 平台（如尚未添加）
npx cap add android

# 同步 Web 资源
npx cap sync android

# 使用 Android Studio 打开
open android/
```

### 10.3 iOS 构建

```bash
# 添加 iOS 平台
npx cap add ios

# 同步 Web 资源
npx cap sync ios

# 使用 Xcode 打开
open ios/
```

---

## 11. 调试技巧

### 11.1 React DevTools

安装 React DevTools 浏览器扩展：
- [Chrome](https://chrome.google.com/webstore)
- [Firefox](https://addons.mozilla.org)

### 11.2 Redux DevTools

安装 Redux DevTools 扩展：
- [Chrome](https://chrome.google.com/webstore)
- [Firefox](https://addons.mozilla.org)

### 11.3 常见问题

| 问题 | 解决方案 |
|------|----------|
| 热更新不生效 | 重启开发服务器 |
| 缓存问题 | 清除浏览器缓存或使用隐私模式 |
| Capacitor 不同步 | 运行 `npx cap sync` |
| 构建失败 | 检查 Node.js 版本，清理 node_modules 重装 |

---

## 12. 常用命令速查

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览生产构建 |
| `npm run lint` | 代码检查 |
| `npm run test` | 运行测试 |
| `npx cap sync` | 同步到原生平台 |
| `npx cap open` | 打开原生 IDE |
