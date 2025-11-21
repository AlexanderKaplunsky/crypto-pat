import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.tsx';
import { validateEnvironment } from './config/env.ts';

// Validate environment on startup
validateEnvironment();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
