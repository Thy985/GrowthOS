/**
 * growthTreeServiceV2
 *
 * 技能树（growth tree）的业务服务。
 *
 * Step 8 改造：脱离 secureStorage 旧架构，改用 ReadWriteRepository。
 * - 默认 backend = IndexedDB（store: 'trees'）
 * - 用户切到 LocalStorage → key: 'growth-trees'
 * - In-Memory：纯内存（测试）
 *
 * 设计：
 * - 整个 Tree（含 children 节点）作为一条记录存放
 * - 节点增删改都通过 get → 改 children → put 整棵树实现
 * - 节点数一般 < 100，性能完全够用
 */

import { Capacitor } from '@capacitor/core';
import type { Tree, TreeNode } from '../../types';
import { createIndexedDbRepository, createLocalStorageRepository, createInMemoryRepository, createSqliteRepository, type ReadWriteRepository } from '../repositories/repository';
import { getStorageBackendConfig } from '../../storage/config';
import { StorageError } from '../../storage';

const isNative = Capacitor.isNativePlatform();

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function ensureNativeOrThrow(): void {
  if (isNative) {
    throw new Error('Native SQLite not implemented yet');
  }
}

// 单例 Repository（懒初始化，按当前 backend config 选后端）
let repositoryInstance: ReadWriteRepository<Tree> | null = null;

function getRepository(): ReadWriteRepository<Tree> {
  if (!repositoryInstance) {
    const kind = getStorageBackendConfig().getStorageBackend();
    switch (kind) {
      case 'indexeddb':
        repositoryInstance = createIndexedDbRepository<Tree>('trees', { cache: true, sync: true });
        break;
      case 'localStorage':
        repositoryInstance = createLocalStorageRepository<Tree>('growth-trees', { cache: true, sync: true });
        break;
      case 'inMemory':
        repositoryInstance = createInMemoryRepository<Tree>({ cache: false, sync: false });
        break;
      case 'sqlite':
        repositoryInstance = createSqliteRepository<Tree>('trees', { cache: true, sync: true });
        break;
    }
  }
  return repositoryInstance;
}

/** 默认按 updatedAt 倒序返回（与旧行为一致：旧实现是 push 顺序，新实现按最近更新） */
export async function getGrowthTrees(): Promise<Tree[]> {
  ensureNativeOrThrow();
  const repo = getRepository();
  const all = await repo.getAll();
  return all.sort((a, b) => {
    const at = a.updatedAt ?? a.createdAt;
    const bt = b.updatedAt ?? b.createdAt;
    return at < bt ? 1 : -1;
  });
}

export async function getGrowthTreeById(id: string): Promise<Tree | null> {
  ensureNativeOrThrow();
  return getRepository().get(id);
}

export async function createGrowthTree(name: string): Promise<Tree> {
  ensureNativeOrThrow();

  const now = new Date().toISOString();
  const newTree: Tree = {
    id: generateId(),
    name,
    createdAt: now,
    updatedAt: now,
    children: [],
  };

  await getRepository().put(newTree);
  return newTree;
}

export async function deleteGrowthTree(id: string): Promise<void> {
  ensureNativeOrThrow();
  const repo = getRepository();
  const existed = await repo.delete(id);
  if (!existed) {
    throw new StorageError('NOT_FOUND', '技能树不存在', { details: { id } });
  }
}

export async function updateGrowthTree(
  id: string,
  updates: Partial<Omit<Tree, 'id' | 'createdAt' | 'children'>>,
): Promise<Tree> {
  ensureNativeOrThrow();

  const repo = getRepository();
  const current = await repo.get(id);
  if (!current) {
    throw new StorageError('NOT_FOUND', '技能树不存在', { details: { id } });
  }

  const next: Tree = {
    ...current,
    ...updates,
    id: current.id,
    createdAt: current.createdAt,
    children: current.children ?? [],
    updatedAt: new Date().toISOString(),
  };
  await repo.put(next);
  return next;
}

/** 添加节点到指定树 */
export async function addTreeNode(
  treeId: string,
  node: Omit<TreeNode, 'id' | 'treeId' | 'createdAt'>,
): Promise<TreeNode> {
  ensureNativeOrThrow();

  const repo = getRepository();
  const tree = await repo.get(treeId);
  if (!tree) {
    throw new StorageError('NOT_FOUND', '技能树不存在', { details: { treeId } });
  }

  const now = new Date().toISOString();
  const newNode: TreeNode = {
    ...node,
    id: generateId(),
    treeId,
    createdAt: now,
  };

  const children = tree.children ?? [];
  const next: Tree = {
    ...tree,
    children: [...children, newNode],
    updatedAt: now,
  };
  await repo.put(next);
  return newNode;
}

/** 更新树内某节点（按 nodeId 找） */
export async function updateTreeNode(
  nodeId: string,
  updates: Partial<Omit<TreeNode, 'id' | 'treeId' | 'createdAt'>>,
): Promise<TreeNode> {
  ensureNativeOrThrow();

  const repo = getRepository();
  const allTrees = await repo.getAll();

  for (const tree of allTrees) {
    if (!tree.children) continue;
    const idx = tree.children.findIndex((n) => n.id === nodeId);
    if (idx !== -1) {
      const oldNode = tree.children[idx];
      const newNode: TreeNode = {
        ...oldNode,
        ...updates,
        id: oldNode.id,
        treeId: oldNode.treeId,
        createdAt: oldNode.createdAt,
        updatedAt: new Date().toISOString(),
      };
      const nextChildren = [...tree.children];
      nextChildren[idx] = newNode;
      await repo.put({
        ...tree,
        children: nextChildren,
        updatedAt: new Date().toISOString(),
      });
      return newNode;
    }
  }

  throw new StorageError('NOT_FOUND', '节点不存在', { details: { nodeId } });
}

/** 删除树内某节点（按 nodeId 找） */
export async function deleteTreeNode(nodeId: string): Promise<void> {
  ensureNativeOrThrow();

  const repo = getRepository();
  const allTrees = await repo.getAll();

  for (const tree of allTrees) {
    if (!tree.children) continue;
    const initialLength = tree.children.length;
    const nextChildren = tree.children.filter((n) => n.id !== nodeId);
    if (nextChildren.length !== initialLength) {
      await repo.put({
        ...tree,
        children: nextChildren,
        updatedAt: new Date().toISOString(),
      });
      return;
    }
  }

  throw new StorageError('NOT_FOUND', '节点不存在', { details: { nodeId } });
}

/** 测试用：重置单例（让测试可以替换后端） */
export function __resetGrowthTreeRepositoryForTest(): void {
  repositoryInstance = null;
}

/** 测试用：注入 Repository */
export function __setGrowthTreeRepositoryForTest(repo: ReadWriteRepository<Tree> | null): void {
  repositoryInstance = repo;
}

const growthTreeServiceV2 = {
  getGrowthTrees,
  getGrowthTreeById,
  createGrowthTree,
  updateGrowthTree,
  deleteGrowthTree,
  addTreeNode,
  updateTreeNode,
  deleteTreeNode,
};

export default growthTreeServiceV2;
