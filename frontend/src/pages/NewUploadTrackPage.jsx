import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/api';
import MainLayout from '../layouts/MainLayout';
import TrackUploadForm from '../components/TrackUploadForm';

const NewUploadTrackPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedTrack, setUploadedTrack] = useState(null);

  // Проверка прав пользователя при загрузке страницы
  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Загрузка данных пользователя для проверки прав
        const userResponse = await getCurrentUser();
        
        if (userResponse.success) {
          setUser(userResponse.data);
          // Проверяем, имеет ли пользователь права админа или артиста
          setIsAuthorized(
            userResponse.data.is_staff || 
            userResponse.data.is_superuser || 
            userResponse.data.role === 'admin' || 
            userResponse.data.role === 'artist'
          );
        } else {
          // Если пользователь не авторизован, перенаправляем на страницу входа
          navigate('/login?reason=unauthorized&redirect=/upload-track');
        }
      } catch (err) {
        console.error('Ошибка при проверке авторизации:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthorization();
  }, [navigate]);

  // Обработчик успешной загрузки трека
  const handleUploadSuccess = (track) => {
    setUploadedTrack(track);
    setUploadSuccess(true);
    
    // Перенаправляем на страницу трека через 2 секунды
    setTimeout(() => {
      navigate(`/tracks/${track.id || track.slug}`);
    }, 2000);
  };

  // Отображаем загрузку
  if (loading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto pb-10 flex items-center justify-center min-h-screen-nav">
          <div className="spinner"></div>
        </div>
      </MainLayout>
    );
  }

  // Если у пользователя нет прав на загрузку треков
  if (user && !isAuthorized) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto pb-10">
          <div className="glass-panel p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-red-400 mb-4">Доступ запрещен</h2>
            <p className="text-white/80">
              У вас нет прав для загрузки треков. Эта функция доступна только для администраторов и артистов.
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto pb-10">
        <h1 className="text-3xl font-bold text-white mb-8">Загрузка трека</h1>
        
        {uploadSuccess ? (
          <div className="glass-panel p-8 rounded-xl">
            <div className="bg-green-500/20 text-green-300 p-6 rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-2">Трек успешно загружен!</h2>
              <p className="mb-4">Вы будете перенаправлены на страницу трека...</p>
              {uploadedTrack && (
                <div className="flex flex-col items-center">
                  {uploadedTrack.cover_image_url && (
                    <img 
                      src={uploadedTrack.cover_image_url} 
                      alt={uploadedTrack.title} 
                      className="w-32 h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  <h3 className="text-xl font-semibold">{uploadedTrack.title}</h3>
                  <p className="text-white/70">{uploadedTrack.artist_name}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <TrackUploadForm onSuccess={handleUploadSuccess} />
        )}
      </div>
    </MainLayout>
  );
};

export default NewUploadTrackPage; 