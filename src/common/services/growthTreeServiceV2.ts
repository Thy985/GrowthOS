import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';
import { STORAGE_KEYS } from '../../constants';
import type { Tree, TreeNode } from '../../types';

const isNative = Capacitor.isNativePlatform();

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 加载成长树
export async function getGrowthTrees(): Promise<Tree[]> {
  if (isNative) {
    throw new Error('Native SQLite getGrowthTrees not implemented yet');
  } else {
    const trees = secureStorage.getItem<Tree[]>(STORAGE_KEYS.TREES) || [];
    return trees;
  }
}

// 创建成长树
export async function createGrowthTree(name: string): Promise<Tree> {
  if (isNative) {
    throw new Error('Native SQLite createGrowthTree not implemented yet');
  } else {
    const trees = secureStorage.getItem<Tree[]>(STORAGE_KEYS.TREES) || [];
    const newTree: Tree = {
      id: generateId(),
      name,
      createdAt: new Date().toISOString(),
      children: []
    };
    
    trees.push(newTree);
    secureStorage.setItem(STORAGE_KEYS.TREES, trees);
    
    return newTree;
  }
}

// 删除成长树
export async function deleteGrowthTree(id: string): Promise<void> {
  if (isNative) {
    throw new Error('Native SQLite deleteGrowthTree not implemented yet');
  } else {
    const trees = secureStorage.getItem<Tree[]>(STORAGE_KEYS.TREES) || [];
    const updatedTrees = trees.filter((t: Tree) => t.id !== id);
    secureStorage.setItem(STORAGE_KEYS.TREES, updatedTrees);
  }
}

// 添加节点
export async function addTreeNode(treeId: string, node: Omit<TreeNode, 'id' | 'treeId' | 'createdAt'>): Promise<TreeNode> {
  if (isNative) {
    throw new Error('Native SQLite addTreeNode not implemented yet');
  } else {
    const trees = secureStorage.getItem<Tree[]>(STORAGE_KEYS.TREES) || [];
    const treeIndex = trees.findIndex((t: Tree) => t.id === treeId);
    
    if (treeIndex === -1) {
      throw new Error('Tree not found');
    }
    
    const newNode: TreeNode = {
      ...node,
      id: generateId(),
      treeId: treeId,
      createdAt: new Date().toISOString()
    };
    
    if (!trees[treeIndex].children) {
      trees[treeIndex].children = [];
    }
    
    trees[treeIndex].children!.push(newNode);
    secureStorage.setItem(STORAGE_KEYS.TREES, trees);
    
    return newNode;
  }
}

// 更新节点
export async function updateTreeNode(nodeId: string, updates: Partial<Omit<TreeNode, 'id' | 'treeId' | 'createdAt'>>): Promise<TreeNode> {
  if (isNative) {
    throw new Error('Native SQLite updateTreeNode not implemented yet');
  } else {
    const trees = secureStorage.getItem<Tree[]>(STORAGE_KEYS.TREES) || [];
    
    for (let i = 0; i < trees.length; i++) {
      if (trees[i].children) {
        const nodeIndex = trees[i].children!.findIndex((n: TreeNode) => n.id === nodeId);
        if (nodeIndex !== -1) {
          trees[i].children![nodeIndex] = {
            ...trees[i].children![nodeIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          secureStorage.setItem(STORAGE_KEYS.TREES, trees);
          return trees[i].children![nodeIndex];
        }
      }
    }
    
    throw new Error('Node not found');
  }
}

// 删除节点
export async function deleteTreeNode(nodeId: string): Promise<void> {
  if (isNative) {
    throw new Error('Native SQLite deleteTreeNode not implemented yet');
  } else {
    const trees = secureStorage.getItem<Tree[]>(STORAGE_KEYS.TREES) || [];
    
    for (let i = 0; i < trees.length; i++) {
      if (trees[i].children) {
        const initialLength = trees[i].children!.length;
        trees[i].children = trees[i].children!.filter((n: TreeNode) => n.id !== nodeId);
        
        if (trees[i].children!.length !== initialLength) {
          secureStorage.setItem(STORAGE_KEYS.TREES, trees);
          return;
        }
      }
    }
    
    throw new Error('Node not found');
  }
}

export default {
  getGrowthTrees,
  createGrowthTree,
  deleteGrowthTree,
  addTreeNode,
  updateTreeNode,
  deleteTreeNode
};
