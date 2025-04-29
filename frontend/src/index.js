import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';
import { MusicPlayerProvider } from './hooks/useMusicPlayer';

// Настройка подробной информации о производительности для production
if (process.env.NODE_ENV === 'production') {
  try {
    const { onCLS, onFID, onLCP } = require('web-vitals');
    onCLS(console.log);
    onFID(console.log);
    onLCP(console.log);
  } catch (e) {
    console.error('Web Vitals не могут быть загружены', e);
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <MusicPlayerProvider>
      <App />
    </MusicPlayerProvider>
  </BrowserRouter>
);

// Включаем отчёты о производительности для анализа и оптимизации
reportWebVitals(metric => {
  const thresholds = {
    'LCP': 2500,
    'FID': 100,
    'CLS': 0.1
  };
  
  if (metric.value > (thresholds[metric.id] || Infinity)) {
    console.warn(`Проблема с производительностью: ${metric.name} - ${Math.round(metric.value)}`);
  }
}); 