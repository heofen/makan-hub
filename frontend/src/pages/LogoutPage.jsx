import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const LogoutPage = () => {
  const navigate = useNavigate();
  const { logout: authLogout } = useAuth();
  
  useEffect(() => {
    const performLogout = async () => {
      try {
        // Вызов API для выхода из системы
        await logout();
        
        // Очистка контекста авторизации
        authLogout();
        
        // Перенаправление на главную страницу
        navigate('/');
      } catch (error) {
        console.error('Ошибка при выходе из системы:', error);
        // В случае ошибки все равно очищаем локальное состояние и перенаправляем
        authLogout();
        navigate('/');
      }
    };
    
    performLogout();
  }, [navigate, authLogout]);
  
  // Отображаем заглушку во время обработки выхода
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark-gradient">
      <div className="glass-panel p-8 rounded-xl text-center max-w-md">
        <div className="animate-spin w-12 h-12 border-4 border-music-primary/30 border-t-music-primary rounded-full mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-white mb-2">Выход из системы</h2>
        <p className="text-white/70">Пожалуйста, подождите...</p>
      </div>
    </div>
  );
};

export default LogoutPage; 