import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Drawer from './Drawer';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, isAuth } = useAuth();
  const navigate = useNavigate();
  
  // Определяем, является ли пользователь администратором
  const isAdmin = user && (user.is_staff || user.is_superuser || user.role === 'admin');

  // Обработчик выхода из аккаунта
  const handleLogout = () => {
    navigate('/logout');
  };

  // Обработчики для шторки
  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <nav className="sticky top-0 z-40 glass-panel-dark backdrop-blur-xl shadow-md py-3 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Бургер меню */}
            <button 
              className="p-1 mr-3 text-white/80 hover:text-white rounded-md focus:outline-none" 
              onClick={openDrawer}
              aria-label="Открыть меню"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Логотип */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-music-primary to-music-secondary flex items-center justify-center">
                <span className="text-white font-bold text-xl">М</span>
              </div>
              <span className="text-white text-xl font-semibold">Makan<span className="text-music-secondary">Hub</span></span>
            </Link>

            {/* Навигация для десктопа */}
            <div className="hidden md:flex md:space-x-10 lg:space-x-12">
              <NavLink to="/" label="Главная" />
              <NavLink to="/search" label="Поиск" />
              <NavLink to="/library" label="Библиотека" />
              <NavLink to="/playlists" label="Плейлисты" />
              <NavLink to="/tracks" label="Треки" />
              <NavLink to="/albums" label="Альбомы" />
            </div>

            {/* Кнопки входа/профиля */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuth ? (
                <div className="flex items-center space-x-3">
                  <div className="text-white/80">
                    {user?.username || 'Пользователь'}
                  </div>
                  <div className="relative group">
                    <button className="w-9 h-9 rounded-full bg-gradient-to-br from-music-primary/30 to-music-secondary/30 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    <div className="absolute right-0 mt-2 w-48 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
                      <div className="glass-panel p-3 rounded-lg shadow-lg">
                        <Link to="/profile" className="block py-2 px-3 rounded-md hover:bg-white/10 transition-colors">
                          Профиль
                        </Link>
                        <Link to="/settings" className="block py-2 px-3 rounded-md hover:bg-white/10 transition-colors">
                          Настройки
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="block py-2 px-3 rounded-md hover:bg-white/10 transition-colors text-music-primary">
                            Админ-панель
                          </Link>
                        )}
                        <hr className="border-white/10 my-2" />
                        <button 
                          onClick={handleLogout}
                          className="block w-full text-left py-2 px-3 rounded-md hover:bg-red-500/20 text-red-300 transition-colors"
                        >
                          Выйти
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn-secondary py-1.5 px-4 mr-2">
                    Войти
                  </Link>
                  <Link to="/register" className="btn-primary py-1.5 px-4">
                    Регистрация
                  </Link>
                </>
              )}
            </div>

            {/* Кнопка мобильного профиля */}
            <div className="md:hidden">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="btn-secondary p-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Мобильное меню профиля */}
        {isMenuOpen && (
          <div className="mt-4 md:hidden glass-panel p-4 rounded-lg mx-4">
            <div className="flex flex-col space-y-3">
              {isAuth ? (
                <>
                  <div className="px-4 py-2 font-medium text-white/90 border-b border-white/10 mb-2">
                    {user?.username || 'Пользователь'}
                  </div>
                  <Link to="/profile" className="text-white py-2 px-4 rounded-lg hover:bg-white/10 transition duration-200">
                    Профиль
                  </Link>
                  <Link to="/settings" className="text-white py-2 px-4 rounded-lg hover:bg-white/10 transition duration-200">
                    Настройки
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="text-music-primary py-2 px-4 rounded-lg hover:bg-white/10 transition duration-200">
                      Админ-панель
                    </Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="text-left text-red-300 py-2 px-4 rounded-lg hover:bg-red-500/20 transition duration-200 w-full"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <div className="flex space-x-3">
                  <Link to="/login" className="btn-secondary w-full py-2 text-center">
                    Войти
                  </Link>
                  <Link to="/register" className="btn-primary w-full py-2 text-center">
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      
      {/* Боковая шторка */}
      <Drawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  );
};

// Компонент ссылки для десктопа
const NavLink = ({ to, label }) => {
  // Проверяем, активна ли ссылка
  const isActive = window.location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`transition duration-200 relative py-1 group ${
        isActive 
          ? 'text-music-primary font-medium' 
          : 'text-white/70 hover:text-white'
      }`}
    >
      {label}
      {isActive && (
        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-music-primary to-music-secondary"></span>
      )}
      {!isActive && (
        <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-music-primary to-music-secondary group-hover:w-full transition-all duration-300"></span>
      )}
    </Link>
  );
};

export default Navbar;