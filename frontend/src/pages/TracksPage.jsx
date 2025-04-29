import React, { useState, useEffect } from 'react';
import { getTracks, getGenres, getArtists } from '../services/api';
import MainLayout from '../layouts/MainLayout';

// Вспомогательные функции и компоненты
const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Компонент для фильтров
const Filters = ({ onFilterChange, genres, artists }) => {
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedArtist, setSelectedArtist] = useState('');

  const handleGenreChange = (e) => {
    const genre = e.target.value;
    setSelectedGenre(genre);
    onFilterChange({ genre, artist_id: selectedArtist });
  };

  const handleArtistChange = (e) => {
    const artistId = e.target.value;
    setSelectedArtist(artistId);
    onFilterChange({ genre: selectedGenre, artist_id: artistId });
  };

  const handleResetFilters = () => {
    setSelectedGenre('');
    setSelectedArtist('');
    onFilterChange({});
  };

  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2">
          <label htmlFor="genre-filter" className="block text-sm text-gray-300 mb-2">
            Фильтр по жанру
          </label>
          <select
            id="genre-filter"
            value={selectedGenre}
            onChange={handleGenreChange}
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
          >
            <option value="">Все жанры</option>
            {genres.map((genre, index) => (
              <option key={index} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full sm:w-1/2">
          <label htmlFor="artist-filter" className="block text-sm text-gray-300 mb-2">
            Фильтр по исполнителю
          </label>
          <select
            id="artist-filter"
            value={selectedArtist}
            onChange={handleArtistChange}
            className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
          >
            <option value="">Все исполнители</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {(selectedGenre || selectedArtist) && (
        <div className="flex justify-end">
          <button
            onClick={handleResetFilters}
            className="text-sm text-music-primary hover:text-music-primary/80 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
};

// Компонент трека
const TrackItem = ({ track }) => {
  return (
    <div className="glass-card p-4 rounded-lg hover:bg-white/5 transition-all duration-300 flex items-center">
      <div className="w-12 h-12 bg-white/10 rounded overflow-hidden flex-shrink-0 mr-4">
        {track.album?.cover_image || track.cover_image ? (
          <img 
            src={track.cover_image || track.album?.cover_image} 
            alt={track.title} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>
      
      <div className="flex-grow">
        <h3 className="text-white font-medium">{track.title}</h3>
        <p className="text-gray-400 text-sm">{track.artist?.name || track.artist_name}</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-gray-400 text-sm">{formatDuration(track.duration)}</span>
        {track.genre && (
          <span className="text-gray-400 text-xs px-2 py-1 bg-white/10 rounded-full">{track.genre}</span>
        )}
        
        <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Основной компонент страницы
const TracksPage = () => {
  const [tracks, setTracks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [totalTracks, setTotalTracks] = useState(0);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Загрузка жанров
        const genresResponse = await getGenres();
        if (genresResponse.success) {
          setGenres(genresResponse.data);
        }
        
        // Загрузка исполнителей
        const artistsResponse = await getArtists();
        if (artistsResponse.success) {
          setArtists(artistsResponse.data);
        }
        
        // Загрузка треков (без фильтров изначально)
        const tracksResponse = await getTracks();
        if (tracksResponse.success) {
          setTracks(tracksResponse.data);
          setTotalTracks(tracksResponse.count || tracksResponse.data.length);
        }
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Загрузка треков при изменении фильтров
  useEffect(() => {
    const loadFilteredTracks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const tracksResponse = await getTracks(filters);
        if (tracksResponse.success) {
          setTracks(tracksResponse.data);
          setTotalTracks(tracksResponse.count || tracksResponse.data.length);
        }
      } catch (err) {
        console.error('Ошибка при фильтрации треков:', err);
        setError('Не удалось применить фильтры. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Всегда вызываем запрос при изменении фильтров
    loadFilteredTracks();
  }, [filters]);

  // Обработчик изменения фильтров
  const handleFilterChange = (newFilters) => {
    // Удаляем пустые значения из фильтров
    const cleanedFilters = Object.entries(newFilters).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    setFilters(cleanedFilters);
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto pb-10">
        <h1 className="text-3xl font-bold text-white mb-8">Треки</h1>
        
        {/* Фильтры */}
        <Filters
          onFilterChange={handleFilterChange}
          genres={genres}
          artists={artists}
        />
        
        {/* Результаты */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {Object.keys(filters).length > 0 ? 'Результаты поиска' : 'Все треки'}
            </h2>
            <span className="text-gray-400 text-sm">Найдено: {totalTracks}</span>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 text-red-300 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          ) : tracks.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <p className="text-gray-300 mb-4">По вашему запросу ничего не найдено</p>
              <button
                onClick={() => setFilters({})}
                className="btn-secondary py-2 px-4"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {tracks.map(track => (
                <TrackItem key={track.id} track={track} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default TracksPage; 