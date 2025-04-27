from django.urls import path, include
from rest_framework.routers import DefaultRouter
from knox import views as knox_views
from .views import (
    ArtistViewSet, AlbumViewSet, TrackViewSet, UserViewSet,
    TrackPlayViewSet, PlaylistViewSet, LikeViewSet, DislikeViewSet, 
    SkipViewSet, RecommendationViewSet, RegisterView, LoginView, statistics_view,
    similar_tracks
)

# Маршруты для API
urlpatterns = [
    # Auth endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', knox_views.LogoutView.as_view(), name='logout'),
    path('auth/logoutall/', knox_views.LogoutAllView.as_view(), name='logoutall'),
    
    # Dashboard statistics
    path('statistics/', statistics_view, name='statistics'),
    path('dashboard/', statistics_view, name='dashboard'),

    # Similar tracks
    path('similar/<str:track_id>/', similar_tracks, name='similar_tracks'),
]

# Регистрация ModelViewSets
router = DefaultRouter()
router.register(r'artists', ArtistViewSet)
router.register(r'albums', AlbumViewSet)
router.register(r'tracks', TrackViewSet)
router.register(r'users', UserViewSet)
router.register(r'track-plays', TrackPlayViewSet, basename='track-play')
router.register(r'playlists', PlaylistViewSet, basename='playlist')
router.register(r'likes', LikeViewSet, basename='like')
router.register(r'dislikes', DislikeViewSet, basename='dislike')
router.register(r'skips', SkipViewSet, basename='skip')
router.register(r'recommendations', RecommendationViewSet, basename='recommendation')

urlpatterns += router.urls 