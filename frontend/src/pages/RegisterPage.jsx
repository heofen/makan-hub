import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/api';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    terms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

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
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать минимум 3 символа';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Неверный формат email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Пароль должен содержать минимум 8 символов';
    }
    
    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Пароли не совпадают';
    }
    
    if (!formData.terms) {
      newErrors.terms = 'Необходимо согласиться с условиями';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    setDebugInfo(null);
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    const registerData = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      password2: formData.password2
    };
    
    // Отладочная информация
    console.log('Отправляемые данные:', registerData);
    setDebugInfo({
      requestData: registerData,
      apiUrl: window.INITIAL_DATA?.apiUrl || '/api/',
      csrfToken: window.INITIAL_DATA?.csrfToken || 'Нет CSRF токена'
    });
    
    try {
      const response = await register(registerData);
      
      setIsLoading(false);
      
      if (response.success) {
        // Сохраняем токен и данные пользователя в localStorage
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        // Перенаправляем на главную страницу
        navigate('/');
        
        // Перезагружаем страницу для обновления данных пользователя из Django
        window.location.reload();
      } else {
        // Обрабатываем ошибки от API
        setDebugInfo({
          ...debugInfo,
          error: response.error,
          success: false
        });
        
        if (response.error) {
          if (typeof response.error === 'string') {
            setApiError(response.error);
          } else if (response.error.detail) {
            setApiError(response.error.detail);
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
          setApiError('Произошла ошибка при регистрации. Пожалуйста, попробуйте позже.');
        }
      }
    } catch (error) {
      setIsLoading(false);
      setApiError(`Непредвиденная ошибка: ${error.message}`);
      setDebugInfo({
        ...debugInfo,
        unexpectedError: error.message,
        stack: error.stack
      });
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
          <h2 className="text-2xl font-bold mb-6 text-center">Создание аккаунта</h2>
          
          {apiError && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200">
              {apiError}
            </div>
          )}

          {/* Отладочная информация */}
          {debugInfo && (
            <div className="mb-6 p-3 bg-blue-500/20 border border-blue-500/40 rounded-lg text-blue-200 text-xs overflow-auto">
              <h3 className="font-bold">Debug Info:</h3>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-white/80 mb-1">Имя пользователя</label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                className={`bg-white/10 backdrop-blur-sm border ${errors.username ? 'border-red-400' : 'border-white/10'} w-full px-4 py-3 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-music-primary/50`}
                placeholder="Введите имя пользователя"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-400">{errors.username}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`bg-white/10 backdrop-blur-sm border ${errors.email ? 'border-red-400' : 'border-white/10'} w-full px-4 py-3 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-music-primary/50`}
                placeholder="Введите email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-1">Пароль</label>
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
            
            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-white/80 mb-1">Подтверждение пароля</label>
              <input
                id="password2"
                name="password2"
                type="password"
                value={formData.password2}
                onChange={handleChange}
                className={`bg-white/10 backdrop-blur-sm border ${errors.password2 ? 'border-red-400' : 'border-white/10'} w-full px-4 py-3 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-music-primary/50`}
                placeholder="Подтвердите пароль"
              />
              {errors.password2 && (
                <p className="mt-1 text-sm text-red-400">{errors.password2}</p>
              )}
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={formData.terms}
                  onChange={handleChange}
                  className={`h-4 w-4 bg-white/10 border-white/20 rounded focus:ring-music-primary ${errors.terms ? 'border-red-400' : ''}`}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className={`${errors.terms ? 'text-red-400' : 'text-white/80'}`}>
                  Я согласен с <Link to="/terms" className="text-music-primary hover:text-music-primary/80">условиями использования</Link> и <Link to="/privacy" className="text-music-primary hover:text-music-primary/80">политикой конфиденциальности</Link>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-400">{errors.terms}</p>
                )}
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full btn-primary py-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-white/60">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="text-music-primary hover:text-music-primary/80">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 