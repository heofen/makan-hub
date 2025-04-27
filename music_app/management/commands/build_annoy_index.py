import logging
from django.core.management.base import BaseCommand
from music_app.services import TrackVectorService
from music_app.annoy_index import annoy_index

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Строит Annoy-индекс для быстрого поиска похожих треков на основе векторных представлений'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Принудительно перестроить индекс, даже если он уже существует'
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        self.stdout.write(f"Начинаем построение Annoy-индекса{'(принудительно)' if force else ''}...")
        
        try:
            # Строим индекс
            if annoy_index.build_index(force=force):
                # Получаем информацию об индексе
                index_info = annoy_index.get_index_info()
                
                self.stdout.write(self.style.SUCCESS(
                    f"Индекс успешно построен. "
                    f"Проиндексировано треков: {index_info.get('indexed_tracks_count', 0)}. "
                    f"Размер индекса: {index_info.get('index_file_size_mb', 0)} МБ."
                ))
                
                # Выводим подробную информацию об индексе
                self.stdout.write("Информация об индексе:")
                for key, value in index_info.items():
                    self.stdout.write(f"  {key}: {value}")
                    
            else:
                self.stdout.write(self.style.ERROR("Не удалось построить индекс. Проверьте логи для получения дополнительной информации."))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Ошибка при построении индекса: {str(e)}"))
            logger.error(f"Ошибка при построении индекса: {str(e)}", exc_info=True) 