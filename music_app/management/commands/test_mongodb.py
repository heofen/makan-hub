from django.core.management.base import BaseCommand
from music_app.mongodb import MongoConnection

class Command(BaseCommand):
    help = 'Тестирование подключения к MongoDB'

    def handle(self, *args, **options):
        try:
            # Пытаемся подключиться к MongoDB
            mongo = MongoConnection.get_instance()
            db = mongo.db
            
            # Проверяем, можем ли получить список коллекций
            collections = db.list_collection_names()
            
            self.stdout.write(self.style.SUCCESS(f'Успешное подключение к MongoDB'))
            self.stdout.write(f'Доступные коллекции: {collections}')
            
            # Создаем тестовую коллекцию, если она не существует
            if 'test' not in collections:
                test_collection = db['test']
                test_collection.insert_one({
                    'name': 'test',
                    'value': 'Тестовая запись',
                    'date': __import__('datetime').datetime.now()
                })
                self.stdout.write(self.style.SUCCESS('Создана тестовая запись в коллекции test'))
            
            # Закрываем соединение
            mongo.close()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Ошибка подключения к MongoDB: {str(e)}')) 