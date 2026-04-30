import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UsageProvider } from './lib/UsageTracker';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UsageProvider>
      <App />
    </UsageProvider>
  </StrictMode>,
);
