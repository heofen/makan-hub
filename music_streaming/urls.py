"""
URL configuration for music_streaming project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework.documentation import include_docs_urls

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('music_app.urls')),
    path('api-auth/', include('rest_framework.urls')),
    # Временно отключаем документацию из-за ошибки с coreapi
    # path('docs/', include_docs_urls(title='Mamka Makana API')),
    
    # Frontend URLs - для обслуживания React приложения
    path('app/', include('frontend.urls')),
    
    # Перенаправление с корня на /app/
    path('', RedirectView.as_view(url='/app/')),
    
    # Перенаправление общих маршрутов на соответствующие маршруты React
    path('login/', RedirectView.as_view(url='/app/login')),
    path('register/', RedirectView.as_view(url='/app/register')),
    path('profile/', RedirectView.as_view(url='/app/profile')),
    path('search/', RedirectView.as_view(url='/app/search')),
    path('library/', RedirectView.as_view(url='/app/library')),
    path('playlists/', RedirectView.as_view(url='/app/playlists')),
    path('settings/', RedirectView.as_view(url='/app/settings')),
    path('logout/', RedirectView.as_view(url='/app/logout')),
]

# Добавляем URL для обслуживания медиа-файлов в режиме разработки
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
