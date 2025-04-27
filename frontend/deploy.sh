#!/bin/bash

# Собираем проект
npm run build

# Создаем директории для статических файлов в Django
mkdir -p ../staticfiles/js
mkdir -p ../staticfiles/css
mkdir -p ../staticfiles/media

# Копируем собранные файлы в директорию статических файлов Django
cp -r build/static/js/* ../staticfiles/js/
cp -r build/static/css/* ../staticfiles/css/
cp -r build/static/media/* ../staticfiles/media/ 2>/dev/null || :

# Копируем другие статические файлы
cp build/manifest.json ../staticfiles/
cp build/favicon.ico ../staticfiles/
cp build/robots.txt ../staticfiles/ 2>/dev/null || :
cp -r build/logo* ../staticfiles/ 2>/dev/null || :

echo "Файлы фронтенда успешно скопированы в директорию статических файлов Django" 