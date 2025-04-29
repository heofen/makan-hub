import React, { useCallback, memo } from 'react';
import useMusicPlayer from '../hooks/useMusicPlayer';
import { formatDuration } from '../utils/helpers';

const MusicPlayerControls = memo(() => {
  const { 
    currentTrack, 
    isPlaying, 
    progress, 
    duration, 
    togglePlay, 
    seekTo,
    skipCurrentTrack
  } = useMusicPlayer();

  // Обработчик изменения положения ползунка прогресса воспроизведения
  const handleProgressChange = useCallback((e) => {
    seekTo(parseFloat(e.target.value));
  }, [seekTo]);

  // Если нет текущего трека, не отображаем управление
  if (!currentTrack) {
    return null;
  }

  return (
    <div className="music-player-background fixed bottom-0 left-0 right-0 py-3 px-4 z-50">
      <div className="container mx-auto flex items-center">
        {/* Информация о треке */}
        <div className="flex items-center mr-4 w-1/4">
          <div className="w-12 h-12 bg-white/10 rounded overflow-hidden flex-shrink-0">
            {currentTrack.album?.cover_image ? (
              <img 
                src={currentTrack.album.cover_image} 
                alt={currentTrack.album.title} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
          </div>
          <div className="ml-3 truncate">
            <p className="text-white font-medium truncate">{currentTrack.title}</p>
            <p className="text-gray-400 text-sm truncate">{currentTrack.artist?.name}</p>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center justify-center space-x-4 flex-1">
          {/* Кнопка пропуска трека */}
          <button 
            onClick={skipCurrentTrack}
            className="p-2 text-gray-400 hover:text-white transition-colors focus:outline-none"
            title="Пропустить"
            aria-label="Пропустить трек"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>

          {/* Кнопка воспроизведения/паузы */}
          <button 
            onClick={togglePlay}
            className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors focus:outline-none"
            title={isPlaying ? "Пауза" : "Воспроизвести"}
            aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* Полоса прогресса */}
        <div className="flex items-center w-1/3 space-x-3">
          <span className="text-gray-400 text-xs min-w-10">{formatDuration(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress || 0}
            onChange={handleProgressChange}
            className="w-full h-1 bg-white/10 rounded-full appearance-none focus:outline-none"
            style={{
              backgroundSize: `${(progress / duration) * 100}% 100%`,
              backgroundImage: 'linear-gradient(to right, #3b82f6, #8b5cf6)'
            }}
          />
          <span className="text-gray-400 text-xs min-w-10">{formatDuration(duration)}</span>
        </div>
      </div>
    </div>
  );
});

MusicPlayerControls.displayName = 'MusicPlayerControls';

export default MusicPlayerControls; 