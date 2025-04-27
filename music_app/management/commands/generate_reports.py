import os
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from django.core.management.base import BaseCommand
from django.db.models import Count, F, Sum, Avg, Q
from django.utils import timezone
from django.conf import settings
from music_app.models import Track, Album, Artist, TrackPlay, Like, Dislike, Playlist, User

class Command(BaseCommand):
    help = 'Генерирует отчеты по аналитике системы с использованием pandas'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Количество дней для анализа'
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default='reports',
            help='Директория для сохранения отчетов'
        )
        parser.add_argument(
            '--format',
            type=str,
            default='csv',
            choices=['csv', 'excel', 'json', 'html', 'all'],
            help='Формат выходных файлов'
        )
        parser.add_argument(
            '--no-plots',
            action='store_true',
            help='Не генерировать графики'
        )

    def handle(self, *args, **options):
        # Получаем параметры
        days = options['days']
        output_dir = options['output_dir']
        file_format = options['format']
        generate_plots = not options['no_plots']
        
        # Устанавливаем стиль для графиков
        if generate_plots:
            plt.style.use('ggplot')
            sns.set_palette("Set2")
            
        # Создаем директорию для отчетов, если она не существует
        report_path = os.path.join(settings.BASE_DIR, output_dir)
        if not os.path.exists(report_path):
            os.makedirs(report_path)
            
        # Получаем период для анализа
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        self.stdout.write(f"Генерация отчетов за период: {start_date.date()} - {end_date.date()}")
        
        # Генерируем все отчеты
        self.generate_user_activity_report(start_date, end_date, report_path, file_format, generate_plots)
        self.generate_track_plays_report(start_date, end_date, report_path, file_format, generate_plots)
        self.generate_like_dislike_report(start_date, end_date, report_path, file_format, generate_plots)
        self.generate_artist_popularity_report(start_date, end_date, report_path, file_format, generate_plots)
        self.generate_playlist_report(start_date, end_date, report_path, file_format, generate_plots)
        
        self.stdout.write(self.style.SUCCESS(f'Отчеты успешно сгенерированы в директории {report_path}'))
        
    def generate_user_activity_report(self, start_date, end_date, report_path, file_format, generate_plots):
        """Генерирует отчет об активности пользователей"""
        self.stdout.write("Генерация отчета по активности пользователей...")
        
        # Получаем данные о действиях пользователей
        users = User.objects.filter(is_active=True).order_by('date_joined')
        
        # Создаем DataFrame для отчета по пользователям
        users_data = []
        for user in users:
            track_plays_count = TrackPlay.objects.filter(user=user, played_at__range=(start_date, end_date)).count()
            likes_count = Like.objects.filter(user=user, timestamp__range=(start_date, end_date)).count()
            dislikes_count = Dislike.objects.filter(user=user, timestamp__range=(start_date, end_date)).count()
            playlists_count = Playlist.objects.filter(owner=user, created_at__range=(start_date, end_date)).count()
            
            users_data.append({
                'user_id': user.id,
                'username': user.username,
                'registration_date': user.date_joined,
                'is_admin': user.is_admin,
                'track_plays': track_plays_count,
                'likes': likes_count,
                'dislikes': dislikes_count,
                'playlists': playlists_count,
                'total_activity': track_plays_count + likes_count + dislikes_count + playlists_count
            })
        
        # Создаем DataFrame
        df_users = pd.DataFrame(users_data)
        
        # Сохраняем отчет в указанном формате
        self._save_report(df_users, 'user_activity', report_path, file_format)
        
        # Создаем графики
        if generate_plots and not df_users.empty:
            # График активности пользователей
            plt.figure(figsize=(12, 6))
            
            # Топ-10 самых активных пользователей
            top_users = df_users.sort_values('total_activity', ascending=False).head(10)
            
            # Создаем стековый бар-чарт
            ax = top_users.plot(
                x='username', 
                y=['track_plays', 'likes', 'dislikes', 'playlists'], 
                kind='bar', 
                stacked=True, 
                figsize=(12, 6)
            )
            
            plt.title('Топ-10 активных пользователей')
            plt.xlabel('Пользователь')
            plt.ylabel('Количество действий')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'user_activity_top10.png'))
            plt.close()
            
            # График регистраций пользователей по дням
            df_users['date'] = df_users['registration_date'].dt.date
            registrations = df_users.groupby('date').size().reset_index(name='count')
            
            plt.figure(figsize=(12, 6))
            plt.plot(registrations['date'], registrations['count'], marker='o')
            plt.title('Динамика регистраций пользователей')
            plt.xlabel('Дата')
            plt.ylabel('Количество регистраций')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'user_registrations.png'))
            plt.close()
            
    def generate_track_plays_report(self, start_date, end_date, report_path, file_format, generate_plots):
        """Генерирует отчет о прослушиваниях треков"""
        self.stdout.write("Генерация отчета по прослушиваниям треков...")
        
        # Получаем данные о прослушиваниях
        track_plays = TrackPlay.objects.filter(played_at__range=(start_date, end_date))
        
        # Если нет данных о прослушиваниях, возвращаемся
        if not track_plays.exists():
            self.stdout.write(self.style.WARNING("Нет данных о прослушиваниях за указанный период"))
            return
        
        # Создаем DataFrame для отчета по прослушиваниям
        plays_data = []
        for play in track_plays:
            plays_data.append({
                'track_id': play.track.id,
                'track_title': play.track.title,
                'artist': play.track.artist.name if play.track.artist else 'Неизвестный',
                'album': play.track.album.title if play.track.album else 'Неизвестный',
                'played_at': play.played_at,
                'play_duration': play.play_duration,
                'completed': play.completed,
                'user_id': play.user.id,
                'username': play.user.username
            })
        
        # Создаем DataFrame
        df_plays = pd.DataFrame(plays_data)
        
        # Сохраняем полный отчет в указанном формате
        self._save_report(df_plays, 'track_plays_full', report_path, file_format)
        
        # Агрегированные данные по трекам
        track_stats = df_plays.groupby(['track_id', 'track_title', 'artist']).agg({
            'played_at': 'count',
            'play_duration': 'mean',
            'completed': 'sum'
        }).reset_index()
        
        track_stats.rename(columns={
            'played_at': 'play_count',
            'play_duration': 'avg_duration',
            'completed': 'completed_count'
        }, inplace=True)
        
        # Вычисляем процент завершенных прослушиваний
        track_stats['completion_rate'] = (track_stats['completed_count'] / track_stats['play_count'] * 100).round(2)
        
        # Сортируем по количеству прослушиваний
        track_stats = track_stats.sort_values('play_count', ascending=False)
        
        # Сохраняем агрегированный отчет
        self._save_report(track_stats, 'track_plays_summary', report_path, file_format)
        
        # Создаем графики
        if generate_plots:
            # График топ-10 популярных треков
            top_tracks = track_stats.head(10)
            
            plt.figure(figsize=(12, 6))
            sns.barplot(x='play_count', y='track_title', data=top_tracks)
            plt.title('Топ-10 популярных треков')
            plt.xlabel('Количество прослушиваний')
            plt.ylabel('Название трека')
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'top_tracks.png'))
            plt.close()
            
            # График прослушиваний по дням
            df_plays['date'] = df_plays['played_at'].dt.date
            plays_by_day = df_plays.groupby('date').size().reset_index(name='count')
            
            plt.figure(figsize=(12, 6))
            plt.plot(plays_by_day['date'], plays_by_day['count'], marker='o')
            plt.title('Динамика прослушиваний треков')
            plt.xlabel('Дата')
            plt.ylabel('Количество прослушиваний')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'plays_by_day.png'))
            plt.close()
            
            # График процента завершенных прослушиваний для топ-10 треков
            plt.figure(figsize=(12, 6))
            sns.barplot(x='completion_rate', y='track_title', data=top_tracks)
            plt.title('Процент завершенных прослушиваний для топ-10 треков')
            plt.xlabel('Процент завершенных прослушиваний')
            plt.ylabel('Название трека')
            plt.xlim(0, 100)
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'completion_rate.png'))
            plt.close()
    
    def generate_like_dislike_report(self, start_date, end_date, report_path, file_format, generate_plots):
        """Генерирует отчет о лайках и дизлайках"""
        self.stdout.write("Генерация отчета по лайкам и дизлайкам...")
        
        # Получаем данные о лайках
        likes = Like.objects.filter(timestamp__range=(start_date, end_date))
        dislikes = Dislike.objects.filter(timestamp__range=(start_date, end_date))
        
        # Если нет данных о лайках и дизлайках, возвращаемся
        if not likes.exists() and not dislikes.exists():
            self.stdout.write(self.style.WARNING("Нет данных о лайках и дизлайках за указанный период"))
            return
        
        # Получаем все треки с их лайками и дизлайками
        tracks = Track.objects.all()
        
        # Создаем DataFrame для отчета по лайкам и дизлайкам
        tracks_data = []
        for track in tracks:
            # Получаем количество лайков и дизлайков за указанный период
            likes_count = likes.filter(track=track).count()
            dislikes_count = dislikes.filter(track=track).count()
            
            # Если у трека нет лайков и дизлайков за период, пропускаем его
            if likes_count == 0 and dislikes_count == 0:
                continue
                
            tracks_data.append({
                'track_id': track.id,
                'track_title': track.title,
                'artist': track.artist.name if track.artist else 'Неизвестный',
                'album': track.album.title if track.album else 'Неизвестный',
                'likes': likes_count,
                'dislikes': dislikes_count,
                'total_reactions': likes_count + dislikes_count,
                'like_ratio': (likes_count / (likes_count + dislikes_count) * 100).round(2) if (likes_count + dislikes_count) > 0 else 0
            })
        
        # Создаем DataFrame
        df_tracks = pd.DataFrame(tracks_data)
        
        # Сортируем по общему количеству реакций
        df_tracks = df_tracks.sort_values('total_reactions', ascending=False)
        
        # Сохраняем отчет
        self._save_report(df_tracks, 'likes_dislikes', report_path, file_format)
        
        # Создаем графики
        if generate_plots and not df_tracks.empty:
            # График топ-10 треков по количеству реакций
            top_tracks = df_tracks.head(10)
            
            plt.figure(figsize=(12, 6))
            
            # Создаем стековый бар-чарт
            ax = top_tracks.plot(
                x='track_title', 
                y=['likes', 'dislikes'], 
                kind='bar', 
                stacked=True, 
                figsize=(12, 6),
                color=['green', 'red']
            )
            
            plt.title('Топ-10 треков по количеству реакций')
            plt.xlabel('Название трека')
            plt.ylabel('Количество реакций')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'top_tracks_reactions.png'))
            plt.close()
            
            # График соотношения лайков к дизлайкам для топ-10 треков
            plt.figure(figsize=(12, 6))
            sns.barplot(x='like_ratio', y='track_title', data=top_tracks)
            plt.title('Процент лайков для топ-10 треков')
            plt.xlabel('Процент лайков')
            plt.ylabel('Название трека')
            plt.xlim(0, 100)
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'like_ratio.png'))
            plt.close()
    
    def generate_artist_popularity_report(self, start_date, end_date, report_path, file_format, generate_plots):
        """Генерирует отчет о популярности исполнителей"""
        self.stdout.write("Генерация отчета по популярности исполнителей...")
        
        # Получаем данные о прослушиваниях
        track_plays = TrackPlay.objects.filter(played_at__range=(start_date, end_date))
        
        # Если нет данных о прослушиваниях, возвращаемся
        if not track_plays.exists():
            self.stdout.write(self.style.WARNING("Нет данных о прослушиваниях за указанный период"))
            return
        
        # Получаем всех исполнителей
        artists = Artist.objects.all()
        
        # Создаем DataFrame для отчета по исполнителям
        artists_data = []
        for artist in artists:
            # Получаем все треки исполнителя
            artist_tracks = Track.objects.filter(artist=artist)
            
            # Если у исполнителя нет треков, пропускаем его
            if not artist_tracks.exists():
                continue
                
            # Получаем количество прослушиваний треков исполнителя за период
            plays_count = track_plays.filter(track__in=artist_tracks).count()
            
            # Получаем количество лайков и дизлайков треков исполнителя за период
            likes_count = Like.objects.filter(
                track__in=artist_tracks,
                timestamp__range=(start_date, end_date)
            ).count()
            
            dislikes_count = Dislike.objects.filter(
                track__in=artist_tracks,
                timestamp__range=(start_date, end_date)
            ).count()
            
            # Если у исполнителя нет прослушиваний, лайков и дизлайков за период, пропускаем его
            if plays_count == 0 and likes_count == 0 and dislikes_count == 0:
                continue
                
            artists_data.append({
                'artist_id': artist.id,
                'artist_name': artist.name,
                'country': artist.country,
                'is_verified': artist.is_verified,
                'tracks_count': artist_tracks.count(),
                'plays_count': plays_count,
                'likes_count': likes_count,
                'dislikes_count': dislikes_count,
                'like_ratio': (likes_count / (likes_count + dislikes_count) * 100).round(2) if (likes_count + dislikes_count) > 0 else 0,
                'popularity_score': plays_count + likes_count * 2 - dislikes_count  # Формула для оценки популярности
            })
        
        # Создаем DataFrame
        df_artists = pd.DataFrame(artists_data)
        
        # Сортируем по показателю популярности
        df_artists = df_artists.sort_values('popularity_score', ascending=False)
        
        # Сохраняем отчет
        self._save_report(df_artists, 'artist_popularity', report_path, file_format)
        
        # Создаем графики
        if generate_plots and not df_artists.empty:
            # График топ-10 исполнителей по популярности
            top_artists = df_artists.head(10)
            
            plt.figure(figsize=(12, 6))
            sns.barplot(x='popularity_score', y='artist_name', data=top_artists)
            plt.title('Топ-10 исполнителей по популярности')
            plt.xlabel('Показатель популярности')
            plt.ylabel('Исполнитель')
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'top_artists_popularity.png'))
            plt.close()
            
            # График соотношения лайков и дизлайков для топ-10 исполнителей
            plt.figure(figsize=(12, 6))
            
            # Создаем стековый бар-чарт
            ax = top_artists.plot(
                x='artist_name', 
                y=['likes_count', 'dislikes_count'], 
                kind='bar', 
                stacked=True, 
                figsize=(12, 6),
                color=['green', 'red']
            )
            
            plt.title('Соотношение лайков и дизлайков для топ-10 исполнителей')
            plt.xlabel('Исполнитель')
            plt.ylabel('Количество')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'top_artists_likes_dislikes.png'))
            plt.close()
    
    def generate_playlist_report(self, start_date, end_date, report_path, file_format, generate_plots):
        """Генерирует отчет о плейлистах"""
        self.stdout.write("Генерация отчета по плейлистам...")
        
        # Получаем данные о плейлистах
        playlists = Playlist.objects.filter(created_at__range=(start_date, end_date))
        
        # Если нет данных о плейлистах, возвращаемся
        if not playlists.exists():
            self.stdout.write(self.style.WARNING("Нет данных о плейлистах за указанный период"))
            return
        
        # Создаем DataFrame для отчета по плейлистам
        playlists_data = []
        for playlist in playlists:
            playlists_data.append({
                'playlist_id': playlist.id,
                'title': playlist.title,
                'owner': playlist.owner.username,
                'is_public': playlist.is_public,
                'tracks_count': playlist.tracks.count(),
                'created_at': playlist.created_at,
                'updated_at': playlist.updated_at
            })
        
        # Создаем DataFrame
        df_playlists = pd.DataFrame(playlists_data)
        
        # Сохраняем отчет
        self._save_report(df_playlists, 'playlists', report_path, file_format)
        
        # Создаем графики
        if generate_plots and not df_playlists.empty:
            # График распределения плейлистов по количеству треков
            plt.figure(figsize=(12, 6))
            sns.histplot(df_playlists['tracks_count'], bins=20, kde=True)
            plt.title('Распределение плейлистов по количеству треков')
            plt.xlabel('Количество треков в плейлисте')
            plt.ylabel('Количество плейлистов')
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'playlists_tracks_distribution.png'))
            plt.close()
            
            # График создания плейлистов по дням
            df_playlists['date'] = df_playlists['created_at'].dt.date
            playlists_by_day = df_playlists.groupby('date').size().reset_index(name='count')
            
            plt.figure(figsize=(12, 6))
            plt.plot(playlists_by_day['date'], playlists_by_day['count'], marker='o')
            plt.title('Динамика создания плейлистов')
            plt.xlabel('Дата')
            plt.ylabel('Количество созданных плейлистов')
            plt.xticks(rotation=45)
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'playlists_by_day.png'))
            plt.close()
            
            # Диаграмма приватных и публичных плейлистов
            public_count = df_playlists['is_public'].sum()
            private_count = len(df_playlists) - public_count
            
            plt.figure(figsize=(8, 8))
            plt.pie(
                [public_count, private_count],
                labels=['Публичные', 'Приватные'],
                autopct='%1.1f%%',
                startangle=90,
                colors=['#ff9999','#66b3ff']
            )
            plt.title('Соотношение публичных и приватных плейлистов')
            plt.axis('equal')
            plt.tight_layout()
            
            # Сохраняем график
            plt.savefig(os.path.join(report_path, 'playlists_public_private.png'))
            plt.close()
            
    def _save_report(self, df, name, report_path, file_format):
        """Сохраняет отчет в указанном формате"""
        timestamp = datetime.now().strftime('%Y%m%d')
        
        if file_format == 'csv' or file_format == 'all':
            df.to_csv(os.path.join(report_path, f'{name}_{timestamp}.csv'), index=False, encoding='utf-8')
            
        if file_format == 'excel' or file_format == 'all':
            df.to_excel(os.path.join(report_path, f'{name}_{timestamp}.xlsx'), index=False)
            
        if file_format == 'json' or file_format == 'all':
            df.to_json(os.path.join(report_path, f'{name}_{timestamp}.json'), orient='records')
            
        if file_format == 'html' or file_format == 'all':
            df.to_html(os.path.join(report_path, f'{name}_{timestamp}.html'), index=False) 