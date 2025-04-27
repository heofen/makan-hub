from django.shortcuts import render, get_object_or_404
from rest_framework import viewsets, permissions, status, generics, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate, login
from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from .models import Artist, Album, Track, User, TrackPlay, Playlist, Like, Dislike, Skip, Recommendation
from .serializers import (
    ArtistSerializer, AlbumSerializer, TrackSerializer,
    UserSerializer, UserUpdateSerializer, UserAdminSerializer,
    TrackPlaySerializer, PlaylistSerializer, PlaylistDetailSerializer,
    LikeSerializer, DislikeSerializer, SkipSerializer, RecommendationSerializer,
    LoginSerializer
)
from .services import TrackVectorService
from django.db import models
from knox.models import AuthToken
from knox.views import LoginView as KnoxLoginView
from rest_framework.authtoken.serializers import AuthTokenSerializer
from rest_framework.filters import SearchFilter, OrderingFilter
import logging
import json
import random
from django.http import Http404
# Добавляю импорт декораторов для кэширования
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_cookie
from django.conf import settings

logger = logging.getLogger(__name__)

User = get_user_model()

# Создаем класс разрешений для работы с пользователями
class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Разрешение для проверки, является ли пользователь владельцем или админом
    """
    def has_object_permission(self, request, view, obj):
        # Админы могут выполнять любые действия
        if request.user.is_admin:
            return True
        
        # Пользователи могут видеть/редактировать только свои аккаунты
        return obj.id == request.user.id

class RegisterView(generics.GenericAPIView):
    """
    API View для регистрации новых пользователей
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = UserSerializer
    
    def post(self, request, *args, **kwargs):
        logger.info(f"Получен запрос на регистрацию: {request.data}")
        try:
            serializer = self.get_serializer(data=request.data)
            
            # Проверяем, все ли необходимые поля присутствуют
            required_fields = ['username', 'email', 'password', 'password2']
            missing_fields = [field for field in required_fields if field not in request.data]
            
            if missing_fields:
                logger.error(f"Отсутствуют обязательные поля: {missing_fields}")
                return Response({
                    "error": f"Отсутствуют обязательные поля: {', '.join(missing_fields)}",
                    "required_fields": required_fields,
                    "received_fields": list(request.data.keys())
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Валидация
            if not serializer.is_valid():
                logger.error(f"Ошибка валидации: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            # Создание пользователя
            user = serializer.save()
            logger.info(f"Пользователь успешно создан: {user.username} (ID: {user.id})")
            
            # Создаем токен для нового пользователя
            token_instance, token = AuthToken.objects.create(user)
            
            return Response({
                "user": UserSerializer(user, context=self.get_serializer_context()).data,
                "token": token
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.exception(f"Непредвиденная ошибка при регистрации: {str(e)}")
            return Response({
                "detail": f"Произошла ошибка при регистрации: {str(e)}",
                "error_type": type(e).__name__
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(KnoxLoginView):
    """
    API View для авторизации пользователей
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer
    
    def post(self, request, format=None):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        
        login(request, user)
        return super().post(request, format=None)

class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet для модели пользователя.
    Поддерживает операции CRUD и дополнительные методы.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    
    def get_serializer_class(self):
        # Выбор сериализатора в зависимости от действия и роли пользователя
        if self.action == 'create':
            return UserSerializer
        elif self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        elif self.request.user.is_admin:
            return UserAdminSerializer
        return UserSerializer
    
    def get_permissions(self):
        # Особые разрешения для разных действий
        if self.action == 'create':
            # Регистрация доступна всем
            permission_classes = [permissions.AllowAny]
        elif self.action in ['update', 'partial_update', 'destroy', 'retrieve']:
            # Только владелец или админ
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
        elif self.action == 'list':
            # Список всех пользователей доступен только админам
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """
        Получение данных текущего пользователя
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def set_role(self, request, pk=None):
        """
        Установка роли пользователя (только для админов)
        """
        user = self.get_object()
        role = request.data.get('role')
        
        if role not in [User.ROLE_USER, User.ROLE_ADMIN]:
            return Response(
                {"detail": "Некорректная роль"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        user.role = role
        user.save()
        
        serializer = UserAdminSerializer(user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def listening_history(self, request):
        """
        Получение истории прослушиваний текущего пользователя
        """
        # Ограничение количества записей
        limit = int(request.query_params.get('limit', 20))
        
        # Получаем историю прослушиваний
        track_plays = TrackPlay.objects.filter(user=request.user).order_by('-played_at')[:limit]
        serializer = TrackPlaySerializer(track_plays, many=True)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def recommendations(self, request):
        """
        Получение персонализированных рекомендаций для текущего пользователя
        """
        # Ограничение количества рекомендаций
        limit = int(request.query_params.get('limit', 10))
        
        # Получаем только непросмотренные рекомендации
        unviewed_only = request.query_params.get('unviewed_only', 'true').lower() == 'true'
        
        # Базовый запрос
        recommendations_query = Recommendation.objects.filter(user=request.user)
        
        # Добавляем фильтр по статусу просмотра
        if unviewed_only:
            recommendations_query = recommendations_query.filter(is_viewed=False)
        
        # Получаем рекомендации, отсортированные по релевантности (score)
        recommendations = recommendations_query.order_by('-score')[:limit]
        
        serializer = RecommendationSerializer(
            recommendations, 
            many=True, 
            context={'request': request}
        )
        
        return Response(serializer.data)

# Create your views here.

class ArtistViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с исполнителями (Artists).
    
    Поддерживает:
    - Получение списка всех исполнителей (GET /artists/)
    - Получение информации об исполнителе (GET /artists/{slug}/)
    - Создание нового исполнителя (POST /artists/)
    - Обновление информации об исполнителе (PUT/PATCH /artists/{slug}/)
    - Удаление исполнителя (DELETE /artists/{slug}/)
    
    Дополнительные методы:
    - Получение альбомов исполнителя (GET /artists/{slug}/albums/)
    - Получение треков исполнителя (GET /artists/{slug}/tracks/)
    - Получение популярных треков исполнителя (GET /artists/{slug}/popular_tracks/)
    - Проверка верификации исполнителя (GET /artists/{slug}/is_verified/)
    - Верификация исполнителя (только для администраторов) (POST /artists/{slug}/verify/)
    """
    queryset = Artist.objects.all()
    serializer_class = ArtistSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'  # Использовать slug вместо id для URL
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['country', 'is_verified']
    search_fields = ['name', 'genres']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        queryset = Artist.objects.all()
        
        # Фильтрация по жанру
        genre = self.request.query_params.get('genre', None)
        if genre:
            queryset = queryset.filter(genres__icontains=genre)
            
        # Фильтрация по стране
        country = self.request.query_params.get('country', None)
        if country:
            queryset = queryset.filter(country__icontains=country)
            
        # Поиск по имени
        name = self.request.query_params.get('name', None)
        if name:
            queryset = queryset.filter(name__icontains=name)
            
        # Фильтрация верифицированных исполнителей
        verified = self.request.query_params.get('verified', None)
        if verified is not None:
            is_verified = verified.lower() == 'true'
            queryset = queryset.filter(is_verified=is_verified)
        
        # Сортировка
        sort_by = self.request.query_params.get('sort_by', 'name')
        if sort_by not in ['name', '-name', 'created_at', '-created_at']:
            sort_by = 'name'  # По умолчанию сортируем по имени
        
        queryset = queryset.order_by(sort_by)
            
        return queryset
    
    def get_serializer_context(self):
        """
        Добавляем request в контекст сериализатора для формирования полных URL
        """
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    def get_permissions(self):
        """
        Права доступа:
        - Чтение доступно всем
        - Создание, обновление и удаление только для аутентифицированных пользователей
        - Верификация только для администраторов
        """
        if self.action == 'verify':
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['get'])
    def albums(self, request, slug=None):
        """Получить все альбомы данного исполнителя"""
        artist = self.get_object()
        albums = artist.albums.all()
        
        # Сортировка
        sort_by = request.query_params.get('sort_by', '-release_year')
        
        # Дополнительная фильтрация по году
        year = request.query_params.get('year', None)
        if year:
            albums = albums.filter(release_year=year)
        
        albums = albums.order_by(sort_by)
        
        # Пагинация для больших коллекций
        page = self.paginate_queryset(albums)
        if page is not None:
            serializer = AlbumSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = AlbumSerializer(albums, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def tracks(self, request, slug=None):
        """Получить все треки данного исполнителя"""
        artist = self.get_object()
        tracks = artist.tracks.all()
        
        # Сортировка
        sort_by = request.query_params.get('sort_by', 'album__release_year')
        
        # Дополнительная фильтрация
        album_id = request.query_params.get('album_id', None)
        if album_id:
            tracks = tracks.filter(album_id=album_id)
            
        genre = request.query_params.get('genre', None)
        if genre:
            tracks = tracks.filter(genre__icontains=genre)
            
        tracks = tracks.order_by(sort_by)
        
        # Пагинация для больших коллекций
        page = self.paginate_queryset(tracks)
        if page is not None:
            serializer = TrackSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def popular_tracks(self, request, slug=None):
        """Получить популярные треки исполнителя на основе прослушиваний"""
        artist = self.get_object()
        limit = int(request.query_params.get('limit', 10))
        
        # Получаем треки этого исполнителя, отсортированные по количеству прослушиваний
        tracks = artist.tracks.annotate(
            plays_count=models.Count('plays')
        ).order_by('-plays_count')[:limit]
        
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def is_verified(self, request, slug=None):
        """Проверить, верифицирован ли исполнитель"""
        artist = self.get_object()
        return Response({
            'is_verified': artist.is_verified
        })
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def verify(self, request, slug=None):
        """Верификация исполнителя (только для администраторов)"""
        artist = self.get_object()
        verified = request.data.get('verified', True)
        
        if not isinstance(verified, bool):
            verified = verified.lower() == 'true'
            
        artist.is_verified = verified
        artist.save(update_fields=['is_verified'])
        
        serializer = self.get_serializer(artist)
        return Response(serializer.data)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class AlbumViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с альбомами.
    
    Поддерживает:
    - Получение списка всех альбомов (GET /albums/)
    - Получение информации об альбоме (GET /albums/{slug}/)
    - Создание нового альбома (POST /albums/)
    - Обновление информации об альбоме (PUT/PATCH /albums/{slug}/)
    - Удаление альбома (DELETE /albums/{slug}/)
    
    Дополнительные методы:
    - Получение треков альбома (GET /albums/{slug}/tracks/)
    """
    queryset = Album.objects.all()
    serializer_class = AlbumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'  # Использовать slug вместо id для URL
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['artist__slug', 'release_year']
    search_fields = ['title', 'artist__name']
    ordering_fields = ['title', 'release_year', 'created_at']
    ordering = ['-release_year', 'title']
    
    def get_queryset(self):
        queryset = Album.objects.all()
        
        # Фильтрация по артисту
        artist_id = self.request.query_params.get('artist_id', None)
        if artist_id is not None:
            queryset = queryset.filter(artist_id=artist_id)
        
        # Фильтрация по имени исполнителя
        artist_name = self.request.query_params.get('artist_name', None)
        if artist_name is not None:
            queryset = queryset.filter(artist__name__icontains=artist_name)
            
        # Фильтрация по году выпуска
        year = self.request.query_params.get('year', None)
        if year is not None:
            queryset = queryset.filter(release_year=year)
            
        # Фильтрация по диапазону годов
        year_from = self.request.query_params.get('year_from', None)
        year_to = self.request.query_params.get('year_to', None)
        
        if year_from is not None:
            queryset = queryset.filter(release_year__gte=year_from)
        if year_to is not None:
            queryset = queryset.filter(release_year__lte=year_to)
            
        # Фильтрация по жанру
        genre = self.request.query_params.get('genre', None)
        if genre is not None:
            queryset = queryset.filter(genre__icontains=genre)
            
        # Поиск по названию
        title = self.request.query_params.get('title', None)
        if title is not None:
            queryset = queryset.filter(title__icontains=title)
        
        # Фильтрация по количеству треков (больше указанного)
        min_tracks = self.request.query_params.get('min_tracks', None)
        if min_tracks is not None:
            try:
                min_tracks = int(min_tracks)
                # Используем аннотацию для подсчета треков
                queryset = queryset.annotate(
                    total_tracks=models.Count('tracks')
                ).filter(total_tracks__gte=min_tracks)
            except (ValueError, TypeError):
                pass
                
        # Сортировка
        sort_by = self.request.query_params.get('sort_by', '-release_year')
        valid_sort_fields = ['release_year', '-release_year', 'title', '-title', 
                            'created_at', '-created_at', 'artist__name', '-artist__name']
        
        if sort_by not in valid_sort_fields:
            sort_by = '-release_year'  # По умолчанию сортируем по году выпуска (сначала новые)
            
        queryset = queryset.order_by(sort_by)
            
        return queryset
    
    def get_serializer_context(self):
        """
        Добавляем request в контекст сериализатора для формирования полных URL к статическим файлам,
        в том числе к обложкам альбомов (cover_image)
        """
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    def get_permissions(self):
        """
        Права доступа:
        - Чтение доступно всем
        - Создание, обновление и удаление только для администраторов
        - Добавление треков только для администраторов
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'add_track']:
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        return [permission() for permission in permission_classes]
    
    @action(detail=True, methods=['get'])
    def tracks(self, request, slug=None):
        """Получить все треки данного альбома"""
        album = self.get_object()
        tracks = album.tracks.all()
        
        # Сортировка 
        sort_by = request.query_params.get('sort_by', 'track_number')
        valid_sort_fields = ['track_number', '-track_number', 'title', '-title']
        
        if sort_by not in valid_sort_fields:
            sort_by = 'track_number'  # По умолчанию сортируем по номеру трека
            
        tracks = tracks.order_by(sort_by)
        
        # Пагинация для больших коллекций
        page = self.paginate_queryset(tracks)
        if page is not None:
            serializer = TrackSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        
        serializer = TrackSerializer(tracks, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def artist(self, request, slug=None):
        """Получить информацию об исполнителе альбома"""
        album = self.get_object()
        artist = album.artist
        serializer = ArtistSerializer(artist, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def similar(self, request, slug=None):
        """Найти похожие альбомы по жанру и году выпуска"""
        album = self.get_object()
        limit = int(request.query_params.get('limit', 5))
        
        # Ищем альбомы того же жанра и примерно того же года выпуска (+/- 2 года)
        # Исключаем текущий альбом из результатов
        similar_albums = Album.objects.filter(
            genre__icontains=album.genre,
            release_year__range=(album.release_year - 2, album.release_year + 2)
        ).exclude(id=album.id)[:limit]
        
        serializer = AlbumSerializer(similar_albums, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def add_track(self, request, slug=None):
        """Добавить трек в альбом (через создание нового трека)"""
        album = self.get_object()
        
        # Получение данных для трека из запроса
        track_data = request.data
        
        # Проверяем наличие обязательных полей
        required_fields = ['title', 'artist_id', 'audio_file']
        missing_fields = [field for field in required_fields if field not in track_data]
        
        if missing_fields:
            return Response(
                {"detail": f"Отсутствуют обязательные поля: {', '.join(missing_fields)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Получаем артиста
            artist_id = track_data.get('artist_id')
            artist = Artist.objects.get(id=artist_id)
            
            # Определяем следующий номер трека в альбоме
            next_track_number = (Track.objects.filter(album=album).aggregate(
                max_num=models.Max('track_number')
            )['max_num'] or 0) + 1
            
            # Создаем новый трек
            track = Track.objects.create(
                title=track_data.get('title'),
                artist=artist,
                album=album,
                audio_file=track_data.get('audio_file'),
                genre=track_data.get('genre', album.genre),
                track_number=track_data.get('track_number', next_track_number),
                is_featured=track_data.get('is_featured', False),
                is_explicit=track_data.get('is_explicit', False),
                lyrics=track_data.get('lyrics', ''),
            )
            
            # Если трек имеет свою обложку, добавляем ее
            if 'cover_image' in track_data:
                track.cover_image = track_data.get('cover_image')
                track.save()
                
            serializer = TrackSerializer(track, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Artist.DoesNotExist:
            return Response(
                {"detail": "Указанный исполнитель не существует"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": f"Ошибка при создании трека: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def update_tracks(self, request, slug=None):
        """
        Обновить список треков альбома (изменить порядок, добавить/удалить треки)
        """
        album = self.get_object()
        tracks_data = request.data.get('tracks')
        
        if not tracks_data or not isinstance(tracks_data, list):
            return Response(
                {"detail": "Необходимо предоставить список идентификаторов треков в поле 'tracks'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Получаем список треков по их ID
            tracks = []
            for track_data in tracks_data:
                track_id = track_data.get('id')
                if not track_id:
                    continue
                    
                try:
                    track = Track.objects.get(id=track_id)
                    
                    # Обновляем номер трека, если указан
                    if 'track_number' in track_data:
                        track.track_number = track_data['track_number']
                        
                    # Перемещаем трек в текущий альбом, если он находится в другом
                    if track.album != album:
                        track.album = album
                        
                    track.save()
                    tracks.append(track)
                    
                except Track.DoesNotExist:
                    # Пропускаем несуществующие треки
                    pass
            
            # Обновляем треки, которые не были переданы в запросе (удаляем их из альбома)
            if request.data.get('remove_other_tracks', False):
                track_ids = [track.id for track in tracks]
                other_tracks = Track.objects.filter(album=album).exclude(id__in=track_ids)
                
                for track in other_tracks:
                    # Создаем новый "пустой" альбом для хранения треков без альбома
                    # или пометка трека как "вне альбома"
                    track.album = None
                    track.save()
            
            # Возвращаем обновленный список треков
            album_tracks = Track.objects.filter(album=album).order_by('track_number')
            serializer = TrackSerializer(album_tracks, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"detail": f"Ошибка при обновлении треков: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
    def perform_create(self, serializer):
        """Создание нового альбома с правильной установкой полей"""
        # Получаем исполнителя из запроса
        artist_id = self.request.data.get('artist')
        
        try:
            artist = Artist.objects.get(id=artist_id)
            serializer.save()
        except Artist.DoesNotExist:
            raise serializers.ValidationError({"artist": "Указанный исполнитель не существует"})
            
    def perform_update(self, serializer):
        """
        Обновление информации об альбоме, включая обложку
        """
        instance = self.get_object()
        
        # Получаем данные из запроса
        artist_id = self.request.data.get('artist')
        
        # Проверяем существование исполнителя, если указан в запросе
        if artist_id:
            try:
                artist = Artist.objects.get(id=artist_id)
            except Artist.DoesNotExist:
                raise serializers.ValidationError({"artist": "Указанный исполнитель не существует"})
        
        # Сохраняем обновленный альбом
        album = serializer.save()
        
        return album
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class TrackViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с треками.
    
    Поддерживает:
    - Получение списка всех треков (GET /tracks/)
    - Получение информации о треке (GET /tracks/{slug}/)
    - Создание нового трека (POST /tracks/)
    - Обновление информации о треке (PUT/PATCH /tracks/{slug}/)
    - Удаление трека (DELETE /tracks/{slug}/)
    
    Дополнительные методы:
    - Получение информации об исполнителе трека (GET /tracks/{slug}/artist/)
    - Получение информации об альбоме трека (GET /tracks/{slug}/album/)
    - Получение статистики по треку (GET /tracks/{slug}/stats/)
    - Поиск похожих треков (GET /tracks/{slug}/similar/)
    - Отметка прослушивания трека (POST /tracks/{slug}/play/)
    - Добавление лайка треку (POST /tracks/{slug}/like/)
    - Добавление дизлайка треку (POST /tracks/{slug}/dislike/)
    - Отметка о пропуске трека (POST /tracks/{slug}/skip/)
    """
    queryset = Track.objects.all()
    serializer_class = TrackSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'  # Использовать slug вместо id для URL
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['artist__slug', 'album__slug', 'genre', 'year']
    search_fields = ['title', 'artist__name', 'album__title']
    ordering_fields = ['title', 'year', 'duration', 'created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Track.objects.all()
        
        # Базовые фильтры
        album_id = self.request.query_params.get('album_id', None)
        artist_id = self.request.query_params.get('artist_id', None)
        
        if album_id is not None:
            queryset = queryset.filter(album_id=album_id)
        if artist_id is not None:
            queryset = queryset.filter(artist_id=artist_id)
            
        # Дополнительные фильтры
        genre = self.request.query_params.get('genre', None)
        if genre is not None:
            queryset = queryset.filter(genre__icontains=genre)
        
        # Поиск по названию
        title = self.request.query_params.get('title', None)
        if title is not None:
            queryset = queryset.filter(title__icontains=title)
            
        # Фильтр по номеру трека
        track_number = self.request.query_params.get('track_number', None)
        if track_number is not None:
            queryset = queryset.filter(track_number=track_number)
            
        # Фильтры по специальным меткам
        featured = self.request.query_params.get('featured', None)
        if featured is not None:
            is_featured = featured.lower() == 'true'
            queryset = queryset.filter(is_featured=is_featured)
            
        explicit = self.request.query_params.get('explicit', None)
        if explicit is not None:
            is_explicit = explicit.lower() == 'true'
            queryset = queryset.filter(is_explicit=is_explicit)
            
        # Поиск по тексту песни
        lyrics = self.request.query_params.get('lyrics', None)
        if lyrics is not None:
            queryset = queryset.filter(lyrics__icontains=lyrics)
        
        # Фильтр по количеству лайков (больше указанного)
        min_likes = self.request.query_params.get('min_likes', None)
        if min_likes is not None:
            try:
                min_likes = int(min_likes)
                queryset = queryset.annotate(
                    likes_count_val=models.Count('likes')
                ).filter(likes_count_val__gte=min_likes)
            except (ValueError, TypeError):
                pass
        
        # Сортировка
        sort_by = self.request.query_params.get('sort_by', 'album__release_year')
        valid_sort_fields = [
            'title', '-title', 
            'album__release_year', '-album__release_year',
            'created_at', '-created_at', 
            'artist__name', '-artist__name',
            'track_number', '-track_number'
        ]
        
        if sort_by not in valid_sort_fields:
            sort_by = 'album__release_year'  # По умолчанию
        
        queryset = queryset.order_by(sort_by)
            
        return queryset
    
    def get_serializer_context(self):
        """
        Добавляем request в контекст сериализатора для формирования полных URL к статическим файлам,
        в том числе к обложкам треков (cover_image) и аудиофайлам (audio_file)
        """
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context
    
    def get_permissions(self):
        """
        Права доступа:
        - Чтение доступно всем
        - Создание, обновление и удаление только для аутентифицированных пользователей
        - Векторизация только для администраторов
        """
        if self.action == 'process_vector':
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated, permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticatedOrReadOnly]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        Создание нового трека с проверкой существования исполнителя и альбома
        """
        # Получаем исполнителя и альбом из запроса
        artist_id = self.request.data.get('artist')
        album_id = self.request.data.get('album')
        
        try:
            # Проверяем существование исполнителя
            artist = Artist.objects.get(id=artist_id)
            
            # Проверяем существование альбома
            album = Album.objects.get(id=album_id)
            
            # Если номер трека не указан, определяем следующий номер трека в альбоме
            if 'track_number' not in self.request.data:
                next_track_number = (Track.objects.filter(album=album).aggregate(
                    max_num=models.Max('track_number')
                )['max_num'] or 0) + 1
                
                track = serializer.save(track_number=next_track_number)
            else:
                track = serializer.save()
                
            # Явно вызываем векторизацию трека
            # (Это избыточно, если настроен сигнал post_save, но для надежности)
            TrackVectorService.process_track(track.id)
                
            return track
        except Artist.DoesNotExist:
            raise serializers.ValidationError({"artist": "Указанный исполнитель не существует"})
        except Album.DoesNotExist:
            raise serializers.ValidationError({"album": "Указанный альбом не существует"})
    
    def perform_update(self, serializer):
        """
        Обновление трека с возможной перестройкой вектора если изменился аудиофайл
        """
        # Проверяем, изменился ли аудиофайл
        instance = self.get_object()
        request_audio = self.request.data.get('audio_file', None)
        
        # Сохраняем обновленный трек
        track = serializer.save()
        
        # Если аудиофайл изменился, перестраиваем вектор
        if request_audio is not None:
            TrackVectorService.process_track(track.id)
        
        return track
    
    @action(detail=True, methods=['get'])
    def lyrics(self, request, slug=None):
        """
        Получить текст песни
        """
        track = self.get_object()
        return Response({
            "title": track.title,
            "artist": track.artist.name,
            "lyrics": track.lyrics
        })
    
    @action(detail=True, methods=['get'])
    def recommendations(self, request, slug=None):
        """
        Получение рекомендаций похожих треков.
        
        Returns:
            Список треков, похожих на данный трек с их оценками схожести.
        """
        try:
            track = self.get_object()
            limit = int(request.query_params.get('limit', 5))
            
            # Используем новый метод, возвращающий оценки схожести
            similarity_scores, similar_tracks = TrackVectorService.get_track_recommendations_with_scores(track.id, limit)
            
            # Получаем сериализованные данные треков
            serializer = TrackSerializer(
                similar_tracks, 
                many=True, 
                context={'request': request}
            )
            
            # Подготавливаем результат с оценками
            result = []
            for track_data in serializer.data:
                track_id = track_data.get('id')
                if track_id in similarity_scores:
                    # Добавляем оценку схожести к данным трека
                    track_data['similarity_score'] = round(similarity_scores[track_id], 4)
                    result.append(track_data)
                
            return Response(result)
            
        except Exception as e:
            logger.error(f"Ошибка при получении рекомендаций для трека {slug}: {str(e)}")
            return Response(
                {"detail": "Не удалось получить рекомендации"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def process_vector(self, request, slug=None):
        """
        Принудительная обработка трека и создание векторного
        представления в MongoDB.
        """
        if not request.user.is_staff:
            return Response(
                {"detail": "У вас нет прав для выполнения этого действия."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        success = TrackVectorService.process_track(self.get_object().id)
        
        if success:
            return Response(
                {"status": "success", "message": "Вектор трека успешно обработан"},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"status": "error", "message": "Ошибка при обработке вектора трека"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated, permissions.IsAdminUser])
    def rebuild_annoy_index(self, request):
        """
        Перестраивает индекс Annoy для быстрого поиска похожих треков.
        Доступно только для администраторов.
        """
        force = request.data.get('force', True)
        
        try:
            from .annoy_index import annoy_index
            
            # Строим индекс
            success = annoy_index.build_index(force=force)
            
            if success:
                # Получаем информацию об индексе
                index_info = annoy_index.get_index_info()
                index_info['success'] = True
                
                return Response(
                    {
                        "status": "success", 
                        "message": f"Индекс успешно построен. Проиндексировано {index_info.get('indexed_tracks_count', 0)} треков.",
                        "index_info": index_info
                    },
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"status": "error", "message": "Не удалось построить индекс"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception as e:
            logger.error(f"Ошибка при построении индекса: {str(e)}")
            return Response(
                {"status": "error", "message": f"Ошибка при построении индекса: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def annoy_index_info(self, request):
        """
        Возвращает информацию о текущем состоянии Annoy-индекса.
        """
        try:
            from .annoy_index import annoy_index
            
            # Загружаем индекс, если он еще не загружен
            if not annoy_index.is_loaded:
                annoy_index.load_index()
            
            # Получаем информацию об индексе
            index_info = annoy_index.get_index_info()
            
            return Response(index_info, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Ошибка при получении информации об индексе: {str(e)}")
            return Response(
                {"status": "error", "message": f"Ошибка при получении информации об индексе: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def play(self, request, slug=None):
        """
        Регистрация прослушивания трека
        """
        track = self.get_object()
        user = request.user
        
        # Обязательные параметры
        play_duration = request.data.get('play_duration')
        completed = request.data.get('completed', False)
        
        if play_duration is None:
            return Response({'error': 'Требуется указать продолжительность воспроизведения (play_duration)'}, 
                             status=status.HTTP_400_BAD_REQUEST)
        
        track_play = TrackPlay.objects.create(
            user=user,
            track=track,
            play_duration=play_duration,
            completed=completed
        )
        
        serializer = TrackPlaySerializer(track_play)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def like(self, request, slug=None):
        """
        Поставить или удалить лайк для трека
        """
        track = self.get_object()
        user = request.user
        
        # Проверяем, существует ли уже лайк для этого трека от этого пользователя
        like_exists = Like.objects.filter(user=user, track=track).exists()
        
        # Если пользователь дизлайкнул трек, удаляем дизлайк (нельзя одновременно лайкнуть и дизлайкнуть)
        if Dislike.objects.filter(user=user, track=track).exists():
            Dislike.objects.filter(user=user, track=track).delete()
        
        if like_exists:
            # Если лайк уже есть, удаляем его (снимаем лайк)
            Like.objects.filter(user=user, track=track).delete()
            return Response(
                {"status": "success", "action": "unliked"},
                status=status.HTTP_200_OK
            )
        else:
            # Если лайка нет, создаем его
            like = Like.objects.create(user=user, track=track)
            serializer = LikeSerializer(like)
            return Response(
                {"status": "success", "action": "liked", "like": serializer.data},
                status=status.HTTP_201_CREATED
            )
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def is_liked(self, request, slug=None):
        """
        Проверить, лайкнул ли текущий пользователь трек
        """
        track = self.get_object()
        user = request.user
        
        liked = Like.objects.filter(user=user, track=track).exists()
        
        return Response(
            {"is_liked": liked},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def dislike(self, request, slug=None):
        """
        Поставить или удалить дизлайк для трека
        """
        track = self.get_object()
        user = request.user
        
        # Проверяем, существует ли уже дизлайк для этого трека от этого пользователя
        dislike_exists = Dislike.objects.filter(user=user, track=track).exists()
        
        # Если пользователь лайкнул трек, удаляем лайк (нельзя одновременно лайкнуть и дизлайкнуть)
        if Like.objects.filter(user=user, track=track).exists():
            Like.objects.filter(user=user, track=track).delete()
        
        if dislike_exists:
            # Если дизлайк уже есть, удаляем его (снимаем дизлайк)
            Dislike.objects.filter(user=user, track=track).delete()
            return Response(
                {"status": "success", "action": "undisliked"},
                status=status.HTTP_200_OK
            )
        else:
            # Если дизлайка нет, создаем его
            dislike = Dislike.objects.create(user=user, track=track)
            serializer = DislikeSerializer(dislike)
            return Response(
                {"status": "success", "action": "disliked", "dislike": serializer.data},
                status=status.HTTP_201_CREATED
            )
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def is_disliked(self, request, slug=None):
        """
        Проверить, дизлайкнул ли текущий пользователь трек
        """
        track = self.get_object()
        user = request.user
        
        disliked = Dislike.objects.filter(user=user, track=track).exists()
        
        return Response(
            {"is_disliked": disliked},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def skip(self, request, slug=None):
        """
        Регистрирует событие пропуска трека.
        Если трек пропущен менее чем за 10 секунд, автоматически создаёт дизлайк.
        """
        track = self.get_object()
        user = request.user
        
        # Получаем данные о длительности прослушивания до пропуска
        duration = request.data.get('duration', 0)
        
        try:
            duration = int(duration)
            if duration < 0:
                duration = 0
        except (ValueError, TypeError):
            duration = 0
        
        # Создаем запись о пропуске
        skip = Skip.objects.create(
            user=user,
            track=track,
            duration=duration
        )
        
        # Если трек пропущен менее чем за 10 секунд, автоматически создаем дизлайк
        # Но только если у пользователя ещё нет дизлайка на этот трек
        auto_dislike = False
        dislike_created = False
        
        if duration < 10:
            auto_dislike = True
            # Проверяем, существует ли уже дизлайк
            dislike_exists = Dislike.objects.filter(user=user, track=track).exists()
            
            if not dislike_exists:
                # Если пользователь лайкнул трек, удаляем лайк
                if Like.objects.filter(user=user, track=track).exists():
                    Like.objects.filter(user=user, track=track).delete()
                
                # Создаем дизлайк
                Dislike.objects.create(user=user, track=track)
                dislike_created = True
        
        serializer = SkipSerializer(skip)
        response_data = serializer.data
        # Добавляем информацию о созданном дизлайке
        response_data.update({
            'auto_dislike': auto_dislike,
            'dislike_created': dislike_created
        })
        
        return Response(response_data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def featured(self, request):
        """
        Получить список треков, отмеченных как хиты
        """
        featured_tracks = Track.objects.filter(is_featured=True).order_by('-created_at')
        limit = int(request.query_params.get('limit', 10))
        featured_tracks = featured_tracks[:limit]
        
        # Пагинация для больших коллекций
        page = self.paginate_queryset(featured_tracks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(featured_tracks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """
        Получить список популярных треков на основе количества прослушиваний
        """
        limit = int(request.query_params.get('limit', 10))
        
        # Получаем треки, отсортированные по количеству прослушиваний за последние 30 дней
        from django.utils import timezone
        from datetime import timedelta
        
        start_date = timezone.now() - timedelta(days=30)
        
        # Получаем треки с количеством прослушиваний
        trending_tracks = Track.objects.filter(
            plays__played_at__gte=start_date
        ).annotate(
            play_count=models.Count('plays')
        ).order_by('-play_count')[:limit]
        
        serializer = self.get_serializer(trending_tracks, many=True)
        return Response(serializer.data)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class TrackPlayViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TrackPlaySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return TrackPlay.objects.filter(user=user).order_by('-played_at')
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class PlaylistViewSet(viewsets.ModelViewSet):
    """
    ViewSet для работы с плейлистами.
    
    Поддерживает:
    - Получение списка всех плейлистов (GET /playlists/)
    - Получение информации о плейлисте (GET /playlists/{id}/)
    - Создание нового плейлиста (POST /playlists/)
    - Обновление информации о плейлисте (PUT/PATCH /playlists/{id}/)
    - Удаление плейлиста (DELETE /playlists/{id}/)
    
    Дополнительные методы:
    - Получение своих плейлистов (GET /playlists/my_playlists/)
    - Добавление трека в плейлист (POST /playlists/{id}/add_track/)
    - Удаление трека из плейлиста (POST /playlists/{id}/remove_track/)
    """
    serializer_class = PlaylistSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'public_slug'
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_public', 'user__id']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        user = self.request.user
        
        # Если пользователь админ, возвращаем все плейлисты
        if user.is_admin:
            queryset = Playlist.objects.all()
        else:
            # Для обычных пользователей - только их собственные плейлисты
            # или публичные плейлисты других пользователей
            queryset = Playlist.objects.filter(
                models.Q(owner=user) | models.Q(is_public=True)
            )
        
        # Фильтрация по владельцу
        owner_id = self.request.query_params.get('owner_id', None)
        if owner_id is not None:
            queryset = queryset.filter(owner_id=owner_id)
        
        # Поиск по названию
        title = self.request.query_params.get('title', None)
        if title is not None:
            queryset = queryset.filter(title__icontains=title)
            
        # Фильтр по публичности
        is_public = self.request.query_params.get('is_public', None)
        if is_public is not None:
            is_public_bool = is_public.lower() == 'true'
            queryset = queryset.filter(is_public=is_public_bool)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['retrieve']:
            return PlaylistDetailSerializer
        return PlaylistSerializer
    
    def perform_create(self, serializer):
        # Устанавливаем текущего пользователя как владельца
        serializer.save(owner=self.request.user)
    
    def perform_update(self, serializer):
        """
        Обновление информации о плейлисте, включая название, обложку и треки
        """
        instance = self.get_object()
        
        # Проверяем права доступа - только владелец или админ могут редактировать плейлист
        if instance.owner != self.request.user and not self.request.user.is_admin:
            raise serializers.ValidationError(
                {"detail": "У вас нет прав на редактирование этого плейлиста"}
            )
            
        # Обновляем плейлист, сохраняя владельца без изменений
        playlist = serializer.save()
        
        # Обработка треков, если они переданы в запросе
        tracks_data = self.request.data.get('tracks')
        if tracks_data and isinstance(tracks_data, list):
            # Очищаем текущие треки, если переданы новые
            playlist.tracks.clear()
            # Добавляем указанные треки
            for track_id in tracks_data:
                try:
                    track = Track.objects.get(id=track_id)
                    playlist.tracks.add(track)
                except Track.DoesNotExist:
                    # Просто пропускаем несуществующие треки
                    pass
                    
        return playlist
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        elif self.action in ['shared']:
            # Для shared endpoint не требуем авторизации
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny()])
    def shared(self, request, public_slug=None):
        """
        Публичный эндпоинт для доступа к плейлисту по его public_slug.
        Не требует авторизации для публичных плейлистов.
        """
        try:
            playlist = Playlist.objects.get(public_slug=public_slug, is_public=True)
        except Playlist.DoesNotExist:
            return Response(
                {"detail": "Публичный плейлист не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        serializer = PlaylistDetailSerializer(playlist, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_track(self, request, public_slug=None):
        """Добавляет трек в плейлист"""
        playlist = self.get_object()
        
        # Проверяем, что пользователь является владельцем
        if playlist.owner != request.user and not request.user.is_admin:
            return Response(
                {"detail": "У вас нет прав на изменение этого плейлиста"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Получаем трек по ID
        track_id = request.data.get('track_id')
        if not track_id:
            return Response(
                {"detail": "Необходимо указать track_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            track = Track.objects.get(pk=track_id)
            playlist.tracks.add(track)
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Track.DoesNotExist:
            return Response(
                {"detail": "Трек не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def remove_track(self, request, public_slug=None):
        """Удаляет трек из плейлиста"""
        playlist = self.get_object()
        
        # Проверяем, что пользователь является владельцем
        if playlist.owner != request.user and not request.user.is_admin:
            return Response(
                {"detail": "У вас нет прав на изменение этого плейлиста"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Получаем трек по ID
        track_id = request.data.get('track_id')
        if not track_id:
            return Response(
                {"detail": "Необходимо указать track_id"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            track = Track.objects.get(pk=track_id)
            playlist.tracks.remove(track)
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except Track.DoesNotExist:
            return Response(
                {"detail": "Трек не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def my_playlists(self, request):
        """Возвращает все плейлисты текущего пользователя"""
        playlists = Playlist.objects.filter(owner=request.user)
        serializer = self.get_serializer(playlists, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class LikeViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления лайками пользователей
    """
    serializer_class = LikeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Если пользователь администратор, он может видеть все лайки
        if user.is_admin:
            queryset = Like.objects.all()
        else:
            # Обычные пользователи видят только свои лайки
            queryset = Like.objects.filter(user=user)
        
        # Фильтрация по пользователю
        user_id = self.request.query_params.get('user_id', None)
        if user_id is not None and user.is_admin:
            queryset = queryset.filter(user_id=user_id)
            
        # Фильтрация по треку
        track_id = self.request.query_params.get('track_id', None)
        if track_id is not None:
            queryset = queryset.filter(track_id=track_id)
            
        # Сортировка
        sort_by = self.request.query_params.get('sort', '-timestamp')
        if sort_by not in ['timestamp', '-timestamp']:
            sort_by = '-timestamp'
        
        return queryset.order_by(sort_by)
    
    def perform_create(self, serializer):
        # Устанавливаем текущего пользователя
        serializer.save(user=self.request.user)
    
    def get_permissions(self):
        # Для удаления требуем, чтобы пользователь был владельцем лайка или админом
        if self.action in ['destroy', 'update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def my_likes(self, request):
        """
        Получить все лайки текущего пользователя
        """
        queryset = Like.objects.filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class DislikeViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления дизлайками пользователей
    """
    serializer_class = DislikeSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Если пользователь администратор, он может видеть все дизлайки
        if user.is_admin:
            queryset = Dislike.objects.all()
        else:
            # Обычные пользователи видят только свои дизлайки
            queryset = Dislike.objects.filter(user=user)
        
        # Фильтрация по пользователю
        user_id = self.request.query_params.get('user_id', None)
        if user_id is not None and user.is_admin:
            queryset = queryset.filter(user_id=user_id)
            
        # Фильтрация по треку
        track_id = self.request.query_params.get('track_id', None)
        if track_id is not None:
            queryset = queryset.filter(track_id=track_id)
            
        # Сортировка
        sort_by = self.request.query_params.get('sort', '-timestamp')
        if sort_by not in ['timestamp', '-timestamp']:
            sort_by = '-timestamp'
        
        return queryset.order_by(sort_by)
    
    def perform_create(self, serializer):
        # Устанавливаем текущего пользователя
        serializer.save(user=self.request.user)
        
        # Удаляем лайк этого трека (если есть)
        track = serializer.validated_data.get('track')
        if track:
            Like.objects.filter(user=self.request.user, track=track).delete()
    
    def get_permissions(self):
        # Для удаления требуем, чтобы пользователь был владельцем дизлайка или админом
        if self.action in ['destroy', 'update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def my_dislikes(self, request):
        """
        Получить все дизлайки текущего пользователя
        """
        queryset = Dislike.objects.filter(user=request.user)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class SkipViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления событиями пропуска треков
    """
    serializer_class = SkipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Если пользователь администратор, он может видеть все пропуски
        if user.is_admin:
            queryset = Skip.objects.all()
        else:
            # Обычные пользователи видят только свои пропуски
            queryset = Skip.objects.filter(user=user)
        
        # Фильтрация по пользователю
        user_id = self.request.query_params.get('user_id', None)
        if user_id is not None and user.is_admin:
            queryset = queryset.filter(user_id=user_id)
            
        # Фильтрация по треку
        track_id = self.request.query_params.get('track_id', None)
        if track_id is not None:
            queryset = queryset.filter(track_id=track_id)
            
        # Фильтрация по минимальной длительности прослушивания
        min_duration = self.request.query_params.get('min_duration', None)
        if min_duration is not None:
            try:
                min_duration = int(min_duration)
                queryset = queryset.filter(duration__gte=min_duration)
            except (ValueError, TypeError):
                pass
                
        # Фильтрация по максимальной длительности прослушивания
        max_duration = self.request.query_params.get('max_duration', None)
        if max_duration is not None:
            try:
                max_duration = int(max_duration)
                queryset = queryset.filter(duration__lte=max_duration)
            except (ValueError, TypeError):
                pass
            
        # Сортировка
        sort_by = self.request.query_params.get('sort', '-timestamp')
        if sort_by not in ['timestamp', '-timestamp', 'duration', '-duration']:
            sort_by = '-timestamp'
        
        return queryset.order_by(sort_by)
    
    def perform_create(self, serializer):
        # Устанавливаем текущего пользователя
        serializer.save(user=self.request.user)
    
    def get_permissions(self):
        # Для удаления требуем, чтобы пользователь был владельцем записи или админом
        if self.action in ['destroy', 'update', 'partial_update']:
            return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def my_skips(self, request):
        """
        Получить все события пропуска треков текущего пользователя
        """
        queryset = Skip.objects.filter(user=request.user)
        
        # Добавляем возможность фильтрации
        track_id = request.query_params.get('track_id', None)
        if track_id:
            queryset = queryset.filter(track_id=track_id)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Получить статистику пропусков треков текущего пользователя
        """
        if not request.user.is_admin and request.user.id != request.user.id:
            return Response(
                {"detail": "У вас нет прав на просмотр этой статистики"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        user_skips = Skip.objects.filter(user=request.user)
        
        # Общее количество пропусков
        total_skips = user_skips.count()
        
        # Средняя длительность прослушивания до пропуска
        from django.db.models import Avg
        avg_duration = user_skips.aggregate(avg_duration=Avg('duration'))
        
        # Пропуски по трекам (топ-5 пропускаемых треков)
        from django.db.models import Count
        top_skipped_tracks = user_skips.values('track').annotate(
            count=Count('track')
        ).order_by('-count')[:5]
        
        # Получаем информацию о треках
        track_ids = [item['track'] for item in top_skipped_tracks]
        tracks_info = []
        
        if track_ids:
            tracks = Track.objects.filter(id__in=track_ids)
            track_map = {track.id: track for track in tracks}
            
            for item in top_skipped_tracks:
                track_id = item['track']
                if track_id in track_map:
                    track = track_map[track_id]
                    tracks_info.append({
                        'id': track.id,
                        'title': track.title,
                        'artist': track.artist.name if track.artist else None,
                        'skips_count': item['count']
                    })
        
        return Response({
            'total_skips': total_skips,
            'avg_duration': avg_duration['avg_duration'] or 0,
            'top_skipped_tracks': tracks_info
        }, status=status.HTTP_200_OK)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

class RecommendationViewSet(viewsets.ModelViewSet):
    """
    API для работы с рекомендациями треков
    """
    serializer_class = RecommendationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """
        Возвращает рекомендации только для текущего пользователя
        """
        return Recommendation.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        """
        Отмечает рекомендацию как просмотренную
        """
        recommendation = self.get_object()
        recommendation.mark_as_viewed()
        return Response({'status': 'recommendation marked as viewed'})
    
    @action(detail=True, methods=['post'])
    def click(self, request, pk=None):
        """
        Отмечает рекомендацию как кликнутую
        """
        recommendation = self.get_object()
        recommendation.mark_as_clicked()
        return Response({'status': 'recommendation marked as clicked'})
    
    @action(detail=False, methods=['get'])
    def unviewed(self, request):
        """
        Возвращает список непросмотренных рекомендаций
        """
        queryset = self.get_queryset().filter(is_viewed=False)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_view(self, request):
        """
        Массовая отметка рекомендаций как просмотренных
        """
        recommendation_ids = request.data.get('recommendation_ids', [])
        count = 0
        
        for rec_id in recommendation_ids:
            try:
                recommendation = Recommendation.objects.get(id=rec_id, user=request.user)
                recommendation.mark_as_viewed()
                count += 1
            except Recommendation.DoesNotExist:
                pass
        
        return Response({'status': f'{count} recommendations marked as viewed'})
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)
    
    @method_decorator(cache_page(settings.CACHE_TTL))
    @method_decorator(vary_on_cookie)
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@cache_page(settings.CACHE_TTL)
def statistics_view(request):
    """
    Возвращает общую статистику платформы для дашборда:
    - Количество треков
    - Количество альбомов
    - Количество исполнителей
    - Количество пользователей
    - Количество плейлистов
    - Количество лайков и дизлайков
    - Количество прослушиваний
    
    Параметры:
    - period: период статистики (all, day, week, month). По умолчанию 'all'.
    - include_user_stats: включить статистику текущего пользователя (true/false). По умолчанию 'true'.
    """
    from django.utils import timezone
    from datetime import timedelta
    
    # Определение временного периода
    period = request.query_params.get('period', 'all')
    include_user_stats = request.query_params.get('include_user_stats', 'true').lower() == 'true'
    
    if period == 'day':
        start_date = timezone.now() - timedelta(days=1)
    elif period == 'week':
        start_date = timezone.now() - timedelta(days=7)
    elif period == 'month':
        start_date = timezone.now() - timedelta(days=30)
    else:
        # Для всего периода (period == 'all') или неверного параметра
        start_date = None
    
    # Базовые запросы с учетом периода
    tracks_query = Track.objects
    albums_query = Album.objects
    artists_query = Artist.objects
    users_query = User.objects
    playlists_query = Playlist.objects
    likes_query = Like.objects
    dislikes_query = Dislike.objects
    track_plays_query = TrackPlay.objects
    
    # Если указан конкретный период, фильтруем данные
    if start_date:
        # Для объектов, созданных в указанный период
        tracks_query = tracks_query.filter(created_at__gte=start_date)
        albums_query = albums_query.filter(created_at__gte=start_date)
        artists_query = artists_query.filter(created_at__gte=start_date)
        users_query = users_query.filter(created_at__gte=start_date)
        playlists_query = playlists_query.filter(created_at__gte=start_date)
        
        # Для действий пользователей, произошедших в указанный период
        likes_query = likes_query.filter(timestamp__gte=start_date)
        dislikes_query = dislikes_query.filter(timestamp__gte=start_date)
        track_plays_query = track_plays_query.filter(played_at__gte=start_date)
    
    # Сбор основной статистики
    stats = {
        'period': period,
        'tracks_count': tracks_query.count(),
        'albums_count': albums_query.count(),
        'artists_count': artists_query.count(),
        'users_count': users_query.count(),
        'playlists_count': playlists_query.count(),
        'likes_count': likes_query.count(),
        'dislikes_count': dislikes_query.count(),
        'track_plays_count': track_plays_query.count(),
    }
    
    # Добавляем статистику для текущего пользователя
    if include_user_stats:
        user = request.user
        
        # Фильтры для пользовательских данных
        user_track_plays_query = track_plays_query.filter(user=user)
        user_likes_query = likes_query.filter(user=user)
        user_dislikes_query = dislikes_query.filter(user=user)
        user_playlists_query = playlists_query.filter(owner=user)
        
        # Количество треков в личных плейлистах
        from django.db.models import Sum
        total_tracks_in_playlists = 0
        
        if user_playlists_query.exists():
            # Используем Count и distinct, чтобы избежать дублирования
            tracks_in_playlists = user_playlists_query.annotate(
                tracks_count=Count('tracks')
            ).aggregate(total=Sum('tracks_count'))
            
            if tracks_in_playlists['total']:
                total_tracks_in_playlists = tracks_in_playlists['total']
        
        # Статистика пользователя
        user_stats = {
            'total_track_plays': user_track_plays_query.count(),
            'unique_tracks_played': user_track_plays_query.values('track').distinct().count(),
            'likes_count': user_likes_query.count(),
            'dislikes_count': user_dislikes_query.count(),
            'playlists_count': user_playlists_query.count(),
            'tracks_in_playlists': total_tracks_in_playlists,
        }
        
        # Топ-5 любимых исполнителей пользователя
        favorite_artists = Artist.objects.annotate(
            user_likes=Count('tracks__likes', filter=Q(tracks__likes__user=user))
        ).order_by('-user_likes')[:5]
        
        user_stats['favorite_artists'] = [{
            'id': artist.id,
            'name': artist.name,
            'likes_count': artist.user_likes
        } for artist in favorite_artists if artist.user_likes > 0]
        
        stats['user'] = user_stats
    
    # Дополнительная статистика для администраторов
    if request.user.is_admin:
        # Топ-5 популярных треков
        popular_tracks = Track.objects.annotate(
            plays_count=Count('plays', filter=Q(plays__played_at__gte=start_date) if start_date else Q())
        ).order_by('-plays_count')[:5]
        
        # Топ-5 популярных исполнителей
        popular_artists = Artist.objects.annotate(
            plays_count=Count('tracks__plays', filter=Q(tracks__plays__played_at__gte=start_date) if start_date else Q())
        ).order_by('-plays_count')[:5]
        
        # Топ-5 треков с наибольшим количеством лайков
        most_liked_tracks = Track.objects.annotate(
            likes_count_val=Count('likes', filter=Q(likes__timestamp__gte=start_date) if start_date else Q())
        ).order_by('-likes_count_val')[:5]
        
        # Динамика прослушиваний по дням (для графиков)
        if period != 'all':
            from django.db.models import DateField
            from django.db.models.functions import TruncDate
            
            # Количество прослушиваний по дням
            plays_by_day = TrackPlay.objects.filter(
                played_at__gte=start_date
            ).annotate(
                day=TruncDate('played_at')
            ).values('day').annotate(
                count=Count('id')
            ).order_by('day')
            
            # Преобразуем для удобства отображения на графике
            plays_by_day_data = {
                str(item['day']): item['count'] for item in plays_by_day
            }
            
            stats['plays_by_day'] = plays_by_day_data
        
        # Дополнительная статистика
        stats.update({
            'popular_tracks': [{
                'id': track.id,
                'title': track.title,
                'artist': track.artist.name,
                'plays_count': track.plays_count
            } for track in popular_tracks],
            'popular_artists': [{
                'id': artist.id,
                'name': artist.name,
                'plays_count': artist.plays_count
            } for artist in popular_artists],
            'most_liked_tracks': [{
                'id': track.id,
                'title': track.title,
                'artist': track.artist.name,
                'likes_count': track.likes_count_val
            } for track in most_liked_tracks],
        })
    
    return Response(stats)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def similar_tracks(request, track_id):
    """
    Получение похожих треков для указанного трека.
    
    Параметры:
    - track_id: ID трека, для которого нужно получить рекомендации
    - limit: Количество рекомендаций (по умолчанию 10)
    
    Возвращает список похожих треков с их метаданными и оценкой релевантности.
    """
    try:
        # Проверяем существование трека
        track = get_object_or_404(Track, id=track_id)
        
        # Получаем параметр limit из запроса или используем значение по умолчанию
        limit = int(request.query_params.get('limit', 10))
        
        # Ограничиваем максимальное количество рекомендаций
        if limit > 50:
            limit = 50
            
        # Получаем рекомендации с оценками схожести
        similarity_scores, similar_tracks = TrackVectorService.get_track_recommendations_with_scores(track_id, limit)
        
        if not similar_tracks:
            return Response({"detail": "No similar tracks found"}, status=404)
        
        # Формируем результат в виде списка треков с оценками
        result = []
        for track in similar_tracks:
            track_data = TrackSerializer(track).data
            track_data['similarity_score'] = round(similarity_scores.get(str(track.id), 0), 3)  # Округляем до 3 знаков
            result.append(track_data)
            
        return Response(result)
        
    except ValueError as e:
        return Response({"detail": str(e)}, status=400)
    except Http404:
        return Response({"detail": "Track not found"}, status=404)
    except Exception as e:
        logging.error(f"Error getting similar tracks: {str(e)}")
        return Response({"detail": "Failed to retrieve similar tracks"}, status=500)
