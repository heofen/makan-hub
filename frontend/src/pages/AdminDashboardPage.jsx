import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { getTracks, getAlbums, getArtists } from '../services/api';

// Вспомогательный компонент для вкладок
const TabButton = ({ active, onClick, children }) => (
  <button
    className={`px-6 py-3 font-medium border-b-2 ${
      active
        ? 'text-music-primary border-music-primary'
        : 'text-gray-400 border-transparent hover:text-white/80'
    }`}
    onClick={onClick}
  >
    {children}
  </button>
);

// Компонент админ-карточки для разделов
const AdminCard = ({ title, count, icon, onClick }) => (
  <div
    className="glass-panel p-6 rounded-xl cursor-pointer hover:bg-white/10 transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      {icon}
    </div>
    <div className="text-3xl font-bold text-music-primary mb-2">{count}</div>
    <div className="text-sm text-white/60">Нажмите для управления</div>
  </div>
);

// Компонент таблицы для отображения данных
const AdminTable = ({ data, columns, onRowClick }) => (
  <div className="glass-panel p-4 rounded-xl overflow-x-auto">
    <table className="w-full text-white/80">
      <thead>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              className="px-4 py-3 text-left text-sm font-medium text-white border-b border-white/10"
            >
              {column.title}
            </th>
          ))}
          <th className="px-4 py-3 text-right border-b border-white/10">Действия</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr 
            key={item.id} 
            className="hover:bg-white/5 transition-colors cursor-pointer"
            onClick={() => onRowClick(item)}
          >
            {columns.map((column) => (
              <td 
                key={`${item.id}-${column.key}`} 
                className="px-4 py-3 text-sm border-b border-white/5"
              >
                {column.render ? column.render(item) : item[column.key]}
              </td>
            ))}
            <td className="px-4 py-3 text-right border-b border-white/5">
              <button 
                className="px-3 py-1 text-xs rounded bg-music-primary/20 text-music-primary mr-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onRowClick(item);
                }}
              >
                Изменить
              </button>
              <button 
                className="px-3 py-1 text-xs rounded bg-red-500/20 text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Вы уверены, что хотите удалить этот элемент?')) {
                    // Удаление элемента (будет реализовано в будущем)
                  }
                }}
              >
                Удалить
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AdminDashboardPage = () => {
  const { user, isAuth } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tracks, setTracks] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Проверка прав доступа к админ-панели
  useEffect(() => {
    if (isAuth === false) {
      navigate('/login');
    } else if (user && !user.is_staff && !user.is_superuser && user.role !== 'admin') {
      navigate('/');
    }
  }, [isAuth, user, navigate]);

  // Загрузка данных для дашборда
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        // Загрузка треков
        const tracksResponse = await getTracks({ limit: 10 });
        if (tracksResponse.success) {
          setTracks(tracksResponse.data);
        }

        // Загрузка альбомов
        const albumsResponse = await getAlbums({ limit: 10 });
        if (albumsResponse.success) {
          setAlbums(albumsResponse.data);
        }

        // Загрузка артистов
        const artistsResponse = await getArtists({ limit: 10 });
        if (artistsResponse.success) {
          setArtists(artistsResponse.data);
        }

        // Пользователей не загружаем, для этого нужен отдельный API-метод с правами админа
      } catch (error) {
        console.error('Ошибка при загрузке данных для админ-панели:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && (user.is_staff || user.is_superuser || user.role === 'admin')) {
      loadDashboardData();
    }
  }, [user]);

  // Определение колонок для разных типов данных
  const trackColumns = [
    { key: 'title', title: 'Название' },
    { 
      key: 'artist', 
      title: 'Исполнитель', 
      render: (item) => item.artist?.name || 'Неизвестный исполнитель' 
    },
    { 
      key: 'album', 
      title: 'Альбом', 
      render: (item) => item.album?.title || 'Сингл' 
    },
    { 
      key: 'duration', 
      title: 'Длительность', 
      render: (item) => {
        const minutes = Math.floor(item.duration / 60);
        const seconds = item.duration % 60;
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
      } 
    },
  ];

  const albumColumns = [
    { key: 'title', title: 'Название' },
    { 
      key: 'artist', 
      title: 'Исполнитель', 
      render: (item) => item.artist?.name || 'Неизвестный исполнитель' 
    },
    { key: 'release_year', title: 'Год выпуска' },
    { key: 'genre', title: 'Жанр' },
  ];

  const artistColumns = [
    { key: 'name', title: 'Имя' },
    { key: 'genres', title: 'Жанры' },
    { 
      key: 'is_verified', 
      title: 'Верификация', 
      render: (item) => item.is_verified ? 'Верифицирован' : 'Не верифицирован' 
    },
  ];

  // Обработчики для разных действий
  const handleRowClick = (item) => {
    // В зависимости от активной вкладки перенаправляем на разные страницы
    if (activeTab === 'tracks') {
      navigate(`/tracks/${item.id}/edit`);
    } else if (activeTab === 'albums') {
      navigate(`/albums/${item.id}/edit`);
    } else if (activeTab === 'artists') {
      navigate(`/artists/${item.id}/edit`);
    } else if (activeTab === 'users') {
      navigate(`/users/${item.id}/edit`);
    }
  };

  // Отрисовка содержимого в зависимости от активной вкладки
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="spinner-lg"></div>
        </div>
      );
    }

    if (activeTab === 'dashboard') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AdminCard
            title="Пользователи"
            count="..."
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            onClick={() => setActiveTab('users')}
          />
          <AdminCard
            title="Треки"
            count={tracks.length}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
            }
            onClick={() => setActiveTab('tracks')}
          />
          <AdminCard
            title="Альбомы"
            count={albums.length}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
            onClick={() => setActiveTab('albums')}
          />
          <AdminCard
            title="Исполнители"
            count={artists.length}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            }
            onClick={() => setActiveTab('artists')}
          />
        </div>
      );
    }

    if (activeTab === 'tracks') {
      return (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Управление треками</h2>
            <Link to="/upload-track" className="btn-primary py-2 px-4">Добавить трек</Link>
          </div>
          {tracks.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center">
              <p className="text-white/60">Нет доступных треков</p>
            </div>
          ) : (
            <AdminTable 
              data={tracks} 
              columns={trackColumns} 
              onRowClick={handleRowClick} 
            />
          )}
        </>
      );
    }

    if (activeTab === 'albums') {
      return (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Управление альбомами</h2>
            <Link to="/create-album" className="btn-primary py-2 px-4">Добавить альбом</Link>
          </div>
          {albums.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center">
              <p className="text-white/60">Нет доступных альбомов</p>
            </div>
          ) : (
            <AdminTable 
              data={albums} 
              columns={albumColumns} 
              onRowClick={handleRowClick} 
            />
          )}
        </>
      );
    }

    if (activeTab === 'artists') {
      return (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Управление исполнителями</h2>
            <Link to="/create-artist" className="btn-primary py-2 px-4">Добавить исполнителя</Link>
          </div>
          {artists.length === 0 ? (
            <div className="glass-panel p-8 rounded-xl text-center">
              <p className="text-white/60">Нет доступных исполнителей</p>
            </div>
          ) : (
            <AdminTable 
              data={artists} 
              columns={artistColumns} 
              onRowClick={handleRowClick} 
            />
          )}
        </>
      );
    }

    if (activeTab === 'users') {
      return (
        <div className="glass-panel p-8 rounded-xl text-center">
          <p className="text-white/60">Управление пользователями будет добавлено позднее</p>
        </div>
      );
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto pb-10">
        <h1 className="text-3xl font-bold text-white mb-8">Панель администратора</h1>

        <div className="glass-panel p-6 rounded-xl mb-8">
          <div className="flex overflow-x-auto space-x-4 mb-6">
            <TabButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
            >
              Дашборд
            </TabButton>
            <TabButton
              active={activeTab === 'users'}
              onClick={() => setActiveTab('users')}
            >
              Пользователи
            </TabButton>
            <TabButton
              active={activeTab === 'tracks'}
              onClick={() => setActiveTab('tracks')}
            >
              Треки
            </TabButton>
            <TabButton
              active={activeTab === 'albums'}
              onClick={() => setActiveTab('albums')}
            >
              Альбомы
            </TabButton>
            <TabButton
              active={activeTab === 'artists'}
              onClick={() => setActiveTab('artists')}
            >
              Исполнители
            </TabButton>
          </div>

          {renderContent()}
        </div>
      </div>
    </MainLayout>
  );
};

export default AdminDashboardPage; 