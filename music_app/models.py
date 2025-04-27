from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _
from django.utils.text import slugify
from django.db.models.signals import post_save
from django.dispatch import receiver

# Менеджер пользователей
class UserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        """
        Создает и сохраняет пользователя с указанным email, username и паролем.
        """
        if not email:
            raise ValueError('Email обязателен')
        if not username:
            raise ValueError('Username обязателен')
            
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
        
    def create_superuser(self, email, username, password=None, **extra_fields):
        """
        Создает и сохраняет суперпользователя с указанным email, username и паролем.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', User.ROLE_ADMIN)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Суперпользователь должен иметь is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Суперпользователь должен иметь is_superuser=True.')
            
        return self.create_user(email, username, password, **extra_fields)

# Кастомная модель пользователя
class User(AbstractUser):
    # Роли пользователей
    ROLE_USER = 'user'
    ROLE_ADMIN = 'admin'
    
    ROLE_CHOICES = [
        (ROLE_USER, 'Обычный пользователь'),
        (ROLE_ADMIN, 'Администратор'),
    ]
    
    email = models.EmailField(_('email address'), unique=True)
    username = models.CharField(_('username'), max_length=150, unique=True)
    role = models.CharField(_('role'), max_length=10, choices=ROLE_CHOICES, default=ROLE_USER)
    
    # Дополнительные поля
    bio = models.TextField(_('biography'), blank=True)
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', blank=True, null=True)
    date_of_birth = models.DateField(_('date of birth'), blank=True, null=True)
    
    # Дата и время
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Указываем менеджер
    objects = UserManager()
    
    # Переопределяем EMAIL_FIELD для django-auth
    EMAIL_FIELD = 'email'
    # Обязательные поля для создания пользователя
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        
    def __str__(self):
        return self.username
    
    @property
    def is_admin(self):
        return self.role == self.ROLE_ADMIN

# Create your models here.

class Artist(models.Model):
    name = models.CharField(max_length=200)
    bio = models.TextField(blank=True)
    image = models.ImageField(upload_to='artists/', blank=True, null=True)
    
    # Дополнительные поля
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    genres = models.CharField(max_length=255, blank=True, help_text="Жанры через запятую")
    country = models.CharField(max_length=100, blank=True)
    website = models.URLField(blank=True)
    is_verified = models.BooleanField(default=False)
    
    # Автоматические поля
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Исполнитель'
        verbose_name_plural = 'Исполнители'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Если slug не задан, генерируем его автоматически
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    @property
    def genres_list(self):
        """Возвращает список жанров исполнителя"""
        if not self.genres:
            return []
        return [genre.strip() for genre in self.genres.split(',')]
    
    @property
    def albums_count(self):
        """Возвращает количество альбомов исполнителя"""
        return self.albums.count()
    
    @property
    def tracks_count(self):
        """Возвращает количество треков исполнителя"""
        return self.tracks.count()

class Album(models.Model):
    title = models.CharField(max_length=200)
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='albums')
    release_year = models.PositiveIntegerField(default=2023, help_text="Год выпуска альбома")
    cover_image = models.ImageField(upload_to='albums/', blank=True, null=True, help_text="Обложка альбома")
    
    # Дополнительные поля
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField(blank=True, help_text="Описание альбома")
    genre = models.CharField(max_length=100, blank=True, help_text="Основной жанр альбома")
    
    # Дата и время
    release_date = models.DateField(blank=True, null=True, help_text="Точная дата выпуска (если известна)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Альбом'
        verbose_name_plural = 'Альбомы'
        ordering = ['-release_year', 'title']
        
    def __str__(self):
        return f"{self.title} - {self.artist.name} ({self.release_year})"
        
    def save(self, *args, **kwargs):
        # Если slug не задан, генерируем его автоматически
        if not self.slug:
            self.slug = slugify(f"{self.title}-{self.artist.name}-{self.release_year}")
        super().save(*args, **kwargs)
        
    @property
    def tracks_count(self):
        """Возвращает количество треков в альбоме"""
        return self.tracks.count()

class Track(models.Model):
    title = models.CharField(max_length=200, help_text="Название трека")
    artist = models.ForeignKey(Artist, on_delete=models.CASCADE, related_name='tracks', help_text="Исполнитель трека")
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='tracks', help_text="Альбом, к которому принадлежит трек")
    audio_file = models.FileField(upload_to='tracks/', help_text="Аудиофайл трека")
    cover_image = models.ImageField(upload_to='tracks/covers/', blank=True, null=True, help_text="Обложка трека (если отличается от обложки альбома)")
    
    # Дополнительные поля
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    duration = models.DurationField(null=True, blank=True, help_text="Длительность трека")
    genre = models.CharField(max_length=100, blank=True, help_text="Жанр трека")
    lyrics = models.TextField(blank=True, help_text="Текст песни")
    track_number = models.PositiveIntegerField(default=1, help_text="Номер трека в альбоме")
    is_featured = models.BooleanField(default=False, help_text="Отмечен ли трек как хит")
    is_explicit = models.BooleanField(default=False, help_text="Содержит ли трек ненормативный контент")
    
    # Метаданные
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Трек'
        verbose_name_plural = 'Треки'
        ordering = ['album', 'track_number', 'title']
        unique_together = ['album', 'track_number']  # Номер трека должен быть уникальным в пределах альбома
    
    def __str__(self):
        return f"{self.title} - {self.artist.name}"
        
    def save(self, *args, **kwargs):
        # Если slug не задан, генерируем его автоматически
        if not self.slug:
            self.slug = slugify(f"{self.title}-{self.artist.name}")
        
        # Если обложка не указана, используем обложку альбома
        if not self.cover_image and self.album and self.album.cover_image:
            self.cover_image = self.album.cover_image
            
        super().save(*args, **kwargs)
        
    @property
    def album_title(self):
        """Возвращает название альбома"""
        return self.album.title if self.album else None
    
    @property
    def artist_name(self):
        """Возвращает имя исполнителя"""
        return self.artist.name if self.artist else None
    
    @property
    def likes_count(self):
        """Возвращает количество лайков трека"""
        return self.likes.count()
    
    def is_liked_by(self, user):
        """Проверяет, поставил ли пользователь лайк треку"""
        if user.is_anonymous:
            return False
        return self.likes.filter(user=user).exists()
    
    @property
    def dislikes_count(self):
        """Возвращает количество дизлайков трека"""
        return self.dislikes.count()
    
    def is_disliked_by(self, user):
        """Проверяет, поставил ли пользователь дизлайк треку"""
        if user.is_anonymous:
            return False
        return self.dislikes.filter(user=user).exists()
    
    @property
    def skips_count(self):
        """Возвращает количество пропусков трека"""
        return self.skips.count()
    
    def get_skip_ratio(self):
        """
        Возвращает соотношение пропусков к прослушиваниям
        (насколько часто трек пропускают)
        """
        plays_count = self.plays.count()
        skips_count = self.skips.count()
        
        if plays_count == 0:
            return 0
            
        return skips_count / (skips_count + plays_count)
    
    def get_average_skip_time(self):
        """
        Возвращает среднее время в секундах, когда трек обычно пропускают
        """
        from django.db.models import Avg
        result = self.skips.aggregate(avg_time=Avg('duration'))
        return result['avg_time'] or 0

# Обработчик сигнала сохранения трека для создания векторного представления
@receiver(post_save, sender=Track)
def process_track_vector(sender, instance, created, **kwargs):
    """
    Обработчик сигнала post_save для модели Track.
    Запускает асинхронную задачу по векторизации трека с помощью CLAP.
    
    Args:
        sender: Класс модели, отправивший сигнал
        instance: Экземпляр модели Track, который был сохранен
        created: True, если экземпляр был создан, False, если обновлен
    """
    # Импортируем здесь, чтобы избежать циклических импортов
    from .services import TrackVectorService
    
    # Проверяем, что аудиофайл существует
    if instance.audio_file:
        # Если трек новый или был обновлен аудиофайл, запускаем векторизацию
        # В реальном проекте это может быть асинхронная задача (Celery, Django RQ)
        # для избежания блокировки основного потока
        try:
            # Запускаем обработку трека
            TrackVectorService.process_track(instance.id)
        except Exception as e:
            # Логируем ошибку, но не блокируем сохранение трека
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Ошибка при векторизации трека {instance.id}: {str(e)}")

class TrackPlay(models.Model):
    """Модель для отслеживания прослушиваний треков пользователями"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='track_plays',
        help_text='Пользователь, прослушавший трек'
    )
    track = models.ForeignKey(
        Track, 
        on_delete=models.CASCADE, 
        related_name='plays',
        help_text='Прослушанный трек'
    )
    played_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Дата и время прослушивания'
    )
    play_duration = models.PositiveIntegerField(
        default=0,
        help_text='Длительность прослушивания в секундах'
    )
    completed = models.BooleanField(
        default=False,
        help_text='Был ли трек прослушан полностью'
    )
    
    class Meta:
        ordering = ['-played_at']
        verbose_name = 'Прослушивание трека'
        verbose_name_plural = 'Прослушивания треков'
        indexes = [
            models.Index(fields=['user', 'played_at']),
            models.Index(fields=['track', 'played_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.track.title} ({self.played_at.strftime('%d.%m.%Y %H:%M')})"

class Playlist(models.Model):
    """Модель для плейлистов пользователей"""
    title = models.CharField(
        max_length=200,
        help_text='Название плейлиста'
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='playlists',
        help_text='Владелец плейлиста'
    )
    tracks = models.ManyToManyField(
        Track,
        related_name='playlists',
        help_text='Треки в плейлисте'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Дата создания плейлиста'
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='Дата обновления плейлиста'
    )
    public_slug = models.SlugField(
        max_length=200,
        unique=True,
        help_text='Уникальная публичная ссылка на плейлист'
    )
    description = models.TextField(
        blank=True,
        help_text='Описание плейлиста'
    )
    is_public = models.BooleanField(
        default=True,
        help_text='Публичный ли плейлист'
    )
    cover_image = models.ImageField(
        upload_to='playlists/covers/',
        blank=True,
        null=True,
        help_text='Обложка плейлиста'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Плейлист'
        verbose_name_plural = 'Плейлисты'
        indexes = [
            models.Index(fields=['owner']),
            models.Index(fields=['public_slug']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.owner.username}"
    
    def save(self, *args, **kwargs):
        # Если public_slug не задан, генерируем его автоматически
        if not self.public_slug:
            base_slug = slugify(f"{self.title}-{self.owner.username}")
            self.public_slug = base_slug
            
            # Проверяем уникальность и добавляем число если нужно
            counter = 1
            while Playlist.objects.filter(public_slug=self.public_slug).exists():
                self.public_slug = f"{base_slug}-{counter}"
                counter += 1
                
        super().save(*args, **kwargs)
    
    @property
    def tracks_count(self):
        """Возвращает количество треков в плейлисте"""
        return self.tracks.count()
    
    @property
    def duration(self):
        """Возвращает общую длительность плейлиста"""
        from django.db.models import Sum
        result = self.tracks.aggregate(total_duration=Sum('duration'))
        return result['total_duration']

class Like(models.Model):
    """Модель для отслеживания лайков треков пользователями"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='likes',
        help_text='Пользователь, поставивший лайк'
    )
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name='likes',
        help_text='Трек, получивший лайк'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text='Дата и время лайка'
    )
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Лайк'
        verbose_name_plural = 'Лайки'
        # Один пользователь может лайкнуть трек только один раз
        unique_together = ['user', 'track']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['track']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.track.title}"

class Dislike(models.Model):
    """Модель для отслеживания дизлайков треков пользователями"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='dislikes',
        help_text='Пользователь, поставивший дизлайк'
    )
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name='dislikes',
        help_text='Трек, получивший дизлайк'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text='Дата и время дизлайка'
    )
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Дизлайк'
        verbose_name_plural = 'Дизлайки'
        # Один пользователь может дизлайкнуть трек только один раз
        unique_together = ['user', 'track']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['track']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.track.title}"

class Skip(models.Model):
    """Модель для отслеживания пропусков треков пользователями"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='skips',
        help_text='Пользователь, пропустивший трек'
    )
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name='skips',
        help_text='Пропущенный трек'
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text='Дата и время пропуска трека'
    )
    duration = models.PositiveIntegerField(
        default=0,
        help_text='Длительность прослушивания до пропуска (в секундах)'
    )
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Пропуск трека'
        verbose_name_plural = 'Пропуски треков'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['track']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['duration']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.track.title} ({self.duration} сек.)"
    
    @property
    def percentage_listened(self):
        """Возвращает процент прослушанного трека перед пропуском"""
        if not self.track.duration:
            return 0
            
        # Конвертируем duration из timedelta в секунды
        track_duration_seconds = self.track.duration.total_seconds()
        if track_duration_seconds <= 0:
            return 0
            
        percentage = (self.duration / track_duration_seconds) * 100
        # Ограничиваем до 100%
        return min(percentage, 100)

class Recommendation(models.Model):
    """Модель для хранения рекомендаций треков пользователям"""
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='recommendations',
        help_text='Пользователь, которому рекомендуется трек'
    )
    track = models.ForeignKey(
        Track,
        on_delete=models.CASCADE,
        related_name='recommendations',
        help_text='Рекомендуемый трек'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='Дата и время генерации рекомендации'
    )
    score = models.FloatField(
        default=0.0,
        help_text='Оценка/вероятность рекомендации (от 0 до 1)'
    )
    is_viewed = models.BooleanField(
        default=False,
        help_text='Просмотрел ли пользователь рекомендацию'
    )
    is_clicked = models.BooleanField(
        default=False,
        help_text='Перешел ли пользователь к рекомендуемому треку'
    )
    source = models.CharField(
        max_length=50,
        default='system',
        help_text='Источник рекомендации (система/коллаборативная фильтрация/контентная и т.д.)'
    )
    
    class Meta:
        ordering = ['-score', '-created_at']
        verbose_name = 'Рекомендация'
        verbose_name_plural = 'Рекомендации'
        # Уникальность для пары пользователь-трек (можно рекомендовать трек только один раз)
        unique_together = ['user', 'track']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['track']),
            models.Index(fields=['created_at']),
            models.Index(fields=['score']),
            models.Index(fields=['is_viewed']),
            models.Index(fields=['source']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.track.title} ({self.score:.2f})"
    
    def mark_as_viewed(self):
        """Отмечает рекомендацию как просмотренную"""
        self.is_viewed = True
        self.save(update_fields=['is_viewed'])
    
    def mark_as_clicked(self):
        """Отмечает рекомендацию как кликнутую (переход к треку)"""
        self.is_viewed = True
        self.is_clicked = True
        self.save(update_fields=['is_viewed', 'is_clicked'])
