import { useActionState } from 'react';
import { useNavigate } from 'react-router';
import { Container, Form, Button, Alert, Card, Row, Col } from 'react-bootstrap';
import { AttendanceSessions } from '../../client/sdk.gen';
import { getErrorMessage } from '../../utils/errors';
import PageHeader from '../../components/common/PageHeader';

interface State { error: string | null; sessionId: number | null }

async function createSessionAction(_prev: State, formData: FormData): Promise<State> {
  try {
    const { data } = await AttendanceSessions.createAttendanceSession({
      body: {
        course_id: Number(formData.get('course_id')),
        venue_id: Number(formData.get('venue_id')),
        semester: String(formData.get('semester')),
        academic_year: String(formData.get('academic_year')),
        session_start: new Date(String(formData.get('session_start'))),
        session_end: new Date(String(formData.get('session_end'))),
      },
    });
    return { error: null, sessionId: data?.session_id ?? null };
  } catch (err: unknown) {
    return { error: getErrorMessage(err), sessionId: null };
  }
}

export default function NewSessionPage() {
  const navigate = useNavigate();
  const [state, formAction, isPending] = useActionState(createSessionAction, {
    error: null, sessionId: null,
  });

  if (state.sessionId) navigate(`/sessions/${state.sessionId}`);

  const currentYear = new Date().getFullYear();

  return (
    <Container fluid>
      <PageHeader title="Start Attendance Session" subtitle="Open a new session to generate a QR code" />
      <Card className="border-0 shadow-sm" style={{ maxWidth: '680px' }}>
        <Card.Body className="p-4">
          {state.error && <Alert variant="danger">{state.error}</Alert>}
          <Form action={formAction}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Course ID</Form.Label>
                  <Form.Control type="number" name="course_id" min={1} required placeholder="e.g. 12" />
                  <Form.Text className="text-muted">From Admin → Courses.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Venue ID</Form.Label>
                  <Form.Control type="number" name="venue_id" min={1} required placeholder="e.g. 3" />
                  <Form.Text className="text-muted">From Admin → Venues.</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Semester</Form.Label>
                  <Form.Select name="semester">
                    <option>Semester 1</option>
                    <option>Semester 2</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Academic Year</Form.Label>
                  <Form.Control
                    type="text" name="academic_year"
                    defaultValue={`${currentYear}/${currentYear + 1}`}
                    pattern="\d{4}/\d{4}" required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Session Start</Form.Label>
                  <Form.Control type="datetime-local" name="session_start" required />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Session End</Form.Label>
                  <Form.Control type="datetime-local" name="session_end" required />
                </Form.Group>
              </Col>
            </Row>
            <div className="mt-4">
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? 'Creating…' : '📋 Open Session & Generate QR'}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
