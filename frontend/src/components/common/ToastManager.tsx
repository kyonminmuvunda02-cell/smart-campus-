import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Toast, ToastContainer } from 'react-bootstrap';

type ToastVariant = 'success' | 'danger' | 'info' | 'warning';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  message: string;
}

interface ToastContextValue {
  showToast: (variant: ToastVariant, title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((variant: ToastVariant, title: string, message: string) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, variant, title, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const variantIcon: Record<ToastVariant, string> = {
    success: 'ti-circle-check',
    danger: 'ti-alert-circle',
    info: 'ti-info-circle',
    warning: 'ti-alert-triangle',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            onClose={() => removeToast(t.id)}
            autohide
            delay={4000}
            bg={t.variant === 'danger' ? 'danger' : undefined}
            className={t.variant === 'danger' ? 'text-white' : ''}
          >
            <Toast.Header>
              <i className={`ti ${variantIcon[t.variant]} me-2`} />
              <strong className="me-auto">{t.title}</strong>
            </Toast.Header>
            <Toast.Body>{t.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
