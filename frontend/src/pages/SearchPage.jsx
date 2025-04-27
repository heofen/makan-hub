import React from 'react';
import MainLayout from '../layouts/MainLayout';
import PlaceholderPage from '../components/PlaceholderPage';

const SearchPage = () => {
  return (
    <MainLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Поиск</h1>
        
        <div className="glass-panel p-4 mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              className="bg-white/10 backdrop-blur-sm border border-white/10 w-full pl-10 pr-4 py-3 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
              placeholder="Поиск исполнителей, треков или альбомов" 
            />
          </div>
        </div>
      </div>
      
      <PlaceholderPage 
        title="Функция поиска в разработке" 
        message="Мы работаем над тем, чтобы сделать поиск максимально удобным и эффективным. Скоро вы сможете найти любимые треки, исполнителей и альбомы." 
      />
    </MainLayout>
  );
};

export default SearchPage; 