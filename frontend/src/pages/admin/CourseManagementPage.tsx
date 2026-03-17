import { useState, useActionState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container, Table, Spinner, Alert, Button, Modal,
  Form, Row, Col, Pagination,
} from 'react-bootstrap';
import { Courses } from '../../client/sdk.gen';
import type { CourseResponse, CourseCreate } from '../../client/types.gen';
import { getErrorMessage, getErrorStatus } from '../../utils/errors';
import PageHeader from '../../components/common/PageHeader';
import ConfirmModal from '../../components/common/ConfirmModal';
import { usePagination } from '../../hooks/usePagination';

interface CreateState { error: string | null }

function CreateCourseModal({ show, onHide, onCreated }: { show: boolean; onHide: () => void; onCreated: () => void }) {
  async function createAction(_prev: CreateState, formData: FormData): Promise<CreateState> {
    try {
      const body: CourseCreate = {
        course_code: String(formData.get('course_code')),
        course_name: String(formData.get('course_name')),
        credits: Number(formData.get('credits')),
        department: String(formData.get('department')),
      };
      await Courses.createCourse({ body });
      onCreated();
      onHide();
      return { error: null };
    } catch (err) {
      const status = getErrorStatus(err);
      if (status === 409) return { error: 'A course with that code already exists.' };
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(createAction, { error: null });

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton><Modal.Title>Create New Course</Modal.Title></Modal.Header>
      <Form action={formAction}>
        <Modal.Body>
          {state.error && <Alert variant="danger">{state.error}</Alert>}
          <Row className="g-3">
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Course Code</Form.Label>
                <Form.Control name="course_code" placeholder="e.g. CS301" required />
              </Form.Group>
            </Col>
            <Col xs={6}>
              <Form.Group>
                <Form.Label>Credits</Form.Label>
                <Form.Control type="number" name="credits" min={1} max={30} defaultValue={3} required />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Course Name</Form.Label>
                <Form.Control name="course_name" placeholder="e.g. Database Systems" required />
              </Form.Group>
            </Col>
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Department</Form.Label>
                <Form.Control name="department" placeholder="e.g. Computer Science" required />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create Course'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function CourseManagementPage() {
  const qc = useQueryClient();
  const { skip, limit, page, totalPages, goToPage, setTotal } = usePagination(20);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CourseResponse | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ['courses', skip, limit],
    queryFn: async () => {
      const { data } = await Courses.listCourses({ query: { skip, limit } });
      if (data) setTotal(data.total);
      return data;
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['courses'] });

  const deleteMutation = useMutation({
    mutationFn: (c: CourseResponse) => Courses.deleteCourse({ path: { course_id: c.course_id } }),
    onSuccess: () => { setDeleteTarget(null); invalidate(); },
  });

  const courses = data?.items ?? [];

  if (isPending && courses.length === 0) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger" className="m-4">{getErrorMessage(error)}</Alert>;

  return (
    <Container fluid className="py-4">
      <PageHeader
        title="Course Management"
        subtitle={`${data?.total ?? 0} courses`}
        action={<Button variant="primary" onClick={() => setShowCreate(true)}>+ New Course</Button>}
      />

      <Table striped hover responsive>
        <thead>
          <tr><th>ID</th><th>Code</th><th>Name</th><th>Dept</th><th>Credits</th><th>Created</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.course_id}>
              <td>{c.course_id}</td>
              <td><code>{c.course_code}</code></td>
              <td>{c.course_name}</td>
              <td>{c.department}</td>
              <td>{c.credits}</td>
              <td>{c.created_at.toLocaleDateString()}</td>
              <td>
                <Button size="sm" variant="outline-danger" onClick={() => setDeleteTarget(c)}>Delete</Button>
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

      <CreateCourseModal show={showCreate} onHide={() => setShowCreate(false)} onCreated={invalidate} />

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Course"
        message={`Permanently delete "${deleteTarget?.course_name}" (${deleteTarget?.course_code})? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isPending={deleteMutation.isPending}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
        onHide={() => setDeleteTarget(null)}
      />
    </Container>
  );
}
