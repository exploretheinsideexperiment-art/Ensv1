import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Purge any stale service workers & caches from previous sessions
if (typeof window !== 'undefined') {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      }).catch(() => {});
    }
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      }).catch(() => {});
    }
  } catch {
    // Ignore storage errors
  }
}

let rootInstance: ReturnType<typeof createRoot> | null = null;

function mountApplication() {
  const container = document.getElementById('root');
  if (!container) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountApplication, { once: true });
      return;
    }
    setTimeout(mountApplication, 50);
    return;
  }

  try {
    if (!rootInstance) {
      rootInstance = createRoot(container);
    }
    rootInstance.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (mountErr) {
    console.error('Fatal mount error in ENSv1:', mountErr);
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #080d17; color: #f87171; font-family: system-ui, sans-serif; padding: 24px; text-align: center;">
        <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Network Simulator Failed to Mount</h2>
        <p style="font-size: 12px; color: #94a3b8; max-width: 400px; margin-bottom: 16px;">${(mountErr as Error)?.message || 'An unexpected error occurred during startup.'}</p>
        <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload();" style="padding: 10px 18px; background: #0284c7; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: bold; cursor: pointer;">
          Reset & Launch Simulator
        </button>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApplication);
} else {
  mountApplication();
}

