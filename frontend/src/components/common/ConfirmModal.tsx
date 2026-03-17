import { Modal, Button } from 'react-bootstrap';

interface Props {
  show: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'success';
  isPending?: boolean;
  onConfirm: () => void;
  /** Called when the modal should close without confirming */
  onHide?: () => void;
  /** Alias for onHide — either can be used */
  onCancel?: () => void;
}

export default function ConfirmModal({
  show,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
  isPending = false,
  onConfirm,
  onHide,
  onCancel,
}: Props) {
  const dismiss = onHide ?? onCancel ?? (() => {});
  return (
    <Modal show={show} onHide={dismiss} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{message}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={dismiss} disabled={isPending}>
          Cancel
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={isPending}>
          {isPending ? 'Processing…' : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
