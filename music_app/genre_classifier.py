import logging
import random
import numpy as np

logger = logging.getLogger(__name__)

class GenreClassifier:
    """
    Класс-заглушка для классификации жанров музыки на основе аудио или эмбеддингов.
    В реальном приложении здесь должна быть реализация модели машинного обучения
    для классификации жанров.
    """
    _instance = None
    
    GENRES = [
        'рок', 'поп', 'хип-хоп', 'рэп', 'электронная', 'джаз', 
        'блюз', 'классическая', 'фолк', 'кантри', 'метал', 
        'инди', 'соул', 'фанк', 'регги', 'панк', 'альтернатива', 
        'техно', 'хаус', 'транс', 'дабстеп', 'эмбиент'
    ]
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GenreClassifier, cls).__new__(cls)
            cls._instance._init()
        return cls._instance
    
    def _init(self):
        """Инициализация атрибутов класса"""
        logger.info("Инициализирована заглушка классификатора жанров")
        self.model_loaded = True
        
    def is_model_loaded(self):
        """Проверяет, загружена ли модель"""
        return self.model_loaded
    
    def predict_genre(self, audio_path=None, embedding=None):
        """
        Предсказывает жанр трека на основе аудиофайла или эмбеддинга.
        
        Args:
            audio_path: Путь к аудиофайлу (опционально)
            embedding: Эмбеддинг аудио (опционально)
            
        Returns:
            dict: Словарь с предсказанными жанрами и их вероятностями
        """
        if audio_path:
            logger.info(f"Прогнозирование жанра для аудиофайла: {audio_path}")
        elif embedding is not None:
            logger.info(f"Прогнозирование жанра на основе эмбеддинга размерности {len(embedding)}")
        else:
            logger.warning("Не указан ни аудиофайл, ни эмбеддинг")
        
        # Генерируем случайные предсказания
        # В реальном приложении здесь должен быть вызов модели
        genres_count = random.randint(1, 3)  # Число жанров, которые будут предсказаны
        
        # Выбираем случайные жанры
        selected_genres = random.sample(self.GENRES, genres_count)
        
        # Генерируем случайные вероятности и нормализуем их
        probabilities = np.random.random(genres_count)
        probabilities = probabilities / np.sum(probabilities)
        
        # Формируем результат
        result = {}
        for genre, prob in zip(selected_genres, probabilities):
            result[genre] = float(prob)
        
        sorted_result = dict(sorted(result.items(), key=lambda x: x[1], reverse=True))
        
        logger.info(f"Предсказанные жанры: {sorted_result}")
        return sorted_result
    
    def predict_genre_from_audio(self, audio_path):
        """
        Предсказывает жанр трека на основе аудиофайла.
        
        Args:
            audio_path: Путь к аудиофайлу
            
        Returns:
            dict: Словарь с предсказанными жанрами и их вероятностями
        """
        return self.predict_genre(audio_path=audio_path)
    
    def predict_genre_from_embedding(self, embedding):
        """
        Предсказывает жанр трека на основе эмбеддинга.
        
        Args:
            embedding: Эмбеддинг аудио
            
        Returns:
            dict: Словарь с предсказанными жанрами и их вероятностями
        """
        return self.predict_genre(embedding=embedding)
    
    def get_all_genres(self):
        """
        Возвращает список всех доступных жанров.
        
        Returns:
            list: Список жанров
        """
        return self.GENRES
    
    def get_model_info(self):
        """
        Возвращает информацию о модели.
        
        Returns:
            dict: Информация о модели
        """
        return {
            "model_type": "Классификатор жанров (эмуляция)",
            "genres_count": len(self.GENRES),
            "is_loaded": self.model_loaded,
            "is_emulated": True
        }

# Создаем и экспортируем синглтон для глобального использования
genre_classifier = GenreClassifier() 