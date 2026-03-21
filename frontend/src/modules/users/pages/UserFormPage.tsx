import { useActionState, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Button, Card, Form, Row, Col, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useUser } from '@/modules/users/hooks/useUser';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';

interface ActionState {
  error: string | null;
}

export default function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { useDetail, createStudent, createLecturer, update } = useUser();

  const { data: user, isLoading: loadingUser } = useDetail(id ? Number(id) : undefined);
  const [role, setRole] = useState<'Student' | 'Lecturer' | 'Admin'>('Student');

  useEffect(() => {
    if (user) {
      setRole((user as { role: 'Student' | 'Lecturer' | 'Admin' }).role);
    }
  }, [user]);

  async function handleSubmit(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      const email = String(formData.get('email'));
      const firstName = String(formData.get('first_name'));
      const lastName = String(formData.get('last_name'));

      if (isEditing) {
        await update.mutateAsync({
          path: { user_id: Number(id) },
          body: {
            email,
            first_name: firstName,
            last_name: lastName,
          },
        });
        showToast('success', 'User Updated', 'Changes saved successfully.');
      } else {
        const password = String(formData.get('password'));
        const userRole = String(formData.get('role')) as 'Student' | 'Lecturer';

        if (userRole === 'Student') {
          await createStudent.mutateAsync({
            body: {
              email,
              first_name: firstName,
              last_name: lastName,
              password,
              role: userRole,
              student_number: String(formData.get('student_number')),
              program: String(formData.get('program')),
              year_of_study: Number(formData.get('year_of_study')),
            },
          });
        } else {
          await createLecturer.mutateAsync({
            body: {
              email,
              first_name: firstName,
              last_name: lastName,
              password,
              role: userRole,
              staff_number: String(formData.get('staff_number')),
              department: String(formData.get('department')),
              office_location: String(formData.get('office_location')) || undefined,
            },
          });
        }
        showToast('success', 'User Created', 'New user account has been added.');
      }

      navigate('/users');
      return { error: null };
    } catch (err) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, { error: null });

  if (loadingUser) {
    return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
  }

  const u = user as Record<string, unknown> | undefined;

  return (
    <div>
      <PageHeader title={isEditing ? 'Edit User' : 'Add User'} subtitle={isEditing ? `Managing ${u?.email}` : 'Create a new account'}>
        <Link to="/users">
          <Button variant="outline-secondary">
            <i className="ti ti-arrow-left me-2" />Back to List
          </Button>
        </Link>
      </PageHeader>

      <Card className="border-0 shadow-sm">
        <Card.Body className="p-4">
          <ErrorAlert error={state.error} dismissible />

              <Form action={formAction}>
                <Row className="g-3 mb-3">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">First Name</Form.Label>
                      <Form.Control
                        name="first_name"
                        defaultValue={u?.first_name as string | undefined}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Last Name</Form.Label>
                      <Form.Control
                        name="last_name"
                        defaultValue={u?.last_name as string | undefined}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Email (Username)</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    defaultValue={u?.email as string | undefined}
                    required
                    className="py-2"
                  />
                  <Form.Text className="text-secondary small">
                    This will be used for logging into the portal.
                  </Form.Text>
                </Form.Group>

                {!isEditing && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label className="small fw-semibold">Initial Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        required
                        minLength={8}
                        className="py-2"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="small fw-semibold">Role</Form.Label>
                      <Form.Select
                        name="role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as 'Student' | 'Lecturer' | 'Admin')}
                        className="py-2"
                      >
                        <option value="Student">Student</option>
                        <option value="Lecturer">Lecturer</option>
                      </Form.Select>
                    </Form.Group>
                  </>
                )}

                {!isEditing && role === 'Student' && (
                  <Row className="g-3 mb-4">
                    <Col sm={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Student Number</Form.Label>
                        <Form.Control name="student_number" required className="py-2" />
                      </Form.Group>
                    </Col>
                    <Col sm={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Year of Study</Form.Label>
                        <Form.Control type="number" name="year_of_study" min={1} max={6} defaultValue={1} required className="py-2" />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Program</Form.Label>
                        <Form.Control name="program" required className="py-2" />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {!isEditing && role === 'Lecturer' && (
                  <Row className="g-3 mb-4">
                    <Col sm={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Staff Number</Form.Label>
                        <Form.Control name="staff_number" required className="py-2" />
                      </Form.Group>
                    </Col>
                    <Col sm={6}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Department</Form.Label>
                        <Form.Control name="department" required className="py-2" />
                      </Form.Group>
                    </Col>
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label className="small fw-semibold">Office Location</Form.Label>
                        <Form.Control name="office_location" className="py-2" />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="py-2 fw-bold"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <>
                        <i className={`ti ti-${isEditing ? 'device-floppy' : 'plus'} me-2`} />
                        {isEditing ? 'Save Changes' : 'Create User'}
                      </>
                    )}
                  </Button>
                </div>
              </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
