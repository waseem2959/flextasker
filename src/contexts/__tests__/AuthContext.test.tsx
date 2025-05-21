import { renderHook, act } from '@testing-library/react-hooks';
import { AuthProvider } from '../AuthContext';
import { useAuth } from '../../hooks/useAuth'; // Assuming useAuth is in this path
import { USERS } from '../../data/mockData';
import type { ToasterToast } from '../../hooks/use-toast'; // Import necessary types

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock toast
const mockToast = jest.fn();
jest.mock('../../hooks/use-toast', () => ({
  toast: (options: Omit<ToasterToast, "id">) => mockToast(options), // Use correct type
}));

const TEST_USER_PASSWORD = 'password456';
describe('AuthContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    mockToast.mockClear();
  });

  test('should initialize with no user if localStorage is empty', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Initial state
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(true);

    // Wait for useEffect to finish
    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
  });

  test('should initialize with user from localStorage if present', async () => {
    const mockUser = USERS[0]; // Use a mock user
    localStorageMock.setItem('flextasker_user', JSON.stringify(mockUser));

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    // Initial state
    expect(result.current.isAuthenticated).toBe(false); // isAuthenticated is derived, might be false initially
    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(true);

    // Wait for useEffect to finish
    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  test('should handle invalid localStorage data gracefully', async () => {
    localStorageMock.setItem('flextasker_user', 'invalid json');

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitForNextUpdate();

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(result.current.loading).toBe(false);
    // Optionally check for console error if needed, but not strictly necessary for hook state
  });


  test('login should authenticate a valid user', async () => {
    const validUser = USERS[0]; // Use a valid mock user
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitForNextUpdate(); // Wait for initial load

    await act(async () => {
      const success = await result.current.login(validUser.email, 'password'); // Password is not used in mock
      expect(success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe(validUser.email);
    expect(localStorageMock.getItem('flextasker_user')).toBe(JSON.stringify(result.current.user));
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Login successful' }));
  });

  test('login should not authenticate an invalid user', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitForNextUpdate(); // Wait for initial load

    await act(async () => {
      const success = await result.current.login('nonexistent@example.com', 'password');
      expect(success).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(localStorageMock.getItem('flextasker_user')).toBe(null);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Login failed' }));
  });

  test('logout should clear user and localStorage', async () => {
    const mockUser = USERS[0];
    localStorageMock.setItem('flextasker_user', JSON.stringify(mockUser));

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitForNextUpdate(); // Wait for initial load

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(localStorageMock.getItem('flextasker_user')).toBe(null);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Logged out' }));
  });

  test('register should create a new user and log them in', async () => {
    const newUserDetails = {
      name: 'New User',
      email: 'newuser@example.com',
      role: 'client' as const, // Use 'as const'
      password: TEST_USER_PASSWORD,
    };

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitForNextUpdate(); // Wait for initial load

    await act(async () => {
      const success = await result.current.register(
        newUserDetails.name,
        newUserDetails.email,
        newUserDetails.role,
        newUserDetails.password
      );
      expect(success).toBe(true);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(expect.objectContaining({
      name: newUserDetails.name,
      email: newUserDetails.email,
      role: newUserDetails.role,
    }));
    expect(localStorageMock.getItem('flextasker_user')).toBe(JSON.stringify(result.current.user));
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Registration successful' }));
  });

  test('register should not create a user if email already exists', async () => {
    const existingUser = USERS[0]; // Use an existing user's email
    const newUserDetails = {
      name: 'Another User',
      email: existingUser.email, // Existing email
      role: 'worker' as const, // Use 'as const'
      password: TEST_USER_PASSWORD, // Use the defined constant
    };

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    await waitForNextUpdate(); // Wait for initial load

    await act(async () => {
      const success = await result.current.register(
        newUserDetails.name,
        newUserDetails.email,
        newUserDetails.role,
        newUserDetails.password
      );
      expect(success).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
    expect(localStorageMock.getItem('flextasker_user')).toBe(null);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Registration failed' }));
  });
});