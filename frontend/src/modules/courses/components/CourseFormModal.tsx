import { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useCourse } from '../hooks/useCourse';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import ErrorAlert from '@/components/common/ErrorAlert';

interface CourseFormModalProps {
  show: boolean;
  onHide: () => void;
  courseId?: number;
}

export default function CourseFormModal({ show, onHide, courseId }: CourseFormModalProps) {
  const isEditing = !!courseId;
  const { showToast } = useToast();
  const { useDetail, create, update } = useCourse();
  const { data: course, isLoading: loadingCourse } = useDetail(courseId);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    department: '',
    credits: 3,
  });

  useEffect(() => {
    if (course && isEditing) {
      const c = course as Record<string, any>;
      setFormData({
        course_code: c.course_code || '',
        course_name: c.course_name || '',
        department: c.department || '',
        credits: c.credits || 3,
      });
    } else if (!isEditing) {
      setFormData({
        course_code: '',
        course_name: '',
        department: '',
        credits: 3,
      });
    }
  }, [course, isEditing, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'credits' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      if (isEditing) {
        await update.mutateAsync({ path: { course_id: courseId }, body: formData });
        showToast('success', 'Course updated', 'Changes saved successfully.');
      } else {
        await create.mutateAsync({ body: formData });
        showToast('success', 'Course created', 'New course has been added.');
      }
      onHide();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" className="premium-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">
          {isEditing ? 'Update Course Record' : 'New Course Record'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-3">
          <ErrorAlert error={error} dismissible />

          {loadingCourse && isEditing ? (
            <div className="text-center py-4"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <div className="stack gap-3">
              <div className="field-shell">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Form.Label className="field-label mb-0">Course Code</Form.Label>
                  <OverlayTrigger
                    placement="right"
                    overlay={<Tooltip>Enter the official academic code (e.g., CS301).</Tooltip>}
                  >
                    <i className="ti ti-info-circle text-secondary cursor-help" />
                  </OverlayTrigger>
                </div>
                <Form.Control
                  name="course_code"
                  value={formData.course_code}
                  onChange={handleChange}
                  required
                  placeholder="e.g. CS301"
                  className="mono"
                />
              </div>

              <div className="field-shell">
                <Form.Label className="field-label">Course Name</Form.Label>
                <Form.Control
                  name="course_name"
                  value={formData.course_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Web Development"
                />
              </div>

              <div className="field-shell">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Form.Label className="field-label mb-0">Department</Form.Label>
                  <OverlayTrigger
                    placement="right"
                    overlay={<Tooltip>The academic unit responsible for this course.</Tooltip>}
                  >
                    <i className="ti ti-info-circle text-secondary cursor-help" />
                  </OverlayTrigger>
                </div>
                <Form.Control
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Computer Science"
                />
              </div>

              <div className="field-shell">
                <Form.Label className="field-label">Credits</Form.Label>
                <Form.Control
                  type="number"
                  name="credits"
                  value={formData.credits}
                  onChange={handleChange}
                  min={1}
                  required
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4">
          <Button variant="outline-secondary" onClick={onHide} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isPending || (loadingCourse && isEditing)}>
            {isPending ? <Spinner animation="border" size="sm" /> : <i className={`ti ti-${isEditing ? 'device-floppy' : 'plus'}`} />}
            {isEditing ? 'Save Changes' : 'Create Course'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
