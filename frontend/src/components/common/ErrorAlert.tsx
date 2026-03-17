import { Alert } from 'react-bootstrap';
import { getErrorMessage } from '@/utils/errors';

interface ErrorAlertProps {
  error: unknown;
  dismissible?: boolean;
  onClose?: () => void;
}

export default function ErrorAlert({ error, dismissible, onClose }: ErrorAlertProps) {
  if (!error) return null;
  return (
    <Alert variant="danger" dismissible={dismissible} onClose={onClose} className="border-0 shadow-sm">
      <i className="ti ti-alert-circle me-2" />
      {getErrorMessage(error)}
    </Alert>
  );
}
