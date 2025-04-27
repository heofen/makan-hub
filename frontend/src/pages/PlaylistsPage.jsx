import React from 'react';
import MainLayout from '../layouts/MainLayout';
import PlaceholderPage from '../components/PlaceholderPage';

const PlaylistsPage = () => {
  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Ваши плейлисты</h1>
          <button className="btn-primary">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Создать плейлист
            </span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {/* Карточка создания плейлиста */}
          <div className="glass-panel-dark aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-music-primary/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-music-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-white/80">Создать плейлист</p>
          </div>
          
          {/* Заглушки плейлистов */}
          {[...Array(3)].map((_, index) => (
            <div key={index} className="glass-panel-dark rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-music-primary/10 cursor-pointer">
              <div className="aspect-square bg-gradient-to-br from-music-primary/10 to-music-secondary/10 flex items-center justify-center">
                <svg className="w-16 h-16 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="p-4">
                <div className="h-4 w-20 bg-white/10 rounded animate-pulse mb-2"></div>
                <div className="h-3 w-32 bg-white/5 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <PlaceholderPage 
        title="Управление плейлистами в разработке" 
        message="Скоро вы сможете создавать собственные плейлисты, добавлять в них треки и делиться ими с друзьями. Функция находится в активной разработке." 
      />
    </MainLayout>
  );
};

export default PlaylistsPage; 