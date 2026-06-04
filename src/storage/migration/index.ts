/**
 * storage/migration 公开 API
 */
export {
  MIGRATABLE_TABLES,
  migrateTable,
  migrateBetweenBackends,
  estimateMigrationSize,
  type MigratableTable,
  type TableMigrationResult,
  type MigrationOptions,
} from './dataMigrator';
