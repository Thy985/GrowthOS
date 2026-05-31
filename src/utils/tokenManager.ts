import { secureStorage } from './secureStorage';
import { STORAGE_KEYS } from '../constants';
import type { User } from '../types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private expiresAt: number = 0;
  private refreshThreshold: number = 5 * 60 * 1000;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  private constructor() {
    this.loadTokensFromStorage();
  }

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  private async loadTokensFromStorage(): Promise<void> {
    try {
      const tokenData = await secureStorage.getItem<TokenPair>(STORAGE_KEYS.TOKEN);
      if (tokenData) {
        this.accessToken = tokenData.accessToken;
        this.refreshToken = tokenData.refreshToken;
        this.expiresAt = tokenData.expiresAt;
      }
    } catch (error) {
      console.error('Failed to load tokens from storage:', error);
    }
  }

  private async saveTokensToStorage(tokens: TokenPair): Promise<void> {
    try {
      await secureStorage.setItem(STORAGE_KEYS.TOKEN, tokens);
    } catch (error) {
      console.error('Failed to save tokens to storage:', error);
    }
  }

  async generateTokens(user: User): Promise<TokenPair> {
    const now = Date.now();
    const accessTokenExpiry = now + 15 * 60 * 1000;
    const refreshTokenExpiry = now + 7 * 24 * 60 * 60 * 1000;

    const accessToken = await this.createToken(user, 'access', accessTokenExpiry);
    const refreshToken = await this.createToken(user, 'refresh', refreshTokenExpiry);

    const tokenPair: TokenPair = {
      accessToken,
      refreshToken,
      expiresAt: accessTokenExpiry
    };

    await this.saveTokensToStorage(tokenPair);

    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresAt = accessTokenExpiry;

    return tokenPair;
  }

  private async createToken(user: User, type: 'access' | 'refresh', expiresAt: number): Promise<string> {
    const payload: Omit<TokenPayload, 'iat' | 'exp'> & { iat: number; exp: number } = {
      userId: user.id,
      email: user.email,
      type,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(expiresAt / 1000)
    };

    const base64Payload = btoa(JSON.stringify(payload));
    const signature = await this.signData(base64Payload);

    return `${base64Payload}.${signature}`;
  }

  private async signData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(data + 'growthos-secret-key');
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return btoa(String.fromCharCode(...hashArray));
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isTokenExpired(): boolean {
    if (!this.expiresAt) return true;
    return Date.now() >= this.expiresAt;
  }

  isTokenExpiringSoon(): boolean {
    if (!this.expiresAt) return true;
    return Date.now() >= (this.expiresAt - this.refreshThreshold);
  }

  async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) {
      return new Promise((resolve) => {
        this.refreshSubscribers.push(resolve);
      });
    }

    if (!this.refreshToken) {
      return null;
    }

    this.isRefreshing = true;

    try {
      const payload = this.parseToken(this.refreshToken);
      if (!payload || payload.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      if (payload.exp * 1000 < Date.now()) {
        throw new Error('Refresh token expired');
      }

      const user: User = {
        id: payload.userId,
        email: payload.email,
        createdAt: ''
      };

      const newTokens = await this.generateTokens(user);
      
      this.refreshSubscribers.forEach(callback => callback(newTokens.accessToken));
      this.refreshSubscribers = [];

      return newTokens.accessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.refreshSubscribers.forEach(callback => callback(''));
      this.refreshSubscribers = [];
      return null;
    } finally {
      this.isRefreshing = false;
    }
  }

  private parseToken(token: string): TokenPayload | null {
    try {
      const [payloadBase64] = token.split('.');
      if (!payloadBase64) return null;
      
      const payload = JSON.parse(atob(payloadBase64));
      return payload as TokenPayload;
    } catch {
      return null;
    }
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const payload = this.parseToken(token);
      if (!payload) return false;
      
      if (payload.exp * 1000 < Date.now()) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await secureStorage.removeItem(STORAGE_KEYS.TOKEN);
      this.accessToken = null;
      this.refreshToken = null;
      this.expiresAt = 0;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  setRefreshThreshold(minutes: number): void {
    this.refreshThreshold = minutes * 60 * 1000;
  }

  getTokenInfo(): { isValid: boolean; expiresAt: Date | null; isExpiringSoon: boolean } {
    return {
      isValid: !this.isTokenExpired(),
      expiresAt: this.expiresAt ? new Date(this.expiresAt) : null,
      isExpiringSoon: this.isTokenExpiringSoon()
    };
  }
}

export const tokenManager = TokenManager.getInstance();
