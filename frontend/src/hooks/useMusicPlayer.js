import { useState, useEffect, useCallback, useContext, createContext, useRef } from 'react';
import { skipTrack } from '../services/api';

// Создаем контекст для музыкального плеера
const MusicPlayerContext = createContext();

// Провайдер контекста для использования в корневом компоненте
export const MusicPlayerProvider = ({ children }) => {
  // Используем useRef для хранения аудио элемента
  const audioElementRef = useRef(null);
  
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackStartTime, setTrackStartTime] = useState(null);
  
  // Инициализируем аудио один раз при монтировании
  useEffect(() => {
    const audio = new Audio();
    audio.volume = volume;
    audioElementRef.current = audio;

    return () => {
      // Убираем обработчики при размонтировании
      audio.pause();
      audio.src = '';
    };
  }, [volume]);

  // Обновление прогресса воспроизведения, оптимизируем для снижения нагрузки
  const updateProgress = useCallback(() => {
    if (audioElementRef.current) {
      // Планируем обновление прогресса через requestAnimationFrame для оптимизации производительности
      requestAnimationFrame(() => {
        setProgress(audioElementRef.current.currentTime);
      });
    }
  }, []);

  // Обработка завершения трека
  const handleTrackEnd = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setTrackStartTime(null);
    // Здесь можно добавить логику для автоматического перехода к следующему треку
  }, []);

  // Установка обработчиков событий для аудио-элемента
  useEffect(() => {
    const audio = audioElementRef.current;
    if (!audio) return;
    
    // Добавляем обработчики
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', handleTrackEnd);
    
    return () => {
      // Убираем обработчики
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [updateProgress, handleTrackEnd]);

  // Обновление громкости при изменении
  useEffect(() => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  // Внутренняя функция для переключения состояния воспроизведения
  // Вынесена отдельно, чтобы избежать циклической зависимости
  const togglePlayInternal = useCallback(() => {
    const audio = audioElementRef.current;
    if (!audio || !currentTrack) return;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          if (!trackStartTime) {
            setTrackStartTime(Date.now());
          }
        })
        .catch(err => {
          console.error('Ошибка воспроизведения:', err);
        });
    }
  }, [currentTrack, isPlaying, trackStartTime]);

  // Публичная функция для переключения состояния воспроизведения
  const togglePlay = useCallback(() => {
    togglePlayInternal();
  }, [togglePlayInternal]);

  // Воспроизведение трека - оптимизированная версия
  const playSong = useCallback((track) => {
    const audio = audioElementRef.current;
    if (!audio) return;
    
    // Если играет тот же трек, переключаем паузу/воспроизведение
    if (currentTrack && currentTrack.id === track.id) {
      togglePlayInternal();
      return;
    }
    
    // Если новый трек
    setCurrentTrack(track);
    
    // Предзагружаем аудио
    audio.src = track.audio_url || track.audio_file || 'https://example.com/placeholder-audio.mp3';
    audio.load();
    
    // Воспроизводим после загрузки метаданных
    const playAfterLoad = () => {
      audio.play()
        .then(() => {
          setIsPlaying(true);
          setTrackStartTime(Date.now());
        })
        .catch(err => {
          console.error('Ошибка воспроизведения:', err);
          setIsPlaying(false);
          setTrackStartTime(null);
        });
      
      // Удаляем этот одноразовый обработчик
      audio.removeEventListener('loadedmetadata', playAfterLoad);
    };
    
    audio.addEventListener('loadedmetadata', playAfterLoad);
  }, [currentTrack, togglePlayInternal]);

  // Перемотка к определенной позиции
  const seekTo = useCallback((time) => {
    const audio = audioElementRef.current;
    if (audio) {
      audio.currentTime = time;
      // Устанавливаем значение напрямую, не дожидаясь события timeupdate
      setProgress(time);
    }
  }, []);

  // Изменение громкости
  const changeVolume = useCallback((value) => {
    setVolume(value);
  }, []);

  // Пропуск трека с отправкой события на сервер
  const skipCurrentTrack = useCallback(async () => {
    const audio = audioElementRef.current;
    if (!currentTrack || !audio) return;
    
    // Вычисляем время прослушивания в секундах
    const listenTime = audio.currentTime;
    const trackId = currentTrack.id;
    
    // Останавливаем воспроизведение
    audio.pause();
    audio.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
    
    // Сбрасываем текущий трек и время начала
    setTrackStartTime(null);
    
    // Отправляем событие skip на сервер
    try {
      await skipTrack(trackId, listenTime);
      console.log(`Трек ${trackId} пропущен после ${listenTime} секунд прослушивания`);
      
      // Если слушали меньше 10 секунд, API автоматически засчитает как дизлайк
      if (listenTime < 10) {
        console.log(`Трек ${trackId} был прослушан менее 10 секунд, учтено как дизлайк`);
      }
    } catch (error) {
      console.error('Ошибка при отправке события пропуска трека:', error);
    }
  }, [currentTrack]);

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
    changeVolume,
    skipCurrentTrack
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