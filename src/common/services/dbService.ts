import { Capacitor } from '@capacitor/core';
import { secureStorage } from '../../utils/secureStorage';

// 当前用户上下文
let currentUserId: number | null = null;

// 检测是否在移动端
const isNative = Capacitor.isNativePlatform();

// 数据库初始化
async function initDatabase() {
  if (isNative) {
    try {
      const { CapacitorSQLite, SQLiteDBConnection } = await import('@capacitor-community/sqlite');
      const sqlite = CapacitorSQLite as any;
      
      // 创建数据库
      await sqlite.createConnection({
        database: 'growthos',
        encrypted: false,
        mode: 'no-encryption',
        version: 1,
        readerVersion: 1
      });
      
      // 获取数据库连接
      const db = await sqlite.retrieveConnection('growthos');
      
      // 创建表结构
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS growth_trees (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
        
        CREATE TABLE IF NOT EXISTS tree_nodes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tree_id INTEGER NOT NULL,
          parent_id INTEGER,
          name TEXT NOT NULL,
          type TEXT NOT NULL,
          mastery INTEGER DEFAULT 0,
          status TEXT DEFAULT 'not_started',
          start_date DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (tree_id) REFERENCES growth_trees (id),
          FOREIGN KEY (parent_id) REFERENCES tree_nodes (id)
        );
        
        CREATE TABLE IF NOT EXISTS records (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          date DATE NOT NULL,
          mood TEXT,
          reflection TEXT,
          activity TEXT,
          learning TEXT,
          tags TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
        
        CREATE TABLE IF NOT EXISTS goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          target_value INTEGER NOT NULL DEFAULT 0,
          current_value INTEGER NOT NULL DEFAULT 0,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
        
        CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          time TEXT NOT NULL,
          is_completed BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        );
      `);
      
      return db;
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      throw error;
    }
  } else {
    // Web 模式：使用 secureStorage 模拟
    console.log('Web mode: Using secureStorage for data persistence');
    return null;
  }
}

// 设置当前用户
export function setCurrentUser(userId: number) {
  currentUserId = userId;
}

// 获取当前用户
export function getCurrentUser() {
  return currentUserId;
}

// 清除当前用户
export function clearCurrentUser() {
  currentUserId = null;
}

// 导出数据库初始化函数
export { initDatabase };
export default { initDatabase, setCurrentUser, getCurrentUser, clearCurrentUser };
