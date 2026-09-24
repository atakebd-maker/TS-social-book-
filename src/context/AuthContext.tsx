import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

interface AuthContextType {
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  authModalTab: 'login' | 'signup' | 'forgot';
  openAuthModal: (tab?: 'login' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  login: (email: string, password?: string) => Promise<void>;
  signUp: (data: { name: string; username: string; email: string; password?: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateCurrentUser: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup' | 'forgot'>('login');

  useEffect(() => {
    // Listen for auth state
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const openAuthModal = (tab: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const login = async (email: string, password?: string) => {
    const user = await authService.login(email, password);
    setCurrentUser(user);
    closeAuthModal();
  };

  const signUp = async (data: { name: string; username: string; email: string; password?: string }) => {
    const user = await authService.signUp(data);
    setCurrentUser(user);
    closeAuthModal();
  };

  const logout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  const updateCurrentUser = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = await userService.updateProfile(currentUser.id, updates);
    setCurrentUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        signUp,
        logout,
        updateCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
