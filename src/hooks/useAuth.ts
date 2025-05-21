import { useContext } from 'react';
import { AuthContext } from '../contexts/context-instance';
import { AuthContextType } from '../types';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
