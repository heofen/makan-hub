import React from 'react';
import MainLayout from '../layouts/MainLayout';
import PlaceholderPage from '../components/PlaceholderPage';

const LibraryPage = () => {
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Ваша библиотека</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <div className="glass-panel-dark p-4 rounded-lg flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-music-primary/30 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Треки</h3>
              <p className="text-white/60 text-sm">0 треков</p>
            </div>
          </div>
          
          <div className="glass-panel-dark p-4 rounded-lg flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-music-secondary/30 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Исполнители</h3>
              <p className="text-white/60 text-sm">0 исполнителей</p>
            </div>
          </div>
          
          <div className="glass-panel-dark p-4 rounded-lg flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/30 flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium">Альбомы</h3>
              <p className="text-white/60 text-sm">0 альбомов</p>
            </div>
          </div>
        </div>
      </div>
      
      <PlaceholderPage 
        title="Ваша библиотека пока пуста" 
        message="Здесь будут отображаться ваши любимые треки, исполнители и альбомы. Начните слушать музыку и добавляйте в избранное, чтобы создать свою персональную коллекцию." 
      />
    </MainLayout>
  );
};

export default LibraryPage; 