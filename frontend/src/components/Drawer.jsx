import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Drawer = ({ isOpen, onClose }) => {
  const { user, isAuth } = useAuth();
  const isAdmin = user && (user.is_staff || user.is_superuser || user.role === 'admin');

  // Закрыть шторку при нажатии Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    
    // Блокировать прокрутку страницы когда меню открыто
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  // Если шторка закрыта, не отображаем ничего
  if (!isOpen) return null;

  return (
    <>
      {/* Затемнение фона */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Шторка с меню */}
      <div className={`fixed top-0 left-0 bottom-0 w-64 md:w-80 bg-dark-gradient z-50 shadow-xl glass-panel-dark transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Хедер шторки с лого и кнопкой закрытия */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <Link to="/" className="flex items-center space-x-2" onClick={onClose}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-music-primary to-music-secondary flex items-center justify-center">
              <span className="text-white font-bold text-xl">М</span>
            </div>
            <span className="text-white text-xl font-semibold">Makan<span className="text-music-secondary">Hub</span></span>
          </Link>
          
          <button 
            className="text-white/70 hover:text-white" 
            onClick={onClose}
            aria-label="Закрыть меню"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Основная навигация */}
        <div className="py-6 px-4">
          <h3 className="text-white/50 text-xs uppercase font-semibold px-4 mb-3">Навигация</h3>
          <nav className="space-y-1">
            <DrawerNavLink to="/" label="Главная" icon="home" onClick={onClose} />
            <DrawerNavLink to="/search" label="Поиск" icon="search" onClick={onClose} />
            <DrawerNavLink to="/library" label="Библиотека" icon="library" onClick={onClose} />
            <DrawerNavLink to="/playlists" label="Плейлисты" icon="playlist" onClick={onClose} />
            <DrawerNavLink to="/tracks" label="Треки" icon="track" onClick={onClose} />
            <DrawerNavLink to="/albums" label="Альбомы" icon="album" onClick={onClose} />
          </nav>
        </div>
        
        {/* Раздел пользователя */}
        <div className="py-6 px-4 border-t border-white/10">
          <h3 className="text-white/50 text-xs uppercase font-semibold px-4 mb-3">Аккаунт</h3>
          <nav className="space-y-1">
            {isAuth ? (
              <>
                <DrawerNavLink to="/profile" label="Профиль" icon="profile" onClick={onClose} />
                <DrawerNavLink to="/settings" label="Настройки" icon="settings" onClick={onClose} />
                {isAdmin && (
                  <DrawerNavLink to="/admin" label="Админ-панель" icon="admin" isAdmin onClick={onClose} />
                )}
                <DrawerNavLink to="/logout" label="Выйти" icon="logout" isLogout onClick={onClose} />
              </>
            ) : (
              <>
                <DrawerNavLink to="/login" label="Войти" icon="login" onClick={onClose} />
                <DrawerNavLink to="/register" label="Регистрация" icon="signup" onClick={onClose} />
              </>
            )}
          </nav>
        </div>
        
        {/* Футер шторки */}
        <div className="mt-auto py-4 px-6 border-t border-white/10">
          <div className="text-white/50 text-xs">
            © 2023 MakanHub. Все права защищены.
          </div>
        </div>
      </div>
    </>
  );
};

// Компонент ссылки для шторки
const DrawerNavLink = ({ to, label, icon, isAdmin, isLogout, onClick }) => {
  const isActive = window.location.pathname === to;
  
  // Функция для определения иконки на основе значения icon
  const renderIcon = () => {
    switch (icon) {
      case 'home':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'search':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'library':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        );
      case 'playlist':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'track':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
        );
      case 'album':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'profile':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'settings':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'admin':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'login':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case 'signup':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'logout':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  let linkClass = `flex items-center space-x-3 px-4 py-3 rounded-lg transition duration-200 ${
    isActive 
      ? 'bg-white/10 text-white font-medium' 
      : 'text-white/70 hover:bg-white/5 hover:text-white'
  }`;
  
  if (isAdmin) {
    linkClass += ' text-music-primary';
  }
  
  if (isLogout) {
    linkClass += ' text-red-400 hover:bg-red-500/10';
  }
  
  return (
    <Link to={to} className={linkClass} onClick={onClick}>
      <span className="flex-shrink-0">{renderIcon()}</span>
      <span>{label}</span>
    </Link>
  );
};

export default Drawer; 