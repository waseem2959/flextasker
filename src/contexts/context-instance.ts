// contexts/context-instance.ts
// This file creates the React Context instance for authentication
// Separating this into its own file prevents circular dependency issues

import { createContext } from 'react';
import { AuthContextType } from '../types';

/**
 * Creates the React Context instance for authentication state management
 * 
 * This context provides authentication state and methods throughout the component tree.
 * The default value is undefined, which helps catch cases where components try to use
 * the context without being wrapped in an AuthProvider.
 * 
 * We initialize with undefined rather than a default object to make it obvious
 * when the context is being used incorrectly (outside of a provider).
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);