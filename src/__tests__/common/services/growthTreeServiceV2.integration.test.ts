/**
 * growthTreeServiceV2 集成测试
 *
 * 覆盖：
 * - 树的 CRUD（create / getById / getAll / update / delete）
 * - 节点增删改（addTreeNode / updateTreeNode / deleteTreeNode）
 * - 节点操作时正确维护父树的 updatedAt
 * - 找不到时抛 StorageError
 */

import {
  getGrowthTrees,
  getGrowthTreeById,
  createGrowthTree,
  updateGrowthTree,
  deleteGrowthTree,
  addTreeNode,
  updateTreeNode,
  deleteTreeNode,
  __setGrowthTreeRepositoryForTest,
  __resetGrowthTreeRepositoryForTest,
} from '../../../common/services/growthTreeServiceV2';
import { createTestRepository } from './_helpers';
import type { ReadWriteRepository } from '../../../common/repositories/repository';
import type { Tree, TreeNode } from '../../../types';

let repo: ReadWriteRepository<Tree>;

const nodeInput = (overrides: Partial<Omit<TreeNode, 'id' | 'treeId' | 'createdAt'>> = {}): Omit<TreeNode, 'id' | 'treeId' | 'createdAt'> => ({
  name: 'Learn TypeScript',
  type: 'skill',
  mastery: 0,
  status: 'not_started',
  parentId: null,
  ...overrides,
});

beforeEach(() => {
  __resetGrowthTreeRepositoryForTest();
  repo = createTestRepository<Tree>();
  __setGrowthTreeRepositoryForTest(repo);
});

afterEach(() => {
  __resetGrowthTreeRepositoryForTest();
});

