import { RouterProvider } from 'react-router';
import { router } from '@/routes';
import { AuthProvider } from '@/modules/auth/context/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { ToastProvider } from '@/components/common/ToastManager';
import { BreadcrumbProvider } from '@/context/BreadcrumbContext';

export default function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <ToastProvider>
          <BreadcrumbProvider>
            <RouterProvider router={router} />
          </BreadcrumbProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
