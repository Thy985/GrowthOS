declare const secureStorage: {
  encryptionEnabled: boolean;
  setItem(key: string, value: unknown): boolean;
  getItem<T = unknown>(key: string, defaultValue?: T | null): T | null;
  removeItem(key: string): boolean;
  clear(): boolean;
  setEncryptionEnabled(enabled: boolean): void;
};

export default secureStorage;
export { secureStorage };
