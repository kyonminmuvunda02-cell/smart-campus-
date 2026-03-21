import { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner, Row, Col, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useUser } from '../hooks/useUser';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import ErrorAlert from '@/components/common/ErrorAlert';

interface UserFormModalProps {
  show: boolean;
  onHide: () => void;
  userId?: number;
}

export default function UserFormModal({ show, onHide, userId }: UserFormModalProps) {
  const isEditing = !!userId;
  const { showToast } = useToast();
  const { useDetail, createStudent, createLecturer, update } = useUser();
  const { data: user, isLoading: loadingUser } = useDetail(userId);

  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [role, setRole] = useState<'Student' | 'Lecturer'>('Student');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    student_number: '',
    program: '',
    year_of_study: 1,
    staff_number: '',
    department: '',
    office_location: '',
  });

  useEffect(() => {
    if (user && isEditing) {
      const u = user as any;
      setFormData((prev) => ({
        ...prev,
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        email: u.email || '',
      }));
      setRole(u.role === 'Lecturer' ? 'Lecturer' : 'Student');
    } else if (!isEditing) {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        student_number: '',
        program: '',
        year_of_study: 1,
        staff_number: '',
        department: '',
        office_location: '',
      });
      setRole('Student');
    }
  }, [user, isEditing, show]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | any>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year_of_study' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    try {
      if (isEditing) {
        await update.mutateAsync({
          path: { user_id: userId! },
          body: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
          },
        });
        showToast('success', 'User Updated', 'The account has been updated.');
      } else {
        if (role === 'Student') {
          await createStudent.mutateAsync({
            body: {
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              password: formData.password,
              role: 'Student',
              student_number: formData.student_number,
              program: formData.program,
              year_of_study: formData.year_of_study,
            },
          });
        } else {
          await createLecturer.mutateAsync({
            body: {
              email: formData.email,
              first_name: formData.first_name,
              last_name: formData.last_name,
              password: formData.password,
              role: 'Lecturer',
              staff_number: formData.staff_number,
              department: formData.department,
              office_location: formData.office_location || undefined,
            },
          });
        }
        showToast('success', 'User Created', 'New account added successfully.');
      }
      onHide();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg" className="premium-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">
          {isEditing ? 'Update User Account' : 'New User Account'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="pt-3">
          <ErrorAlert error={error} dismissible />

          {loadingUser && isEditing ? (
            <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
          ) : (
            <div className="stack gap-3">
              <Row>
                <Col md={6}>
                  <div className="field-shell">
                    <Form.Label className="field-label">First Name</Form.Label>
                    <Form.Control name="first_name" value={formData.first_name} onChange={handleChange} required />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="field-shell">
                    <Form.Label className="field-label">Last Name</Form.Label>
                    <Form.Control name="last_name" value={formData.last_name} onChange={handleChange} required />
                  </div>
                </Col>
              </Row>

              <div className="field-shell">
                <Form.Label className="field-label">Email Address</Form.Label>
                <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>

              {!isEditing && (
                <Row>
                  <Col md={6}>
                    <div className="field-shell">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <Form.Label className="field-label mb-0">Password</Form.Label>
                        <OverlayTrigger
                          placement="right"
                          overlay={<Tooltip>Initial password must be at least 8 characters.</Tooltip>}
                        >
                          <i className="ti ti-info-circle text-secondary cursor-help" />
                        </OverlayTrigger>
                      </div>
                      <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required minLength={8} />
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="field-shell">
                      <Form.Label className="field-label">Account Type</Form.Label>
                      <Form.Select value={role} onChange={(e) => setRole(e.target.value as any)}>
                        <option value="Student">Student</option>
                        <option value="Lecturer">Lecturer</option>
                      </Form.Select>
                    </div>
                  </Col>
                </Row>
              )}

              {!isEditing && role === 'Student' && (
                <div className="bg-light p-3 rounded-3 border">
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="field-shell mb-0">
                        <Form.Label className="field-label">Student Number</Form.Label>
                        <Form.Control name="student_number" value={formData.student_number} onChange={handleChange} required />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="field-shell mb-0">
                        <Form.Label className="field-label">Year of Study</Form.Label>
                        <Form.Control type="number" name="year_of_study" value={formData.year_of_study} onChange={handleChange} min={1} required />
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="field-shell mb-0">
                        <Form.Label className="field-label">Program / Major</Form.Label>
                        <Form.Control name="program" value={formData.program} onChange={handleChange} required placeholder="e.g. BSc Computer Science" />
                      </div>
                    </Col>
                  </Row>
                </div>
              )}

              {!isEditing && role === 'Lecturer' && (
                <div className="bg-light p-3 rounded-3 border">
                  <Row className="g-3">
                    <Col md={6}>
                      <div className="field-shell mb-0">
                        <Form.Label className="field-label">Staff Number</Form.Label>
                        <Form.Control name="staff_number" value={formData.staff_number} onChange={handleChange} required />
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="field-shell mb-0">
                        <Form.Label className="field-label">Department</Form.Label>
                        <Form.Control name="department" value={formData.department} onChange={handleChange} required />
                      </div>
                    </Col>
                    <Col md={12}>
                      <div className="field-shell mb-0">
                        <Form.Label className="field-label">Office Location (Optional)</Form.Label>
                        <Form.Control name="office_location" value={formData.office_location} onChange={handleChange} />
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 pb-4">
          <Button variant="outline-secondary" onClick={onHide} disabled={isPending}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isPending || (loadingUser && isEditing)}>
            {isPending ? <Spinner animation="border" size="sm" /> : <i className={`ti ti-${isEditing ? 'device-floppy' : 'plus'}`} />}
            {isEditing ? 'Save Changes' : 'Create Account'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
