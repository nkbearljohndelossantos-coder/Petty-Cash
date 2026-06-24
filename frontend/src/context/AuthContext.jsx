import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkLoggedIn = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (!res?.data) {
            throw new Error('Session response did not contain a user');
          }
          setUser(res.data);
          setToken(storedToken);
        } catch (err) {
          localStorage.removeItem('token');
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (!res?.token || !res?.user) {
      throw new Error(res?.message || 'Login failed');
    }
    localStorage.setItem('token', res.token);
    setToken(res.token);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
