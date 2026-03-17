import { client } from '@/client/client.gen';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

// Prefer a relative API path by default so mobile devices hitting the Vite dev server
// can use its /api proxy instead of depending on a hardcoded LAN IP.
client.setConfig({
  baseUrl: configuredBaseUrl || '',
});

// Add auth interceptor — attach token to every request
client.interceptors.request.use((request) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

// Add response interceptor — handle 401 globally
client.interceptors.response.use((response) => {
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    window.location.href = '/login';
  }
  return response;
});
