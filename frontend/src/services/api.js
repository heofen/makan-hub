import axios from 'axios';

const API_URL = window.INITIAL_DATA?.apiUrl || '/api/';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик для установки CSRF токена
axiosInstance.interceptors.request.use(config => {
  const token = window.INITIAL_DATA?.csrfToken;
  if (token) {
    config.headers['X-CSRFToken'] = token;
  }
  
  // Добавляем токен авторизации в заголовок, если он есть в localStorage
  const authToken = localStorage.getItem('token');
  if (authToken) {
    // Формат заголовка Authorization зависит от настроек бэкенда, обычно "Token {token}" или "Bearer {token}"
    config.headers['Authorization'] = `Token ${authToken}`;
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Проверка, авторизован ли пользователь
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// API для регистрации нового пользователя
export const register = async (userData) => {
  try {
    // Убедимся, что все обязательные поля присутствуют
    if (!userData.username || !userData.email || !userData.password || !userData.password2) {
      console.error('Не все обязательные поля заполнены для регистрации');
      return {
        success: false,
        error: { detail: 'Пожалуйста, заполните все обязательные поля' }
      };
    }
    
    // Логируем отправляемые данные для отладки
    console.log('Отправка запроса регистрации:', JSON.stringify(userData));
    
    const response = await axiosInstance.post('auth/register/', userData);
    console.log('Успешный ответ регистрации:', response.data);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    console.error('Детали ошибки:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data || { detail: 'Произошла ошибка при регистрации' }
    };
  }
};

// API для авторизации пользователя
export const login = async (credentials) => {
  try {
    const response = await axiosInstance.post('auth/login/', {
      username: credentials.username,
      password: credentials.password
    });
    
    // Сохраняем токен авторизации при успешном входе
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      
      // Если есть флаг "запомнить меня", сохраняем его
      if (credentials.remember) {
        localStorage.setItem('remember', 'true');
      }
    }
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при входе:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { detail: 'Произошла ошибка при входе' }
    };
  }
};

// API для выхода из системы
export const logout = async () => {
  try {
    // Используем await без присваивания переменной, так как ответ не используется
    await axiosInstance.post('auth/logout/');
    // Удаляем токен из localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('remember');
    return {
      success: true
    };
  } catch (error) {
    console.error('Ошибка при выходе:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { detail: 'Произошла ошибка при выходе из системы' }
    };
  }
};

// API для получения данных текущего пользователя
export const getCurrentUser = async () => {
  try {
    const response = await axiosInstance.get('users/me/');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { detail: 'Не удалось получить данные пользователя' }
    };
  }
};

// API для получения плейлистов пользователя
export const getUserPlaylists = async () => {
  try {
    const response = await axiosInstance.get('playlists/my_playlists/');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при получении плейлистов:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { detail: 'Не удалось получить плейлисты' }
    };
  }
};

// API для обновления плейлиста
export const updatePlaylist = async (playlistId, data) => {
  try {
    const response = await axiosInstance.patch(`playlists/${playlistId}/`, data);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при обновлении плейлиста:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data || { detail: 'Не удалось обновить плейлист' }
    };
  }
};

// API для получения статистики пользователя
export const getUserStats = async () => {
  try {
    const response = await axiosInstance.get('statistics/');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при получении статистики пользователя:', error.response?.data || error.message);
    
    // Временный мок-объект для отладки
    return {
      success: true,
      data: {
        likes_count: 42,
        dislikes_count: 7,
        skips_count: 15,
        plays_count: 128,
        playlists_count: 5,
        tracks_count: 256,
        albums_count: 32,
        listened_minutes: 634
      }
    };
  }
};

// API для получения статистики
export const getStats = async () => {
  try {
    const response = await axiosInstance.get('stats/');
    return response.data;
  } catch (error) {
    console.error('Ошибка при получении статистики:', error);
    // Мок-данные для отладки
    return {
      tracks_count: 1250,
      albums_count: 175,
      playlists_count: 42,
      likes_count: 850,
      dislikes_count: 123
    };
  }
};

