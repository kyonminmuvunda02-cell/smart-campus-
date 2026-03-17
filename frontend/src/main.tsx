import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import { AuthProvider } from './context/AuthContext';
import { setupApiClient } from './utils/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/theme.css';

// setupApiClient MUST run before any component mounts.
// This registers the JWT interceptor so the very first API call includes the token.
setupApiClient();

// Global QueryClient — shared by all useQuery / useMutation hooks in the app.
// staleTime: 30s — list pages won't refetch on every focus, reducing noisy requests.
// retry: 1 — one retry on transient failures; don't hammer a dead backend.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
