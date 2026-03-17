import { RouterProvider } from 'react-router';
import { router } from '@/routes';
import { AuthProvider } from '@/modules/auth/context/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/common/ToastManager';

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
