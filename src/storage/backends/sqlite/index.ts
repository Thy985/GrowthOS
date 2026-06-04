/**
 * SQLite backend barrel
 *
 * 用法：
 *   import { SqliteAdapter, InMemorySqliteClient, createPlatformSqliteClient } from '@/storage/backends/sqlite';
 */

export { SqliteAdapter } from '../SqliteAdapter';
export {
  InMemorySqliteClient,
  isNativePlatform,
  createPlatformSqliteClient,
  type SqliteClient,
  type SqliteSchema,
  type SqliteTableName,
  type SortDirection,
} from './SqliteClient';
