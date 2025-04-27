import os
import logging
import numpy as np
from annoy import AnnoyIndex
from django.conf import settings
from datetime import datetime

from .mongodb import TrackVectors

logger = logging.getLogger(__name__)

# Проверяем доступность numpy
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    logger.warning("Numpy недоступен. Annoy-индексация будет отключена.")
    NUMPY_AVAILABLE = False

class TrackAnnoyIndex:
    """
    Класс для создания и использования Annoy-индекса для быстрого поиска похожих треков
    на основе их векторных представлений.
    """
    _instance = None
    
    # Настройки индекса
    EMBEDDING_DIM = 512  # Размерность эмбеддингов CLAP
    N_TREES = 50         # Количество деревьев (больше - точнее, но медленнее)
    INDEX_DIR = 'annoy_indices'  # Директория для хранения индексов
    INDEX_FILE = 'tracks_index.ann'  # Имя файла индекса
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(TrackAnnoyIndex, cls).__new__(cls)
            cls._instance._init()
        return cls._instance
    
    def _init(self):
        """Инициализация атрибутов класса"""
        self.index = None
        self.id_to_idx = {}  # Маппинг ID трека на индекс в Annoy
        self.idx_to_id = {}  # Обратный маппинг: индекс -> ID трека
        self.index_path = self._get_index_path()
        self.is_loaded = False
        self.next_idx = 0  # Следующий доступный индекс для инкрементального обновления
    
    def is_index_loaded(self):
        """
        Проверяет, загружен ли индекс.
        
        Returns:
            bool: True, если индекс загружен
        """
        return self.is_loaded
    
    @staticmethod
    def _get_index_path():
        """Возвращает путь к файлу индекса"""
        index_dir = os.path.join(settings.BASE_DIR, TrackAnnoyIndex.INDEX_DIR)
        if not os.path.exists(index_dir):
            os.makedirs(index_dir)
        return os.path.join(index_dir, TrackAnnoyIndex.INDEX_FILE)
    
    def build_index(self, force=False):
        """
        Строит Annoy-индекс на основе векторов треков из MongoDB.
        
        Args:
            force: Принудительное построение индекса, даже если он уже существует
            
        Returns:
            bool: Успешность построения индекса
        """
        if not NUMPY_AVAILABLE:
            logger.error("Numpy недоступен. Индекс не может быть построен.")
            return False
        
        # Проверяем, существует ли индекс и не требуется ли принудительное обновление
        if os.path.exists(self.index_path) and not force:
            logger.info(f"Индекс уже существует: {self.index_path}. Пропускаем построение.")
            return self.load_index()
        
        try:
            # Получаем все треки из MongoDB
            collection = TrackVectors.get_collection()
            all_tracks = list(collection.find())
            
            if not all_tracks:
                logger.warning("Нет треков для построения индекса.")
                return False
            
            # Создаем новый индекс с нужной размерностью
            index = AnnoyIndex(self.EMBEDDING_DIM, 'angular')  # angular для косинусного расстояния
            
            # Очищаем старые маппинги
            self.id_to_idx = {}
            self.idx_to_id = {}
            
            # Добавляем каждый трек в индекс
            idx = 0
            for track_doc in all_tracks:
                track_id = track_doc.get('track_id')
                vector_data = track_doc.get('vector', {})
                embedding = vector_data.get('embedding', [])
                
                # Пропускаем треки без эмбеддингов
                if not embedding or len(embedding) != self.EMBEDDING_DIM:
                    continue
                
                # Добавляем вектор в индекс
                index.add_item(idx, embedding)
                
                # Сохраняем соответствие между ID трека и его индексом
                self.id_to_idx[track_id] = idx
                self.idx_to_id[idx] = track_id
                
                idx += 1
            
            if idx == 0:
                logger.warning("Не найдено треков с валидными эмбеддингами для построения индекса.")
                return False
            
            # Сохраняем следующий индекс для инкрементальных обновлений
            self.next_idx = idx
            
            # Строим индекс
            logger.info(f"Строим Annoy-индекс с {idx} треками и {self.N_TREES} деревьями.")
            index.build(self.N_TREES)
            
            # Сохраняем индекс
            index.save(self.index_path)
            
            # Сохраняем маппинги
            self._save_mappings()
            
            # Устанавливаем индекс для текущего экземпляра
            self.index = index
            self.is_loaded = True
            
            logger.info(f"Индекс успешно построен и сохранен в {self.index_path}")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при построении индекса: {str(e)}")
            return False
    
    def _save_mappings(self):
        """Сохраняет маппинги ID треков на индексы"""
        mappings_path = self.index_path + '.mappings'
        try:
            np.savez(
                mappings_path,
                id_to_idx=np.array(list(self.id_to_idx.items()), dtype=object),
                idx_to_id=np.array(list(self.idx_to_id.items()), dtype=object),
                next_idx=np.array([self.next_idx])
            )
            logger.info(f"Маппинги сохранены в {mappings_path}")
        except Exception as e:
            logger.error(f"Ошибка при сохранении маппингов: {str(e)}")
    
    def _load_mappings(self):
        """Загружает маппинги ID треков на индексы"""
        mappings_path = self.index_path + '.mappings.npz'
        try:
            if not os.path.exists(mappings_path):
                logger.warning(f"Файл маппингов не найден: {mappings_path}")
                return False
                
            mappings = np.load(mappings_path, allow_pickle=True)
            
            # Восстанавливаем словари
            self.id_to_idx = dict(mappings['id_to_idx'].tolist())
            self.idx_to_id = dict(mappings['idx_to_id'].tolist())
            
            # Конвертируем строковые ключи обратно в целые числа для idx_to_id
            self.idx_to_id = {int(k): v for k, v in self.idx_to_id.items()}
            
            # Загружаем следующий доступный индекс
            if 'next_idx' in mappings:
                self.next_idx = int(mappings['next_idx'][0])
            else:
                # Для обратной совместимости
                self.next_idx = max(self.idx_to_id.keys()) + 1 if self.idx_to_id else 0
            
            logger.info(f"Маппинги загружены из {mappings_path}")
            return True
        except Exception as e:
            logger.error(f"Ошибка при загрузке маппингов: {str(e)}")
            return False
    
    def load_index(self):
        """
        Загружает сохраненный индекс с диска.
        
        Returns:
            bool: Успешность загрузки индекса
        """
        if not NUMPY_AVAILABLE:
            logger.error("Numpy недоступен. Индекс не может быть загружен.")
            return False
            
        if not os.path.exists(self.index_path):
            logger.warning(f"Индекс не найден по пути: {self.index_path}")
            return False
            
        try:
            # Загружаем маппинги
            if not self._load_mappings():
                return False
            
            # Создаем и загружаем индекс
            index = AnnoyIndex(self.EMBEDDING_DIM, 'angular')
            index.load(self.index_path)
            
            self.index = index
            self.is_loaded = True
            
            logger.info(f"Индекс успешно загружен из {self.index_path}")
            return True
        except Exception as e:
            logger.error(f"Ошибка при загрузке индекса: {str(e)}")
            return False
    
    def add_track_to_index(self, track_id):
        """
        Инкрементально добавляет трек в существующий индекс.
        
        Args:
            track_id: ID трека для добавления
            
        Returns:
            bool: Успешность добавления трека
        """
        if not NUMPY_AVAILABLE:
            logger.error("Numpy недоступен. Индекс не может быть обновлен.")
            return False
            
        # Проверяем, загружен ли индекс
        if not self.is_loaded:
            success = self.load_index()
            if not success:
                # Если индекса нет, строим его
                logger.info("Индекс не загружен, пытаемся построить новый...")
                return self.build_index(force=True)
        
        try:
            # Проверяем, есть ли уже трек в индексе
            if track_id in self.id_to_idx:
                logger.info(f"Трек {track_id} уже есть в индексе, пропускаем.")
                return True
            
            # Получаем вектор трека из MongoDB
            vector = TrackVectors.get_track_vector(track_id)
            
            if not vector or 'embedding' not in vector:
                logger.warning(f"Вектор для трека {track_id} не найден")
                return False
            
            embedding = vector['embedding']
            
            # Проверяем, правильная ли размерность эмбеддинга
            if len(embedding) != self.EMBEDDING_DIM:
                logger.error(f"Некорректная размерность эмбеддинга для трека {track_id}: {len(embedding)}, ожидается {self.EMBEDDING_DIM}")
                return False
            
            # Индекс Annoy не поддерживает инкрементальное обновление после построения
            # Мы создадим новый индекс с добавленным треком и сохраним его
            
            # Создаем новый индекс
            new_index = AnnoyIndex(self.EMBEDDING_DIM, 'angular')
            
            # Копируем все существующие векторы
            for idx, track_id_existing in self.idx_to_id.items():
                # Получаем вектор из MongoDB
                existing_vector = TrackVectors.get_track_vector(track_id_existing)
                if existing_vector and 'embedding' in existing_vector:
                    new_index.add_item(idx, existing_vector['embedding'])
            
            # Добавляем новый вектор
            idx = self.next_idx
            new_index.add_item(idx, embedding)
            
            # Обновляем маппинги
            self.id_to_idx[track_id] = idx
            self.idx_to_id[idx] = track_id
            self.next_idx += 1
            
            # Строим и сохраняем индекс
            new_index.build(self.N_TREES)
            new_index.save(self.index_path)
            
            # Сохраняем обновленные маппинги
            self._save_mappings()
            
            # Обновляем индекс в памяти
            self.index = new_index
            
            logger.info(f"Трек {track_id} успешно добавлен в Annoy-индекс")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при добавлении трека {track_id} в индекс: {str(e)}")
            return False
    
    def find_similar_tracks(self, track_id, limit=10):
        """
        Находит похожие треки используя Annoy-индекс.
        
        Args:
            track_id: ID исходного трека
            limit: Максимальное количество результатов
            
        Returns:
            Список кортежей (ID трека, показатель схожести)
        """
        if not NUMPY_AVAILABLE:
            logger.error("Numpy недоступен. Поиск схожих треков невозможен.")
            return []
            
        if not self.is_loaded:
            if not self.load_index():
                logger.warning("Индекс не загружен. Пытаемся построить новый.")
                if not self.build_index():
                    logger.error("Не удалось построить индекс. Поиск невозможен.")
                    return []
        
        try:
            # Получаем вектор исходного трека
            vector = TrackVectors.get_track_vector(track_id)
            
            if not vector or 'embedding' not in vector:
                logger.warning(f"Вектор для трека {track_id} не найден")
                return []
            
            embedding = vector['embedding']
            
            # Если исходный трек не в индексе, ищем по вектору
            if track_id not in self.id_to_idx:
                # Получаем ближайшие треки по косинусному расстоянию
                nn_indices, distances = self.index.get_nns_by_vector(
                    embedding, limit + 1, include_distances=True
                )
            else:
                # Получаем ближайшие треки к данному треку
                idx = self.id_to_idx[track_id]
                nn_indices, distances = self.index.get_nns_by_item(
                    idx, limit + 1, include_distances=True
                )
            
            # Преобразуем индексы в ID треков и фильтруем исходный трек
            similar_tracks = []
            for nn_idx, distance in zip(nn_indices, distances):
                nn_track_id = self.idx_to_id.get(nn_idx)
                
                # Пропускаем исходный трек
                if nn_track_id == track_id:
                    continue
                    
                # Косинусное сходство = 1 - косинусное расстояние
                similarity = 1.0 - distance
                similar_tracks.append((nn_track_id, similarity))
                
                if len(similar_tracks) >= limit:
                    break
            
            return similar_tracks
            
        except Exception as e:
            logger.error(f"Ошибка при поиске похожих треков: {str(e)}")
            return []
    
    def find_similar_tracks_with_scores(self, track_id, limit=10):
        """
        Находит похожие треки используя Annoy-индекс и возвращает списки ID треков и оценок сходства.
        
        Args:
            track_id: ID исходного трека
            limit: Максимальное количество результатов
            
        Returns:
            tuple: (similar_track_ids, similarity_scores), где
                   similar_track_ids - список ID треков,
                   similarity_scores - список оценок сходства
        """
        # Вызываем существующий метод для получения кортежей (id, score)
        similar_track_tuples = self.find_similar_tracks(track_id, limit)
        
        if not similar_track_tuples:
            return [], []
        
        # Разделяем результаты на два отдельных списка
        similar_track_ids = [track_tuple[0] for track_tuple in similar_track_tuples]
        similarity_scores = [track_tuple[1] for track_tuple in similar_track_tuples]
        
        return similar_track_ids, similarity_scores
    
    def remove_track_from_index(self, track_id):
        """
        Удаляет трек из индекса.
        Внимание: В Annoy нельзя удалить отдельный элемент, поэтому
        трек будет фактически удален только при следующем полном перестроении индекса.
        Мы лишь удаляем информацию о треке из маппингов.
        
        Args:
            track_id: ID трека для удаления
            
        Returns:
            bool: Успешность операции
        """
        if not self.is_loaded:
            if not self.load_index():
                logger.warning("Индекс не загружен, удаление невозможно.")
                return False
        
        try:
            # Проверяем, есть ли трек в индексе
            if track_id not in self.id_to_idx:
                logger.info(f"Трек {track_id} не найден в индексе, пропускаем удаление.")
                return True
            
            # Удаляем информацию о треке из маппингов
            idx = self.id_to_idx[track_id]
            del self.id_to_idx[track_id]
            del self.idx_to_id[idx]
            
            # Сохраняем обновленные маппинги
            self._save_mappings()
            
            logger.info(f"Трек {track_id} помечен как удаленный из индекса (будет удален при следующем перестроении)")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка при удалении трека {track_id} из индекса: {str(e)}")
            return False
    
    def track_exists_in_index(self, track_id):
        """
        Проверяет, существует ли трек в индексе.
        
        Args:
            track_id: ID трека
            
        Returns:
            bool: True, если трек есть в индексе
        """
        return track_id in self.id_to_idx
    
    def get_index_info(self):
        """
        Возвращает информацию об индексе.
        
        Returns:
            dict: Информация об индексе
        """
        if not self.is_loaded:
            self.load_index()
            
        try:
            index_size = os.path.getsize(self.index_path) if os.path.exists(self.index_path) else 0
            index_size_mb = index_size / (1024 * 1024)
            
            index_mtime = None
            if os.path.exists(self.index_path):
                mtime = os.path.getmtime(self.index_path)
                index_mtime = datetime.fromtimestamp(mtime).isoformat()
            
            return {
                "indexed_tracks_count": len(self.id_to_idx),
                "trees_count": self.N_TREES,
                "embedding_dim": self.EMBEDDING_DIM,
                "index_file_path": self.index_path,
                "index_file_size_mb": round(index_size_mb, 2),
                "last_modified": index_mtime,
                "is_loaded": self.is_loaded,
                "next_idx": self.next_idx
            }
        except Exception as e:
            logger.error(f"Ошибка при получении информации об индексе: {str(e)}")
            return {
                "error": str(e),
                "is_loaded": self.is_loaded
            }

# Создаем и экспортируем синглтон для глобального использования
annoy_index = TrackAnnoyIndex() 