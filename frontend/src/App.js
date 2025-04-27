import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Импорт компонентов страниц
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import PlaylistsPage from './pages/PlaylistsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlaceholderPage from './components/PlaceholderPage';
import MainLayout from './layouts/MainLayout';

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Основные страницы */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        
        {/* Страницы аутентификации */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Страницы-заглушки */}
        <Route 
          path="/about" 
          element={
            <MainLayout>
              <PlaceholderPage 
                title="О нас" 
                message="Информация о компании и наша миссия скоро появятся на этой странице." 
              />
            </MainLayout>
          } 
        />
        <Route 
          path="/for-artists" 
          element={
            <MainLayout>
              <PlaceholderPage 
                title="Для исполнителей" 
                message="Информация для музыкантов и инструменты для загрузки контента скоро появятся на этой странице." 
              />
            </MainLayout>
          } 
        />
        <Route 
          path="/privacy" 
          element={
            <MainLayout>
              <PlaceholderPage 
                title="Политика конфиденциальности" 
                message="Политика конфиденциальности сервиса скоро появится на этой странице." 
              />
            </MainLayout>
          } 
        />
        <Route 
          path="/terms" 
          element={
            <MainLayout>
              <PlaceholderPage 
                title="Условия использования" 
                message="Условия использования сервиса скоро появятся на этой странице." 
              />
            </MainLayout>
          } 
        />
        
        {/* Страница 404 */}
        <Route 
          path="*" 
          element={
            <MainLayout>
              <PlaceholderPage 
                title="Страница не найдена" 
                message="Запрашиваемая страница не существует. Пожалуйста, проверьте адрес или вернитесь на главную страницу." 
              />
            </MainLayout>
          } 
        />
      </Routes>
    </div>
  );
}

export default App; 