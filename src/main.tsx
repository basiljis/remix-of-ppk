import './index.css';
import { registerServiceWorker } from './service-worker-registration';

// Redirect unvrsm.ru:8080 to unvrsm.ru
if (window.location.port === '8080' && (window.location.hostname === 'unvrsm.ru' || window.location.hostname === 'www.unvrsm.ru')) {
  window.location.href = window.location.protocol + '//' + window.location.hostname + window.location.pathname + window.location.search;
}

// Ensure preloader doesn't hang due to CSS/Asset loading delays
document.addEventListener('DOMContentLoaded', () => {
  // Even shorter check for total hang: 3.5s
  setTimeout(() => {
    const root = document.getElementById('root');
    const hasPreloader = document.querySelector('.preloader') || document.querySelector('#preloader') || document.body.innerText.includes('universum.');
    
    if (root && root.innerHTML === '' && hasPreloader) {
      console.warn('App seems stuck at preloader stage, forcing reload...');
      if (!sessionStorage.getItem('force_reload_stuck')) {
        sessionStorage.setItem('force_reload_stuck', 'true');
        window.location.reload();
      }
    }
  }, 3500);
});

// One-time purge of legacy workbox caches that previously broke the site.
// We keep our own asset cache (`assets-v1`); only workbox-* caches are removed.
const purgeLegacyWorkboxCaches = async () => {
  if (typeof window === 'undefined' || !window.caches) return;
  try {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith('workbox-')).map((k) => caches.delete(k))
    );
  } catch (e) {
    console.warn('[cache-cleanup] failed', e);
  }
};

const importWithRetry = async <T,>(importFn: () => Promise<T>, retries = 2): Promise<T> => {
  try {
    return await importFn();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, 450));
    return importWithRetry(importFn, retries - 1);
  }
};

const showBootstrapError = () => {
  const root = document.getElementById("root");
  if (!root) return;

  root.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:hsl(210,40%,98%);color:hsl(210,100%,15%);font-family:system-ui,-apple-system,sans-serif;text-align:center">
      <div style="max-width:440px">
        <div style="font-size:12px;letter-spacing:.25em;text-transform:uppercase;margin-bottom:16px">universum.</div>
        <h1 style="font-size:22px;line-height:1.3;margin:0 0 12px">Не удалось загрузить приложение</h1>
        <p style="font-size:15px;line-height:1.5;margin:0 0 20px;opacity:.75">Обновите страницу. Если ошибка повторится, очистите кэш браузера.</p>
        <button onclick="window.location.reload()" style="height:44px;padding:0 18px;border-radius:8px;border:0;background:hsl(210,100%,20%);color:white;font-weight:600;cursor:pointer">Обновить страницу</button>
      </div>
    </div>
  `;
};

const bootstrap = async () => {
  void purgeLegacyWorkboxCaches();

  const [reactDom, react, app] = await Promise.all([
    importWithRetry(() => import('react-dom/client')),
    importWithRetry(() => import('react')),
    importWithRetry(() => import('./App.tsx')),
    importWithRetry(() => import('./i18n')),
  ]).then(([rd, r, a]) => [rd, r, a] as const);

  const { createRoot } = reactDom;
  const React = react;
  const { default: App } = app;

  createRoot(document.getElementById("root")!).render(React.createElement(App));

  // Register SW after the app is mounted so it never blocks first render.
  registerServiceWorker();
};

void bootstrap().catch((error) => {
  console.error('[bootstrap] Failed to start application', error);
  // Ensure we are not on a specific port that might be causing issues
  if (window.location.port === '8080' && window.location.hostname === 'unvrsm.ru') {
    window.location.href = 'http://unvrsm.ru/';
    return;
  }
  showBootstrapError();
});
