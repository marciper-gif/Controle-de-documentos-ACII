import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App.tsx';
import LandingPage from './components/LandingPage.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Fase 4 (rebranding): página pública de apresentação do produto —
            standalone, sem Firebase/login. Qualquer outro caminho continua
            indo pro App normal (que já faz o próprio roteamento interno
            via src/lib/appRouting.ts — não mexe em nada disso). */}
        <Route path="/produto" element={<LandingPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
