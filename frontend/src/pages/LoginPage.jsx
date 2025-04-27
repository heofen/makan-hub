import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '', // может быть email или имя пользователя
    password: '',
    remember: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Очищаем ошибки при изменении поля
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя или email обязательны';
    }
    
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const loginData = {
      username: formData.username, // В API поле называется username, но может содержать email
      password: formData.password
    };
    
    const response = await login(loginData);
    
    setIsLoading(false);
    
    if (response.success) {
      // Сохраняем токен в localStorage или cookie
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        if (formData.remember) {
          // Если "Запомнить меня" включено, устанавливаем более длительный срок хранения
          // В реальном приложении здесь можно использовать куки с более длительным сроком действия
          localStorage.setItem('remember', 'true');
        }
      }
      
      // Перенаправляем на главную страницу
      navigate('/');
      
      // Перезагружаем страницу для обновления данных пользователя из Django
      window.location.reload();
    } else {
      // Обрабатываем ошибки от API
      if (response.error) {
        if (typeof response.error === 'string') {
          setApiError(response.error);
        } else if (response.error.detail) {
          setApiError(response.error.detail);
        } else if (response.error.non_field_errors) {
          setApiError(response.error.non_field_errors[0]);
        } else {
          // Обрабатываем ошибки валидации полей
          const fieldErrors = {};
          Object.keys(response.error).forEach(key => {
            fieldErrors[key] = response.error[key][0];
          });
          setErrors(prevErrors => ({
            ...prevErrors,
            ...fieldErrors
          }));
        }
      } else {
        setApiError('Произошла ошибка при входе. Пожалуйста, проверьте данные и попробуйте снова.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="pt-6 px-4">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-music-primary to-music-secondary flex items-center justify-center">
            <span className="text-white font-bold text-xl">М</span>
          </div>
          <span className="text-white text-xl font-semibold">Makan<span className="text-music-secondary">Hub</span></span>
        </Link>
      </div>
      
      <div className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="glass-panel w-full max-w-md p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">Вход в аккаунт</h2>
          
          {apiError && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200">
              {apiError}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-1">Email или имя пользователя</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className={`bg-white/10 backdrop-blur-sm border ${errors.username ? 'border-red-400' : 'border-white/10'} w-full px-4 py-3 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-music-primary/50`}
                placeholder="Введите email или имя пользователя"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-white/80">Пароль</label>
                <Link to="/forgot-password" className="text-sm text-music-primary hover:text-music-primary/80">
                  Забыли пароль?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`bg-white/10 backdrop-blur-sm border ${errors.password ? 'border-red-400' : 'border-white/10'} w-full px-4 py-3 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-music-primary/50`}
                placeholder="Введите пароль"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password}</p>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                className="h-4 w-4 bg-white/10 border-white/20 rounded focus:ring-music-primary"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-white/80">
                Запомнить меня
              </label>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full btn-primary py-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-white/60">
              Нет аккаунта?{' '}
              <Link to="/register" className="text-music-primary hover:text-music-primary/80">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 