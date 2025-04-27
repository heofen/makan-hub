from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Artist, Album, Track, User, TrackPlay, Playlist, Like, Dislike, Skip, Recommendation

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'password2', 'role', 
                 'bio', 'avatar', 'date_of_birth', 'created_at', 'updated_at']
        extra_kwargs = {
            'role': {'read_only': True},  # Роль может быть изменена только администратором
            'created_at': {'read_only': True},
            'updated_at': {'read_only': True},
        }
    
    def validate(self, attrs):
        # Проверка совпадения паролей
        if attrs.get('password') != attrs.get('password2'):
            raise serializers.ValidationError({"password": "Пароли не совпадают"})
            
        # Проверка email
        email = attrs.get('email', '').strip().lower()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Пользователь с таким email уже существует"})
            
        # Проверка username
        username = attrs.get('username', '').strip()
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "Пользователь с таким username уже существует"})
            
        return attrs
    
    def create(self, validated_data):
        # Удаляем password2, так как он не нужен при создании
        validated_data.pop('password2', None)
        # Создаем пользователя
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
        )
        
        # Копируем остальные данные
        for key, value in validated_data.items():
            if key not in ['email', 'username', 'password']:
                setattr(user, key, value)
        
        user.save()
        return user

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={'input_type': 'password'}, trim_whitespace=False)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            # Пробуем аутентифицировать с username
            user = authenticate(username=username, password=password)
            
            # Если не получилось, пробуем с email
            if not user and '@' in username:
                try:
                    user_obj = User.objects.get(email=username)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass
            
            if not user:
                msg = 'Невозможно авторизоваться с предоставленными учетными данными'
                raise serializers.ValidationError(msg, code='authorization')
        else:
            msg = 'Необходимо указать "username" и "password"'
            raise serializers.ValidationError(msg, code='authorization')
            
        attrs['user'] = user
        return attrs

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'bio', 'avatar', 'date_of_birth']
        
class UserAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'is_active', 'is_staff', 
                 'bio', 'avatar', 'date_of_birth', 'created_at', 'updated_at']

class ArtistSerializer(serializers.ModelSerializer):
    genres_list = serializers.ReadOnlyField()
    albums_count = serializers.ReadOnlyField()
    tracks_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Artist
        fields = [
            'id', 'name', 'bio', 'image', 'slug', 'genres', 'genres_list',
            'country', 'website', 'is_verified', 'albums_count', 'tracks_count',
            'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'slug': {'read_only': True}  # slug генерируется автоматически
        }

class AlbumSerializer(serializers.ModelSerializer):
    artist_name = serializers.ReadOnlyField(source='artist.name')
    tracks_count = serializers.ReadOnlyField()
    cover_image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Album
        fields = [
            'id', 'title', 'artist', 'artist_name', 'release_year', 'cover_image',
            'cover_image_url', 'slug', 'description', 'genre', 'release_date', 
            'tracks_count', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'slug': {'read_only': True}  # slug генерируется автоматически
        }
    
    def get_cover_image_url(self, obj):
        """
        Возвращает полный URL к обложке альбома
        """
        request = self.context.get('request')
        if obj.cover_image and hasattr(obj.cover_image, 'url'):
            return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url
        return None

class TrackSerializer(serializers.ModelSerializer):
    album_title = serializers.ReadOnlyField(source='album.title')
    artist_name = serializers.ReadOnlyField(source='artist.name')
    album_cover = serializers.SerializerMethodField()
    cover_image_url = serializers.SerializerMethodField()
    audio_file_url = serializers.SerializerMethodField()
    likes_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    dislikes_count = serializers.ReadOnlyField()
    is_disliked = serializers.SerializerMethodField()
    skips_count = serializers.ReadOnlyField()
    skip_ratio = serializers.SerializerMethodField()
    average_skip_time = serializers.SerializerMethodField()
    
    class Meta:
        model = Track
        fields = [
            'id', 'title', 'artist', 'artist_name', 'album', 'album_title', 
            'audio_file', 'audio_file_url', 'cover_image', 'cover_image_url', 
            'album_cover', 'duration', 'genre', 'lyrics', 'track_number', 
            'is_featured', 'is_explicit', 'slug', 'created_at', 'updated_at', 
            'likes_count', 'is_liked', 'dislikes_count', 'is_disliked', 
            'skips_count', 'skip_ratio', 'average_skip_time'
        ]
        extra_kwargs = {
            'slug': {'read_only': True}  # slug генерируется автоматически
        }
    
    def get_album_cover(self, obj):
        """
        Возвращает URL обложки альбома, если у трека нет собственной обложки
        """
        request = self.context.get('request')
        if obj.cover_image and hasattr(obj.cover_image, 'url'):
            return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url
        elif obj.album and obj.album.cover_image and hasattr(obj.album.cover_image, 'url'):
            return request.build_absolute_uri(obj.album.cover_image.url) if request else obj.album.cover_image.url
        return None
    
    def get_cover_image_url(self, obj):
        """
        Возвращает полный URL к обложке трека
        """
        request = self.context.get('request')
        if obj.cover_image and hasattr(obj.cover_image, 'url'):
            return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url
        return None
    
    def get_audio_file_url(self, obj):
        """
        Возвращает полный URL к аудиофайлу трека
        """
        request = self.context.get('request')
        if obj.audio_file and hasattr(obj.audio_file, 'url'):
            return request.build_absolute_uri(obj.audio_file.url) if request else obj.audio_file.url
        return None
    
    def get_is_liked(self, obj):
        """
        Проверяет, поставил ли текущий пользователь лайк треку
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.is_liked_by(request.user)
        return False

    def get_is_disliked(self, obj):
        """
        Проверяет, поставил ли текущий пользователь дизлайк треку
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.is_disliked_by(request.user)
        return False

    def get_skip_ratio(self, obj):
        """
        Возвращает соотношение пропусков к прослушиваниям
        """
        return obj.get_skip_ratio()
    
    def get_average_skip_time(self, obj):
        """
        Возвращает среднее время в секундах, когда трек обычно пропускают
        """
        return obj.get_average_skip_time()

