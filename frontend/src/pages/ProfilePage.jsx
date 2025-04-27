import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { getCurrentUser, getUserStats, getUserPlaylists, updatePlaylist, logout } from '../services/api';

// SVG-иконки для профиля
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SaveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CancelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// Компонент для статистики пользователя
const UserStatsDashboard = ({ stats }) => {
  return (
    <div className="glass-panel p-6 rounded-xl mb-8">
      <h2 className="text-2xl font-semibold mb-6">Ваша статистика</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <StatCard title="Лайков" value={stats.likes_count} />
        <StatCard title="Дизлайков" value={stats.dislikes_count} />
        <StatCard title="Прослушиваний" value={stats.plays_count} />
        <StatCard title="Пропусков" value={stats.skips_count} />
        <StatCard title="Мин. прослушано" value={stats.listened_minutes} />
        <StatCard title="Плейлистов" value={stats.playlists_count} />
        <StatCard title="Треков" value={stats.tracks_count} />
        <StatCard title="Альбомов" value={stats.albums_count} />
      </div>
    </div>
  );
};

// Компонент карточки статистики
const StatCard = ({ title, value }) => (
  <div className="glass-card p-4 rounded-lg bg-white/5 flex flex-col items-center text-center">
    <p className="text-gray-300 text-sm">{title}</p>
    <p className="text-white text-xl font-semibold mt-1">{value}</p>
  </div>
);

// Компонент редактируемого плейлиста
const EditablePlaylist = ({ playlist, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(playlist.title);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (title.trim() === '') return;
    if (title === playlist.title) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    const response = await updatePlaylist(playlist.public_slug, { title });
    setIsLoading(false);
    
    if (response.success) {
      onUpdate(playlist.public_slug, response.data);
      setIsEditing(false);
    } else {
      // Сбросить до оригинального названия в случае ошибки
      setTitle(playlist.title);
      alert('Не удалось обновить плейлист');
    }
  };

  return (
    <div className="glass-card p-4 rounded-lg hover:bg-white/5 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div className="flex-grow">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 w-full text-white focus:outline-none focus:ring-2 focus:ring-music-primary/50"
              autoFocus
            />
          ) : (
            <Link to={`/playlists/${playlist.public_slug}`} className="text-white hover:text-music-primary transition-colors">
              {playlist.title}
            </Link>
          )}
          <p className="text-sm text-gray-400 mt-1">{playlist.tracks_count} треков</p>
        </div>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button 
                disabled={isLoading}
                onClick={handleSave} 
                className="p-1.5 bg-green-500/20 rounded-full hover:bg-green-500/30 transition-colors"
              >
                <SaveIcon />
              </button>
              <button 
                disabled={isLoading}
                onClick={() => {
                  setTitle(playlist.title);
                  setIsEditing(false);
                }} 
                className="p-1.5 bg-red-500/20 rounded-full hover:bg-red-500/30 transition-colors"
              >
                <CancelIcon />
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <EditIcon />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Загружаем данные пользователя
        const userResponse = await getCurrentUser();
        if (!userResponse.success) {
          throw new Error(userResponse.error?.detail || 'Не удалось загрузить профиль');
        }
        setUser(userResponse.data);
        
        // Загружаем статистику
        const statsResponse = await getUserStats();
        if (statsResponse.success) {
          setStats(statsResponse.data);
        }
        
        // Загружаем плейлисты
        const playlistsResponse = await getUserPlaylists();
        if (playlistsResponse.success) {
          setPlaylists(playlistsResponse.data.results || []);
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных профиля:', err);
        setError('Не удалось загрузить данные профиля. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    const response = await logout();
    if (response.success) {
      navigate('/');
      window.location.reload(); // Перезагрузка для обновления состояния авторизации
    }
  };

  const handlePlaylistUpdate = (playlistId, updatedPlaylist) => {
    setPlaylists(playlists.map(p => 
      p.public_slug === playlistId ? { ...p, ...updatedPlaylist } : p
    ));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="spinner"></div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="glass-panel p-8 rounded-xl">
          <h2 className="text-2xl font-semibold text-red-400 mb-4">Ошибка</h2>
          <p className="text-white/80">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 btn-primary"
          >
            Попробовать снова
          </button>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <div className="glass-panel p-8 rounded-xl">
          <h2 className="text-2xl font-semibold mb-4">Требуется авторизация</h2>
          <p className="text-white/80">Для просмотра профиля необходимо войти в аккаунт.</p>
          <div className="mt-6 flex space-x-4">
            <Link to="/login" className="btn-primary">
              Войти
            </Link>
            <Link to="/register" className="btn-secondary">
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        {/* Профиль пользователя */}
        <div className="glass-panel p-8 rounded-xl mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-music-primary to-music-secondary flex items-center justify-center text-white text-3xl font-bold">
                {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">{user.username}</h1>
                <p className="text-gray-300 mt-1">{user.email}</p>
                <p className="text-gray-400 text-sm mt-2">Дата регистрации: {new Date(user.date_joined).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex flex-col space-y-2 w-full md:w-auto">
              <Link to="/settings" className="btn-secondary w-full md:w-auto text-center">
                Редактировать профиль
              </Link>
              <button 
                onClick={handleLogout}
                className="btn-secondary bg-red-500/20 hover:bg-red-500/30 w-full md:w-auto"
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </div>

        {/* Метрики пользователя */}
        {stats && <UserStatsDashboard stats={stats} />}

        {/* Плейлисты пользователя */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Ваши плейлисты</h2>
            <Link to="/playlists/create" className="btn-primary text-sm py-2">
              Создать плейлист
            </Link>
          </div>
          
          {playlists.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <p className="text-gray-300 mb-4">У вас пока нет плейлистов</p>
              <Link to="/playlists/create" className="btn-primary">
                Создать первый плейлист
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {playlists.map(playlist => (
                <EditablePlaylist 
                  key={playlist.public_slug} 
                  playlist={playlist} 
                  onUpdate={handlePlaylistUpdate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage; 