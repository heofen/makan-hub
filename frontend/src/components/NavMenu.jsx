import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NavMenu = () => {
  const { isAuthenticated, currentUser } = useAuth();
  
  // Проверяем, имеет ли пользователь права на загрузку треков
  const canUploadTracks = currentUser && (
    currentUser.is_staff || 
    currentUser.is_superuser || 
    currentUser.role === 'admin' || 
    currentUser.role === 'artist'
  );
  
  return (
    <nav className="py-4">
      <ul className="space-y-2">
        <li>
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-music-primary text-white' : 'text-gray-300 hover:bg-white/10'
              }`
            }
            end
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Главная
          </NavLink>
        </li>
        
        <li>
          <NavLink 
            to="/search" 
            className={({ isActive }) => 
              `flex items-center px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'bg-music-primary text-white' : 'text-gray-300 hover:bg-white/10'
              }`
            }
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Поиск
          </NavLink>
        </li>
        
        {isAuthenticated && (
          <>
            <li>
              <NavLink 
                to="/library" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-music-primary text-white' : 'text-gray-300 hover:bg-white/10'
                  }`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Моя музыка
              </NavLink>
            </li>
            
            <li>
              <NavLink 
                to="/playlists" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-music-primary text-white' : 'text-gray-300 hover:bg-white/10'
                  }`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Плейлисты
              </NavLink>
            </li>
            
            {canUploadTracks && (
              <li>
                <NavLink 
                  to="/upload-track" 
                  className={({ isActive }) => 
                    `flex items-center px-4 py-2 rounded-lg transition-colors ${
                      isActive ? 'bg-music-primary text-white' : 'text-gray-300 hover:bg-white/10'
                    }`
                  }
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Загрузить трек
                </NavLink>
              </li>
            )}
            
            <li>
              <NavLink 
                to="/profile" 
                className={({ isActive }) => 
                  `flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive ? 'bg-music-primary text-white' : 'text-gray-300 hover:bg-white/10'
                  }`
                }
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Профиль
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default NavMenu; 