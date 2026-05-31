import authReducer, { clearError } from '../../store/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false
  };

  describe('reducer', () => {
    test('should return the initial state', () => {
      const result = authReducer(undefined, { type: 'unknown' });
      expect(result).toEqual(initialState);
    });

    test('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error message'
      };
      
      const result = authReducer(stateWithError, clearError());
      expect(result.error).toBeNull();
    });
  });

  describe('login action', () => {
    test('should set loading state when login is pending', () => {
      const action = { type: 'auth/login/pending' };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should set user when login is fulfilled', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2024-01-01'
      };
      const action = {
        type: 'auth/login/fulfilled',
        payload: user
      };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.user).toEqual(user);
      expect(result.isAuthenticated).toBe(true);
    });

    test('should set error when login is rejected', () => {
      const action = {
        type: 'auth/login/rejected',
        error: { message: 'Login failed' }
      };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Login failed');
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('register action', () => {
    test('should set loading state when register is pending', () => {
      const action = { type: 'auth/register/pending' };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should set user when register is fulfilled', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2024-01-01'
      };
      const action = {
        type: 'auth/register/fulfilled',
        payload: user
      };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.user).toEqual(user);
      expect(result.isAuthenticated).toBe(true);
    });

    test('should set error when register is rejected', () => {
      const action = {
        type: 'auth/register/rejected',
        error: { message: 'Registration failed' }
      };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Registration failed');
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('logout action', () => {
    test('should set loading state when logout is pending', () => {
      const loggedInState = {
        ...initialState,
        user: { id: '1', email: 'test@example.com', createdAt: '2024-01-01' },
        isAuthenticated: true
      };
      const action = { type: 'auth/logout/pending' };
      const result = authReducer(loggedInState, action);
      
      expect(result.isLoading).toBe(true);
    });

    test('should clear user when logout is fulfilled', () => {
      const loggedInState = {
        ...initialState,
        user: { id: '1', email: 'test@example.com', createdAt: '2024-01-01' },
        isAuthenticated: true
      };
      const action = { type: 'auth/logout/fulfilled' };
      const result = authReducer(loggedInState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    test('should set error when logout is rejected', () => {
      const action = {
        type: 'auth/logout/rejected',
        error: { message: 'Logout failed' }
      };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Logout failed');
    });
  });

  describe('checkAuth action', () => {
    test('should set loading state when checkAuth is pending', () => {
      const action = { type: 'auth/checkAuth/pending' };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(true);
    });

    test('should set user when checkAuth is fulfilled with user', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: '2024-01-01'
      };
      const action = {
        type: 'auth/checkAuth/fulfilled',
        payload: user
      };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.user).toEqual(user);
      expect(result.isAuthenticated).toBe(true);
    });

    test('should clear user when checkAuth is fulfilled with null', () => {
      const loggedInState = {
        ...initialState,
        user: { id: '1', email: 'test@example.com', createdAt: '2024-01-01' },
        isAuthenticated: true
      };
      const action = {
        type: 'auth/checkAuth/fulfilled',
        payload: null
      };
      const result = authReducer(loggedInState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });

    test('should set error when checkAuth is rejected', () => {
      const action = {
        type: 'auth/checkAuth/rejected',
        error: { message: 'Check auth failed' }
      };
      const result = authReducer(initialState, action);
      
      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Check auth failed');
    });
  });
});
