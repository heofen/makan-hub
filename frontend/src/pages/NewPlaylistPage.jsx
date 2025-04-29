import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import MainLayout from '../layouts/MainLayout';
import PlaylistCreateForm from '../components/PlaylistCreateForm';

const NewPlaylistPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createdPlaylist, setCreatedPlaylist] = useState(null);

  // Проверка авторизации пользователя
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userResponse = await getCurrentUser();
        
        if (!userResponse.success) {
          // Если пользователь не авторизован, перенаправляем на страницу входа
          navigate('/login?reason=unauthorized&redirect=/playlists/create');
        }
      } catch (err) {
        console.error('Ошибка при проверке авторизации:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);

  // Обработчик успешного создания плейлиста
  const handleCreateSuccess = (playlist) => {
    setCreatedPlaylist(playlist);
    setCreateSuccess(true);
  };

  // Отображаем загрузку
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto pb-10 flex items-center justify-center min-h-screen-nav">
          <div className="spinner"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-10">
        <h1 className="text-3xl font-bold text-white mb-8">Создание плейлиста</h1>
        
        <PlaylistCreateForm onSuccess={handleCreateSuccess} />
      </div>
    </MainLayout>
  );
};

export default NewPlaylistPage; 