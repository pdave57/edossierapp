import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { loginUser, registerUser, logoutUser, getMe, studentLogin } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    const isStudentSession = localStorage.getItem('student_session') === 'true';
    if (isStudentSession) {
      const studentInfo = localStorage.getItem('student_info');
      if (studentInfo) {
        try {
          setUser(JSON.parse(studentInfo));
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
      return;
    }
    
    try {
      const response = await getMe();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user session:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('student_session');
      localStorage.removeItem('student_info');
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
    return authData;
  };

  const studentLoginFn = async (credentials) => {
    const response = await studentLogin(credentials);
    const authData = response.data?.data || response.data;
    const { access_token, refresh_token } = authData;
    
    localStorage.setItem('access_token', access_token);
    if (refresh_token) {
      localStorage.setItem('refresh_token', refresh_token);
    }
    setToken(access_token);
    return authData;
  };

  const register = async (userData) => {
    const response = await registerUser(userData);
    return response.data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('student_session');
      localStorage.removeItem('student_info');
      setToken(null);
      setUser(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    studentLogin: studentLoginFn,
    register,
    logout,
    isAuthenticated: !!token && !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
