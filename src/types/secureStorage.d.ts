declare module '../utils/secureStorage' {
  interface SecureStorage {
    encryptionEnabled: boolean;
    setItem(key: string, value: unknown): boolean;
    getItem<T = unknown>(key: string, defaultValue?: T | null): T | null;
    removeItem(key: string): boolean;
    clear(): boolean;
    setEncryptionEnabled(enabled: boolean): void;
  }

  const secureStorage: SecureStorage;
  export default secureStorage;
  export { secureStorage };
}

declare module '../../utils/secureStorage' {
  interface SecureStorage {
    encryptionEnabled: boolean;
    setItem(key: string, value: unknown): boolean;
    getItem<T = unknown>(key: string, defaultValue?: T | null): T | null;
    removeItem(key: string): boolean;
    clear(): boolean;
    setEncryptionEnabled(enabled: boolean): void;
  }

  const secureStorage: SecureStorage;
  export default secureStorage;
  export { secureStorage };
}
