/**
 * Форматирует продолжительность в секундах в формат мм:сс
 * @param {number} durationInSeconds - продолжительность в секундах
 * @returns {string} форматированная строка в формате мм:сс
 */
export const formatDuration = (durationInSeconds) => {
  if (!durationInSeconds) return '0:00';
  
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = Math.floor(durationInSeconds % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Обрезает текст до указанной длины и добавляет многоточие
 * @param {string} text - Исходный текст
 * @param {number} maxLength - Максимальная длина текста
 * @returns {string} Обрезанный текст
 */
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
};

/**
 * Форматирует число, добавляя разделитель разрядов
 * @param {number} num - Число для форматирования
 * @returns {string} Отформатированное число
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Получает относительное время (например, "5 минут назад")
 * @param {string|Date} dateString - Дата в виде строки или объекта Date
 * @returns {string} Относительное время
 */
export const getRelativeTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'только что';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${getMinutesWord(diffInMinutes)} назад`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${getHoursWord(diffInHours)} назад`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${getDaysWord(diffInDays)} назад`;
  }
  
  // Для более старых дат просто возвращаем дату в формате ДД.ММ.ГГГГ
  return date.toLocaleDateString('ru-RU');
};

// Вспомогательные функции для правильного склонения слов
const getMinutesWord = (minutes) => {
  if (minutes % 10 === 1 && minutes % 100 !== 11) {
    return 'минуту';
  } else if ([2, 3, 4].includes(minutes % 10) && ![12, 13, 14].includes(minutes % 100)) {
    return 'минуты';
  } else {
    return 'минут';
  }
};

const getHoursWord = (hours) => {
  if (hours % 10 === 1 && hours % 100 !== 11) {
    return 'час';
  } else if ([2, 3, 4].includes(hours % 10) && ![12, 13, 14].includes(hours % 100)) {
    return 'часа';
  } else {
    return 'часов';
  }
};

const getDaysWord = (days) => {
  if (days % 10 === 1 && days % 100 !== 11) {
    return 'день';
  } else if ([2, 3, 4].includes(days % 10) && ![12, 13, 14].includes(days % 100)) {
    return 'дня';
  } else {
    return 'дней';
  }
};

/**
 * Генерирует случайный цвет в формате HEX
 * @returns {string} - Случайный цвет в формате HEX
 */
export const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Определяет, является ли текущее устройство мобильным
 * @returns {boolean} - true, если устройство мобильное
 */
export const isMobile = () => {
  return window.innerWidth <= 768;
}; 