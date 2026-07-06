import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { loginUser, registerUser, logoutUser, getMe } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  // Fetch authenticated user details if a token exists
  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user session:', error);
      // Clear invalid token if the API rejects it
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials) => {
    const response = await loginUser(credentials);
    const authData = response.data?.data || response.data;
    const { access_token, refresh_token } = authData;
    
    localStorage.setItem('access_token', access_token);
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token);
    }
    setToken(access_token);
    // The useEffect will automatically trigger fetchUser() due to token change
    return authData;
  };

  const register = async (userData) => {
    const response = await registerUser(userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await logoutUser(); // Invalidate token on the backend
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to easily consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
