/**
 * MemoryAdapter
 *
 * 用途：运行时"易失"数据（如 UI form draft、临时计算结果）
 * 特点：
 * - 始终在内存
 * - 关闭浏览器 tab 就清空
 * - 用 InMemoryAdapter 实现，逻辑统一
 */

import { InMemoryAdapter } from './InMemoryAdapter';
import type { BaseEntity } from '../types';

export class MemoryAdapter<T extends BaseEntity> extends InMemoryAdapter<T> {
  constructor() {
    super();
    // 立即初始化，调用方无需 await init()
    void this.init();
  }
}
