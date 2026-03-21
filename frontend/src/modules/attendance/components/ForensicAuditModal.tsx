import { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useAttendanceReview } from '../hooks/useAttendanceReview';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';

interface ForensicAuditModalProps {
  show: boolean;
  onHide: () => void;
  attendanceRecord: any;
  studentName: string;
}

export default function ForensicAuditModal({ show, onHide, attendanceRecord, studentName }: ForensicAuditModalProps) {
  const [reviewNote, setReviewNote] = useState('');
  const { showToast } = useToast();
  const { review } = useAttendanceReview();

  useEffect(() => {
    if (attendanceRecord) {
      setReviewNote(attendanceRecord.review_note || '');
    }
  }, [attendanceRecord]);

  if (!attendanceRecord) return null;

  async function handleDecision(status: 'Verified' | 'Rejected') {
    try {
      await review.mutateAsync({ 
        attendanceId: attendanceRecord.attendance_id, 
        body: { verification_status: status, review_note: reviewNote.trim() || null } 
      });
      showToast('success', 'Audit Complete', `Record marked as ${status}.`);
      onHide();
    } catch (e) {
      showToast('danger', 'Audit Failed', getErrorMessage(e));
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="premium-modal forensic-audit">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-navy h5 d-flex align-items-center gap-2">
          <i className="ti ti-microscope text-purple" />
          Forensic Evidence Audit
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-4">
        <div className="row g-4">
          <div className="col-md-6 border-end">
            <h6 className="uppercase small fw-bold text-secondary mb-3">Identity Binding</h6>
            <div className="surface-card bg-light-subtle p-3 mb-3 border-0">
               <div className="d-flex align-items-center gap-3">
                  <div className="sb-avatar bg-purple text-white fw-bold">{studentName[0] || 'S'}</div>
                  <div className="entity-copy">
                    <strong className="text-navy d-block">{studentName || 'Unknown Student'}</strong>
                    <span className="smaller text-muted">ID: {attendanceRecord.attendance_id}</span>
                  </div>
               </div>
            </div>

            <h6 className="uppercase small fw-bold text-secondary mb-3">Integrity Markers</h6>
            <div className="stack gap-2">
               <div className="p-2 border rounded-3 d-flex justify-content-between align-items-center">
                  <span className="small text-muted">Fraud Flag</span>
                  <span className={`status-pill sm ${attendanceRecord.fraud_flag ? 'red' : 'green'}`}>
                    {attendanceRecord.fraud_flag ? 'High Risk' : 'None Detected'}
                  </span>
               </div>
               <div className="p-2 border rounded-3 d-flex justify-content-between align-items-center">
                  <span className="small text-muted">GPS Trace</span>
                  <span className={`status-pill sm ${attendanceRecord.gps_latitude ? 'green' : 'amber'}`}>
                    {attendanceRecord.gps_latitude ? 'Geocoded' : 'Missing'}
                  </span>
               </div>
               <div className="p-2 border rounded-3">
                  <span className="smaller text-secondary fw-bold uppercase d-block mb-1">Device Fingerprint</span>
                  <code className="smaller text-purple">{attendanceRecord.device_id || 'Browser Virtual Client'}</code>
               </div>
            </div>
          </div>

          <div className="col-md-6">
            <h6 className="uppercase small fw-bold text-secondary mb-3">Audit Log & Actions</h6>
             <div className="field-shell mb-4">
                <label className="field-label">Reviewer Justification</label>
                <Form.Control 
                  as="textarea" 
                  rows={4} 
                  value={reviewNote}
                  onChange={e => setReviewNote(e.target.value)}
                  placeholder="Explain why this record is being approved or rejected..."
                  className="bg-light-subtle border-0"
                />
             </div>

             <div className="alert alert-warning border-0 small mb-4">
                <i className="ti ti-info-circle me-2" />
                Audit decisions are final and will be reflected in the student's academic progress report.
             </div>

             <div className="d-flex gap-2">
                <Button variant="danger" className="flex-grow-1 py-2 fw-bold" onClick={() => handleDecision('Rejected')} disabled={review.isPending}>
                   <i className="ti ti-x me-2" />Reject Trace
                </Button>
                <Button variant="green" className="flex-grow-1 py-2 fw-bold" onClick={() => handleDecision('Verified')} disabled={review.isPending}>
                   <i className="ti ti-check me-2" />Verify Presence
                </Button>
             </div>
             {review.isPending && (
               <div className="text-center mt-3"><Spinner animation="border" size="sm" variant="purple" /></div>
             )}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
