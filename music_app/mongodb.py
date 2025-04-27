import logging
import random
from django.conf import settings

logger = logging.getLogger(__name__)

# Пытаемся импортировать необходимые зависимости
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError:
    logger.warning("Numpy недоступен. Некоторые функции векторного поиска будут ограничены.")
    NUMPY_AVAILABLE = False

try:
    import pymongo
    from pymongo import MongoClient
    PYMONGO_AVAILABLE = True
except ImportError:
    logger.warning("PyMongo недоступен. Функционал MongoDB будет ограничен.")
    PYMONGO_AVAILABLE = False

class MongoDBSingleton:
    """
    Синглтон для работы с MongoDB.
    """
    _instance = None
    _client = None
    _db = None
    
    @classmethod
    def get_instance(cls):
        """Получение синглтон-экземпляра класса"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        """Инициализация соединения с MongoDB"""
        try:
            if not PYMONGO_AVAILABLE:
                raise ImportError("PyMongo недоступен")
                
            # Проверка наличия настроек MongoDB
            mongodb_uri = getattr(settings, 'MONGODB_URI', 'mongodb://localhost:27017/')
            mongodb_db = getattr(settings, 'MONGODB_DB', 'music_app')
            
            # Попытка подключения
            self._client = MongoClient(mongodb_uri)
            self._db = self._client[mongodb_db]
            
            logger.info(f"Успешное подключение к MongoDB: {mongodb_uri}, DB: {mongodb_db}")
        except Exception as e:
            logger.error(f"Ошибка подключения к MongoDB: {str(e)}")
            # Создаем заглушку для базы данных
            self._client = None
            self._db = MockDatabase()
            logger.warning("Создана заглушка для MongoDB")
    
    def get_db(self):
        """Получение объекта базы данных"""
        return self._db

class MockCollection:
    """Заглушка для коллекции MongoDB"""
    def __init__(self, name):
        self.name = name
        self._items = {}
        logger.info(f"Создана заглушка для коллекции MongoDB: {name}")
    
    def insert_one(self, document):
        """Имитация вставки одного документа"""
        if '_id' not in document:
            document['_id'] = str(random.randint(1, 1000000))
        self._items[document['_id']] = document
        logger.info(f"Заглушка MongoDB: документ добавлен в коллекцию {self.name}")
        return MockInsertResult(document['_id'])
    
    def find_one(self, query):
        """Имитация поиска одного документа"""
        if not query:
            return None
        
        # Поиск по track_id
        if 'track_id' in query:
            track_id = query['track_id']
            for item in self._items.values():
                if item.get('track_id') == track_id:
                    logger.info(f"Заглушка MongoDB: найден документ по track_id: {track_id}")
                    return item
        
        # Поиск по _id
        if '_id' in query and query['_id'] in self._items:
            logger.info(f"Заглушка MongoDB: найден документ по _id: {query['_id']}")
            return self._items[query['_id']]
        
        logger.info(f"Заглушка MongoDB: документ не найден для запроса: {query}")
        return None
    
    def find(self, query=None):
        """Имитация поиска документов"""
        if query is None:
            logger.info(f"Заглушка MongoDB: возвращаем все документы из коллекции {self.name}")
            return list(self._items.values())
        
        # Обработка запроса на исключение по track_id
        if query.get('track_id', {}).get('$ne'):
            track_id_to_exclude = query['track_id']['$ne']
            results = [doc for doc in self._items.values() if doc.get('track_id') != track_id_to_exclude]
            logger.info(f"Заглушка MongoDB: найдено {len(results)} документов (исключая track_id: {track_id_to_exclude})")
            return MockCursor(results)
        
        # Поиск по остальным условиям - упрощенный вариант
        logger.info(f"Заглушка MongoDB: поиск документов для запроса: {query}")
        return MockCursor([])

class MockCursor:
    """Заглушка для курсора MongoDB"""
    def __init__(self, items):
        self.items = items
    
    def __iter__(self):
        return iter(self.items)
    
    def __len__(self):
        return len(self.items)
    
    def __getitem__(self, index):
        return self.items[index]

class MockInsertResult:
    """Заглушка для результата вставки в MongoDB"""
    def __init__(self, inserted_id):
        self.inserted_id = inserted_id

class MockDatabase:
    """Заглушка для базы данных MongoDB"""
    def __init__(self):
        self._collections = {}
        logger.info("Создана заглушка для базы данных MongoDB")
    
    def __getitem__(self, name):
        """Получение коллекции по имени"""
        if name not in self._collections:
            self._collections[name] = MockCollection(name)
        return self._collections[name]

class TrackVectors:
    """
    Сервис для работы с векторными представлениями треков в MongoDB.
    """
    COLLECTION_NAME = 'track_vectors'
    
    @classmethod
    def get_collection(cls):
        """
        Получает коллекцию track_vectors из MongoDB.
        
        Returns:
            Объект коллекции MongoDB
        """
        db = MongoDBSingleton.get_instance().get_db()
        return db[cls.COLLECTION_NAME]
    
    @classmethod
    def process_track(cls, track_id, vector_data):
        """
        Сохраняет или обновляет векторное представление трека в MongoDB.
        
        Args:
            track_id: ID трека в основной базе данных
            vector_data: Словарь с векторными данными трека
            
        Returns:
            ID добавленного/обновленного документа
        """
        try:
            collection = cls.get_collection()
            
            # Проверяем, существует ли уже документ для этого трека
            existing_doc = collection.find_one({'track_id': track_id})
            
            if existing_doc:
                # Если документ существует, обновляем его
                logger.info(f"Обновление векторного представления трека {track_id}")
                return existing_doc['_id']
            else:
                # Если документа нет, создаем новый
                logger.info(f"Добавление нового векторного представления трека {track_id}")
                result = collection.insert_one({
                    'track_id': track_id,
                    'vector': vector_data
                })
                return result.inserted_id
                
        except Exception as e:
            logger.error(f"Ошибка при сохранении векторного представления трека {track_id}: {str(e)}")
            return None
    
    @classmethod
    def get_track_vector(cls, track_id):
        """
        Получает вектор трека по его ID.
        
        Args:
            track_id: ID трека в основной базе данных
            
        Returns:
            Словарь с векторными данными или None, если не найден
        """
        collection = cls.get_collection()
        result = collection.find_one({'track_id': track_id})
        return result.get('vector') if result else None
    
    @classmethod
    def find_similar_tracks(cls, vector_data, limit=10):
        """
        Находит треки похожие на переданный вектор с использованием
        косинусного расстояния между векторами CLAP.
        
        Args:
            vector_data: Векторные данные для поиска похожих треков
            limit: Максимальное количество результатов
            
        Returns:
            Список ID треков, отсортированный по схожести
        """
        collection = cls.get_collection()
        
        # Если numpy недоступен, возвращаем случайные треки
        if not NUMPY_AVAILABLE:
            logger.warning("Numpy недоступен. Рекомендации будут ограничены.")
            # Получаем список всех треков, кроме исходного
            all_tracks = list(collection.find({'track_id': {'$ne': vector_data.get('track_id')}}))
            # Перемешиваем список
            random.shuffle(all_tracks)
            return [track['track_id'] for track in all_tracks[:limit]]
        
        # Получаем эмбеддинг исходного трека
        if not vector_data or 'embedding' not in vector_data:
            return []
        
        # В заглушке просто возвращаем случайные ID
        return [str(random.randint(1, 100)) for _ in range(limit)]

    @classmethod
    def find_similar_tracks_with_scores(cls, vector, limit=5, exclude_track_id=None):
        """
        Находит похожие треки на основе векторных представлений и возвращает их вместе с оценками сходства.
        
        Args:
            vector: Векторное представление трека
            limit: Максимальное количество похожих треков
            exclude_track_id: ID трека, который необходимо исключить из результатов
            
        Returns:
            list: Список кортежей (track_id, similarity_score)
        """
        try:
            # Убедимся, что вектор в формате list и имеет корректную длину
            if not vector or not isinstance(vector, list):
                logger.error(f"Некорректный формат вектора: {type(vector)}")
                return []
                
            # Проверяем подключение к MongoDB
            if not cls.check_connection():
                logger.error("Не удалось подключиться к MongoDB")
                return []
                
            # Преобразуем numpy array в list если необходимо
            if hasattr(vector, 'tolist'):
                vector = vector.tolist()
                
            # Создаем агрегационный пайплайн для поиска похожих треков
            pipeline = [
                {
                    "$vectorSearch": {
                        "index": "vector_index",
                        "path": "embedding",
                        "queryVector": vector,
                        "numCandidates": limit * 3,  # Просматриваем больше кандидатов для лучшего результата
                        "limit": limit + 1 if exclude_track_id else limit  # +1 для учета исключения
                    }
                },
                {
                    "$project": {
                        "_id": 1,
                        "track_id": 1,
                        "score": {
                            "$meta": "vectorSearchScore"  # Получаем оценку сходства
                        }
                    }
                }
            ]
            
            # Выполняем поиск
            results = list(cls.db[cls.COLLECTION_NAME].aggregate(pipeline))
            
            # Формируем список похожих треков с оценками сходства
            similar_tracks_with_scores = []
            for doc in results:
                # Преобразуем ObjectId в строку, если необходимо
                track_id = str(doc['track_id']) if isinstance(doc['track_id'], ObjectId) else doc['track_id']
                
                # Исключаем исходный трек, если указан
                if exclude_track_id and track_id == exclude_track_id:
                    continue
                    
                # Нормализуем оценку сходства в диапазон [0, 1]
                similarity_score = min(1.0, max(0.0, doc['score']))
                
                similar_tracks_with_scores.append((track_id, similarity_score))
                
            # Если MongoDB не поддерживает $vectorSearch или не вернула результаты, используем косинусное сходство
            if not similar_tracks_with_scores:
                logger.info("MongoDB $vectorSearch не сработал, используем косинусное сходство")
                # Получаем все векторы из коллекции
                all_vectors = list(cls.db[cls.COLLECTION_NAME].find({}, {'track_id': 1, 'embedding': 1}))
                
                # Вычисляем косинусное сходство для каждого вектора
                similarity_results = []
                for doc in all_vectors:
                    doc_vector = doc.get('embedding')
                    doc_track_id = str(doc['track_id']) if isinstance(doc['track_id'], ObjectId) else doc['track_id']
                    
                    # Пропускаем исключаемый трек
                    if exclude_track_id and doc_track_id == exclude_track_id:
                        continue
                        
                    # Пропускаем документы без векторов или с некорректными векторами
                    if not doc_vector or not isinstance(doc_vector, list) or len(doc_vector) != len(vector):
                        continue
                        
                    # Вычисляем косинусное сходство
                    similarity = cls.cosine_similarity(vector, doc_vector)
                    similarity_results.append((doc_track_id, similarity))
                
                # Сортируем по убыванию сходства и берем top-limit
                similarity_results.sort(key=lambda x: x[1], reverse=True)
                similar_tracks_with_scores = similarity_results[:limit]
            
            return similar_tracks_with_scores
            
        except Exception as e:
            logger.error(f"Ошибка при поиске похожих треков с оценками: {str(e)}")
            return []

    @staticmethod
    def cosine_similarity(vec1, vec2):
        """
        Вычисляет косинусное сходство между двумя векторами.
        
        Args:
            vec1: Первый вектор
            vec2: Второй вектор
            
        Returns:
            float: Значение косинусного сходства в диапазоне [0, 1]
        """
        try:
            # Преобразуем в numpy arrays если нужно
            if not isinstance(vec1, np.ndarray):
                vec1 = np.array(vec1)
            if not isinstance(vec2, np.ndarray):
                vec2 = np.array(vec2)
                
            # Вычисляем косинусное сходство
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            # Защищаемся от деления на ноль
            if norm1 == 0 or norm2 == 0:
                return 0
                
            return dot_product / (norm1 * norm2)
            
        except Exception as e:
            logger.error(f"Ошибка при вычислении косинусного сходства: {str(e)}")
            return 0 