import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 1. Importa el registro virtual del plugin PWA
import { registerSW } from 'virtual:pwa-register';

// 2. Registra el Service Worker y maneja actualizaciones o modo offline
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('Hay una nueva versión de la aplicación de pagos disponible. ¿Deseas actualizarla ahora?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('La aplicación está lista para funcionar sin conexión.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);