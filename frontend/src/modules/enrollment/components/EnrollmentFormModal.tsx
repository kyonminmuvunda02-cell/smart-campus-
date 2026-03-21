import { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import SearchableSelect from '@/components/common/SearchableSelect';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useEnrollment } from '../hooks/useEnrollment';
import { useUser } from '@/modules/users/hooks/useUser';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { getErrorMessage } from '@/utils/errors';
import { useToast } from '@/components/common/ToastManager';

interface EnrollmentFormModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
  studentId?: number;
}

function currentAcademicYear() {
  const now = new Date();
  return `${now.getFullYear()}/${now.getFullYear() + 1}`;
}

export default function EnrollmentFormModal({ show, onHide, onSuccess, studentId }: EnrollmentFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    student_id: studentId ? String(studentId) : '',
    course_id: '',
    semester: 'Semester 1',
    academic_year: currentAcademicYear(),
  });

  const { showToast } = useToast();
  const { create } = useEnrollment();
  const { useList: useUsers } = useUser();
  const { useList: useCourses } = useCourse();

  const { data: usersData } = useUsers({ query: { limit: 500 } });
  const { data: coursesData } = useCourses({ query: { limit: 500 } });

  const students = ((usersData as any)?.items ?? []).filter((u: any) => u.role === 'Student');
  const courses = (coursesData as any)?.items ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.student_id || !formData.course_id) {
      setError('Please select both a student and a course.');
      return;
    }

    try {
      setError(null);
      await create.mutateAsync({
        body: {
          student_id: Number(formData.student_id),
          course_id: Number(formData.course_id),
          semester: formData.semester,
          academic_year: formData.academic_year
        }
      });
      showToast('success', 'Registration Successful', 'Student has been enrolled in the course.');
      onSuccess?.();
      onHide();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="premium-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-navy h5">
          <i className="ti ti-plus text-purple me-2" />
          Register New Enrollment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-4">
        <ErrorAlert error={error} dismissible />
        <Form onSubmit={handleSubmit} className="stack gap-3">
          <div className="row g-3">
            <div className="col-md-6">
              <div className="field-shell">
                <label className="field-label">Student Member</label>
                <SearchableSelect
                  name="student_id"
                  placeholder="Select a student..."
                  value={formData.student_id}
                  onValueChange={v => setFormData(p => ({ ...p, student_id: v }))}
                  options={students.map((s: any) => ({
                    value: String(s.user_id),
                    label: `${s.first_name} ${s.last_name}`,
                    meta: s.email
                  }))}
                  disabled={!!studentId}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="field-shell">
                <label className="field-label">Academic Course</label>
                <SearchableSelect
                  name="course_id"
                  placeholder="Select a course..."
                  value={formData.course_id}
                  onValueChange={v => setFormData(p => ({ ...p, course_id: v }))}
                  options={courses.map((c: any) => ({
                    value: String(c.course_id),
                    label: `${c.course_code} - ${c.course_name}`
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="row g-3">
            <div className="col-md-6">
              <div className="field-shell">
                <label className="field-label">Semester Period</label>
                <Form.Select 
                  value={formData.semester} 
                  onChange={e => setFormData(p => ({ ...p, semester: e.target.value }))}
                  className="bg-light-subtle border-0"
                >
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Summer Session</option>
                </Form.Select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="field-shell">
                <label className="field-label">Academic Year</label>
                <Form.Control 
                  value={formData.academic_year} 
                  onChange={e => setFormData(p => ({ ...p, academic_year: e.target.value }))} 
                  className="bg-light-subtle border-0"
                />
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="ghost" onClick={onHide} className="fw-bold">Cancel</Button>
            <Button type="submit" variant="purple" className="px-4 fw-bold" disabled={create.isPending}>
              {create.isPending ? <Spinner size="sm" /> : 'Confirm Enrollment'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
