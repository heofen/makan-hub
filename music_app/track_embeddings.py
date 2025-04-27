#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Модуль track_embeddings.py
Класс для работы с эмбеддингами аудиотреков.
"""

import os
import json
import numpy as np
import logging
from pathlib import Path
from datetime import datetime
from .clap_model import clap_model

logger = logging.getLogger(__name__)

class TrackEmbeddings:
    """
    Класс для работы с эмбеддингами музыкальных треков.
    Позволяет сохранять и загружать эмбеддинги, а также сравнивать их.
    """
    
    def __init__(self, embeddings_dir="embeddings"):
        """
        Инициализирует экземпляр для работы с эмбеддингами треков.
        
        Args:
            embeddings_dir (str): Директория для хранения эмбеддингов
        """
        self.embeddings_dir = Path(embeddings_dir)
        self.embeddings_cache = {}  # Кэш эмбеддингов в памяти
        
        # Создаем директорию для эмбеддингов, если она не существует
        if not self.embeddings_dir.exists():
            try:
                self.embeddings_dir.mkdir(parents=True, exist_ok=True)
                logger.info(f"Создана директория для эмбеддингов: {self.embeddings_dir}")
            except Exception as e:
                logger.error(f"Не удалось создать директорию для эмбеддингов: {str(e)}")
    
    def _get_embedding_path(self, audio_path):
        """
        Получает путь к файлу эмбеддинга для аудиофайла.
        
        Args:
            audio_path (str): Путь к аудиофайлу
            
        Returns:
            Path: Путь к файлу эмбеддинга
        """
        # Получаем имя файла без расширения и добавляем .json
        audio_file = Path(audio_path)
        embedding_filename = f"{audio_file.stem}.json"
        return self.embeddings_dir / embedding_filename
    
    def generate_embedding(self, audio_path):
        """
        Генерирует эмбеддинг для аудиофайла и сохраняет его.
        
        Args:
            audio_path (str): Путь к аудиофайлу
            
        Returns:
            numpy.ndarray: Эмбеддинг аудиофайла или None при ошибке
        """
        if not Path(audio_path).exists():
            logger.error(f"Аудиофайл не найден: {audio_path}")
            return None
        
        try:
            # Получаем эмбеддинг с помощью CLAP модели
            embedding = clap_model.generate_embedding(audio_path)
            
            if embedding is None:
                logger.error(f"Не удалось сгенерировать эмбеддинг для {audio_path}")
                return None
            
            # Сохраняем эмбеддинг в файл
            embedding_saved = self.save_embedding(audio_path, embedding)
            
            if embedding_saved:
                # Добавляем эмбеддинг в кэш
                self.embeddings_cache[audio_path] = embedding
                logger.info(f"Эмбеддинг успешно сгенерирован и сохранен для {audio_path}")
                return embedding
            else:
                logger.error(f"Не удалось сохранить эмбеддинг для {audio_path}")
                return None
                
        except Exception as e:
            logger.error(f"Ошибка при генерации эмбеддинга: {str(e)}")
            return None
    
    def save_embedding(self, audio_path, embedding):
        """
        Сохраняет эмбеддинг в файл.
        
        Args:
            audio_path (str): Путь к аудиофайлу
            embedding (numpy.ndarray): Эмбеддинг для сохранения
            
        Returns:
            bool: True, если сохранение прошло успешно
        """
        embedding_path = self._get_embedding_path(audio_path)
        
        try:
            # Подготавливаем данные для сохранения
            embedding_data = {
                "audio_path": audio_path,
                "embedding": embedding.tolist(),  # Преобразуем numpy массив в список
                "created_at": datetime.now().isoformat(),
                "model_info": clap_model.get_model_info() if clap_model.is_ready() else None
            }
            
            # Сохраняем в JSON файл
            with open(embedding_path, 'w', encoding='utf-8') as f:
                json.dump(embedding_data, f, ensure_ascii=False, indent=2)
                
            logger.info(f"Эмбеддинг сохранен в {embedding_path}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при сохранении эмбеддинга в {embedding_path}: {str(e)}")
            return False
    
    def load_embedding(self, audio_path):
        """
        Загружает эмбеддинг из файла.
        
        Args:
            audio_path (str): Путь к аудиофайлу
            
        Returns:
            numpy.ndarray: Загруженный эмбеддинг или None при ошибке
        """
        # Проверяем, есть ли эмбеддинг в кэше
        if audio_path in self.embeddings_cache:
            logger.debug(f"Эмбеддинг для {audio_path} найден в кэше")
            return self.embeddings_cache[audio_path]
            
        embedding_path = self._get_embedding_path(audio_path)
        
        if not embedding_path.exists():
            logger.warning(f"Файл эмбеддинга не найден: {embedding_path}")
            return None
            
        try:
            # Загружаем эмбеддинг из JSON файла
            with open(embedding_path, 'r', encoding='utf-8') as f:
                embedding_data = json.load(f)
                
            # Преобразуем список обратно в numpy массив
            embedding = np.array(embedding_data.get("embedding", []))
            
            if embedding.size == 0:
                logger.error(f"Загруженный эмбеддинг пустой: {embedding_path}")
                return None
                
            # Добавляем в кэш
            self.embeddings_cache[audio_path] = embedding
            
            logger.info(f"Эмбеддинг загружен из {embedding_path}")
            return embedding
            
        except Exception as e:
            logger.error(f"Ошибка при загрузке эмбеддинга из {embedding_path}: {str(e)}")
            return None
    
    def get_or_create_embedding(self, audio_path):
        """
        Получает эмбеддинг из кэша или файла, а если не существует - создает новый.
        
        Args:
            audio_path (str): Путь к аудиофайлу
            
        Returns:
            numpy.ndarray: Эмбеддинг аудиофайла или None при ошибке
        """
        # Сначала пытаемся загрузить существующий эмбеддинг
        embedding = self.load_embedding(audio_path)
        
        # Если эмбеддинг не найден, генерируем новый
        if embedding is None:
            logger.info(f"Существующий эмбеддинг не найден для {audio_path}, генерируем новый")
            embedding = self.generate_embedding(audio_path)
            
        return embedding
    
    def get_embedding_metadata(self, audio_path):
        """
        Получает метаданные эмбеддинга.
        
        Args:
            audio_path (str): Путь к аудиофайлу
            
        Returns:
            dict: Метаданные эмбеддинга или None при ошибке
        """
        embedding_path = self._get_embedding_path(audio_path)
        
        if not embedding_path.exists():
            logger.warning(f"Файл эмбеддинга не найден: {embedding_path}")
            return None
            
        try:
            # Загружаем метаданные из JSON файла
            with open(embedding_path, 'r', encoding='utf-8') as f:
                embedding_data = json.load(f)
                
            # Удаляем сам эмбеддинг из метаданных чтобы не занимать много места
            if "embedding" in embedding_data:
                embedding_shape = np.array(embedding_data["embedding"]).shape
                embedding_data["embedding_shape"] = embedding_shape
                del embedding_data["embedding"]
                
            return embedding_data
            
        except Exception as e:
            logger.error(f"Ошибка при загрузке метаданных эмбеддинга из {embedding_path}: {str(e)}")
            return None
    
    def list_embeddings(self):
        """
        Получает список всех сохраненных эмбеддингов.
        
        Returns:
            list: Список путей к файлам эмбеддингов
        """
        try:
            embedding_files = list(self.embeddings_dir.glob("*.json"))
            embeddings_list = []
            
            for embedding_file in embedding_files:
                try:
                    with open(embedding_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        embeddings_list.append({
                            "file": str(embedding_file),
                            "audio_path": data.get("audio_path", "Неизвестно"),
                            "created_at": data.get("created_at", "Неизвестно")
                        })
                except Exception as e:
                    logger.error(f"Ошибка при чтении файла эмбеддинга {embedding_file}: {str(e)}")
            
            return embeddings_list
            
        except Exception as e:
            logger.error(f"Ошибка при получении списка эмбеддингов: {str(e)}")
            return []
    
    def compare_tracks(self, track1_path, track2_path):
        """
        Сравнивает два аудиотрека, вычисляя косинусное сходство их эмбеддингов.
        
        Args:
            track1_path (str): Путь к первому аудиофайлу
            track2_path (str): Путь ко второму аудиофайлу
            
        Returns:
            float: Значение косинусного сходства (от -1 до 1) или None при ошибке
        """
        # Получаем эмбеддинги для обоих треков
        embedding1 = self.get_or_create_embedding(track1_path)
        embedding2 = self.get_or_create_embedding(track2_path)
        
        if embedding1 is None or embedding2 is None:
            logger.error("Не удалось получить эмбеддинги для сравнения треков")
            return None
            
        try:
            # Вычисляем косинусное сходство
            # Формула: cos(θ) = (A·B) / (||A|| * ||B||)
            dot_product = np.dot(embedding1, embedding2)
            norm1 = np.linalg.norm(embedding1)
            norm2 = np.linalg.norm(embedding2)
            
            if norm1 == 0 or norm2 == 0:
                logger.warning("Норма одного из эмбеддингов равна нулю, невозможно вычислить сходство")
                return 0.0
                
            similarity = dot_product / (norm1 * norm2)
            
            logger.info(f"Сходство между треками '{track1_path}' и '{track2_path}': {similarity:.4f}")
            return similarity
            
        except Exception as e:
            logger.error(f"Ошибка при сравнении треков: {str(e)}")
            return None
    
    def delete_embedding(self, audio_path):
        """
        Удаляет эмбеддинг для аудиофайла.
        
        Args:
            audio_path (str): Путь к аудиофайлу
            
        Returns:
            bool: True, если удаление прошло успешно
        """
        embedding_path = self._get_embedding_path(audio_path)
        
        if not embedding_path.exists():
            logger.warning(f"Файл эмбеддинга не найден: {embedding_path}")
            return False
            
        try:
            # Удаляем файл
            embedding_path.unlink()
            
            # Удаляем из кэша, если есть
            if audio_path in self.embeddings_cache:
                del self.embeddings_cache[audio_path]
                
            logger.info(f"Эмбеддинг удален: {embedding_path}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при удалении эмбеддинга {embedding_path}: {str(e)}")
            return False
    
    def clear_cache(self):
        """
        Очищает кэш эмбеддингов в памяти.
        """
        self.embeddings_cache.clear()
        logger.info("Кэш эмбеддингов очищен")
    
    def get_embedding_stats(self):
        """
        Получает статистику по сохраненным эмбеддингам.
        
        Returns:
            dict: Статистика по эмбеддингам
        """
        try:
            embedding_files = list(self.embeddings_dir.glob("*.json"))
            total_size = 0
            
            for embedding_file in embedding_files:
                total_size += embedding_file.stat().st_size
                
            return {
                "count": len(embedding_files),
                "total_size_bytes": total_size,
                "total_size_mb": total_size / (1024 * 1024),
                "cache_size": len(self.embeddings_cache),
                "embeddings_dir": str(self.embeddings_dir)
            }
            
        except Exception as e:
            logger.error(f"Ошибка при получении статистики эмбеддингов: {str(e)}")
            return {
                "count": 0,
                "total_size_bytes": 0,
                "total_size_mb": 0,
                "cache_size": len(self.embeddings_cache),
                "embeddings_dir": str(self.embeddings_dir),
                "error": str(e)
            } 