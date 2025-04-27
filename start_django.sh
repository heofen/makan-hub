#!/bin/bash
cd "$(dirname "$0")"
echo "Запуск Django-сервера на порту 8000..."

# Обновляем файл frontend/views.py, устанавливая debug=True
sed -i 's/'"'"'debug'"'"': False/'"'"'debug'"'"': True/g' frontend/views.py

# Запускаем Django сервер
python manage.py runserver
