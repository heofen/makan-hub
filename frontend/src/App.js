import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Импорт компонентов страниц
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import LibraryPage from './pages/LibraryPage';
import PlaylistsPage from './pages/PlaylistsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import TracksPage from './pages/TracksPage';
import AlbumsPage from './pages/AlbumsPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import PlaceholderPage from './components/PlaceholderPage';
import MainLayout from './layouts/MainLayout';
import UploadTrackPage from './pages/UploadTrackPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LogoutPage from './pages/LogoutPage';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Основные страницы */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/playlists/:playlistId" element={<PlaylistDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/tracks" element={<TracksPage />} />
          <Route path="/albums" element={<AlbumsPage />} />
          <Route path="/albums/:albumId" element={<AlbumDetailPage />} />
          <Route path="/upload-track" element={<UploadTrackPage />} />
          
          {/* Админ-панель */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          
          {/* Страницы редактирования (будут реализованы позже) */}
          <Route 
            path="/tracks/:trackId/edit" 
            element={
              <MainLayout>
                <PlaceholderPage 
                  title="Редактирование трека" 
                  message="Функционал редактирования треков находится в разработке" 
                />
              </MainLayout>
            } 
          />
          <Route 
            path="/albums/:albumId/edit" 
            element={
              <MainLayout>
                <PlaceholderPage 
                  title="Редактирование альбома" 
                  message="Функционал редактирования альбомов находится в разработке" 
                />
              </MainLayout>
            } 
          />
          <Route 
            path="/artists/:artistId/edit" 
            element={
              <MainLayout>
                <PlaceholderPage 
                  title="Редактирование исполнителя" 
                  message="Функционал редактирования исполнителей находится в разработке" 
                />
              </MainLayout>
            } 
          />
          
          {/* Страницы аутентификации */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          
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
    </AuthProvider>
  );
}

export default App; 