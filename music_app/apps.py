from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class MusicAppConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'music_app'
    
    def ready(self):
        """
        Выполняется при запуске приложения. Используется для загрузки
        Annoy-индекса в память при старте сервера.
        """
        import os
        
        # Предотвращаем двойное выполнение при запуске с помощью reloader
        if os.environ.get('RUN_MAIN') != 'true':
            try:
                # Импортируем здесь, чтобы избежать циклических импортов
                from .annoy_index import annoy_index
                
                # Пытаемся загрузить Annoy-индекс
                loaded = annoy_index.load_index()
                if loaded:
                    index_info = annoy_index.get_index_info()
                    logger.info(f"Annoy-индекс успешно загружен. Треков в индексе: {index_info.get('indexed_tracks_count', 0)}")
                else:
                    logger.warning("Annoy-индекс не найден. Будет использован при первом запросе рекомендаций.")
            except Exception as e:
                logger.error(f"Ошибка при загрузке Annoy-индекса: {str(e)}")
                
        # Импортируем сигналы
        import music_app.signals
