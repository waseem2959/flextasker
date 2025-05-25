// contexts/AuthContext.tsx
import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { USERS } from '../data/mockData';
import { toast } from '../hooks/use-toast';
import { AuthContextType, LoginCredentials, RegisterData, User, UserImpl } from '../types';
import { AuthContext } from './context-instance';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on component mount
  useEffect(() => {
    console.log('AuthContext: Checking localStorage for existing user session...');
    const storedUser = localStorage.getItem('flextasker_user');
    
    if (storedUser) {
      console.log('AuthContext: Found stored user session in localStorage.');
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('AuthContext: Successfully parsed stored user:', parsedUser);
        
        // Convert the stored user data to a proper User instance
        // This ensures we have all the computed properties like 'name'
        const userInstance = UserImpl.fromApiResponse(parsedUser);
        setUser(userInstance);
      } catch (error) {
        console.error('AuthContext: Failed to parse stored user data:', error);
        // Clean up corrupted data
        localStorage.removeItem('flextasker_user');
      }
    } else {
      console.log('AuthContext: No existing user session found.');
    }
    
    setLoading(false);
  }, []);

  // Mock login function - simulates API authentication
  // In a real application, this would make an HTTP request to your backend
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate network delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Find user by email in mock data (case-insensitive)
      // In a real app, this would be handled by your backend authentication
      const foundUser = USERS.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
      
      if (foundUser) {
        console.log('AuthContext: User authentication successful:', foundUser);
        
        // Create a proper User instance with computed properties
        // This transformation handles the differences between mock data and real API responses
        const userInstance = new UserImpl({
          id: foundUser.id,
          firstName: foundUser.firstName || foundUser.name?.split(' ')[0] || 'User',
          lastName: foundUser.lastName || foundUser.name?.split(' ').slice(1).join(' ') || '',
          email: foundUser.email,
          role: foundUser.role,
          avatar: foundUser.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(foundUser.name || foundUser.email)}&background=random&color=fff`,
          trustScore: foundUser.trustScore || 0,
          // Fix: Use emailVerified instead of verified, and provide fallback
          emailVerified: foundUser.emailVerified ?? false,
          phoneVerified: false, // Default for mock data
          createdAt: new Date(foundUser.createdAt || Date.now()),
          // Fix: Use averageRating instead of rating, and provide fallback
          averageRating: foundUser.averageRating ?? 0,
          totalReviews: foundUser.totalReviews ?? 0,
          completedTasks: 0, // Default for mock data
        });
        
        // Update application state
        setUser(userInstance);
        
        // Persist user session in localStorage
        // We store the plain object, not the class instance, to avoid serialization issues
        console.log('AuthContext: Persisting user session to localStorage');
        localStorage.setItem('flextasker_user', JSON.stringify({
          ...userInstance,
          createdAt: userInstance.createdAt.toISOString(), // Ensure proper date serialization
        }));
        
        // Provide user feedback
        toast({
          title: "Login successful",
          description: `Welcome back, ${userInstance.name}!`,
        });
        
        return true;
      } else {
        console.log('AuthContext: Authentication failed - user not found');
        toast({
          title: "Login failed",
          description: "Invalid email or password. Please check your credentials and try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('AuthContext: Login process encountered an error:', error);
      toast({
        title: "Login error",
        description: "An unexpected error occurred during login. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Mock registration function - simulates user account creation
  // In a real application, this would make an HTTP request to create a new user
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setLoading(true);
    try {
      // Simulate network delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if email is already registered
      // In a real app, this validation would be handled by your backend
      console.log('AuthContext: Checking email availability for registration:', data.email);
      const userExists = USERS.find(u => u.email.toLowerCase() === data.email.toLowerCase());
      
      if (userExists) {
        console.log('AuthContext: Registration failed - email already exists:', userExists);
        toast({
          title: "Registration failed",
          description: "An account with this email address already exists. Please use a different email or try logging in.",
          variant: "destructive",
        });
        return false;
      }
      
      // Create new user instance with proper typing and default values
      // In a real app, the backend would generate the ID and set appropriate defaults
      // Fix: Use slice instead of deprecated substr method
      const randomSuffix = Math.random().toString(36).slice(2, 11);
      const newUser = new UserImpl({
        id: `user-${Date.now()}-${randomSuffix}`, // Generate unique ID
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.toLowerCase().trim(),
        role: data.role,
        // Fix: Avoid nested template literals by using string concatenation
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName + ' ' + data.lastName)}&background=random&color=fff`,
        trustScore: 0, // New users start with zero trust score
        emailVerified: false, // New users need to verify their email
        phoneVerified: false, // New users need to verify their phone
        createdAt: new Date(), // Current timestamp for account creation
        averageRating: 0, // No ratings yet for new users
        totalReviews: 0, // No reviews yet for new users
        completedTasks: 0, // No completed tasks for new users
        phone: data.phone, // Optional phone number from registration data
      });
      
      console.log('AuthContext: New user account created successfully:', newUser);
      
      // Update application state with new user
      setUser(newUser);
      
      // Persist new user session in localStorage
      console.log('AuthContext: Persisting new user session to localStorage');
      localStorage.setItem('flextasker_user', JSON.stringify({
        ...newUser,
        createdAt: newUser.createdAt.toISOString(), // Ensure proper date serialization
      }));
      
      // Provide success feedback to user
      toast({
        title: "Registration successful",
        description: `Welcome to FlexTasker, ${newUser.name}! Please check your email to verify your account.`,
      });
      
      return true;
    } catch (error) {
      console.error('AuthContext: Registration process encountered an error:', error);
      toast({
        title: "Registration error",
        description: "An unexpected error occurred during registration. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Logout function - clears user session and local storage
  const logout = useCallback(() => {
    console.log('AuthContext: User logout initiated');
    
    // Clear application state
    setUser(null);
    
    // Clear persisted session data
    localStorage.removeItem('flextasker_user');
    
    // Provide user feedback
    toast({
      title: "Logged out",
      description: "You have been successfully logged out. Thank you for using FlexTasker!",
    });
    
    console.log('AuthContext: User logout completed successfully');
  }, []);

  // Optimized context value creation using useMemo
  // This prevents unnecessary re-renders of consuming components
  const contextValue = useMemo((): AuthContextType => {
    return {
      user,
      isAuthenticated: !!user, // Convert user object to boolean
      role: user?.role ?? null,
      login,
      logout,
      register,
      loading,
    };
  }, [user, login, logout, register, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};