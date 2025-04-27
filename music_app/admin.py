from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import Artist, Album, Track, User, Playlist, Like, Dislike, Skip, Recommendation
from django.db.models import Max

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('email', 'username', 'role', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('role', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('email', 'username')
    ordering = ('email',)
    
    fieldsets = (
        (None, {'fields': ('email', 'username', 'password')}),
        (_('Personal info'), {'fields': ('first_name', 'last_name', 'bio', 'avatar', 'date_of_birth')}),
        (_('Permissions'), {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        (_('Important dates'), {'fields': ('last_login', 'date_joined', 'created_at', 'updated_at')}),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2'),
        }),
    )

@admin.register(Artist)
class ArtistAdmin(admin.ModelAdmin):
    list_display = ('name', 'country', 'genres', 'is_verified', 'albums_count', 'tracks_count', 'created_at', 'updated_at')
    list_filter = ('is_verified', 'country', 'created_at')
    search_fields = ('name', 'bio', 'genres')
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ('created_at', 'updated_at', 'albums_count', 'tracks_count')
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'slug', 'bio', 'image')
        }),
        ('Дополнительная информация', {
            'fields': ('genres', 'country', 'website', 'is_verified')
        }),
        ('Статистика', {
            'fields': ('albums_count', 'tracks_count')
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def albums_count(self, obj):
        return obj.albums.count()
    albums_count.short_description = 'Количество альбомов'
    
    def tracks_count(self, obj):
        return obj.tracks.count()
    tracks_count.short_description = 'Количество треков'

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'release_year', 'genre', 'tracks_count', 'created_at', 'updated_at')
    list_filter = ('artist', 'release_year', 'genre')
    search_fields = ('title', 'artist__name', 'description', 'genre')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at', 'tracks_count')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'artist', 'release_year', 'cover_image')
        }),
        ('Дополнительная информация', {
            'fields': ('description', 'genre', 'release_date')
        }),
        ('Статистика', {
            'fields': ('tracks_count',)
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def tracks_count(self, obj):
        return obj.tracks.count()
    tracks_count.short_description = 'Количество треков'

@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ('title', 'artist', 'album', 'track_number', 'genre', 'duration', 'is_featured', 'is_explicit')
    list_filter = ('artist', 'album', 'genre', 'is_featured', 'is_explicit')
    search_fields = ('title', 'artist__name', 'album__title', 'lyrics')
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'slug', 'artist', 'album', 'track_number')
        }),
        ('Медиа', {
            'fields': ('audio_file', 'cover_image', 'duration')
        }),
        ('Дополнительная информация', {
            'fields': ('genre', 'lyrics', 'is_featured', 'is_explicit')
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def get_form(self, request, obj=None, change=False, **kwargs):
        form = super().get_form(request, obj, change, **kwargs)
        # Если это новый трек, попытаемся предустановить номер трека
        if not obj and 'album' in form.base_fields and form.base_fields['album'].initial:
            album_id = form.base_fields['album'].initial
            try:
                # Находим максимальный номер трека в данном альбоме и увеличиваем на 1
                max_track = Track.objects.filter(album_id=album_id).aggregate(Max('track_number'))
                if max_track['track_number__max'] is not None:
                    form.base_fields['track_number'].initial = max_track['track_number__max'] + 1
            except:
                pass
        return form

@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'tracks_count', 'is_public', 'public_slug', 'created_at')
    list_filter = ('is_public', 'created_at')
    search_fields = ('title', 'description', 'owner__username')
    readonly_fields = ('created_at', 'updated_at', 'tracks_count', 'duration')
    prepopulated_fields = {'public_slug': ('title',)}
    filter_horizontal = ('tracks',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('title', 'owner', 'public_slug', 'description', 'is_public')
        }),
        ('Треки', {
            'fields': ('tracks', 'tracks_count', 'duration')
        }),
        ('Оформление', {
            'fields': ('cover_image',)
        }),
        ('Метаданные', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def tracks_count(self, obj):
        return obj.tracks.count()
    tracks_count.short_description = 'Количество треков'

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'track', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('user__username', 'track__title')
    readonly_fields = ('timestamp',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'track')
        }),
        ('Метаданные', {
            'fields': ('timestamp',)
        }),
    )

@admin.register(Dislike)
class DislikeAdmin(admin.ModelAdmin):
    list_display = ('user', 'track', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('user__username', 'track__title')
    readonly_fields = ('timestamp',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'track')
        }),
        ('Метаданные', {
            'fields': ('timestamp',)
        }),
    )

@admin.register(Skip)
class SkipAdmin(admin.ModelAdmin):
    list_display = ('user', 'track', 'duration', 'percentage_listened_display', 'timestamp')
    list_filter = ('timestamp',)
    search_fields = ('user__username', 'track__title')
    readonly_fields = ('timestamp', 'percentage_listened_display')
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'track', 'duration')
        }),
        ('Статистика', {
            'fields': ('percentage_listened_display',)
        }),
        ('Метаданные', {
            'fields': ('timestamp',)
        }),
    )
    
    def percentage_listened_display(self, obj):
        """Форматирует процент прослушивания для отображения"""
        return f"{obj.percentage_listened:.1f}%"
    percentage_listened_display.short_description = 'Процент прослушивания'

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('user', 'track', 'score', 'source', 'is_viewed', 'is_clicked', 'created_at')
    list_filter = ('is_viewed', 'is_clicked', 'source', 'created_at')
    search_fields = ('user__username', 'track__title')
    readonly_fields = ('created_at',)
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('user', 'track', 'score', 'source')
        }),
        ('Статистика взаимодействия', {
            'fields': ('is_viewed', 'is_clicked')
        }),
        ('Метаданные', {
            'fields': ('created_at',)
        }),
    )
    
    # Добавляем действия для работы с рекомендациями в админке
    actions = ['mark_as_viewed', 'mark_as_clicked']
    
    def mark_as_viewed(self, request, queryset):
        """Отмечает выбранные рекомендации как просмотренные"""
        updated = queryset.update(is_viewed=True)
        self.message_user(request, f'Отмечено {updated} рекомендаций как просмотренные')
    mark_as_viewed.short_description = 'Отметить как просмотренные'
    
    def mark_as_clicked(self, request, queryset):
        """Отмечает выбранные рекомендации как кликнутые"""
        updated = queryset.update(is_viewed=True, is_clicked=True)
        self.message_user(request, f'Отмечено {updated} рекомендаций как кликнутые')
    mark_as_clicked.short_description = 'Отметить как кликнутые'
