from django.urls import path, re_path
from . import views

urlpatterns = [
    # Корневой маршрут
    path('', views.index, name='index'),
    
    # Обработка всех маршрутов React Router (включая без слэша в конце)
    re_path(r'^(?P<path>.*)/$', views.react_routes, name='react_routes_slash'),
    re_path(r'^(?P<path>.*)$', views.react_routes, name='react_routes'),
] 