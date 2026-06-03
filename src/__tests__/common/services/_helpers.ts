/**
 * 共享的 Repository 工厂（测试用）
 *
 * 用法：
 *   const records = createTestRepository<GrowthRecord>('records');
 *   __setRecordRepositoryForTest(records);
 *   // ... 跑 service
 *   records.clear();
 */

import { createInMemoryRepository, type Repository } from '../../../common/repositories/repository';

export function createTestRepository<T extends { id: string }>(): Repository<T> {
  return createInMemoryRepository<T>();
}
