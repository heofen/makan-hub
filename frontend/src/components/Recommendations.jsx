import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDuration, truncateText } from '../utils/helpers';
import { FaPlay, FaChevronRight } from 'react-icons/fa';
import useMusicPlayer from '../hooks/useMusicPlayer';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { playSong } = useMusicPlayer();

  const AlbumCover = ({ imageUrl, altText }) => (
    <div className="relative w-14 h-14 min-w-14 rounded-md overflow-hidden group-hover:shadow-glow transition duration-300">
      {imageUrl ? (
        <img src={imageUrl} alt={altText} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
          <span className="text-xs text-neutral-400">Нет обложки</span>
        </div>
      )}
    </div>
  );

  const Track = ({ track }) => (
    <div 
      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition duration-300 cursor-pointer"
      onClick={() => playSong(track)}
    >
      <div className="relative">
        <AlbumCover 
          imageUrl={track.album?.cover_url} 
          altText={`${track.album?.title || 'Альбом'}`} 
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <FaPlay className="text-white text-sm" />
        </div>
      </div>
      
      <div className="flex-grow min-w-0">
        <p className="text-white font-medium text-sm">{truncateText(track.title, 28)}</p>
        <p className="text-neutral-400 text-xs">{truncateText(track.artist?.name, 25)}</p>
      </div>
      
      <div className="text-neutral-400 text-xs whitespace-nowrap pl-2">
        {formatDuration(track.duration)}
      </div>
    </div>
  );

  useEffect(() => {
    // Имитация загрузки рекомендаций
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        // Здесь будет реальный запрос к API
        setTimeout(() => {
          setRecommendations([
            {
              id: 1,
              title: 'Песня о любви',
              duration: 183,
              artist: { name: 'Артист 1', id: 1 },
              album: { title: 'Альбом 1', id: 1, cover_url: 'https://via.placeholder.com/300' }
            },
            {
              id: 2,
              title: 'Летний хит с очень длинным названием',
              duration: 247,
              artist: { name: 'Группа с длинным названием', id: 2 },
              album: { title: 'Альбом 2', id: 2, cover_url: 'https://via.placeholder.com/300' }
            },
            {
              id: 3,
              title: 'Крутой бит',
              duration: 195,
              artist: { name: 'DJ Смит', id: 3 },
              album: { title: 'Альбом 3', id: 3, cover_url: 'https://via.placeholder.com/300' }
            },
            {
              id: 4,
              title: 'Медленная мелодия',
              duration: 285,
              artist: { name: 'Певица Голос', id: 4 },
              album: { title: 'Альбом 4', id: 4, cover_url: 'https://via.placeholder.com/300' }
            },
            {
              id: 5,
              title: 'Вечеринка',
              duration: 221,
              artist: { name: 'Веселые ребята', id: 5 },
              album: { title: 'Альбом 5', id: 5 }
            }
          ]);
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Ошибка при загрузке рекомендаций', error);
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const handleSeeAllClick = () => {
    navigate('/recommendations');
  };

  return (
    <div className="p-4 backdrop-blur-sm bg-black/30 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">Слушайте сегодня</h2>
        <button 
          onClick={handleSeeAllClick}
          className="flex items-center text-sm text-neutral-400 hover:text-white transition duration-300"
        >
          Все рекомендации <FaChevronRight className="ml-1 text-xs" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-3 p-2 animate-pulse">
              <div className="w-14 h-14 rounded-md bg-neutral-800"></div>
              <div className="flex-grow">
                <div className="h-4 bg-neutral-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-neutral-800 rounded w-1/2"></div>
              </div>
              <div className="w-8 h-3 bg-neutral-800 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1">
          {recommendations.map((track) => (
            <Track key={track.id} track={track} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Recommendations; 
