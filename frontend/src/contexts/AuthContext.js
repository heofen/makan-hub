import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, isAuthenticated } from '../services/api';

// Создаем контекст
const AuthContext = createContext(null);

// Хук для использования контекста авторизации
export const useAuth = () => useContext(AuthContext);

// Провайдер контекста авторизации
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(isAuthenticated());

  // Загрузка данных пользователя при первом рендере
  useEffect(() => {
    const loadUser = async () => {
      if (isAuth) {
        try {
          const response = await getCurrentUser();
          if (response.success) {
            setUser(response.data);
          } else {
            // Если не удалось получить данные пользователя, сбрасываем авторизацию
            setIsAuth(false);
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Ошибка при загрузке данных пользователя:', error);
          setIsAuth(false);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [isAuth]);

  // Функция для входа пользователя
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuth(true);
  };

  // Функция для выхода пользователя
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuth(false);
  };

  // Значение контекста, которое будет доступно через хук useAuth
  const value = {
    currentUser: user,
    user,
    isAuthenticated: isAuth,
    isAuth,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 