describe('growthTreeServiceV2 (Step 8: ReadWriteRepository path)', () => {
  describe('Tree CRUD', () => {
    it('createGrowthTree assigns id, createdAt, updatedAt, empty children', async () => {
      const tree = await createGrowthTree('Frontend Mastery');
      expect(tree.id).toBeTruthy();
      expect(tree.name).toBe('Frontend Mastery');
      expect(tree.createdAt).toBeTruthy();
      expect(tree.updatedAt).toBeTruthy();
      expect(tree.children).toEqual([]);
    });

    it('getGrowthTreeById returns null when not found', async () => {
      expect(await getGrowthTreeById('nope')).toBeNull();
    });

    it('getGrowthTreeById returns the tree when exists', async () => {
      const t = await createGrowthTree('T');
      expect((await getGrowthTreeById(t.id))?.name).toBe('T');
    });

    it('getGrowthTrees returns all trees sorted by updatedAt desc', async () => {
      const a = await createGrowthTree('A');
      // ensure 时间顺序可分辨
      await new Promise((r) => setTimeout(r, 5));
      const b = await createGrowthTree('B');
      const all = await getGrowthTrees();
      expect(all).toHaveLength(2);
      // 后建的 B 应在前面（updatedAt 更新）
      expect(all[0].id).toBe(b.id);
      expect(all[1].id).toBe(a.id);
    });

    it('updateGrowthTree merges and stamps updatedAt', async () => {
      const t = await createGrowthTree('Original');
      await new Promise((r) => setTimeout(r, 5));
      const updated = await updateGrowthTree(t.id, { name: 'Renamed' });
      expect(updated.name).toBe('Renamed');
      expect(updated.id).toBe(t.id);
      expect(updated.createdAt).toBe(t.createdAt);
      expect(updated.updatedAt).not.toBe(t.updatedAt);
    });

    it('updateGrowthTree throws on non-existent', async () => {
      await expect(updateGrowthTree('nope', { name: 'x' })).rejects.toThrow(/技能树不存在/);
    });

    it('deleteGrowthTree removes the tree', async () => {
      const t = await createGrowthTree('T');
      await deleteGrowthTree(t.id);
      expect(await getGrowthTreeById(t.id)).toBeNull();
    });

    it('deleteGrowthTree throws on non-existent', async () => {
      await expect(deleteGrowthTree('nope')).rejects.toThrow(/技能树不存在/);
    });
  });

  describe('TreeNode operations', () => {
    it('addTreeNode appends a node with id/treeId/createdAt and updates parent updatedAt', async () => {
      const tree = await createGrowthTree('Parent');
      const oldUpdatedAt = tree.updatedAt;
      await new Promise((r) => setTimeout(r, 5));

      const node = await addTreeNode(tree.id, nodeInput({ name: 'Child 1' }));

      expect(node.id).toBeTruthy();
      expect(node.treeId).toBe(tree.id);
      expect(node.createdAt).toBeTruthy();
      expect(node.name).toBe('Child 1');

      const reloaded = await getGrowthTreeById(tree.id);
      expect(reloaded?.children).toHaveLength(1);
      expect(reloaded?.children?.[0]?.id).toBe(node.id);
      expect(reloaded?.updatedAt).not.toBe(oldUpdatedAt);
    });

    it('addTreeNode throws on non-existent tree', async () => {
      await expect(addTreeNode('nope', nodeInput())).rejects.toThrow(/技能树不存在/);
    });

    it('updateTreeNode merges and stamps updatedAt on the node', async () => {
      const tree = await createGrowthTree('T');
      const node = await addTreeNode(tree.id, nodeInput({ mastery: 10 }));

      const updated = await updateTreeNode(node.id, { mastery: 50, status: 'in_progress' });

      expect(updated.id).toBe(node.id);
      expect(updated.treeId).toBe(tree.id);
      expect(updated.createdAt).toBe(node.createdAt);
      expect(updated.mastery).toBe(50);
      expect(updated.status).toBe('in_progress');
      expect(updated.updatedAt).toBeTruthy();
    });

    it('updateTreeNode throws on non-existent node', async () => {
      await expect(updateTreeNode('nope', { mastery: 50 })).rejects.toThrow(/节点不存在/);
    });

    it('deleteTreeNode removes the node from children', async () => {
      const tree = await createGrowthTree('T');
      const n1 = await addTreeNode(tree.id, nodeInput({ name: 'A' }));
      await addTreeNode(tree.id, nodeInput({ name: 'B' }));

      await deleteTreeNode(n1.id);

      const reloaded = await getGrowthTreeById(tree.id);
      expect(reloaded?.children).toHaveLength(1);
      expect(reloaded?.children?.[0]?.name).toBe('B');
    });

    it('deleteTreeNode throws on non-existent node', async () => {
      await expect(deleteTreeNode('nope')).rejects.toThrow(/节点不存在/);
    });

    it('updateTreeNode and deleteTreeNode touch the parent tree updatedAt', async () => {
      const tree = await createGrowthTree('T');
      const node = await addTreeNode(tree.id, nodeInput());
      const t1 = (await getGrowthTreeById(tree.id))?.updatedAt;

      await new Promise((r) => setTimeout(r, 5));
      await updateTreeNode(node.id, { mastery: 20 });
      const t2 = (await getGrowthTreeById(tree.id))?.updatedAt;
      expect(t2).not.toBe(t1);

      await new Promise((r) => setTimeout(r, 5));
      await deleteTreeNode(node.id);
      const t3 = (await getGrowthTreeById(tree.id))?.updatedAt;
      expect(t3).not.toBe(t2);
    });

    it('updateTreeNode searches across multiple trees', async () => {
      const treeA = await createGrowthTree('A');
      const treeB = await createGrowthTree('B');
      const nodeB = await addTreeNode(treeB.id, nodeInput({ name: 'B-node' }));

      const updated = await updateTreeNode(nodeB.id, { mastery: 99 });
      expect(updated.treeId).toBe(treeB.id);
      // treeA 不应被改
      const reloadedA = await getGrowthTreeById(treeA.id);
      expect(reloadedA?.children).toEqual([]);
    });
  });

  describe('Regression: same interface as V1 callers expect', () => {
    it('returns Tree[] (with children embedded) for aiTools.getGrowthTrees', async () => {
      const tree = await createGrowthTree('Demo');
      await addTreeNode(tree.id, nodeInput({ name: 'N1' }));
      await addTreeNode(tree.id, nodeInput({ name: 'N2' }));

      const trees = await getGrowthTrees();
      expect(trees).toHaveLength(1);
      expect(trees[0].children).toHaveLength(2);
      expect(trees[0].children?.map((c) => c.name)).toEqual(['N1', 'N2']);
    });
  });
});
