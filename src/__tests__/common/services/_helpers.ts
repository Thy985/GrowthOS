/**
 * 共享的 Repository 工厂（测试用）
 *
 * 用法：
 *   const records = createTestRepository<GrowthRecord>('records');
 *   __setRecordRepositoryForTest(records);
 *   // ... 跑 service
 *   records.clear();
 */

import { createInMemoryRepository, type ReadWriteRepository } from '../../../common/repositories/repository';

export function createTestRepository<T extends { id: string }>(): ReadWriteRepository<T> {
  return createInMemoryRepository<T>();
}
