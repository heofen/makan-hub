import React, { useState, useRef } from 'react';
import { createPlaylist } from '../services/api';

const PlaylistCreateForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_public: true
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [createdPlaylist, setCreatedPlaylist] = useState(null);
  const shareUrlRef = useRef(null);

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
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
  };
  
  // Валидация формы
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Название плейлиста обязательно';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      const response = await createPlaylist(formData);
      
      if (response.success) {
        setCreatedPlaylist(response.data);
        
        // Вызываем callback если он был передан
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(response.data);
        }
      } else {
        handleApiErrors(response.error);
      }
    } catch (error) {
      console.error('Ошибка при создании плейлиста:', error);
      setApiError('Произошла ошибка при создании плейлиста. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApiErrors = (error) => {
    if (!error) {
      setApiError('Произошла неизвестная ошибка при создании плейлиста. Пожалуйста, попробуйте позже.');
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
        setApiError('Произошла ошибка при создании плейлиста. Пожалуйста, проверьте данные и попробуйте снова.');
      }
    }
  };

  // Функция для копирования ссылки в буфер обмена
  const copyShareUrl = () => {
    if (shareUrlRef.current) {
      shareUrlRef.current.select();
      document.execCommand('copy');
      
      // Предотвращаем выделение
      window.getSelection().removeAllRanges();
      
      // Можно добавить уведомление об успешном копировании
      alert('Ссылка скопирована!');
    }
  };
  
  // Создаем полный URL для шаринга
  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/shared/${createdPlaylist.public_slug}`;
  };

  return (
    <div className="glass-panel p-8 rounded-xl">
      {apiError && (
        <div className="bg-red-500/20 text-red-300 p-4 rounded-lg mb-6">
          <p>{apiError}</p>
        </div>
      )}
      
      {createdPlaylist ? (
        <div className="space-y-6">
          <div className="bg-green-500/20 text-green-300 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Плейлист успешно создан!</h2>
            <p>Теперь вы можете добавлять в него треки и делиться им с друзьями.</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Информация о плейлисте</h3>
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="mb-3">
                <span className="text-gray-400">Название:</span>
                <p className="text-white font-medium">{createdPlaylist.title}</p>
              </div>
              
              {createdPlaylist.description && (
                <div className="mb-3">
                  <span className="text-gray-400">Описание:</span>
                  <p className="text-white">{createdPlaylist.description}</p>
                </div>
              )}
              
              <div className="mb-3">
                <span className="text-gray-400">Доступ:</span>
                <p className="text-white">
                  {createdPlaylist.is_public ? 'Публичный' : 'Приватный'}
                </p>
              </div>
            </div>
          </div>
          
          {createdPlaylist.is_public && (
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Публичная ссылка</h3>
              <div className="flex items-center space-x-2">
                <input
                  ref={shareUrlRef}
                  type="text"
                  value={getShareUrl()}
                  readOnly
                  className="flex-1 bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none"
                />
                <button
                  onClick={copyShareUrl}
                  className="btn-secondary py-2 px-4"
                  type="button"
                >
                  Копировать
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-400">
                По этой ссылке любой пользователь сможет просмотреть ваш плейлист.
              </p>
            </div>
          )}
          
          <div className="flex space-x-4 pt-4">
            <a
              href={`/playlists/${createdPlaylist.id}`}
              className="btn-primary py-3 px-6 flex-1 text-center"
            >
              Перейти к плейлисту
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название плейлиста */}
          <div>
            <label htmlFor="title" className="block text-sm text-gray-300 mb-2">
              Название плейлиста *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full bg-white/10 text-white border ${errors.title ? 'border-red-400' : 'border-white/20'} rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50`}
              placeholder="Введите название плейлиста"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-400">{errors.title}</p>
            )}
          </div>
          
          {/* Описание плейлиста */}
          <div>
            <label htmlFor="description" className="block text-sm text-gray-300 mb-2">
              Описание
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-white/10 text-white border border-white/20 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-music-primary/50"
              placeholder="Добавьте описание плейлиста (необязательно)"
              rows="3"
            ></textarea>
          </div>
          
          {/* Доступ к плейлисту */}
          <div>
            <div className="flex items-center">
              <input
                id="is_public"
                name="is_public"
                type="checkbox"
                checked={formData.is_public}
                onChange={handleChange}
                className="h-4 w-4 bg-white/10 border-white/20 rounded focus:ring-music-primary"
              />
              <label htmlFor="is_public" className="ml-2 block text-sm text-white/80">
                Публичный плейлист (доступен по ссылке)
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Если плейлист публичный, вы сможете поделиться им с другими пользователями по ссылке.
            </p>
          </div>
          
          {/* Кнопка создания */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary py-3 px-6 w-full flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="spinner-sm mr-3"></div>
                  Создание...
                </>
              ) : (
                'Создать плейлист'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PlaylistCreateForm; 