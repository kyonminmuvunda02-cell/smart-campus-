import { useActionState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button, Card, Form, Row, Col, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import ErrorAlert from '@/components/common/ErrorAlert';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { useSession } from '@/modules/sessions/hooks/useSession';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';

interface ActionState {
  error: string | null;
}

function toLocalDateTimeInputValue(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

export default function SessionFormPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { create } = useSession();

  const { useList: useCourses } = useCourse();
  const { useList: useVenues } = useVenue();

  const { data: coursesData, isLoading: loadingCourses } = useCourses();
  const { data: venuesData, isLoading: loadingVenues } = useVenues();

  async function handleSubmit(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      const courseId = Number(formData.get('course_id'));
      const venueId = Number(formData.get('venue_id'));
      const sessionType = String(formData.get('session_type') || 'Lecture');
      const timetableSlot = String(formData.get('timetable_slot') || '').trim() || null;
      const semester = String(formData.get('semester'));
      const academicYear = String(formData.get('academic_year'));
      const sessionStart = new Date(String(formData.get('session_start')));
      const sessionEnd = new Date(String(formData.get('session_end')));

      const result = await create.mutateAsync({
        body: {
          course_id: courseId,
          venue_id: venueId,
          session_type: sessionType,
          timetable_slot: timetableSlot,
          semester,
          academic_year: academicYear,
          session_start: sessionStart,
          session_end: sessionEnd,
        },
      });

      showToast('success', 'Session scheduled', 'The class is now on the lecturer schedule and can be started when it is time to take attendance.');
      navigate(`/sessions/${result.session_id}`);
      return { error: null };
    } catch (err) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, { error: null });

  const courses = (coursesData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const venues = (venuesData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  return (
    <div>
      <PageHeader
        title="Schedule Session"
        subtitle="Create the class window in advance, then start attendance when the lecturer is ready."
      >
        <Link to="/sessions">
          <Button variant="outline-secondary">
            <i className="ti ti-arrow-left me-2" />Back to Sessions
          </Button>
        </Link>
      </PageHeader>

      <Row className="justify-content-center">
        <Col md={7}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <ErrorAlert error={state.error} dismissible />

              <Form action={formAction}>
                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Course</Form.Label>
                  {loadingCourses ? (
                    <div className="py-2"><Spinner animation="border" size="sm" variant="primary" /></div>
                  ) : (
                    <SearchableSelect
                      name="course_id"
                      required
                      placeholder="Select a course..."
                      searchPlaceholder="Search course code or title..."
                      options={courses.map((course) => ({
                        value: String(course.course_id as number),
                        label: `${course.course_code as string} - ${course.course_name as string}`,
                        meta: `Course #${String(course.course_id as number)}`,
                        keywords: `${String(course.course_code ?? '')} ${String(course.course_name ?? '')}`,
                      }))}
                    />
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Venue</Form.Label>
                  {loadingVenues ? (
                    <div className="py-2"><Spinner animation="border" size="sm" variant="primary" /></div>
                  ) : (
                    <SearchableSelect
                      name="venue_id"
                      required
                      placeholder="Select a venue..."
                      searchPlaceholder="Search venue or building..."
                      options={venues.map((venue) => ({
                        value: String(venue.venue_id as number),
                        label: `${venue.venue_name as string}${(venue.building as string) ? ` (${venue.building as string})` : ''}`,
                        meta: [venue.latitude, venue.longitude, venue.radius_meters].every((item) => item !== null && item !== undefined)
                          ? 'Geofence ready'
                          : 'Needs geofence',
                        keywords: `${String(venue.venue_name ?? '')} ${String(venue.building ?? '')}`,
                      }))}
                    />
                  )}
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Session type</Form.Label>
                      <Form.Select name="session_type" defaultValue="Lecture" required className="py-2">
                        <option value="Lecture">Lecture</option>
                        <option value="Tutorial">Tutorial</option>
                        <option value="Lab">Lab</option>
                        <option value="Seminar">Seminar</option>
                        <option value="Exam">Exam</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Semester</Form.Label>
                      <Form.Select name="semester" defaultValue="Semester 1" required className="py-2">
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Academic Year</Form.Label>
                      <Form.Control
                        name="academic_year"
                        defaultValue={`${now.getFullYear()}/${now.getFullYear() + 1}`}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="small fw-semibold">Timetable slot</Form.Label>
                  <Form.Control
                    name="timetable_slot"
                    placeholder="e.g. Mon 08:00-10:00"
                    className="py-2"
                  />
                </Form.Group>

                <Row className="g-3 mb-4">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Scheduled Start</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        name="session_start"
                        defaultValue={toLocalDateTimeInputValue(now)}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label className="small fw-semibold">Scheduled End</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        name="session_end"
                        defaultValue={toLocalDateTimeInputValue(oneHourFromNow)}
                        required
                        className="py-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="login-hint mb-4">
                  Scheduling a session does not open attendance immediately. The lecturer still starts the live check-in window when the class actually begins, and only geofenced venues can be scheduled.
                </div>

                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="py-2 fw-bold"
                    disabled={isPending || loadingCourses || loadingVenues}
                  >
                    {isPending ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Scheduling...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-calendar-event me-2" />Schedule Session
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
