from .models import Track
from .mongodb import TrackVectors
from .clap_model import CLAPModel, CLAP_AVAILABLE
from .annoy_index import annoy_index
import json
import logging
import os
from django.conf import settings

logger = logging.getLogger(__name__)

class TrackVectorService:
    """
    Сервис для работы с векторными представлениями треков,
    хранящимися в MongoDB.
    """
    
    @staticmethod
    def extract_track_features(track):
        """
        Извлекает особенности трека для создания вектора с помощью CLAP.
        
        Args:
            track: объект модели Track
            
        Returns:
            Словарь с векторными данными трека
        """
        # Базовая информация о треке
        features = {
            "track_id": track.id,
            "title": track.title,
            "artist_id": track.artist_id,
            "album_id": track.album_id,
            # Аудио-особенности
            "audio_features": {
                "duration": str(track.duration) if track.duration else None,
                "genre": track.genre,
            },
            # Пустой эмбеддинг по умолчанию
            "embedding": []
        }
        
        # Если CLAP недоступен, возвращаем базовые данные без векторизации
        if not CLAP_AVAILABLE:
            logger.warning(f"CLAP недоступен, трек {track.id} будет сохранен без векторизации")
            return features
            
        # Получаем путь к аудиофайлу
        if not track.audio_file:
            logger.error(f"У трека {track.id} отсутствует аудиофайл")
            return features
            
        # Получаем полный путь к файлу
        audio_path = os.path.join(settings.MEDIA_ROOT, track.audio_file.name)
        
        # Проверяем существование файла
        if not os.path.exists(audio_path):
            logger.error(f"Файл не найден: {audio_path}")
            return features
        
        # Получаем CLAP модель
        clap_model = CLAPModel.get_instance()
        
        # Получаем векторное представление аудио
        embedding = clap_model.get_audio_embedding(audio_path)
        
        if embedding is not None:
            # Преобразуем numpy в список для JSON
            features["embedding"] = embedding.tolist()
        else:
            logger.error(f"Не удалось получить эмбеддинг для трека {track.id}")
        
        return features
    
    @classmethod
    def process_track(cls, track_id):
        """
        Обрабатывает трек - извлекает особенности и сохраняет в MongoDB.
        
        Args:
            track_id: ID трека
            
        Returns:
            bool: успешность операции
        """
        try:
            track = Track.objects.get(pk=track_id)
            
            # Извлечение особенностей с помощью CLAP
            features = cls.extract_track_features(track)
            
            # Сохранение в MongoDB
            TrackVectors.save_track_vector(track_id, features)
            
            # Обновляем Annoy-индекс, только если есть валидный эмбеддинг
            if features.get('embedding') and len(features['embedding']) > 0:
                # Используем инкрементальное обновление индекса
                result = annoy_index.add_track_to_index(track_id)
                if result:
                    logger.info(f"Трек {track_id} успешно добавлен в Annoy-индекс")
                else:
                    logger.warning(f"Не удалось добавить трек {track_id} в Annoy-индекс")
            else:
                logger.warning(f"Трек {track_id} не имеет эмбеддинга, не добавляем в индекс")
            
            return True
        except Exception as e:
            logger.error(f"Ошибка при обработке трека {track_id}: {str(e)}")
            return False
    
    @classmethod
    def get_track_recommendations(cls, track_id, limit=5):
        """
        Получает рекомендации похожих треков.
        
        Args:
            track_id: ID трека
            limit: максимальное количество рекомендаций
            
        Returns:
            Список объектов Track
        """
        try:
            # Сначала пробуем быстрый поиск через Annoy-индекс
            if annoy_index.is_loaded:
                similar_track_ids = []
                
                # Проверяем, загружен ли индекс, если нет - загружаем или строим
                if not annoy_index.load_index():
                    logger.warning("Не удалось загрузить Annoy-индекс, пытаемся построить")
                    if not annoy_index.build_index():
                        logger.warning("Не удалось построить Annoy-индекс, используем обычный поиск")
                    else:
                        similar_track_pairs = annoy_index.find_similar_tracks(track_id, limit=limit)
                        similar_track_ids = [track_id for track_id, _ in similar_track_pairs]
                else:
                    similar_track_pairs = annoy_index.find_similar_tracks(track_id, limit=limit)
                    similar_track_ids = [track_id for track_id, _ in similar_track_pairs]
                
                # Если нашли результаты через Annoy
                if similar_track_ids:
                    similar_tracks = Track.objects.filter(pk__in=similar_track_ids)
                    logger.info(f"Найдено {len(similar_tracks)} похожих треков через Annoy-индекс")
                    return similar_tracks
            
            # Если Annoy не доступен или не вернул результаты, используем обычный поиск
            logger.info("Используем обычный поиск в MongoDB")
            
            # Получаем вектор трека из MongoDB
            vector = TrackVectors.get_track_vector(track_id)
            
            if not vector:
                # Если вектора нет, обрабатываем трек
                cls.process_track(track_id)
                vector = TrackVectors.get_track_vector(track_id)
                
                # Если вектор все еще не найден
                if not vector:
                    return []
            
            # Получаем похожие треки на основе вектора
            similar_track_ids = TrackVectors.find_similar_tracks(vector, limit=limit)
            
            # Загружаем объекты треков из основной PostgreSQL базы
            similar_tracks = Track.objects.filter(pk__in=similar_track_ids)
            
            return similar_tracks
            
        except Exception as e:
            logger.error(f"Ошибка при получении рекомендаций для трека {track_id}: {str(e)}")
            return []
    
    @classmethod
    def get_track_recommendations_with_scores(cls, track_id, limit=10):
        """
        Получает рекомендации треков с оценками сходства.
        
        Args:
            track_id: ID трека, для которого нужны рекомендации
            limit: максимальное количество рекомендаций
            
        Returns:
            tuple: (scores, tracks), где scores - список оценок сходства, 
                   tracks - список объектов Track
        """
        try:
            track = Track.objects.get(id=track_id)
        except Track.DoesNotExist:
            logger.error(f"Трек с ID {track_id} не найден")
            return [], []
        
        # Проверяем, загружен ли индекс Annoy
        if annoy_index.is_loaded:
            logger.info(f"Используем Annoy индекс для поиска похожих треков к {track.title}")
            
            # Пытаемся найти похожие треки через Annoy индекс
            similar_track_ids, similarity_scores = annoy_index.find_similar_tracks_with_scores(track_id, limit)
            
            # Если результаты найдены через Annoy
            if similar_track_ids:
                tracks = list(Track.objects.filter(id__in=similar_track_ids))
                
                # Сортируем треки в том же порядке, что и ID треков
                id_to_index = {str(track_id): i for i, track_id in enumerate(similar_track_ids)}
                tracks.sort(key=lambda t: id_to_index.get(str(t.id), 999))
                
                logger.info(f"Найдено {len(tracks)} похожих треков через Annoy индекс")
                return similarity_scores, tracks
        else:
            logger.warning("Annoy индекс не загружен, используем MongoDB для поиска по эмбеддингам")
        
        # Отказываемся на поиск по MongoDB коллекции
        from music_app.embeddings import find_similar_tracks_by_embedding
        
        embeddings_result = find_similar_tracks_by_embedding(track_id, limit)
        if not embeddings_result:
            logger.warning(f"Не удалось найти похожие треки для {track.title} в MongoDB")
            return [], []
        
        similar_track_ids = [result["track_id"] for result in embeddings_result]
        similarity_scores = [result["similarity"] for result in embeddings_result]
        
        tracks = list(Track.objects.filter(id__in=similar_track_ids))
        
        # Сортируем треки в том же порядке, что и ID треков
        id_to_index = {str(track_id): i for i, track_id in enumerate(similar_track_ids)}
        tracks.sort(key=lambda t: id_to_index.get(str(t.id), 999))
        
        logger.info(f"Найдено {len(tracks)} похожих треков через MongoDB")
        return similarity_scores, tracks
    
    @classmethod
    def rebuild_annoy_index(cls):
        """
        Перестраивает Annoy-индекс для всех треков.
        
        Returns:
            dict: Информация о построенном индексе
        """
        try:
            # Форсируем перестроение индекса
            success = annoy_index.build_index(force=True)
            
            if success:
                return annoy_index.get_index_info()
            else:
                return {"error": "Не удалось построить индекс", "success": False}
                
        except Exception as e:
            logger.error(f"Ошибка при перестроении индекса: {str(e)}")
            return {"error": str(e), "success": False} 