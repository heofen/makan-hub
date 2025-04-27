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
    const response = await axiosInstance.post('auth/login/', credentials);
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
    const response = await axiosInstance.post('auth/logout/');
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