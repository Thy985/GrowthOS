import { SecureEncryption } from '../../utils/secureEncryption';

describe('SecureEncryption', () => {
  let encryption: SecureEncryption;
  const testDeviceId = 'test-device-123';

  beforeEach(() => {
    encryption = new SecureEncryption();
    localStorage.clear();
  });

  afterEach(() => {
    encryption.clearSalt();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with a device ID', async () => {
      await encryption.initialize(testDeviceId);
      
      expect(localStorage.getItem('_encryption_salt')).toBeTruthy();
    });

    it('should reuse existing salt if available', async () => {
      const salt = 'dGVzdC5zYWx0LnZhbHVl';
      localStorage.setItem('_encryption_salt', salt);
      
      await encryption.initialize(testDeviceId);
      
      expect(localStorage.getItem('_encryption_salt')).toBe(salt);
    });

    it('should generate a new salt if none exists', async () => {
      await encryption.initialize(testDeviceId);
      
      const storedSalt = localStorage.getItem('_encryption_salt');
      expect(storedSalt).toBeTruthy();
      expect(storedSalt).not.toBe('dGVzdC5zYWx0LnZhbHVl');
    });
  });

  describe('encryption', () => {
    beforeEach(async () => {
      await encryption.initialize(testDeviceId);
    });

    it('should encrypt string data', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryption.encrypt(plaintext);
      
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(plaintext);
      expect(typeof encrypted).toBe('string');
    });

    it('should encrypt object data', async () => {
      const data = { key: 'value', number: 42, nested: { foo: 'bar' } };
      const encrypted = await encryption.encrypt(data);
      
      expect(encrypted).toBeTruthy();
      expect(encrypted).not.toBe(JSON.stringify(data));
    });

    it('should encrypt array data', async () => {
      const data = [1, 2, 3, 'four', { five: 5 }];
      const encrypted = await encryption.encrypt(data);
      
      expect(encrypted).toBeTruthy();
    });

    it('should encrypt number data', async () => {
      const data = 42;
      const encrypted = await encryption.encrypt(data);
      
      expect(encrypted).toBeTruthy();
    });

    it('should encrypt null and undefined', async () => {
      const encryptedNull = await encryption.encrypt(null);
      const encryptedUndefined = await encryption.encrypt(undefined);
      
      expect(encryptedNull).toBeTruthy();
      expect(encryptedUndefined).toBeTruthy();
    });

    it('should produce different ciphertexts for same input (due to random IV)', async () => {
      const plaintext = 'Same text';
      const encrypted1 = await encryption.encrypt(plaintext);
      const encrypted2 = await encryption.encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should fail to encrypt without initialization', async () => {
      const uninitializedEncryption = new SecureEncryption();
      const result = await uninitializedEncryption.encrypt('test');
      
      expect(result).toBeNull();
    });
  });

  describe('decryption', () => {
    beforeEach(async () => {
      await encryption.initialize(testDeviceId);
    });

    it('should decrypt encrypted string data', async () => {
      const plaintext = 'Hello, World!';
      const encrypted = await encryption.encrypt(plaintext);
      const decrypted = await encryption.decrypt<string>(encrypted!);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should decrypt encrypted object data', async () => {
      const data = { key: 'value', number: 42 };
      const encrypted = await encryption.encrypt(data);
      const decrypted = await encryption.decrypt<typeof data>(encrypted!);
      
      expect(decrypted).toEqual(data);
    });

    it('should decrypt encrypted array data', async () => {
      const data = [1, 2, 3, 'four'];
      const encrypted = await encryption.encrypt(data);
      const decrypted = await encryption.decrypt<typeof data>(encrypted!);
      
      expect(decrypted).toEqual(data);
    });

    it('should decrypt null and undefined', async () => {
      const encryptedNull = await encryption.encrypt(null);
      const encryptedUndefined = await encryption.encrypt(undefined);
      
      const decryptedNull = await encryption.decrypt(encryptedNull!);
      const decryptedUndefined = await encryption.decrypt(encryptedUndefined!);
      
      expect(decryptedNull).toBeNull();
      expect(decryptedUndefined).toBeUndefined();
    });

    it('should fail to decrypt with wrong device ID', async () => {
      const plaintext = 'Secret data';
      const encrypted = await encryption.encrypt(plaintext);
      
      const newEncryption = new SecureEncryption();
      await newEncryption.initialize('different-device-id');
      
      const decrypted = await newEncryption.decrypt(encrypted!);
      
      expect(decrypted).toBeNull();
    });

    it('should fail to decrypt tampered ciphertext', async () => {
      const plaintext = 'Original text';
      const encrypted = await encryption.encrypt(plaintext);
      
      const tampered = encrypted!.slice(0, -2) + 'XX';
      const decrypted = await encryption.decrypt(tampered);
      
      expect(decrypted).toBeNull();
    });

    it('should fail to decrypt without initialization', async () => {
      const plaintext = 'Secret data';
      const encrypted = await encryption.encrypt(plaintext);
      
      const uninitializedEncryption = new SecureEncryption();
      const decrypted = await uninitializedEncryption.decrypt(encrypted!);
      
      expect(decrypted).toBeNull();
    });
  });

  describe('round-trip encryption', () => {
    beforeEach(async () => {
      await encryption.initialize(testDeviceId);
    });

    it('should handle complex nested objects', async () => {
      const data = {
        user: {
          id: '123',
          name: 'Test User',
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        items: ['a', 'b', 'c'],
        metadata: {
          created: '2024-01-01',
          tags: ['test', 'unit'],
        },
      };

      const encrypted = await encryption.encrypt(data);
      const decrypted = await encryption.decrypt<typeof data>(encrypted!);

      expect(decrypted).toEqual(data);
    });

    it('should handle Unicode characters', async () => {
      const data = {
        chinese: '你好世界',
        japanese: 'こんにちは',
        arabic: 'مرحبا',
        emoji: '👋🎉🚀',
      };

      const encrypted = await encryption.encrypt(data);
      const decrypted = await encryption.decrypt<typeof data>(encrypted!);

      expect(decrypted).toEqual(data);
    });

    it('should handle long strings', async () => {
      const data = 'A'.repeat(10000);

      const encrypted = await encryption.encrypt(data);
      const decrypted = await encryption.decrypt<string>(encrypted!);

      expect(decrypted).toBe(data);
    });

    it('should handle special characters', async () => {
      const data = 'Special: @#$%^&*()_+-=[]{}|;:,.<>?/~`"\'\\';

      const encrypted = await encryption.encrypt(data);
      const decrypted = await encryption.decrypt<string>(encrypted!);

      expect(decrypted).toBe(data);
    });

    it('should handle JSON-like structures', async () => {
      const data = {
        jsonString: '{"key":"value"}',
        arrayString: '[1,2,3]',
        escapedChars: 'Line1\\nLine2',
      };

      const encrypted = await encryption.encrypt(data);
      const decrypted = await encryption.decrypt<typeof data>(encrypted!);

      expect(decrypted).toEqual(data);
    });
  });

  describe('static methods', () => {
    it('should generate unique device IDs', () => {
      const id1 = SecureEncryption.generateDeviceId();
      const id2 = SecureEncryption.generateDeviceId();

      expect(id1).toBeTruthy();
      expect(id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate device IDs with expected format', () => {
      const id = SecureEncryption.generateDeviceId();

      expect(id).toMatch(/^device_/);
    });
  });

  describe('clearSalt', () => {
    it('should clear the salt from storage', async () => {
      await encryption.initialize(testDeviceId);
      
      encryption.clearSalt();
      
      expect(localStorage.getItem('_encryption_salt')).toBeNull();
    });

    it('should prevent decryption after salt is cleared', async () => {
      await encryption.initialize(testDeviceId);
      
      const plaintext = 'Secret data';
      const encrypted = await encryption.encrypt(plaintext);
      
      encryption.clearSalt();
      
      const decrypted = await encryption.decrypt(encrypted!);
      expect(decrypted).toBeNull();
    });
  });
});
