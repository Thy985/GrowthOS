import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';

const isNative = Capacitor.isNativePlatform();

interface TreeNode {
  id: number;
  tree_id: number;
  parent_id?: number;
  name: string;
  type: string;
  mastery: number;
  status: string;
  start_date?: string;
  created_at: string;
  updated_at: string;
}

interface GrowthTree {
  id: number;
  name: string;
  created_at: string;
  children?: TreeNode[];
}

// 加载成长树
export async function getGrowthTrees(): Promise<GrowthTree[]> {
  if (isNative) {
    // TODO: 实现原生 SQLite 查询
    throw new Error('Native SQLite getGrowthTrees not implemented yet');
  } else {
    // Web 模式
    const trees = secureStorage.getItem('growth-trees') || [];
    return trees;
  }
}

// 创建成长树
export async function createGrowthTree(name: string): Promise<GrowthTree> {
  if (isNative) {
    // TODO: 实现原生 SQLite 插入
    throw new Error('Native SQLite createGrowthTree not implemented yet');
  } else {
    // Web 模式
    const trees = secureStorage.getItem('growth-trees') || [];
    const newTree: GrowthTree = {
      id: Date.now(),
      name,
      created_at: new Date().toISOString(),
      children: []
    };
    
    trees.push(newTree);
    secureStorage.setItem('growth-trees', trees);
    
    return newTree;
  }
}

// 删除成长树
export async function deleteGrowthTree(id: number): Promise<void> {
  if (isNative) {
    // TODO: 实现原生 SQLite 删除
    throw new Error('Native SQLite deleteGrowthTree not implemented yet');
  } else {
    // Web 模式
    const trees = secureStorage.getItem('growth-trees') || [];
    const updatedTrees = trees.filter((t: any) => t.id !== id);
    secureStorage.setItem('growth-trees', updatedTrees);
  }
}

// 添加节点
export async function addTreeNode(treeId: number, node: Omit<TreeNode, 'id' | 'tree_id' | 'created_at' | 'updated_at'>): Promise<TreeNode> {
  if (isNative) {
    // TODO: 实现原生 SQLite 插入
    throw new Error('Native SQLite addTreeNode not implemented yet');
  } else {
    // Web 模式
    const trees = secureStorage.getItem('growth-trees') || [];
    const treeIndex = trees.findIndex((t: any) => t.id === treeId);
    
    if (treeIndex === -1) {
      throw new Error('Tree not found');
    }
    
    const newNode: TreeNode = {
      ...node,
      id: Date.now(),
      tree_id: treeId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (!trees[treeIndex].children) {
      trees[treeIndex].children = [];
    }
    
    trees[treeIndex].children.push(newNode);
    secureStorage.setItem('growth-trees', trees);
    
    return newNode;
  }
}

// 更新节点
export async function updateTreeNode(nodeId: number, updates: Partial<Omit<TreeNode, 'id' | 'tree_id' | 'created_at'>>): Promise<TreeNode> {
  if (isNative) {
    // TODO: 实现原生 SQLite 更新
    throw new Error('Native SQLite updateTreeNode not implemented yet');
  } else {
    // Web 模式
    const trees = secureStorage.getItem('growth-trees') || [];
    
    for (let i = 0; i < trees.length; i++) {
      if (trees[i].children) {
        const nodeIndex = trees[i].children.findIndex((n: any) => n.id === nodeId);
        if (nodeIndex !== -1) {
          trees[i].children[nodeIndex] = {
            ...trees[i].children[nodeIndex],
            ...updates,
            updated_at: new Date().toISOString()
          };
          secureStorage.setItem('growth-trees', trees);
          return trees[i].children[nodeIndex];
        }
      }
    }
    
    throw new Error('Node not found');
  }
}

// 删除节点
export async function deleteTreeNode(nodeId: number): Promise<void> {
  if (isNative) {
    // TODO: 实现原生 SQLite 删除
    throw new Error('Native SQLite deleteTreeNode not implemented yet');
  } else {
    // Web 模式
    const trees = secureStorage.getItem('growth-trees') || [];
    
    for (let i = 0; i < trees.length; i++) {
      if (trees[i].children) {
        const initialLength = trees[i].children.length;
        trees[i].children = trees[i].children.filter((n: any) => n.id !== nodeId);
        
        if (trees[i].children.length !== initialLength) {
          secureStorage.setItem('growth-trees', trees);
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
