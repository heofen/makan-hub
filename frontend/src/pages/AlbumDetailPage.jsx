import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAlbumDetails } from '../services/api';
import MainLayout from '../layouts/MainLayout';

// Вспомогательные функции и компоненты
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Компонент для отображения трека в списке
const TrackListItem = ({ track, trackNumber }) => {
  return (
    <Link 
      to={`/tracks/${track.id}`} 
      className="glass-card p-4 rounded-lg hover:bg-white/5 transition-all duration-300 flex items-center"
    >
      <div className="w-8 flex-shrink-0 text-center text-gray-400">
        {trackNumber}
      </div>
      
      <div className="flex-grow ml-4">
        <h3 className="text-white font-medium">{track.title}</h3>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-gray-400 text-sm">{formatDuration(track.duration)}</span>
        <span className="text-gray-400 text-xs px-2 py-1 bg-white/10 rounded-full">{track.genre}</span>
        
        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </Link>
  );
};

// Основной компонент страницы
const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const [album, setAlbum] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка данных альбома при монтировании компонента
  useEffect(() => {
    const loadAlbumData = async () => {
      setIsLoading(true);
      try {
        const response = await getAlbumDetails(albumId);
        if (response.success) {
          setAlbum(response.data);
        } else {
          throw new Error("Не удалось загрузить информацию об альбоме");
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных альбома:', err);
        setError('Не удалось загрузить информацию об альбоме. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (albumId) {
      loadAlbumData();
    }
  }, [albumId]);

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
  if (error || !album) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel p-8 rounded-xl">
            <h2 className="text-2xl font-semibold text-red-400 mb-4">Ошибка</h2>
            <p className="text-white/80">{error || 'Альбом не найден'}</p>
            <Link to="/albums" className="btn-primary mt-6 inline-block">
              Вернуться к списку альбомов
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-10">
        {/* Шапка альбома */}
        <div className="glass-panel p-8 rounded-xl mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-64 h-64 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
              {album.cover_image ? (
                <img 
                  src={album.cover_image} 
                  alt={album.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    className="w-24 h-24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={1.5} 
                      d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" 
                    />
                  </svg>
                </div>
              )}
            </div>
            
            <div className="flex-grow">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">{album.title}</h1>
                  
                  <div className="mt-2">
                    <Link 
                      to={`/artists/${album.artist.id}`} 
                      className="text-xl text-music-primary hover:underline"
                    >
                      {album.artist.name}
                    </Link>
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-4">
                    <span className="text-gray-300 text-sm px-3 py-1 bg-white/10 rounded-full">
                      {album.release_year}
                    </span>
                    <span className="text-gray-300 text-sm px-3 py-1 bg-white/10 rounded-full">
                      {album.genre}
                    </span>
                    <span className="text-gray-300 text-sm px-3 py-1 bg-white/10 rounded-full">
                      {album.tracks.length} треков
                    </span>
                  </div>
                  
                  {album.description && (
                    <p className="text-gray-300 mt-6">{album.description}</p>
                  )}
                </div>
                
                <div className="mt-6 flex space-x-4">
                  <button className="btn-primary py-2 px-6 flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Воспроизвести</span>
                  </button>
                  <button className="btn-secondary py-2 px-6 flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <span>Добавить в избранное</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Список треков */}
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Треки</h2>
          
          <div className="space-y-3">
            {album.tracks.map((track, index) => (
              <TrackListItem 
                key={track.id} 
                track={track} 
                trackNumber={track.track_number || index + 1} 
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default AlbumDetailPage; 