class TrackPlaySerializer(serializers.ModelSerializer):
    track_title = serializers.CharField(source='track.title', read_only=True)
    artist_name = serializers.CharField(source='track.artist_name', read_only=True)
    album_title = serializers.CharField(source='track.album_title', read_only=True)
    
    class Meta:
        model = TrackPlay
        fields = ['id', 'track', 'track_title', 'artist_name', 'album_title', 
                  'played_at', 'play_duration', 'completed']
        read_only_fields = ['played_at'] 

class PlaylistSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    tracks_count = serializers.ReadOnlyField()
    duration = serializers.ReadOnlyField()
    
    class Meta:
        model = Playlist
        fields = [
            'id', 'title', 'owner', 'owner_username', 'tracks',
            'created_at', 'updated_at', 'public_slug', 'description',
            'is_public', 'cover_image', 'tracks_count', 'duration'
        ]
        read_only_fields = ['created_at', 'updated_at', 'owner']
        
    def create(self, validated_data):
        # Устанавливаем владельца как текущего пользователя
        user = self.context['request'].user
        validated_data['owner'] = user
        return super().create(validated_data)
        
class PlaylistDetailSerializer(PlaylistSerializer):
    """Расширенный сериализатор для детальной информации о плейлисте с треками"""
    tracks = TrackSerializer(many=True, read_only=True)
    
    class Meta(PlaylistSerializer.Meta):
        fields = PlaylistSerializer.Meta.fields 

class LikeSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    track_title = serializers.ReadOnlyField(source='track.title')
    artist_name = serializers.ReadOnlyField(source='track.artist_name')
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'user_username', 'track', 'track_title', 
                 'artist_name', 'timestamp']
        read_only_fields = ['timestamp', 'user']
        
    def create(self, validated_data):
        # Устанавливаем пользователя как текущего аутентифицированного пользователя
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class DislikeSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    track_title = serializers.ReadOnlyField(source='track.title')
    artist_name = serializers.ReadOnlyField(source='track.artist_name')
    
    class Meta:
        model = Dislike
        fields = ['id', 'user', 'user_username', 'track', 'track_title', 
                 'artist_name', 'timestamp']
        read_only_fields = ['timestamp', 'user']
        
    def create(self, validated_data):
        # Устанавливаем пользователя как текущего аутентифицированного пользователя
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class SkipSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    track_title = serializers.ReadOnlyField(source='track.title')
    artist_name = serializers.ReadOnlyField(source='track.artist_name')
    percentage_listened = serializers.ReadOnlyField()
    
    class Meta:
        model = Skip
        fields = ['id', 'user', 'user_username', 'track', 'track_title',
                 'artist_name', 'duration', 'percentage_listened', 'timestamp']
        read_only_fields = ['timestamp', 'user']
        
    def create(self, validated_data):
        # Устанавливаем пользователя как текущего аутентифицированного пользователя
        user = self.context['request'].user
        validated_data['user'] = user
        return super().create(validated_data)

class RecommendationSerializer(serializers.ModelSerializer):
    user_username = serializers.ReadOnlyField(source='user.username')
    track_title = serializers.ReadOnlyField(source='track.title')
    artist_name = serializers.ReadOnlyField(source='track.artist_name')
    album_title = serializers.ReadOnlyField(source='track.album_title')
    track_duration = serializers.ReadOnlyField(source='track.duration')
    track_cover = serializers.SerializerMethodField()
    track_audio_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Recommendation
        fields = ['id', 'user', 'user_username', 'track', 'track_title', 
                 'artist_name', 'album_title', 'track_duration', 'track_cover',
                 'track_audio_url', 'score', 'source', 'is_viewed', 'is_clicked', 
                 'created_at']
        read_only_fields = ['created_at', 'user', 'is_viewed', 'is_clicked']
    
    def get_track_cover(self, obj):
        """
        Возвращает URL обложки трека/альбома
        """
        request = self.context.get('request')
        
        if obj.track.cover_image and hasattr(obj.track.cover_image, 'url'):
            return request.build_absolute_uri(obj.track.cover_image.url) if request else obj.track.cover_image.url
        elif obj.track.album and obj.track.album.cover_image and hasattr(obj.track.album.cover_image, 'url'):
            return request.build_absolute_uri(obj.track.album.cover_image.url) if request else obj.track.album.cover_image.url
        
        return None
    
    def get_track_audio_url(self, obj):
        """
        Возвращает URL аудиофайла рекомендуемого трека
        """
        request = self.context.get('request')
        
        if obj.track.audio_file and hasattr(obj.track.audio_file, 'url'):
            return request.build_absolute_uri(obj.track.audio_file.url) if request else obj.track.audio_file.url
        
        return None
    
    def create(self, validated_data):
        # Устанавливаем пользователя как текущего аутентифицированного пользователя
        user = self.context['request'].user
        validated_data['user'] = user
        
        # Проверяем, есть ли уже рекомендация для этого пользователя и трека
        track = validated_data.get('track')
        try:
            recommendation = Recommendation.objects.get(user=user, track=track)
            # Обновляем существующую рекомендацию
            for key, value in validated_data.items():
                setattr(recommendation, key, value)
            recommendation.save()
            return recommendation
        except Recommendation.DoesNotExist:
            # Создаем новую рекомендацию
            return super().create(validated_data) 