
import React, { useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, UserRole } from '../types';
import { USERS } from '../data/mockData';
import { toast } from '../hooks/use-toast';
import { createContextValue } from './AuthUtils';

// The useAuth hook is imported directly from '../hooks/useAuth' where needed

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, role: UserRole, password: string) => Promise<boolean>;
  loading: boolean;
}

import { AuthContext } from './context-instance';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    console.log('AuthContext: Checking localStorage for user...');
    const storedUser = localStorage.getItem('flextasker_user');
    if (storedUser) {
      console.log('AuthContext: Found stored user in localStorage.');
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('AuthContext: Parsed stored user:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('flextasker_user');
      }
    }
    setLoading(false);
  }, []);

  // Mock login function wrapped in useCallback to prevent recreation on each render
  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user by email (mock authentication)
      const foundUser = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (foundUser) {
        // Create avatar URL based on name if none exists
        if (!foundUser.avatar) {
          foundUser.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(foundUser.name)}&background=random&color=fff`;
        }
        
        console.log('AuthContext: User found in mock data:', foundUser);
        setUser(foundUser);
        console.log('AuthContext: Storing user in localStorage:', foundUser);
        localStorage.setItem('flextasker_user', JSON.stringify(foundUser));
        toast({
          title: "Login successful",
          description: `Welcome back, ${foundUser.name}!`,
        });
        return true;
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mock register function wrapped in useCallback to prevent recreation on each render
  const register = useCallback(async (name: string, email: string, role: UserRole, _password: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if user already exists
      console.log('AuthContext: Checking if user exists in mock data for registration:', email);
      const userExists = USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (userExists) {
        console.log('AuthContext: User already exists:', userExists);
        toast({
          title: "Registration failed",
          description: "Email already in use",
          variant: "destructive",
        });
        return false;
      }
      
      // Create new user (this would typically be handled by a backend)
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        role,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
        rating: 0,
        totalReviews: 0,
        createdAt: new Date().toISOString(),
        verified: false,
      };
      
      // In a real app, we'd save this to the backend
      // For demo purposes, we'll just set the user state
      console.log('AuthContext: New user created (mock):', newUser);
      setUser(newUser);
      console.log('AuthContext: Storing new user in localStorage:', newUser);
      localStorage.setItem('flextasker_user', JSON.stringify(newUser));
      
      toast({
        title: "Registration successful",
        description: `Welcome to FlexTasker, ${name}!`,
      });
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function wrapped in useCallback to prevent recreation on each render
  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('flextasker_user');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  }, []);

  // Context value with useMemo for optimization
  const contextValue = useMemo(() => createContextValue(
    user,
    loading,
    login,
    logout,
    register
  ), [user, loading, login, logout, register]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// We'll move useAuth to a separate file
