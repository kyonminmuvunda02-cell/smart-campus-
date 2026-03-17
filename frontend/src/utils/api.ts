import { client } from '../client/client.gen';

export function setupApiClient() {
  client.setConfig({
    baseUrl: import.meta.env.VITE_API_BASE_URL || '',
  });
}

// Attach JWT token to every outgoing request automatically.
client.interceptors.request.use((request) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`);
  }
  return request;
});

// Handle 401 globally — token expired or invalid.
client.interceptors.response.use((response) => {
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_role');
    window.location.href = '/login';
  }
  return response;
});
