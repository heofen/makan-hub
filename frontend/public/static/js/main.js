/*
 * MacanHub Frontend
 * Compiled JS for production
 */

// Временная заглушка для демонстрации
(function() {
  // Получаем данные из Django шаблона
  const initialData = window.INITIAL_DATA || {
    apiUrl: '/api/',
    csrfToken: '',
    user: { is_authenticated: false }
  };

  // Простая инициализация приложения
  document.addEventListener('DOMContentLoaded', function() {
    const rootEl = document.getElementById('root');
    
    if (!rootEl) return;
    
    // Если пользователь не аутентифицирован, показываем простой UI
    if (!initialData.user.is_authenticated) {
      rootEl.innerHTML = `
        <div class="placeholder-content glass">
          <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Добро пожаловать в MacanHub</h1>
          <p style="font-size: 1.25rem; margin-bottom: 2rem;">Музыкальный стриминговый сервис</p>
          <div style="display: flex; gap: 1rem;">
            <a href="/app/login" class="btn-primary">Вход</a>
            <a href="/app/register" style="color: var(--text-secondary);">Регистрация</a>
          </div>
        </div>
      `;
    } else {
      rootEl.innerHTML = `
        <div class="placeholder-content glass">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">Привет, ${initialData.user.username || 'пользователь'}!</h1>
          <p style="font-size: 1.25rem; margin-bottom: 2rem;">
            Это простая заглушка для MacanHub. Фронтенд React находится в разработке.
          </p>
          <div style="display: flex; gap: 1rem;">
            <a href="/api/" class="btn-primary">API</a>
            <a href="/admin/" style="color: var(--text-secondary);">Админка</a>
          </div>
        </div>
      `;
    }
  });
})(); 