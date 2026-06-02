import authReducer, { clearError, setUser, checkAuth, login, register, logout } from '../../store/slices/authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    isLoading: false,
    error: null,
    isAuthenticated: false
  };

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2024-01-01'
  };

  describe('reducer - basic actions', () => {
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

    test('should handle setUser', () => {
      const result = authReducer(initialState, setUser(mockUser));
      expect(result.user).toEqual(mockUser);
      expect(result.isAuthenticated).toBe(true);
    });
  });

  describe('login thunk', () => {
    test('should set loading state when login is pending', () => {
      const action = { type: login.pending.type };
      const result = authReducer(initialState, action);

      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should set user when login is fulfilled', () => {
      const action = {
        type: login.fulfilled.type,
        payload: { user: mockUser, token: 'test-token' }
      };
      const result = authReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.user).toEqual(mockUser);
      expect(result.isAuthenticated).toBe(true);
    });

    test('should set error when login is rejected', () => {
      const action = {
        type: login.rejected.type,
        payload: 'Login failed'
      };
      const result = authReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Login failed');
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('register thunk', () => {
    test('should set loading state when register is pending', () => {
      const action = { type: register.pending.type };
      const result = authReducer(initialState, action);

      expect(result.isLoading).toBe(true);
      expect(result.error).toBeNull();
    });

    test('should set user when register is fulfilled', () => {
      const action = {
        type: register.fulfilled.type,
        payload: { user: mockUser, token: 'test-token' }
      };
      const result = authReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.user).toEqual(mockUser);
      expect(result.isAuthenticated).toBe(true);
    });

    test('should set error when register is rejected', () => {
      const action = {
        type: register.rejected.type,
        payload: 'Registration failed'
      };
      const result = authReducer(initialState, action);

      expect(result.isLoading).toBe(false);
      expect(result.error).toBe('Registration failed');
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('logout thunk', () => {
    test('should clear user when logout is fulfilled', () => {
      const loggedInState = {
        ...initialState,
        user: mockUser,
        isAuthenticated: true
      };
      const action = { type: logout.fulfilled.type };
      const result = authReducer(loggedInState, action);

      expect(result.isLoading).toBe(false);
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth action', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    test('should set user from localStorage', () => {
      localStorage.setItem('user', JSON.stringify(mockUser));
      const result = authReducer(initialState, checkAuth());
      expect(result.user).toEqual(mockUser);
      expect(result.isAuthenticated).toBe(true);
    });

    test('should keep null user when localStorage is empty', () => {
      const result = authReducer(initialState, checkAuth());
      expect(result.user).toBeNull();
      expect(result.isAuthenticated).toBe(false);
    });
  });
});
