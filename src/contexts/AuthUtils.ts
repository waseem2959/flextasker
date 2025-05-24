import { User, UserRole } from '../types';

// Helper function for authentication related utilities
export const createContextValue = (
  user: User | null,
  loading: boolean,
  login: (email: string, password: string) => Promise<boolean>,
  logout: () => void,
  register: (name: string, email: string, role: UserRole, password: string) => Promise<boolean>
) => ({
  user, 
  isAuthenticated: !!user, 
  role: user?.role ?? null,
  login, 
  logout, 
  register,
  loading
});