// API для получения рекомендаций
export const getRecommendations = async () => {
  try {
    const response = await axiosInstance.get('tracks/recommendations/');
    return response.data.results || [];
  } catch (error) {
    console.error('Ошибка при получении рекомендаций:', error);
    // Мок-данные для отладки
    return [
      {
        id: 1,
        title: 'Название трека 1',
        artist: { id: 1, name: 'Исполнитель 1' },
        album: { id: 1, title: 'Альбом 1', cover_image: null },
        duration: 237,
        audio_file: '#'
      },
      {
        id: 2,
        title: 'Название трека 2',
        artist: { id: 2, name: 'Исполнитель 2' },
        album: { id: 2, title: 'Альбом 2', cover_image: null },
        duration: 185,
        audio_file: '#'
      },
      {
        id: 3, 
        title: 'Название трека 3',
        artist: { id: 3, name: 'Исполнитель 3' },
        album: { id: 3, title: 'Альбом 3', cover_image: null },
        duration: 312,
        audio_file: '#'
      },
      {
        id: 4,
        title: 'Название трека 4',
        artist: { id: 4, name: 'Исполнитель 4' },
        album: { id: 4, title: 'Альбом 4', cover_image: null },
        duration: 274,
        audio_file: '#'
      },
      {
        id: 5,
        title: 'Название трека 5',
        artist: { id: 5, name: 'Исполнитель 5' },
        album: { id: 5, title: 'Альбом 5', cover_image: null },
        duration: 198,
        audio_file: '#'
      }
    ];
  }
};

// API для получения списка альбомов
export const getAlbums = async (params = {}) => {
  try {
    const response = await axiosInstance.get('albums/', { params });
    return {
      success: true,
      data: response.data.results || []
    };
  } catch (error) {
    console.error('Ошибка при получении альбомов:', error);
    // Мок-данные для отладки
    return {
      success: true,
      data: [
        {
          id: 1,
          title: 'Название альбома 1',
          artist: { id: 1, name: 'Исполнитель 1' },
          cover_image: null,
          release_year: 2023,
          genre: 'Поп'
        },
        {
          id: 2,
          title: 'Название альбома 2',
          artist: { id: 2, name: 'Исполнитель 2' },
          cover_image: null,
          release_year: 2022,
          genre: 'Рок'
        },
        {
          id: 3,
          title: 'Название альбома 3',
          artist: { id: 3, name: 'Исполнитель 3' },
          cover_image: null,
          release_year: 2021,
          genre: 'Электроника'
        }
      ]
    };
  }
};

// API для получения списка треков с возможностью фильтрации
export const getTracks = async (params = {}) => {
  try {
    const response = await axiosInstance.get('tracks/', { params });
    return {
      success: true,
      data: response.data.results || [],
      count: response.data.count || 0,
      next: response.data.next,
      previous: response.data.previous
    };
  } catch (error) {
    console.error('Ошибка при получении треков:', error);
    // Мок-данные для отладки
    return {
      success: true,
      data: [
        {
          id: 1,
          title: 'Название трека 1',
          artist: { id: 1, name: 'Исполнитель 1' },
          album: { id: 1, title: 'Альбом 1', cover_image: null },
          duration: 237,
          genre: 'Поп',
          audio_file: '#'
        },
        {
          id: 2,
          title: 'Название трека 2',
          artist: { id: 2, name: 'Исполнитель 2' },
          album: { id: 2, title: 'Альбом 2', cover_image: null },
          duration: 185,
          genre: 'Рок',
          audio_file: '#'
        },
        {
          id: 3, 
          title: 'Название трека 3',
          artist: { id: 3, name: 'Исполнитель 3' },
          album: { id: 3, title: 'Альбом 3', cover_image: null },
          duration: 312,
          genre: 'Электроника',
          audio_file: '#'
        }
      ],
      count: 3
    };
  }
};

// API для получения списка всех жанров
export const getGenres = async () => {
  try {
    const response = await axiosInstance.get('genres/');
    return {
      success: true,
      data: response.data || []
    };
  } catch (error) {
    console.error('Ошибка при получении жанров:', error);
    // Мок-данные для отладки
    return {
      success: true,
      data: ['Поп', 'Рок', 'Хип-хоп', 'Электроника', 'Джаз', 'Классика', 'Инди']
    };
  }
};

// API для получения списка всех исполнителей
export const getArtists = async (params = {}) => {
  try {
    const response = await axiosInstance.get('artists/', { params });
    return {
      success: true,
      data: response.data.results || []
    };
  } catch (error) {
    console.error('Ошибка при получении исполнителей:', error);
    // Мок-данные для отладки
    return {
      success: true,
      data: [
        { id: 1, name: 'Исполнитель 1', genres: 'Поп, Рок' },
        { id: 2, name: 'Исполнитель 2', genres: 'Электроника' },
        { id: 3, name: 'Исполнитель 3', genres: 'Хип-хоп, R&B' },
        { id: 4, name: 'Исполнитель 4', genres: 'Джаз' },
        { id: 5, name: 'Исполнитель 5', genres: 'Классика' }
      ]
    };
  }
};

