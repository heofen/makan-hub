from django.shortcuts import render
import json
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
import logging

# Настройка логирования
logger = logging.getLogger(__name__)

def index(request, path=''):
    """
    Основная точка входа в приложение React
    """
    try:
        # Для разработки всегда используем режим debug
        debug_mode = True
        logger.info(f"Рендерим index.html с debug={debug_mode}")
        
        context = {
            'debug': debug_mode,  # Явно устанавливаем debug в True
            'user_data': get_user_data(request),
        }
        return render(request, 'frontend/index.html', context)
    except Exception as e:
        logger.error(f"Ошибка при рендеринге frontend/index.html: {str(e)}")
        # В случае ошибки возвращаем простую HTML-страницу с ошибкой
        error_message = f"Произошла ошибка при загрузке приложения: {str(e)}"
        return render(request, 'frontend/error.html', {'error_message': error_message})

# Функция view для обработки всех маршрутов, которые обрабатывает React Router
def react_routes(request, path):
    """
    Обрабатывает все маршруты React Router
    """
    return index(request)

def get_user_data(request):
    """
    Функция для получения данных пользователя в формате JSON
    """
    try:
        if request.user.is_authenticated:
            data = {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'is_authenticated': True
            }
        else:
            data = {
                'is_authenticated': False
            }
        
        return json.dumps(data)
    except Exception as e:
        logger.error(f"Ошибка при получении данных пользователя: {str(e)}")
        return json.dumps({'is_authenticated': False, 'error': str(e)}) 