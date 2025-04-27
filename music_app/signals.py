from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Track, User, Playlist
from music_streaming.celery import app
from .annoy_index import annoy_index
import logging
from .services import TrackVectorService

logger = logging.getLogger(__name__)

# Добавляем импорт для асинхронной обработки
from celery import shared_task

# Этот файл уже импортирован в apps.py, здесь мы определяем сигналы
# для автоматической обработки треков и обновления Annoy-индекса

@shared_task
def process_track_async(track_id):
    """
    Асинхронная задача для обработки трека (добавление в Annoy-индекс)
    """
    try:
        logger.info(f"Начало обработки трека {track_id}...")
        
        # Добавляем трек в Annoy-индекс
        result = TrackVectorService.process_track(track_id)
        
        if result:
            logger.info(f"Трек {track_id} успешно обработан")
        else:
            logger.error(f"Не удалось обработать трек {track_id}")
            
        return result
    except Exception as e:
        logger.error(f"Ошибка при обработке трека {track_id}: {str(e)}")
        return False

@receiver(post_save, sender=Track)
def track_post_save(sender, instance, created, **kwargs):
    """
    Обработчик события сохранения трека.
    Запускает асинхронную задачу для обработки трека и добавления его в Annoy-индекс.
    """
    try:
        # Проверяем наличие нужного поля
        if hasattr(instance, 'file') and instance.file:
            # Обрабатываем трек и добавляем в индекс, если у него есть эмбеддинг
            result = process_track_async(instance.id)
            if result:
                logger.info(f"Сигнал post_save: Трек {instance.id} обработан и добавлен в индекс")
            else:
                logger.warning(f"Сигнал post_save: Не удалось обработать трек {instance.id}")
        else:
            logger.warning(f"Сигнал post_save: Трек {instance.id} без файла, пропускаем обработку")
    except Exception as e:
        logger.error(f"Ошибка в обработчике post_save для трека {instance.id}: {str(e)}")

@receiver(post_delete, sender=Track)
def track_post_delete(sender, instance, **kwargs):
    """
    Обработчик события удаления трека.
    Удаляет трек из Annoy-индекса.
    """
    try:
        # Удаляем трек из Annoy-индекса
        track_id = instance.id
        logger.info(f"Трек {track_id} удален, удаляем из Annoy-индекса...")
        
        # Удаляем трек из Annoy-индекса
        result = annoy_index.remove_track_from_index(track_id)
        
        if result:
            logger.info(f"Сигнал post_delete: Трек {track_id} удален из индекса")
        else:
            logger.warning(f"Сигнал post_delete: Не удалось удалить трек {track_id} из индекса")
    except Exception as e:
        logger.error(f"Ошибка в обработчике post_delete для трека {instance.id}: {str(e)}")

# Сигналы для User и Playlist остаются неизменными
# ... 