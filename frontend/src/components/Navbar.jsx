import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Получаем данные пользователя из window.INITIAL_DATA
    const initialData = window.INITIAL_DATA;
    if (initialData && initialData.user) {
      setIsLoggedIn(initialData.user.is_authenticated);
      setUserData(initialData.user);
    }
  }, []);

  return (
    <nav className="sticky top-0 z-50 glass-panel-dark backdrop-blur-xl shadow-md py-3 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
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
          </div>

          {/* Кнопки входа/профиля */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="text-white/80">
                  {userData?.username || 'Пользователь'}
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
                      <hr className="border-white/10 my-2" />
                      <Link to="/logout" className="block py-2 px-3 rounded-md hover:bg-red-500/20 text-red-300 transition-colors">
                        Выйти
                      </Link>
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

          {/* Кнопка мобильного меню */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="btn-secondary p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Мобильное меню */}
      {isMenuOpen && (
        <div className="mt-4 md:hidden glass-panel p-4 rounded-lg mx-4">
          <div className="flex flex-col space-y-4">
            <MobileNavLink to="/" label="Главная" />
            <MobileNavLink to="/search" label="Поиск" />
            <MobileNavLink to="/library" label="Библиотека" />
            <MobileNavLink to="/playlists" label="Плейлисты" />
            
            {isLoggedIn ? (
              <>
                <div className="px-4 py-2 text-white/80">
                  {userData?.username || 'Пользователь'}
                </div>
                <Link to="/profile" className="text-white py-2 px-4 rounded-lg hover:bg-white/10 transition duration-200">
                  Профиль
                </Link>
                <Link to="/settings" className="text-white py-2 px-4 rounded-lg hover:bg-white/10 transition duration-200">
                  Настройки
                </Link>
                <Link to="/logout" className="text-red-300 py-2 px-4 rounded-lg hover:bg-red-500/20 transition duration-200">
                  Выйти
                </Link>
              </>
            ) : (
              <div className="pt-2 flex space-x-3">
                <Link to="/login" className="btn-secondary w-full text-center">
                  Войти
                </Link>
                <Link to="/register" className="btn-primary w-full text-center">
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
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

// Компонент ссылки для мобильного меню
const MobileNavLink = ({ to, label }) => {
  const isActive = window.location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`py-2 px-4 rounded-lg transition duration-200 ${
        isActive 
          ? 'bg-white/10 text-music-primary font-medium' 
          : 'text-white hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  );
};

export default Navbar; 