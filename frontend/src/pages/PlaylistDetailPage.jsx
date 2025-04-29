import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlaylistDetails, removeTrackFromPlaylist, getTracks, addTrackToPlaylist, updatePlaylist } from '../services/api';
import MainLayout from '../layouts/MainLayout';

// Вспомогательные функции и компоненты
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Мемоизированный компонент для отображения трека в списке
const PlaylistTrackItem = memo(({ track, index, onRemove, isEditing }) => {
  const handleRemove = useCallback(() => {
    onRemove(track.id);
  }, [track.id, onRemove]);

  return (
    <div className="glass-card p-4 rounded-lg hover:bg-white/5 transition-all duration-300 flex items-center">
      <div className="w-8 flex-shrink-0 text-center text-gray-400">
        {index + 1}
      </div>
      
      <div className="w-10 h-10 bg-white/10 rounded overflow-hidden ml-2 flex-shrink-0">
        {track.album?.cover_image ? (
          <img 
            src={track.album.cover_image} 
            alt={track.album.title} 
            className="w-full h-full object-cover"
            loading="lazy" // Добавляем ленивую загрузку изображений
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex-grow ml-4">
        <Link to={`/tracks/${track.id}`} className="text-white font-medium hover:text-music-primary transition-colors">
          {track.title}
        </Link>
        <p className="text-gray-400 text-sm">
          {track.artist?.name}
          {track.album && ` • ${track.album.title}`}
        </p>
      </div>
      
      <div className="flex items-center space-x-3">
        <span className="text-gray-400 text-sm">{formatDuration(track.duration)}</span>
        
        {isEditing ? (
          <button 
            onClick={handleRemove}
            className="p-2 bg-red-500/20 text-red-300 rounded-full hover:bg-red-500/30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ) : (
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

PlaylistTrackItem.displayName = 'PlaylistTrackItem';

// Мемоизированный компонент поиска треков для добавления в плейлист
const AddTracksPanel = memo(({ playlist, onTrackAdded }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Поиск треков по заданному запросу
  const searchTracks = useCallback(async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await getTracks({ search: searchTerm });
      if (response.success) {
        // Фильтруем треки, которые уже есть в плейлисте
        const existingTrackIds = new Set(playlist.tracks.map(track => track.id));
        const filteredTracks = response.data.filter(track => !existingTrackIds.has(track.id));
        setTracks(filteredTracks);
      } else {
        throw new Error("Не удалось найти треки");
      }
    } catch (err) {
      console.error('Ошибка при поиске треков:', err);
      setError('Не удалось найти треки. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, playlist.tracks]);

  // Обработчик изменения поискового запроса
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  // Обработчик добавления трека в плейлист
  const handleAddTrack = useCallback(async (trackId) => {
    try {
      const response = await addTrackToPlaylist(playlist.id, trackId);
      if (response.success) {
        const addedTrack = tracks.find(track => track.id === trackId);
        if (addedTrack) {
          onTrackAdded(addedTrack);
          // Удаляем трек из результатов поиска
          setTracks(prevTracks => prevTracks.filter(track => track.id !== trackId));
        }
      } else {
        throw new Error("Не удалось добавить трек");
      }
    } catch (err) {
      console.error('Ошибка при добавлении трека:', err);
      setError('Не удалось добавить трек. Пожалуйста, попробуйте позже.');
    }
  }, [playlist.id, tracks, onTrackAdded]);

  // Мемоизируем список треков, чтобы не рендерить его заново при каждом обновлении родительского компонента
  const tracksList = useMemo(() => {
    if (tracks.length === 0) {
      if (searchTerm.trim() && !isLoading) {
        return (
          <div className="bg-white/5 rounded-lg p-8 text-center">
            <p className="text-gray-300">По вашему запросу ничего не найдено</p>
          </div>
        );
      }
      return null;
    }

    return (
      <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
        {tracks.map(track => (
          <div key={track.id} className="glass-card p-4 rounded-lg hover:bg-white/5 transition-all duration-300 flex items-center">
            <div className="flex-grow">
              <h3 className="text-white font-medium">{track.title}</h3>
              <p className="text-gray-400 text-sm">{track.artist?.name}</p>
            </div>
            
            <button
              onClick={() => handleAddTrack(track.id)}
              className="p-2 bg-green-500/20 text-green-300 rounded-full hover:bg-green-500/30 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  }, [tracks, searchTerm, isLoading, handleAddTrack]);

  return (
    <div className="glass-panel p-6 rounded-xl mt-6">
      <h2 className="text-xl font-semibold mb-4">Добавить треки</h2>
      
      <div className="flex mb-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Поиск треков..."
          className="flex-grow bg-white/10 text-white border border-white/20 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
        />
        <button
          onClick={searchTracks}
          disabled={isLoading || !searchTerm.trim()}
          className="bg-music-primary text-white rounded-r-lg px-4 py-2 hover:bg-music-primary/90 transition-colors disabled:bg-music-primary/50"
        >
          {isLoading ? 'Поиск...' : 'Найти'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {tracksList}
    </div>
  );
});

AddTracksPanel.displayName = 'AddTracksPanel';

// Мемоизированный компонент для копирования ссылки на плейлист
const ShareLink = memo(({ url }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Не удалось скопировать ссылку:', err);
      });
  }, [url]);

  return (
    <div className="flex items-center space-x-2 mt-2">
      <div className="bg-white/10 text-gray-300 rounded-lg px-3 py-2 text-sm flex-grow truncate">
        {url}
      </div>
      <button
        onClick={copyToClipboard}
        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
      >
        {copied ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
});

ShareLink.displayName = 'ShareLink';

// Мемоизированный компонент для отображения формы редактирования информации о плейлисте
const PlaylistEditForm = memo(({ playlist, onSave }) => {
  const [title, setTitle] = useState(playlist.title || '');
  const [description, setDescription] = useState(playlist.description || '');
  const [isPublic, setIsPublic] = useState(playlist.is_public);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTitleChange = useCallback((e) => {
    setTitle(e.target.value);
  }, []);

  const handleDescriptionChange = useCallback((e) => {
    setDescription(e.target.value);
  }, []);

  const handleIsPublicChange = useCallback((e) => {
    setIsPublic(e.target.checked);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await updatePlaylist(playlist.id, {
        title,
        description,
        is_public: isPublic
      });

      if (response.success) {
        onSave(response.data);
      } else {
        throw new Error(response.error?.detail || 'Не удалось обновить плейлист');
      }
    } catch (err) {
      console.error('Ошибка при обновлении плейлиста:', err);
      setError('Не удалось обновить информацию о плейлисте. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  }, [playlist.id, title, description, isPublic, onSave]);

  return (
    <div className="glass-panel p-6 rounded-xl mb-6">
      <h2 className="text-xl font-semibold mb-4">Редактировать информацию</h2>
      
      {error && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="playlist-title" className="block text-gray-300 mb-2">
            Название плейлиста
          </label>
          <input
            id="playlist-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="playlist-description" className="block text-gray-300 mb-2">
            Описание
          </label>
          <textarea
            id="playlist-description"
            value={description}
            onChange={handleDescriptionChange}
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50 min-h-[100px]"
          />
        </div>
        
        <div className="mb-6">
          <label className="flex items-center text-gray-300 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isPublic} 
              onChange={handleIsPublicChange}
              className="mr-2 h-5 w-5 rounded"
            />
            Сделать плейлист публичным
          </label>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-music-primary text-white rounded-lg px-6 py-2 hover:bg-music-primary/90 transition-colors disabled:bg-music-primary/50"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
});

PlaylistEditForm.displayName = 'PlaylistEditForm';

// Основной компонент страницы
const PlaylistDetailPage = () => {
  const { playlistId } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Загрузка данных плейлиста при монтировании компонента
  useEffect(() => {
    const loadPlaylistData = async () => {
      setIsLoading(true);
      try {
        const response = await getPlaylistDetails(playlistId);
        if (response.success) {
          setPlaylist(response.data);
        } else {
          throw new Error("Не удалось загрузить информацию о плейлисте");
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных плейлиста:', err);
        setError('Не удалось загрузить информацию о плейлисте. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (playlistId) {
      loadPlaylistData();
    }
  }, [playlistId]);

  // Удаление трека из плейлиста
  const handleRemoveTrack = useCallback(async (trackId) => {
    try {
      const response = await removeTrackFromPlaylist(playlistId, trackId);
      if (response.success) {
        // Обновляем локальное состояние без перезагрузки с сервера
        setPlaylist(prev => ({
          ...prev,
          tracks: prev.tracks.filter(track => track.id !== trackId)
        }));
      } else {
        throw new Error("Не удалось удалить трек");
      }
    } catch (err) {
      console.error('Ошибка при удалении трека:', err);
      alert('Не удалось удалить трек. Пожалуйста, попробуйте позже.');
    }
  }, [playlistId]);

  // Добавление трека в плейлист
  const handleTrackAdded = useCallback((track) => {
    setPlaylist(prev => ({
      ...prev,
      tracks: [...prev.tracks, track]
    }));
  }, []);

  // Включение/выключение режима редактирования
  const toggleEditMode = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  // Обработчик сохранения изменений в данных плейлиста
  const handlePlaylistInfoSaved = useCallback((updatedPlaylist) => {
    // Обновляем только поля информации, сохраняя список треков неизменным
    setPlaylist(prev => ({
      ...updatedPlaylist,
      tracks: prev.tracks
    }));
  }, []);

  // Мемоизируем список треков для предотвращения лишних рендеров
  const tracksList = useMemo(() => {
    if (!playlist) return null;
    
    if (playlist.tracks.length === 0) {
      return (
        <div className="bg-white/5 rounded-lg p-8 text-center">
          <p className="text-gray-300">В этом плейлисте пока нет треков</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-3">
        {playlist.tracks.map((track, index) => (
          <PlaylistTrackItem 
            key={track.id} 
            track={track} 
            index={index}
            onRemove={handleRemoveTrack}
            isEditing={isEditing}
          />
        ))}
      </div>
    );
  }, [playlist, isEditing, handleRemoveTrack]);

  // Рендер во время загрузки
  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-[70vh]">
          <div className="spinner"></div>
        </div>
      </MainLayout>
    );
  }

  // Рендер при ошибке
  if (error || !playlist) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-red-400 mb-4">Ошибка</h2>
            <p className="text-white/80">{error || 'Плейлист не найден'}</p>
            <Link to="/playlists" className="btn-primary mt-6 inline-block">
              Вернуться к списку плейлистов
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-10">
        {/* Шапка плейлиста */}
        <div className="glass-panel p-8 rounded-xl mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">{playlist.title}</h1>
              
              {playlist.description && (
                <p className="text-gray-300 mt-2">{playlist.description}</p>
              )}
              
              <div className="mt-3">
                <div className="flex items-center text-gray-400 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Обновлен: {new Date(playlist.updated_at).toLocaleDateString()}
                </div>
                
                <div className="flex items-center text-gray-400 text-sm mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {playlist.tracks.length} треков
                </div>
              </div>
              
              {/* Публичная ссылка */}
              {playlist.is_public && (
                <div className="mt-4">
                  <div className="text-gray-300 text-sm">Публичная ссылка:</div>
                  <ShareLink url={playlist.share_url} />
                </div>
              )}
            </div>
            
            <div>
              <button
                onClick={toggleEditMode}
                className={`btn-${isEditing ? 'secondary bg-green-500/20 hover:bg-green-500/30' : 'primary'} py-2 px-4 flex items-center space-x-2`}
              >
                {isEditing ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Готово</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span>Редактировать</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Форма редактирования информации (показывается только в режиме редактирования) */}
        {isEditing && (
          <PlaylistEditForm 
            playlist={playlist} 
            onSave={handlePlaylistInfoSaved} 
          />
        )}
        
        {/* Список треков */}
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Треки</h2>
          {tracksList}
        </div>
        
        {/* Панель добавления треков (показывается только в режиме редактирования) */}
        {isEditing && (
          <AddTracksPanel 
            playlist={playlist}
            onTrackAdded={handleTrackAdded}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default PlaylistDetailPage; 