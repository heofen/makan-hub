# Настройка баз данных для музыкального стриминга

Это руководство объясняет, как настроить базы данных PostgreSQL и MongoDB для проекта.

## PostgreSQL (основная база данных)

PostgreSQL используется для хранения основных данных приложения: исполнителей, альбомов, треков и пользователей.

### Установка PostgreSQL

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
```

#### MacOS
```bash
brew install postgresql
brew services start postgresql
```

#### Windows
1. Скачайте установщик с [официального сайта](https://www.postgresql.org/download/windows/)
2. Запустите установщик и следуйте инструкциям

### Создание базы данных и пользователя

```bash
# Подключение к PostgreSQL
sudo -u postgres psql

# В консоли PostgreSQL
CREATE DATABASE music_streaming;
CREATE USER music_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE music_streaming TO music_user;
\q
```

### Конфигурация в Django

В файле `.env` настройте параметры подключения:
```
USE_POSTGRES=True
POSTGRES_NAME=music_streaming
POSTGRES_USER=music_user
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

## MongoDB (база для векторов треков)

MongoDB используется для хранения векторных представлений треков, которые используются для рекомендательной системы.

### Установка MongoDB

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb  # Для автозапуска
```

#### MacOS
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Windows
1. Скачайте установщик MongoDB Community Edition с [официального сайта](https://www.mongodb.com/try/download/community)
2. Запустите установщик и следуйте инструкциям

### Проверка MongoDB

Проверьте, что MongoDB запущена:
```bash
mongo --eval "db.version()"
```

### Конфигурация в Django

В файле `.env` настройте параметры подключения:
```
MONGO_URI=mongodb://localhost:27017/
MONGO_DB=music_vectors
```

## Переключение между режимами разработки и продакшн

По умолчанию проект использует SQLite для разработки. Для использования PostgreSQL установите:
```
USE_POSTGRES=True
```

Для режима разработки, когда PostgreSQL не установлен, установите:
```
USE_POSTGRES=False
```

## Тестирование подключений

### Проверка PostgreSQL
```bash
python manage.py shell

# В консоли Python
from django.db import connections
connections['default'].ensure_connection()
# Если нет ошибок, подключение работает
```

### Проверка MongoDB
```bash
python manage.py test_mongodb
``` 