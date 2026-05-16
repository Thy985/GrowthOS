# PWA 离线增强实施计划

## 概述

本文档是基于 `2026-06-09-pwa-offline-design.md` 的详细实施计划。

## 实施步骤

### Phase 1: 基础架构

- [ ] 1.1 安装 `idb` 库（IndexedDB Promise 封装）
- [ ] 1.2 创建 `src/utils/offlineStorage.ts` - IndexedDB 服务
  - [ ] 定义数据库 schema
  - [ ] 实现 init/CRUD/查询方法
  - [ ] 添加版本迁移支持
- [ ] 1.3 创建 `src/utils/networkDetector.ts` - 网络状态检测
  - [ ] 检测 online/offline 事件
  - [ ] 提供 useNetworkStatus hook

### Phase 2: 同步队列

- [ ] 2.1 创建 `src/utils/syncQueue.ts` - 同步队列管理
  - [ ] addToQueue() - 添加操作到队列
  - [ ] processQueue() - 处理队列
  - [ ] retry failed 操作
  - [ ] 冲突检测逻辑
- [ ] 2.2 创建 `src/store/slices/syncSlice.ts` - Redux 同步状态
  - [ ] pendingCount 状态
  - [ ] isSyncing 状态
  - [ ] conflicts 列表
  - [ ] sync/resolveConflict actions

### Phase 3: Service Worker

- [ ] 3.1 重写 `public/service-worker.js`
  - [ ] 动态获取构建资源列表
  - [ ] Stale While Revalidate 策略
  - [ ] API 请求不缓存
- [ ] 3.2 更新 `vite.config.ts` 输出 SW 文件清单
- [ ] 3.3 创建离线回退页面 `public/offline.html`

### Phase 4: UI 组件

- [ ] 4.1 创建 `src/components/OfflineIndicator.tsx`
  - [ ] 显示离线状态
  - [ ] 待同步数量徽章
  - [ ] 触发同步按钮
- [ ] 4.2 创建 `src/components/SyncPanel.tsx`
  - [ ] 待同步列表
  - [ ] 选择性同步
  - [ ] 清除队列选项
- [ ] 4.3 创建 `src/components/ConflictModal.tsx`
  - [ ] 本地 vs 服务器对比
  - [ ] 选择保留版本
  - [ ] 合并选项
- [ ] 4.4 创建 `src/hooks/useOfflineStatus.ts`
- [ ] 4.5 创建 `src/hooks/useSyncQueue.ts`

### Phase 5: 数据层集成

- [ ] 5.1 更新记录存储 - 使用 IndexedDB
- [ ] 5.2 更新目标存储 - 使用 IndexedDB
- [ ] 5.3 更新提醒存储 - 使用 IndexedDB
- [ ] 5.4 集成同步队列到 CRUD 操作

### Phase 6: App 集成

- [ ] 6.1 在 App.jsx 添加 OfflineIndicator
- [ ] 6.2 添加 SyncPanel 抽屉组件
- [ ] 6.3 更新 index.html - 完善 PWA 标签

### Phase 7: 测试验证

- [ ] 7.1 构建并测试 `npm run build`
- [ ] 7.2 验证 Service Worker 注册
- [ ] 7.3 测试离线模式
- [ ] 7.4 测试同步功能

---

## 验证命令

```bash
# 构建
npm run build

# 预览
npm run preview
```

## 预计工作量

- Phase 1-2: 基础架构 ~2 小时
- Phase 3: Service Worker ~1.5 小时
- Phase 4: UI 组件 ~2 小时
- Phase 5-6: 集成 ~2 小时
- Phase 7: 测试 ~1 小时

**总计: ~8.5 小时**
