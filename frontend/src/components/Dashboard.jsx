import React, { useEffect, useState } from 'react';
import { getStats } from '../services/api';
import { formatNumber } from '../utils/helpers';

// Иконки для метрик
const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const MusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
);

const AlbumIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const PlaylistIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9H5m14 6H5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h18v14H3z" />
  </svg>
);

const LikeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const NewMusicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Компонент карточки метрики
const MetricCard = ({ title, value, icon }) => (
  <div className="glass-card p-5 rounded-xl bg-white/5 shadow-md border border-white/10 hover:border-white/20 transition-all">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-300/90 font-medium">{title}</p>
        <h3 className="text-2xl font-semibold mt-1 text-white">{typeof value === 'number' ? formatNumber(value) : value}</h3>
      </div>
      <div className="p-3 rounded-full bg-white/10">
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    tracks_count: 0,
    albums_count: 0,
    playlists_count: 0,
    likes_count: 0,
    dislikes_count: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-xl">
        <h2 className="text-2xl font-semibold mb-6">Загрузка статистики...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="glass-card p-5 rounded-xl animate-pulse bg-white/5 border border-white/10">
              <div className="flex justify-between">
                <div className="w-36 h-4 bg-white/10 rounded mb-2"></div>
                <div className="w-10 h-10 rounded-full bg-white/10"></div>
              </div>
              <div className="w-24 h-8 bg-white/10 rounded mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6">Статистика MakanHub</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard 
          title="Треков в библиотеке" 
          value={stats.tracks_count} 
          icon={<MusicIcon />} 
        />
        <MetricCard 
          title="Альбомов" 
          value={stats.albums_count} 
          icon={<AlbumIcon />} 
        />
        <MetricCard 
          title="Плейлистов" 
          value={stats.playlists_count} 
          icon={<PlaylistIcon />} 
        />
        <MetricCard 
          title="Лайков" 
          value={stats.likes_count} 
          icon={<LikeIcon />} 
        />
        <MetricCard 
          title="Прослушано треков" 
          value={stats.tracks_count * 3} // Просто для примера
          icon={<ChartIcon />} 
        />
        <MetricCard 
          title="Новинки этой недели" 
          value={Math.floor(stats.tracks_count / 10)} // Просто для примера 
          icon={<NewMusicIcon />} 
        />
      </div>
    </div>
  );
};

export default Dashboard; 