import React, { useState, useEffect } from 'react';
import { getAlbums, getArtists, getGenres } from '../services/api';
import MainLayout from '../layouts/MainLayout';
import { Link } from 'react-router-dom';

// Компонент для фильтров
const Filters = ({ onFilterChange, artists, genres }) => {
  const [selectedArtist, setSelectedArtist] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');

  const handleArtistChange = (e) => {
    const artistId = e.target.value;
    setSelectedArtist(artistId);
    onFilterChange({ 
      artist_id: artistId,
      genre: selectedGenre
    });
  };

  const handleGenreChange = (e) => {
    const genre = e.target.value;
    setSelectedGenre(genre);
    onFilterChange({ 
      artist_id: selectedArtist,
      genre: genre
    });
  };

  const handleResetFilters = () => {
    setSelectedArtist('');
    setSelectedGenre('');
    onFilterChange({});
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
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
        
        <div className="w-full md:w-1/2">
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
      </div>
      
      {(selectedArtist || selectedGenre) && (
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

// Компонент карточки альбома
const AlbumCard = ({ album }) => {
  return (
    <Link 
      to={`/albums/${album.id}`} 
      className="glass-card rounded-lg overflow-hidden hover:bg-white/5 transition-all duration-300 flex flex-col"
    >
      <div className="aspect-square bg-white/10 overflow-hidden">
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
              className="w-16 h-16"
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
      
      <div className="p-4">
        <h3 className="text-white font-medium truncate">{album.title}</h3>
        <p className="text-gray-400 text-sm mt-1">{album.artist?.name}</p>
        <div className="flex items-center mt-2">
          <span className="text-gray-400 text-xs px-2 py-1 bg-white/10 rounded-full">{album.release_year}</span>
          {album.genre && (
            <span className="text-gray-400 text-xs ml-2 px-2 py-1 bg-white/10 rounded-full">{album.genre}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

// Основной компонент страницы
const AlbumsPage = () => {
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const [totalAlbums, setTotalAlbums] = useState(0);

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Загрузка исполнителей
        const artistsResponse = await getArtists();
        if (artistsResponse.success) {
          setArtists(artistsResponse.data);
        }
        
        // Загрузка жанров
        const genresResponse = await getGenres();
        if (genresResponse.success) {
          setGenres(genresResponse.data);
        }
        
        // Загрузка альбомов (без фильтров изначально)
        const albumsResponse = await getAlbums();
        if (albumsResponse.success) {
          setAlbums(albumsResponse.data);
          setTotalAlbums(albumsResponse.count || albumsResponse.data.length);
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

  // Загрузка альбомов при изменении фильтров
  useEffect(() => {
    const loadFilteredAlbums = async () => {
      setIsLoading(true);
      try {
        const albumsResponse = await getAlbums(filters);
        if (albumsResponse.success) {
          setAlbums(albumsResponse.data);
          setTotalAlbums(albumsResponse.count || albumsResponse.data.length);
        }
      } catch (err) {
        console.error('Ошибка при фильтрации альбомов:', err);
        setError('Не удалось применить фильтры. Пожалуйста, попробуйте позже.');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Вызываем запрос при любом изменении фильтров
    loadFilteredAlbums();
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
      <div className="max-w-6xl mx-auto pb-10">
        <h1 className="text-3xl font-bold text-white mb-8">Альбомы</h1>
        
        {/* Фильтры */}
        <Filters
          onFilterChange={handleFilterChange}
          artists={artists}
          genres={genres}
        />
        
        {/* Результаты */}
        <div className="glass-panel p-6 rounded-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Все альбомы</h2>
            <span className="text-gray-400 text-sm">Найдено: {totalAlbums}</span>
          </div>
        
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="spinner"></div>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 text-red-300 p-4 rounded-lg">
              <p>{error}</p>
            </div>
          ) : albums.length === 0 ? (
            <div className="bg-white/5 rounded-lg p-8 text-center">
              <p className="text-gray-300">По вашему запросу ничего не найдено</p>
              <button
                onClick={() => setFilters({})}
                className="mt-4 btn-secondary"
              >
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {albums.map(album => (
                <AlbumCard key={album.id} album={album} />
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AlbumsPage; 