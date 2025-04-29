import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadTrack, getArtists, getAlbums, getGenres, getCurrentUser } from '../services/api';
import MainLayout from '../layouts/MainLayout';

const UploadTrackPage = () => {
  const navigate = useNavigate();
  
  // Состояния для формы
  const [title, setTitle] = useState('');
  const [artistId, setArtistId] = useState('');
  const [albumId, setAlbumId] = useState('');
  const [genre, setGenre] = useState('');
  const [trackNumber, setTrackNumber] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  
  // Состояния для данных из API
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  
  // Состояния для UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [audioPreview, setAudioPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
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
        }
        
        // Загрузка списка исполнителей
        const artistsResponse = await getArtists();
        if (artistsResponse.success) {
          setArtists(artistsResponse.data);
        }
        
        // Загрузка списка жанров
        const genresResponse = await getGenres();
        if (genresResponse.success) {
          setGenres(genresResponse.data);
        }
        
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить необходимые данные. Пожалуйста, попробуйте позже.');
      }
    };
    
    loadData();
  }, []);
  
  // Загрузка альбомов при выборе исполнителя
  useEffect(() => {
    const loadAlbums = async () => {
      if (!artistId) {
        setAlbums([]);
        return;
      }
      
      try {
        const albumsResponse = await getAlbums({ artist_id: artistId });
        if (albumsResponse.success) {
          setAlbums(albumsResponse.data);
        }
      } catch (err) {
        console.error('Ошибка при загрузке альбомов:', err);
      }
    };
    
    loadAlbums();
  }, [artistId]);
  
  // Обработчики изменения полей формы
  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleArtistChange = (e) => {
    setArtistId(e.target.value);
    setAlbumId(''); // Сбрасываем выбранный альбом при смене исполнителя
  };
  const handleAlbumChange = (e) => setAlbumId(e.target.value);
  const handleGenreChange = (e) => setGenre(e.target.value);
  const handleTrackNumberChange = (e) => setTrackNumber(e.target.value);
  
  // Обработчики загрузки файлов
  const handleAudioFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudioFile(file);
      // Создаем URL для предпросмотра аудио
      setAudioPreview(URL.createObjectURL(file));
    }
  };
  
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      // Создаем URL для предпросмотра изображения
      setCoverPreview(URL.createObjectURL(file));
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    if (!title) {
      setError('Название трека обязательно');
      return false;
    }
    
    if (!artistId) {
      setError('Необходимо выбрать исполнителя');
      return false;
    }
    
    if (!audioFile) {
      setError('Необходимо загрузить аудиофайл');
      return false;
    }
    
    return true;
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const trackData = {
        title,
        artist_id: artistId,
        album_id: albumId || null,
        genre: genre || null,
        track_number: trackNumber || null,
        audio_file: audioFile,
        cover_image: coverImage || null
      };
      
      const response = await uploadTrack(trackData);
      
      if (response.success) {
        setSuccess(true);
        // Очищаем форму
        setTitle('');
        setArtistId('');
        setAlbumId('');
        setGenre('');
        setTrackNumber('');
        setAudioFile(null);
        setCoverImage(null);
        setAudioPreview(null);
        setCoverPreview(null);
        
        // Перенаправляем на страницу загруженного трека через 2 секунды
        setTimeout(() => {
          navigate(`/tracks/${response.data.id}`);
        }, 2000);
      } else {
        throw new Error(response.error?.detail || 'Не удалось загрузить трек');
      }
    } catch (err) {
      console.error('Ошибка при загрузке трека:', err);
      setError(err.message || 'Произошла ошибка при загрузке трека. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
        
        <div className="glass-panel p-8 rounded-xl">
          {success ? (
            <div className="bg-green-500/20 text-green-300 p-6 rounded-lg text-center">
              <h2 className="text-xl font-semibold mb-2">Трек успешно загружен!</h2>
              <p>Вы будете перенаправлены на страницу трека...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6">
                  <p>{error}</p>
                </div>
              )}
              
              {/* Название трека */}
              <div className="mb-6">
                <label htmlFor="title" className="block text-sm text-gray-300 mb-2">
                  Название трека *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
                  placeholder="Введите название трека"
                  required
                />
              </div>
              
              {/* Исполнитель */}
              <div className="mb-6">
                <label htmlFor="artist" className="block text-sm text-gray-300 mb-2">
                  Исполнитель *
                </label>
                <select
                  id="artist"
                  value={artistId}
                  onChange={handleArtistChange}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
                  required
                >
                  <option value="">Выберите исполнителя</option>
                  {artists.map(artist => (
                    <option key={artist.id} value={artist.id}>
                      {artist.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Альбом (если выбран исполнитель) */}
              {artistId && (
                <div className="mb-6">
                  <label htmlFor="album" className="block text-sm text-gray-300 mb-2">
                    Альбом
                  </label>
                  <select
                    id="album"
                    value={albumId}
                    onChange={handleAlbumChange}
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
                  >
                    <option value="">Без альбома</option>
                    {albums.map(album => (
                      <option key={album.id} value={album.id}>
                        {album.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Жанр */}
              <div className="mb-6">
                <label htmlFor="genre" className="block text-sm text-gray-300 mb-2">
                  Жанр
                </label>
                <select
                  id="genre"
                  value={genre}
                  onChange={handleGenreChange}
                  className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
                >
                  <option value="">Выберите жанр</option>
                  {genres.map((genreItem, index) => (
                    <option key={index} value={genreItem}>
                      {genreItem}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Номер трека (если выбран альбом) */}
              {albumId && (
                <div className="mb-6">
                  <label htmlFor="trackNumber" className="block text-sm text-gray-300 mb-2">
                    Номер трека в альбоме
                  </label>
                  <input
                    type="number"
                    id="trackNumber"
                    value={trackNumber}
                    onChange={handleTrackNumberChange}
                    min="1"
                    className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
                  />
                </div>
              )}
              
              {/* Загрузка аудиофайла */}
              <div className="mb-6">
                <label htmlFor="audioFile" className="block text-sm text-gray-300 mb-2">
                  Аудиофайл *
                </label>
                <div className="flex flex-col space-y-4">
                  <input
                    type="file"
                    id="audioFile"
                    onChange={handleAudioFileChange}
                    accept="audio/*"
                    className="hidden"
                    required
                  />
                  <label
                    htmlFor="audioFile"
                    className="cursor-pointer bg-white/10 border border-white/20 border-dashed rounded-lg p-6 text-center hover:bg-white/15 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
                    </svg>
                    <p className="text-gray-300">
                      {audioFile ? audioFile.name : 'Нажмите или перетащите файл сюда'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Поддерживаемые форматы: MP3, WAV, OGG (до 20 МБ)
                    </p>
                  </label>
                  
                  {audioPreview && (
                    <div className="glass-card p-4 rounded-lg">
                      <audio controls className="w-full">
                        <source src={audioPreview} type={audioFile.type} />
                        Ваш браузер не поддерживает аудио-элемент.
                      </audio>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Загрузка обложки */}
              <div className="mb-6">
                <label htmlFor="coverImage" className="block text-sm text-gray-300 mb-2">
                  Обложка трека
                </label>
                <div className="flex flex-col space-y-4">
                  <input
                    type="file"
                    id="coverImage"
                    onChange={handleCoverImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <label
                    htmlFor="coverImage"
                    className="cursor-pointer bg-white/10 border border-white/20 border-dashed rounded-lg p-6 text-center hover:bg-white/15 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-300">
                      {coverImage ? coverImage.name : 'Нажмите или перетащите изображение сюда'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Поддерживаемые форматы: JPG, PNG, WEBP (до 5 МБ)
                    </p>
                  </label>
                  
                  {coverPreview && (
                    <div className="w-40 h-40 bg-white/10 rounded-lg overflow-hidden">
                      <img 
                        src={coverPreview} 
                        alt="Предпросмотр обложки" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Кнопка отправки */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary py-3 px-6 w-full flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="spinner-sm mr-3"></div>
                      Загрузка...
                    </>
                  ) : (
                    'Загрузить трек'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default UploadTrackPage; 