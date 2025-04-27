import { useState, useEffect, useCallback, useContext, createContext } from 'react';

// Создаем контекст для музыкального плеера
const MusicPlayerContext = createContext();

// Провайдер контекста для использования в корневом компоненте
export const MusicPlayerProvider = ({ children }) => {
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioElement, setAudioElement] = useState(null);

  // Инициализация аудио-элемента
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    
    // Обработчики событий
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', handleTrackEnd);
    
    setAudioElement(audio);
    
    return () => {
      // Убираем обработчики при размонтировании
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('ended', handleTrackEnd);
      audio.pause();
    };
  }, []);

  // Обновление громкости при изменении
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = volume;
    }
  }, [volume, audioElement]);

  // Обновление прогресса воспроизведения
  const updateProgress = useCallback(() => {
    if (audioElement) {
      setProgress(audioElement.currentTime);
    }
  }, [audioElement]);

  // Обработка завершения трека
  const handleTrackEnd = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    // Здесь можно добавить логику для автоматического перехода к следующему треку
  }, []);

  // Воспроизведение трека
  const playSong = useCallback((track) => {
    if (audioElement) {
      // Если играет тот же трек, переключаем паузу/воспроизведение
      if (currentTrack && currentTrack.id === track.id) {
        if (isPlaying) {
          audioElement.pause();
          setIsPlaying(false);
        } else {
          audioElement.play();
          setIsPlaying(true);
        }
        return;
      }
      
      // Если новый трек
      setCurrentTrack(track);
      audioElement.src = track.audio_url || 'https://example.com/placeholder-audio.mp3';
      audioElement.load();
      audioElement.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(err => {
          console.error('Ошибка воспроизведения:', err);
          setIsPlaying(false);
        });
    }
  }, [audioElement, currentTrack, isPlaying]);

  // Пауза/возобновление воспроизведения
  const togglePlay = useCallback(() => {
    if (!audioElement || !currentTrack) return;
    
    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  }, [audioElement, currentTrack, isPlaying]);

  // Перемотка к определенной позиции
  const seekTo = useCallback((time) => {
    if (audioElement) {
      audioElement.currentTime = time;
      setProgress(time);
    }
  }, [audioElement]);

  // Изменение громкости
  const changeVolume = useCallback((value) => {
    setVolume(value);
  }, []);

  // Предоставляем доступ к функциям через контекст
  const value = {
    currentTrack,
    isPlaying,
    volume,
    progress,
    duration,
    playSong,
    togglePlay,
    seekTo,
    changeVolume
  };

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

// Хук для использования контекста плеера
const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer должен использоваться внутри MusicPlayerProvider');
  }
  return context;
};

export default useMusicPlayer; 