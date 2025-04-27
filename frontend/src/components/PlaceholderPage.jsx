import React from 'react';

const PlaceholderPage = ({ title, message }) => {
  return (
    <div className="placeholder-page">
      <div className="flex flex-col items-center space-y-4">
        <svg 
          className="w-20 h-20 text-music-primary opacity-60" 
          fill="currentColor" 
          viewBox="0 0 20 20" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" 
            clipRule="evenodd" 
          />
        </svg>
        
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-music-primary to-music-secondary bg-clip-text text-transparent">
          {title || 'Страница в разработке'}
        </h2>
        
        <p className="placeholder-text max-w-lg">
          {message || 'Эта страница находится в активной разработке и скоро будет доступна. Спасибо за ваше терпение!'}
        </p>
        
        <div className="mt-6 relative">
          <div className="h-1 w-48 bg-gray-700 rounded overflow-hidden">
            <div className="animate-pulse h-full w-1/2 bg-gradient-to-r from-music-primary to-music-secondary"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceholderPage; 