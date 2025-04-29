import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getRecommendations } from '../services/api';
import { formatDuration } from '../utils/helpers';
import useMusicPlayer from '../hooks/useMusicPlayer';

const RecommendedTracks = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = useMusicPlayer();

  useEffect(() => {
    const loadRecommendations = async () => {
      setLoading(true);
      try {
        const data = await getRecommendations();
        setTracks(data);
      } catch (error) {
        console.error('Ошибка при загрузке рекомендаций:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRecommendations();
  }, []);

  const handlePlayTrack = (track) => {
    playSong(track);
  };

  return (
    <div className="glass-panel p-6 rounded-xl">
      <h2 className="text-2xl font-semibold mb-6">Рекомендации для вас</h2>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="glass-card p-4 rounded-lg animate-pulse">
              <div className="w-full aspect-square bg-white/10 rounded-lg mb-3"></div>
              <div className="h-5 w-3/4 bg-white/10 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-white/10 rounded"></div>
            </div>
          ))}
        </div>
      ) : tracks && tracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <div 
              key={track.id} 
              className="glass-card p-4 rounded-lg hover:bg-white/5 transition-all duration-300 cursor-pointer"
              onClick={() => handlePlayTrack(track)}
            >
              <div className="relative w-full aspect-square bg-white/10 rounded-lg mb-3 overflow-hidden group">
                {track.album?.cover_image ? (
                  <img 
                    src={track.album.cover_image} 
                    alt={track.album.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="font-medium text-white truncate">{track.title}</h3>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-gray-400">{track.artist?.name}</p>
                <span className="text-xs text-gray-500">{formatDuration(track.duration)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex justify-center items-center py-10">
          <p className="text-gray-400">Для вас пока нет рекомендаций</p>
        </div>
      )}
      
      <div className="mt-6 flex justify-center">
        <Link to="/discover" className="btn-primary">Больше рекомендаций</Link>
      </div>
    </div>
  );
};

export default RecommendedTracks; 