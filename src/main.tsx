import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import App from './App.tsx';
import LandingPage from './components/LandingPage.tsx';
import './index.css';

// Fase 4: /sobre é a página pública de apresentação do produto — a única
// rota tratada aqui fora do App. Todo o resto continua em "/*", onde o
// próprio App.tsx lê/escreve a URL manualmente (ver parseAppPath /
// computeAppPath) — não precisou mudar nada desse mecanismo existente.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/sobre" element={<LandingPage />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
