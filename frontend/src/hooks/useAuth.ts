import { useState, useCallback } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(authService.getStoredUser);

  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (email: string, full_name: string, password: string) => {
    return authService.register(email, full_name, password);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return { user, login, register, logout, isAuthenticated: !!user };
}
