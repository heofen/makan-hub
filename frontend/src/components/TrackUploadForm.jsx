import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadTrack, getArtists, getAlbums, getGenres } from '../services/api';

const TrackUploadForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  
  // Состояния для формы
  const [formData, setFormData] = useState({
    title: '',
    artist_id: '',
    album_id: '',
    genre: '',
    track_number: '',
    audio_file: null,
    cover_image: null
  });
  
  // Состояния для данных из API
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  
  // Состояния для UI
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    const loadData = async () => {
      try {
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
        setApiError('Не удалось загрузить необходимые данные. Пожалуйста, попробуйте позже.');
      }
    };
    
    loadData();
  }, []);
  
  // Загрузка альбомов при выборе исполнителя
  useEffect(() => {
    const loadAlbums = async () => {
      if (!formData.artist_id) {
        setAlbums([]);
        return;
      }
      
      try {
        const albumsResponse = await getAlbums({ artist_id: formData.artist_id });
        if (albumsResponse.success) {
          setAlbums(albumsResponse.data);
        }
      } catch (err) {
        console.error('Ошибка при загрузке альбомов:', err);
        setApiError('Не удалось загрузить альбомы. Пожалуйста, попробуйте позже.');
      }
    };
    
    loadAlbums();
  }, [formData.artist_id]);
  
  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      
      if (file) {
        setFormData({
          ...formData,
          [name]: file
        });
        
        // Создаем URL для предпросмотра
        if (name === 'audio_file') {
          setAudioPreview(URL.createObjectURL(file));
        } else if (name === 'cover_image') {
          setCoverPreview(URL.createObjectURL(file));
        }
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Очищаем ошибки при изменении поля
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
    
    // Очищаем общую ошибку API при изменении любого поля
    if (apiError) {
      setApiError(null);
    }
    
    // Сбрасываем выбранный альбом при смене исполнителя
    if (name === 'artist_id') {
      setFormData(prev => ({
        ...prev,
        album_id: '',
        track_number: ''
      }));
    }
    
    // Сбрасываем номер трека при смене альбома
    if (name === 'album_id' && value === '') {
      setFormData(prev => ({
        ...prev,
        track_number: ''
      }));
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название трека обязательно';
    }
    
    if (!formData.artist_id) {
      newErrors.artist_id = 'Необходимо выбрать исполнителя';
    }
    
    if (!formData.audio_file) {
      newErrors.audio_file = 'Необходимо загрузить аудиофайл';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Очистка формы
  const resetForm = () => {
    setFormData({
      title: '',
      artist_id: '',
      album_id: '',
      genre: '',
      track_number: '',
      audio_file: null,
      cover_image: null
    });
    setAudioPreview(null);
    setCoverPreview(null);
    setErrors({});
    setApiError(null);
  };
  
  // Обработчик отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await uploadTrack(formData);
      
      if (response.success) {
        resetForm();
        
        // Вызываем callback если он был передан
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(response.data);
        }
      } else {
        handleApiErrors(response.error);
      }
    } catch (error) {
      console.error('Ошибка при загрузке трека:', error);
      setApiError('Произошла ошибка при загрузке трека. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApiErrors = (error) => {
    if (!error) {
      setApiError('Произошла неизвестная ошибка при загрузке трека. Пожалуйста, попробуйте позже.');
      return;
    }
    
    if (typeof error === 'string') {
      setApiError(error);
    } else if (error.detail) {
      setApiError(error.detail);
    } else {
      // Обрабатываем ошибки валидации полей
      const fieldErrors = {};
      Object.keys(error).forEach(key => {
        fieldErrors[key] = Array.isArray(error[key]) ? error[key][0] : error[key];
      });
      setErrors(fieldErrors);
      
      if (Object.keys(fieldErrors).length === 0) {
        setApiError('Произошла ошибка при загрузке трека. Пожалуйста, проверьте данные и попробуйте снова.');
      }
    }
  };
  
  // Освобождаем ресурсы при размонтировании компонента
  useEffect(() => {
    return () => {
      if (audioPreview) URL.revokeObjectURL(audioPreview);
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [audioPreview, coverPreview]);

  return (
    <div className="glass-panel p-8 rounded-xl">
      {apiError && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6">
          <p>{apiError}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Название трека */}
        <div>
          <label htmlFor="title" className="block text-sm text-gray-300 mb-2">
            Название трека *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className={`w-full bg-white/10 text-white border ${errors.title ? 'border-red-400' : 'border-white/20'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50`}
            placeholder="Введите название трека"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-400">{errors.title}</p>
          )}
        </div>
        
        {/* Исполнитель */}
        <div>
          <label htmlFor="artist_id" className="block text-sm text-gray-300 mb-2">
            Исполнитель *
          </label>
          <select
            id="artist_id"
            name="artist_id"
            value={formData.artist_id}
            onChange={handleChange}
            className={`w-full bg-white/10 text-white border ${errors.artist_id ? 'border-red-400' : 'border-white/20'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50`}
          >
            <option value="">Выберите исполнителя</option>
            {artists.map(artist => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
          {errors.artist_id && (
            <p className="mt-1 text-sm text-red-400">{errors.artist_id}</p>
          )}
        </div>
        
        {/* Альбом (если выбран исполнитель) */}
        {formData.artist_id && (
          <div>
            <label htmlFor="album_id" className="block text-sm text-gray-300 mb-2">
              Альбом
            </label>
            <select
              id="album_id"
              name="album_id"
              value={formData.album_id}
              onChange={handleChange}
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
        <div>
          <label htmlFor="genre" className="block text-sm text-gray-300 mb-2">
            Жанр
          </label>
          <select
            id="genre"
            name="genre"
            value={formData.genre}
            onChange={handleChange}
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
        {formData.album_id && (
          <div>
            <label htmlFor="track_number" className="block text-sm text-gray-300 mb-2">
              Номер трека в альбоме
            </label>
            <input
              type="number"
              id="track_number"
              name="track_number"
              value={formData.track_number}
              onChange={handleChange}
              min="1"
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
            />
          </div>
        )}
        
        {/* Загрузка аудиофайла */}
        <div>
          <label htmlFor="audio_file" className="block text-sm text-gray-300 mb-2">
            Аудиофайл *
          </label>
          <div className="flex flex-col space-y-4">
            <input
              type="file"
              id="audio_file"
              name="audio_file"
              onChange={handleChange}
              accept="audio/*"
              className="hidden"
            />
            <label
              htmlFor="audio_file"
              className={`cursor-pointer bg-white/10 border ${errors.audio_file ? 'border-red-400' : 'border-white/20'} border-dashed rounded-lg p-6 text-center hover:bg-white/15 transition-colors`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
              <p className="text-gray-300">
                {formData.audio_file ? formData.audio_file.name : 'Нажмите или перетащите файл сюда'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Поддерживаемые форматы: MP3, WAV, OGG (до 20 МБ)
              </p>
            </label>
            
            {errors.audio_file && (
              <p className="mt-1 text-sm text-red-400">{errors.audio_file}</p>
            )}
            
            {audioPreview && (
              <div className="glass-panel p-4 rounded-lg">
                <audio controls className="w-full">
                  <source src={audioPreview} type={formData.audio_file.type} />
                  Ваш браузер не поддерживает аудио-элемент.
                </audio>
              </div>
            )}
          </div>
        </div>
        
        {/* Загрузка обложки */}
        <div>
          <label htmlFor="cover_image" className="block text-sm text-gray-300 mb-2">
            Обложка трека
          </label>
          <div className="flex flex-col space-y-4">
            <input
              type="file"
              id="cover_image"
              name="cover_image"
              onChange={handleChange}
              accept="image/*"
              className="hidden"
            />
            <label
              htmlFor="cover_image"
              className="cursor-pointer bg-white/10 border border-white/20 border-dashed rounded-lg p-6 text-center hover:bg-white/15 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-300">
                {formData.cover_image ? formData.cover_image.name : 'Нажмите или перетащите изображение сюда'}
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
        
        {/* Кнопки управления */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={resetForm}
            className="btn-secondary py-3 px-6 flex-1"
            disabled={isLoading}
          >
            Очистить
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary py-3 px-6 flex-1 flex items-center justify-center"
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
    </div>
  );
};

export default TrackUploadForm; 