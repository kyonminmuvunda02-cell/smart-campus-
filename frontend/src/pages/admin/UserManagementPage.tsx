import { useState, useActionState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container, Table, Spinner, Alert, Badge, Button, Modal,
  Form, Row, Col, Pagination, Nav,
} from 'react-bootstrap';
import { Users } from '../../client/sdk.gen';
import type { AppUserResponse, StudentCreate, LecturerCreate } from '../../client/types.gen';
import { getErrorMessage, getErrorStatus } from '../../utils/errors';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { usePagination } from '../../hooks/usePagination';

// ─── Create User Modal ────────────────────────────────────────────────────────
// The real API has separate endpoints for students vs lecturers

interface CreateState { error: string | null }

function CreateUserModal({ show, onHide, onCreated }: { show: boolean; onHide: () => void; onCreated: () => void }) {
  const [roleTab, setRoleTab] = useState<'Student' | 'Lecturer'>('Student');

  async function createAction(_prev: CreateState, formData: FormData): Promise<CreateState> {
    try {
      if (roleTab === 'Student') {
        const body: StudentCreate = {
          email: String(formData.get('email')),
          password: String(formData.get('password')),
          first_name: String(formData.get('first_name')),
          last_name: String(formData.get('last_name')),
          role: 'Student',
          student_number: String(formData.get('student_number')),
          program: String(formData.get('program')),
          year_of_study: Number(formData.get('year_of_study')),
        };
        await Users.createStudent({ body });
      } else {
        const body: LecturerCreate = {
          email: String(formData.get('email')),
          password: String(formData.get('password')),
          first_name: String(formData.get('first_name')),
          last_name: String(formData.get('last_name')),
          role: 'Lecturer',
          staff_number: String(formData.get('staff_number')),
          department: String(formData.get('department')),
          office_location: String(formData.get('office_location')) || null,
        };
        await Users.createLecturer({ body });
      }
      onCreated();
      onHide();
      return { error: null };
    } catch (err) {
      const status = getErrorStatus(err);
      if (status === 409) return { error: 'A user with that email already exists.' };
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(createAction, { error: null });

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton><Modal.Title>Create New User</Modal.Title></Modal.Header>
      <Form action={formAction}>
        <Modal.Body>
          {state.error && <Alert variant="danger">{state.error}</Alert>}

          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link active={roleTab === 'Student'} onClick={() => setRoleTab('Student')}>Student</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={roleTab === 'Lecturer'} onClick={() => setRoleTab('Lecturer')}>Lecturer</Nav.Link>
            </Nav.Item>
          </Nav>

          <Row className="g-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label>First Name</Form.Label>
                <Form.Control name="first_name" required />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Last Name</Form.Label>
                <Form.Control name="last_name" required />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" name="email" placeholder="user@cuz.ac.zm" required />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" name="password" minLength={8} required />
              </Form.Group>
            </Col>

            {roleTab === 'Student' ? (
              <>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label>Student Number</Form.Label>
                    <Form.Control name="student_number" placeholder="e.g. CUZ2024001" required />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label>Year of Study</Form.Label>
                    <Form.Control type="number" name="year_of_study" min={1} max={6} defaultValue={1} required />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Program</Form.Label>
                    <Form.Control name="program" placeholder="e.g. BSc Computer Science" required />
                  </Form.Group>
                </Col>
              </>
            ) : (
              <>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label>Staff Number</Form.Label>
                    <Form.Control name="staff_number" placeholder="e.g. LEC001" required />
                  </Form.Group>
                </Col>
                <Col xs={6}>
                  <Form.Group>
                    <Form.Label>Department</Form.Label>
                    <Form.Control name="department" placeholder="e.g. Computer Science" required />
                  </Form.Group>
                </Col>
                <Col xs={12}>
                  <Form.Group>
                    <Form.Label>Office Location <small className="text-muted">(optional)</small></Form.Label>
                    <Form.Control name="office_location" placeholder="e.g. Block A, Room 12" />
                  </Form.Group>
                </Col>
              </>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? 'Creating…' : `Create ${roleTab}`}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  const qc = useQueryClient();
  const { skip, limit, page, totalPages, goToPage, setTotal } = usePagination(20);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppUserResponse | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ['users', skip, limit],
    queryFn: async () => {
      const { data } = await Users.listUsers({ query: { skip, limit } });
      if (data) setTotal(data.total);
      return data;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const deleteMutation = useMutation({
    mutationFn: (u: AppUserResponse) => Users.deleteUser({ path: { user_id: u.user_id } }),
    onSuccess: () => { setDeleteTarget(null); invalidate(); },
  });

  const users = data?.items ?? [];
  const roleBg = (role: string) =>
    role === 'Admin' ? 'danger' : role === 'Lecturer' ? 'primary' : 'secondary';

  if (isPending && users.length === 0) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger" className="m-4">{getErrorMessage(error)}</Alert>;

  return (
    <Container fluid className="py-4">
      <PageHeader
        title="User Management"
        subtitle={`${data?.total ?? 0} users registered`}
        action={<Button variant="primary" onClick={() => setShowCreate(true)}>+ New User</Button>}
      />

      <Table striped hover responsive>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.user_id}>
              <td>{u.user_id}</td>
              <td>{u.first_name} {u.last_name}</td>
              <td>{u.email}</td>
              <td><Badge bg={roleBg(u.role)}>{u.role}</Badge></td>
              <td>{u.created_at.toLocaleDateString()}</td>
              <td>
                <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(u)}>Delete</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <Pagination className="mt-3">
          <Pagination.Prev onClick={() => goToPage(page - 1)} disabled={page === 1} />
          {Array.from({ length: totalPages }, (_, i) => (
            <Pagination.Item key={i + 1} active={i + 1 === page} onClick={() => goToPage(i + 1)}>
              {i + 1}
            </Pagination.Item>
          ))}
          <Pagination.Next onClick={() => goToPage(page + 1)} disabled={page === totalPages} />
        </Pagination>
      )}

      <CreateUserModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={invalidate} />

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete User"
        message={`Permanently delete ${deleteTarget?.first_name} ${deleteTarget?.last_name}? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
      />
    </Container>
  );
}
