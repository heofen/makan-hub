#!/bin/bash

# Определяем переменные для цветного вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Проверяем, установлены ли необходимые зависимости
echo -e "${BLUE}Проверка зависимостей...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${YELLOW}npm не найден. Пожалуйста, установите Node.js${NC}"
    exit 1
fi

# Создаем скрипт запуска React-сервера
cat > start_react.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Запуск React-сервера на порту 3000..."
npm start
EOF

# Создаем скрипт запуска Django-сервера
cat > ../start_django.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
echo "Запуск Django-сервера на порту 8000..."

# Обновляем файл frontend/views.py, устанавливая debug=True
sed -i 's/'"'"'debug'"'"': False/'"'"'debug'"'"': True/g' frontend/views.py

# Запускаем Django сервер
python manage.py runserver
EOF

# Делаем скрипты исполняемыми
chmod +x start_react.sh
chmod +x ../start_django.sh

# Изменяем Django-шаблон для использования React-сервера в режиме разработки
echo -e "${GREEN}Настройка Django для режима разработки...${NC}"
if [ -d "../templates/frontend" ]; then
    # Исправляем файл views.py для режима разработки
    sed -i 's/'"'"'debug'"'"': False/'"'"'debug'"'"': True/g' views.py
    echo -e "${GREEN}Django настроен для режима разработки.${NC}"
else
    echo -e "${YELLOW}Директория шаблонов не найдена. Проверьте структуру проекта.${NC}"
fi

echo -e "${GREEN}Запуск серверов в отдельных терминалах...${NC}"

# Открываем новые терминалы для запуска серверов
if command -v gnome-terminal &> /dev/null; then
    # Для GNOME-терминала
    gnome-terminal -- bash -c "cd \"$(pwd)\" && ./start_react.sh; bash"
    gnome-terminal -- bash -c "cd \"$(pwd)/..\" && ./start_django.sh; bash"
elif command -v xterm &> /dev/null; then
    # Для xterm
    xterm -e "cd \"$(pwd)\" && ./start_react.sh; bash" &
    xterm -e "cd \"$(pwd)/..\" && ./start_django.sh; bash" &
elif command -v konsole &> /dev/null; then
    # Для KDE Konsole
    konsole --new-tab -e "cd \"$(pwd)\" && ./start_react.sh; bash" &
    konsole --new-tab -e "cd \"$(pwd)/..\" && ./start_django.sh; bash" &
else
    echo -e "${YELLOW}Не удалось определить терминал для запуска серверов.${NC}"
    echo -e "${YELLOW}Запустите следующие команды в разных терминалах:${NC}"
    echo -e "${BLUE}Терминал 1: cd \"$(pwd)\" && ./start_react.sh${NC}"
    echo -e "${BLUE}Терминал 2: cd \"$(pwd)/..\" && ./start_django.sh${NC}"
fi

echo -e "${GREEN}Скрипты созданы:${NC}"
echo -e "${BLUE}- ./start_react.sh - запуск React-сервера${NC}"
echo -e "${BLUE}- ../start_django.sh - запуск Django-сервера${NC}"
echo -e "${YELLOW}После запуска, React будет доступен по адресу: http://localhost:3000${NC}"
echo -e "${YELLOW}Django API будет доступен по адресу: http://localhost:8000/api/${NC}"
echo -e "${YELLOW}Для остановки серверов используйте Ctrl+C в соответствующих терминалах${NC}" 