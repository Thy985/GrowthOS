/**
 * recordServiceV2 集成测试
 * 验证迁移到 IndexedDB（实际用 InMemory 跑测试）后行为一致
 */

import {
  getRecords,
  getRecordById,
  createRecord,
  updateRecord,
  deleteRecord,
  getTags,
  searchRecords,
  __setRecordRepositoryForTest,
  __resetRecordRepositoryForTest,
} from '../../../common/services/recordServiceV2';
import { createTestRepository } from './_helpers';
import type { ReadWriteRepository } from '../../../common/repositories/repository';
import type { GrowthRecord } from '../../../types';

let repo: ReadWriteRepository<GrowthRecord>;

beforeEach(() => {
  __resetRecordRepositoryForTest();
  repo = createTestRepository<GrowthRecord>();
  __setRecordRepositoryForTest(repo);
});

afterEach(() => {
  __resetRecordRepositoryForTest();
});

describe('recordServiceV2 (Step 2: IndexedDB path)', () => {
  describe('createRecord + getRecords', () => {
    it('creates a record and returns it from getRecords', async () => {
      const created = await createRecord({ activity: 'Studied React hooks' });
      expect(created.id).toBeTruthy();
      expect(created.activity).toBe('Studied React hooks');
      expect(created.mood).toBe('okay'); // DEFAULT_MOOD
      expect(created.category).toBe('other');

      const all = await getRecords();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(created.id);
    });

    it('extracts #tags from activity and learning', async () => {
      const created = await createRecord({
        activity: 'Did some work #react #typescript',
        learning: 'Read about #hooks',
      });
      expect(created.tags).toEqual(expect.arrayContaining(['react', 'typescript', 'hooks']));
    });

    it('merges explicit tags with extracted ones (deduplicated)', async () => {
      const created = await createRecord({
        activity: 'foo #react',
        tags: ['react', 'extra'],
      });
      expect(created.tags).toEqual(expect.arrayContaining(['react', 'extra']));
      expect(created.tags).toHaveLength(2);
    });

    it('returns records sorted by createdAt desc (newest first)', async () => {
      const a = await createRecord({ activity: 'first' });
      // ensure different timestamp
      await new Promise((r) => setTimeout(r, 2));
      const b = await createRecord({ activity: 'second' });
      const all = await getRecords();
      expect(all[0].id).toBe(b.id);
      expect(all[1].id).toBe(a.id);
    });
  });

  describe('getRecordById', () => {
    it('returns the record if it exists', async () => {
      const created = await createRecord({ activity: 'A' });
      const found = await getRecordById(created.id);
      expect(found).toEqual(created);
    });

    it('returns null if not found', async () => {
      const found = await getRecordById('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('updateRecord', () => {
    it('merges updates and stamps updatedAt', async () => {
      const created = await createRecord({ activity: 'old' });
      // 强制时间戳不同（jsdom 计时精度可能到 1ms）
      await new Promise((r) => setTimeout(r, 5));
      const updated = await updateRecord(created.id, { activity: 'new', mood: 'great' });
      expect(updated.activity).toBe('new');
      expect(updated.mood).toBe('great');
      expect(updated.id).toBe(created.id);
      expect(updated.createdAt).toBe(created.createdAt);
      expect(updated.updatedAt).toBeTruthy();
      // updatedAt 不早于 createdAt
      expect(updated.updatedAt! >= created.createdAt).toBe(true);
    });

    it('throws on non-existent id', async () => {
      await expect(updateRecord('nope', { activity: 'x' })).rejects.toThrow(/不存在/);
    });
  });

  describe('deleteRecord', () => {
    it('removes a record', async () => {
      const a = await createRecord({ activity: 'A' });
      const b = await createRecord({ activity: 'B' });
      await deleteRecord(a.id);
      const all = await getRecords();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(b.id);
    });

    it('throws on non-existent id', async () => {
      await expect(deleteRecord('nope')).rejects.toThrow(/不存在/);
    });
  });

  describe('getTags', () => {
    it('returns unique tags across records', async () => {
      await createRecord({ activity: 'a #foo #bar' });
      await createRecord({ activity: 'b #bar #baz' });
      const tags = await getTags();
      expect(tags.sort()).toEqual(['bar', 'baz', 'foo']);
    });
  });

  describe('searchRecords', () => {
    it('returns all on empty query', async () => {
      await createRecord({ activity: 'a' });
      await createRecord({ activity: 'b' });
      const r = await searchRecords('');
      expect(r).toHaveLength(2);
    });

    it('matches in activity field', async () => {
      await createRecord({ activity: 'learned TypeScript' });
      await createRecord({ activity: 'played games' });
      const r = await searchRecords('typescript');
      expect(r).toHaveLength(1);
      expect(r[0].activity).toBe('learned TypeScript');
    });

    it('matches in tags (case-insensitive)', async () => {
      await createRecord({ activity: 'a', tags: ['React', 'TypeScript'] });
      await createRecord({ activity: 'b', tags: ['Python'] });
      const r = await searchRecords('react');
      expect(r).toHaveLength(1);
    });
  });
});
