import { useState } from 'react';
import { Modal, Button, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import SearchableSelect from '@/components/common/SearchableSelect';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useCourse } from '../hooks/useCourse';
import { useUser } from '@/modules/users/hooks/useUser';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';

interface AssignLecturerModalProps {
  show: boolean;
  onHide: () => void;
  courseId: number;
}

export default function AssignLecturerModal({ show, onHide, courseId }: AssignLecturerModalProps) {
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { useAssignments, assignLecturer } = useCourse();
  const { useList: useUsers } = useUser();

  const { data: assignmentsData } = useAssignments(courseId);
  const { data: usersData } = useUsers({ query: { skip: 0, limit: 200 } });

  const assignments = (assignmentsData as { items?: Array<Record<string, any>> })?.items ?? [];
  const users = (usersData as { items?: Array<Record<string, any>> })?.items ?? [];
  const lecturers = users.filter((user) => user.role === 'Lecturer');
  const activeLecturerIds = new Set(assignments.map((a) => Number(a.lecturer_id ?? 0)));
  const availableLecturers = lecturers.filter((l) => !activeLecturerIds.has(Number(l.user_id ?? 0)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLecturerId) return;

    try {
      setError(null);
      await assignLecturer.mutateAsync({
        body: {
          course_id: courseId,
          lecturer_id: Number(selectedLecturerId),
        },
      });
      showToast('success', 'Lecturer Assigned', 'The lecturer can now manage sessions for this course.');
      setSelectedLecturerId('');
      onHide();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="premium-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">Assign Lecturer</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit}>
        <Modal.Body className="pt-3">
          <ErrorAlert error={error} dismissible />

          <div className="field-shell">
            <div className="d-flex align-items-center gap-2 mb-2">
              <label className="field-label mb-0">Select Lecturer</label>
              <OverlayTrigger
                placement="right"
                overlay={<Tooltip>Assigning a lecturer grants them access to create sessions and manage attendance.</Tooltip>}
              >
                <i className="ti ti-info-circle text-secondary cursor-help" />
              </OverlayTrigger>
            </div>
            
            <SearchableSelect
              name="lecturer_id"
              value={selectedLecturerId}
              onValueChange={setSelectedLecturerId}
              disabled={assignLecturer.isPending || availableLecturers.length === 0}
              placeholder={availableLecturers.length === 0 ? "No lecturers available" : "Search for a lecturer..."}
              options={availableLecturers.map((l) => ({
                value: String(l.user_id),
                label: `${String(l.first_name ?? '')} ${String(l.last_name ?? '')}`.trim() || `Lecturer #${l.user_id}`,
                meta: String(l.email ?? ''),
              }))}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4">
          <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!selectedLecturerId || assignLecturer.isPending}>
            {assignLecturer.isPending ? <Spinner animation="border" size="sm" /> : <i className="ti ti-user-plus" />}
            Confirm Assignment
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
