/**
 * 存储层错误模型
 *
 * 设计原则：
 * 1. 业务层只看到 StorageError
 * 2. 错误码枚举，UI 可按码决定怎么显示
 * 3. 保留 cause 便于排查
 */

export type StorageErrorCode =
  | 'NOT_FOUND'             // 实体不存在
  | 'ALREADY_EXISTS'        // 唯一键冲突
  | 'QUOTA_EXCEEDED'        // 配额耗尽
  | 'CORRUPTED_DATA'        // 数据损坏
  | 'SCHEMA_MISMATCH'       // 版本不兼容
  | 'TRANSACTION_ABORTED'   // 事务被中止
  | 'PLATFORM_UNAVAILABLE'  // 后端不可用（如 Safari 隐私模式无 IndexedDB）
  | 'PERMISSION_DENIED'     // 权限被拒
  | 'INVALID_INPUT'         // 输入校验失败
  | 'UNKNOWN';              // 未分类

export interface StorageErrorOptions {
  cause?: unknown,
  details?: Record<string, unknown>,
}

export class StorageError extends Error {
  public readonly code: StorageErrorCode;
  public readonly cause?: unknown;
  public readonly details?: Record<string, unknown>;

  constructor(code: StorageErrorCode, message: string, options: StorageErrorOptions = {}) {
    super(message);
    this.name = 'StorageError';
    this.code = code;
    this.cause = options.cause;
    this.details = options.details;
    // 保留 V8 的 stack trace
    if (typeof (Error as { captureStackTrace?: unknown }).captureStackTrace === 'function') {
      // 第二参数仅用于裁剪 stack，不参与类型契约
      (Error as unknown as { captureStackTrace: (target: object, ctor?: unknown) => void })
        .captureStackTrace(this, StorageError);
    }
  }

  /**
   * 推断底层错误码。
   * 用于 catch (err) 时把 DOMException / QuotaExceededError 等包装为 StorageError。
   */
  static from(err: unknown, fallbackMessage = 'Unknown storage error'): StorageError {
    if (err instanceof StorageError) return err;
    if (err instanceof Error) {
      const name = err.name;
      const message = err.message;
      // 常见 DOM 错误
      if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        return new StorageError('QUOTA_EXCEEDED', message, { cause: err });
      }
      if (name === 'InvalidStateError') {
        return new StorageError('PLATFORM_UNAVAILABLE', message, { cause: err });
      }
      if (name === 'DataCloneError') {
        return new StorageError('INVALID_INPUT', message, { cause: err });
      }
      if (name === 'VersionError') {
        return new StorageError('SCHEMA_MISMATCH', message, { cause: err });
      }
      if (name === 'AbortError') {
        return new StorageError('TRANSACTION_ABORTED', message, { cause: err });
      }
      return new StorageError('UNKNOWN', message || fallbackMessage, { cause: err });
    }
    return new StorageError('UNKNOWN', fallbackMessage, { cause: err });
  }
}

/** 类型守卫：判断是否 StorageError */
export function isStorageError(err: unknown): err is StorageError {
  return err instanceof StorageError;
}
