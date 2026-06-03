/**
 * authServiceV2 集成测试
 * - 真实跑 register/login 流程（不再 mock secureStorage）
 * - users 存 InMemory Repository
 * - current user 存另一个 InMemory Repository
 * - tokenManager 用真实对象（不依赖 secureStorage，因为 token 是从空开始生成的）
 */

import {
  register,
  login,
  logout,
  getCurrentUserInfo,
  __setUserRepositoryForTest,
  __setCurrentUserRepositoryForTest,
  __resetAuthRepositoryForTest,
} from '../../../common/services/authServiceV2';
import { createTestRepository } from './_helpers';
import type { ReadWriteRepository } from '../../../common/repositories/repository';
import type { User } from '../../../types';

interface StoredUser {
  id: string,
  email: string,
  passwordHash: string,
  createdAt: string,
}

let userRepo: ReadWriteRepository<StoredUser>;
let currentUserRepo: ReadWriteRepository<User>;

beforeEach(() => {
  __resetAuthRepositoryForTest();
  userRepo = createTestRepository<StoredUser>();
  currentUserRepo = createTestRepository<User>();
  __setUserRepositoryForTest(userRepo);
  __setCurrentUserRepositoryForTest(currentUserRepo);
});

afterEach(() => {
  __resetAuthRepositoryForTest();
});

describe('authServiceV2 (Step 2: IndexedDB path)', () => {
  describe('register', () => {
    it('creates a new user and returns user + token', async () => {
      const { user, token } = await register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Tester',
      });
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Tester');
      expect(token).toBeTruthy();

      // user 真的写进了 IDB
      const all = await userRepo.getAll();
      expect(all).toHaveLength(1);
      expect(all[0].email).toBe('test@example.com');
      expect(all[0].passwordHash).toBeTruthy();
      // 不应回显 passwordHash
      expect((user as unknown as { passwordHash?: string }).passwordHash).toBeUndefined();
    });

    it('rejects duplicate email', async () => {
      await register({ email: 'dup@example.com', password: 'password123' });
      await expect(
        register({ email: 'dup@example.com', password: 'password123' })
      ).rejects.toThrow(/已被注册/);
    });

    it('rejects short password', async () => {
      await expect(
        register({ email: 'a@b.com', password: 'short' })
      ).rejects.toThrow(/至少需要/);
    });

    it('rejects invalid email', async () => {
      await expect(
        register({ email: 'not-an-email', password: 'password123' })
      ).rejects.toThrow(/邮箱格式无效/);
    });

    it('caches current user reference after register', async () => {
      const { user } = await register({
        email: 'a@b.com',
        password: 'password123',
      });
      const cached = await getCurrentUserInfo();
      expect(cached).not.toBeNull();
      expect(cached?.email).toBe(user.email);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await register({ email: 'login@example.com', password: 'password123', name: 'Login User' });
    });

    it('returns user + token on valid credentials', async () => {
      const { user, token } = await login('login@example.com', 'password123');
      expect(user.email).toBe('login@example.com');
      expect(token).toBeTruthy();
    });

    it('rejects wrong password', async () => {
      await expect(
        login('login@example.com', 'wrongpassword')
      ).rejects.toThrow(/邮箱或密码错误/);
    });

    it('rejects unknown email', async () => {
      await expect(
        login('nobody@example.com', 'password123')
      ).rejects.toThrow(/邮箱或密码错误/);
    });

    it('is case-insensitive on email', async () => {
      const { user } = await login('LOGIN@example.com', 'password123');
      expect(user.email).toBe('login@example.com');
    });
  });

  describe('logout', () => {
    it('clears the current user reference', async () => {
      await register({ email: 'a@b.com', password: 'password123' });
      await logout();
      const cached = await getCurrentUserInfo();
      expect(cached).toBeNull();
    });
  });
});
