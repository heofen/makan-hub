import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Dashboard from '../components/Dashboard';
import Recommendations from '../components/Recommendations';
import RecommendedTracks from '../components/RecommendedTracks';

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Получаем данные пользователя из window.INITIAL_DATA
    const initialData = window.INITIAL_DATA;
    if (initialData && initialData.user) {
      setIsLoggedIn(initialData.user.is_authenticated);
    }
  }, []);

  return (
    <MainLayout>
      <div className="flex flex-col space-y-8">
        <section className="glass-panel p-8 flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-music-primary to-music-secondary bg-clip-text text-transparent">
                Открывайте новую музыку
              </span>
              <br />
              каждый день
            </h1>
            <p className="text-white/70 text-lg">
              Миллионы треков, подкастов и плейлистов готовы к прослушиванию.
            </p>
            <div className="pt-4">
              {isLoggedIn ? (
                <Link to="/search" className="btn-primary">Начать слушать</Link>
              ) : (
                <Link to="/register" className="btn-primary">Зарегистрироваться</Link>
              )}
            </div>
          </div>
          <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
            <div className="w-64 h-64 rounded-full bg-gradient-to-br from-music-primary to-music-secondary flex items-center justify-center shadow-lg shadow-music-primary/30">
              <div className="w-56 h-56 rounded-full bg-music-dark flex items-center justify-center">
                <svg className="w-28 h-28 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>
          </div>
        </section>
        
        {isLoggedIn ? (
          // Содержимое для авторизованных пользователей
          <>
            {/* Дашборд с метриками */}
            <Dashboard />
            
            {/* Рекомендации треков в виде карточек */}
            <RecommendedTracks />
            
            {/* Компактные рекомендации треков */}
            <Recommendations />
          </>
        ) : (
          // Содержимое для неавторизованных пользователей
          <>
            {/* Преимущества сервиса */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-6">Почему MakanHub?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-5 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Миллионы треков</h3>
                  <p className="text-gray-300">Огромная библиотека музыки всех жанров, от классики до современных хитов.</p>
                </div>
                
                <div className="glass-card p-5 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Умные рекомендации</h3>
                  <p className="text-gray-300">Персонализированные рекомендации на основе ваших музыкальных предпочтений.</p>
                </div>
                
                <div className="glass-card p-5 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">На любом устройстве</h3>
                  <p className="text-gray-300">Слушайте музыку на телефоне, компьютере или планшете с синхронизацией плейлистов.</p>
                </div>
              </div>
            </section>
            
            {/* Популярные плейлисты */}
            <section className="glass-panel p-6 rounded-xl">
              <h2 className="text-2xl font-semibold mb-6">Популярные плейлисты</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="glass-card p-4 rounded-lg hover:transform hover:-translate-y-1 transition-all duration-300">
                    <div className="aspect-square rounded bg-gradient-to-br from-music-primary/20 to-music-secondary/20 flex items-center justify-center mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-white">Плейлист #{index + 1}</h3>
                    <p className="text-sm text-gray-400 mt-1">30 треков</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center mt-6">
                <Link to="/register" className="btn-primary">Исследовать больше</Link>
              </div>
            </section>
          </>
        )}
        
        {/* Популярные исполнители - показываем всем */}
        <section className="glass-panel p-6 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">Популярные исполнители</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="glass-card p-4 rounded-lg flex flex-col items-center hover:transform hover:-translate-y-1 transition-all duration-300">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-music-primary/20 to-music-secondary/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="mt-3 font-medium text-white">Исполнитель {index + 1}</h3>
              </div>
            ))}
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default HomePage; 