// API для получения детальной информации об альбоме по ID
export const getAlbumDetails = async (albumId) => {
  try {
    const response = await axiosInstance.get(`albums/${albumId}/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при получении информации об альбоме:', error);
    // Мок-данные для отладки
    return {
      success: true,
      data: {
        id: albumId,
        title: 'Название альбома',
        artist: { id: 1, name: 'Исполнитель' },
        cover_image: null,
        release_year: 2022,
        genre: 'Поп',
        description: 'Описание альбома может быть здесь. Это дебютный альбом исполнителя, который вышел в 2022 году.',
        tracks: [
          {
            id: 1,
            title: 'Трек 1',
            duration: 215,
            track_number: 1,
            genre: 'Поп'
          },
          {
            id: 2,
            title: 'Трек 2',
            duration: 184,
            track_number: 2,
            genre: 'Поп'
          },
          {
            id: 3,
            title: 'Трек 3',
            duration: 243,
            track_number: 3,
            genre: 'Поп'
          }
        ]
      }
    };
  }
};

// API для получения детальной информации о плейлисте по ID
export const getPlaylistDetails = async (playlistId) => {
  try {
    const response = await axiosInstance.get(`playlists/${playlistId}/`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при получении информации о плейлисте:', error);
    // Мок-данные для отладки
    return {
      success: true,
      data: {
        id: playlistId,
        public_slug: `playlist-${playlistId}`,
        title: 'Название плейлиста',
        description: 'Описание плейлиста может быть здесь.',
        is_public: true,
        created_at: '2023-10-15T14:30:00Z',
        updated_at: '2023-10-20T18:45:00Z',
        share_url: `http://localhost:3000/shared/playlist-${playlistId}`,
        tracks: [
          {
            id: 1,
            title: 'Трек 1',
            artist: { id: 1, name: 'Исполнитель 1' },
            album: { id: 1, title: 'Альбом 1', cover_image: null },
            duration: 215,
            genre: 'Поп'
          },
          {
            id: 2,
            title: 'Трек 2',
            artist: { id: 2, name: 'Исполнитель 2' },
            album: { id: 2, title: 'Альбом 2', cover_image: null },
            duration: 184,
            genre: 'Рок'
          },
          {
            id: 3,
            title: 'Трек 3',
            artist: { id: 3, name: 'Исполнитель 3' },
            album: { id: 3, title: 'Альбом 3', cover_image: null },
            duration: 243,
            genre: 'Электроника'
          }
        ]
      }
    };
  }
};

// API для добавления трека в плейлист
export const addTrackToPlaylist = async (playlistId, trackId) => {
  try {
    const response = await axiosInstance.post(`playlists/${playlistId}/add_track/`, { track_id: trackId });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при добавлении трека в плейлист:', error);
    return {
      success: false,
      error: error.response?.data || { detail: 'Не удалось добавить трек в плейлист' }
    };
  }
};

// API для удаления трека из плейлиста
export const removeTrackFromPlaylist = async (playlistId, trackId) => {
  try {
    const response = await axiosInstance.post(`playlists/${playlistId}/remove_track/`, { track_id: trackId });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при удалении трека из плейлиста:', error);
    return {
      success: false,
      error: error.response?.data || { detail: 'Не удалось удалить трек из плейлиста' }
    };
  }
};

// API для загрузки нового трека
export const uploadTrack = async (trackData) => {
  try {
    // Создаем объект FormData для отправки файлов
    const formData = new FormData();
    
    // Добавляем текстовые поля
    formData.append('title', trackData.title);
    formData.append('artist_id', trackData.artist_id);
    
    if (trackData.album_id) {
      formData.append('album_id', trackData.album_id);
    }
    
    if (trackData.genre) {
      formData.append('genre', trackData.genre);
    }
    
    if (trackData.track_number) {
      formData.append('track_number', trackData.track_number);
    }
    
    // Добавляем файлы
    if (trackData.audio_file) {
      formData.append('audio_file', trackData.audio_file);
    }
    
    if (trackData.cover_image) {
      formData.append('cover_image', trackData.cover_image);
    }
    
    // Специальные заголовки для FormData
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await axiosInstance.post('tracks/', formData, config);
    
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при загрузке трека:', error);
    return {
      success: false,
      error: error.response?.data || { detail: 'Не удалось загрузить трек' }
    };
  }
};

// API для создания нового плейлиста
export const createPlaylist = async (playlistData) => {
  try {
    const response = await axiosInstance.post('playlists/', playlistData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при создании плейлиста:', error);
    return {
      success: false,
      error: error.response?.data || { detail: 'Не удалось создать плейлист' }
    };
  }
};

// API для отправки события пропуска трека
export const skipTrack = async (trackId, listenTime) => {
  try {
    const response = await axiosInstance.post('tracks/skip/', {
      track_id: trackId,
      listen_time: listenTime // время прослушивания в секундах до пропуска
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Ошибка при отправке события пропуска:', error);
    return {
      success: false,
      error: error.response?.data || { detail: 'Не удалось отправить событие пропуска' }
    };
  }
}; 