import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './lib/apiClient'; // Configure API client (base URL + auth interceptor)
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
