import { useActionState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button, Form, Spinner } from 'react-bootstrap';
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

  const { data: coursesData } = useCourses({ query: { limit: 500 } });
  const { data: venuesData } = useVenues({ query: { limit: 500 } });

  async function handleSubmit(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      const courseId = Number(formData.get('course_id'));
      const venueId = Number(formData.get('venue_id'));
      const sessionType = String(formData.get('session_type') || 'Lecture');
      const semester = String(formData.get('semester'));
      const academicYear = String(formData.get('academic_year'));
      const sessionStart = new Date(String(formData.get('session_start')));
      const sessionEnd = new Date(String(formData.get('session_end')));

      const result = await create.mutateAsync({
        body: {
          course_id: courseId,
          venue_id: venueId,
          session_type: sessionType,
          semester,
          academic_year: academicYear,
          session_start: sessionStart,
          session_end: sessionEnd,
        },
      });

      showToast('success', 'Session scheduled', 'Ready for attendance capture.');
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
    <div className="stack gap-4">
      <PageHeader
        title="Schedule Teaching Session"
        subtitle="Select the course, choose an approved venue, and define when students can check in."
        icon="calendar-plus"
        tone="teal"
        breadcrumbs={[{ label: 'Teaching Ops', path: '/sessions' }, { label: 'Schedule' }]}
      >
        <Link to="/sessions"><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
      </PageHeader>

      <div className="surface-card p-4 shadow-sm border-0">
        <ErrorAlert error={state.error} dismissible />
        <Form action={formAction}>
          <div className="row g-4">
                <div className="col-md-12">
                  <div className="field-shell">
                    <label className="field-label">Target Unit / Course</label>
                    <SearchableSelect
                      name="course_id"
                      required
                      placeholder="Select course..."
                      searchPlaceholder="Search by code or course name..."
                      options={courses.map(c => ({
                        value: String(c.course_id),
                        label: `${c.course_code} - ${c.course_name}`,
                        meta: String(c.department ?? ''),
                        keywords: `${String(c.course_code ?? '')} ${String(c.course_name ?? '')} ${String(c.department ?? '')}`
                      }))}
                    />
                  </div>
                </div>

                <div className="col-md-12">
                  <div className="field-shell">
                    <label className="field-label">Assigned Venue</label>
                    <SearchableSelect
                      name="venue_id"
                      required
                      placeholder="Select venue..."
                      searchPlaceholder="Search by venue or building..."
                      options={venues.map(v => ({
                        value: String(v.venue_id),
                        label: `${v.venue_name} (${v.building || 'Main Campus'})`,
                        meta: [v.latitude, v.longitude, v.radius_meters].every(i => i !== null) ? 'Geofence Ready' : 'Needs Setup',
                        keywords: `${String(v.venue_name ?? '')} ${String(v.building ?? '')} ${String(v.venue_code ?? '')}`
                      }))}
                    />
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="field-shell">
                    <label className="field-label">Session Type</label>
                    <Form.Select name="session_type" defaultValue="Lecture" className="form-control-sm h-auto py-2">
                      <option>Lecture</option>
                      <option>Tutorial</option>
                      <option>Lab</option>
                      <option>Seminar</option>
                      <option>Exam</option>
                    </Form.Select>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="field-shell">
                    <label className="field-label">Semester</label>
                    <Form.Select name="semester" className="form-control-sm h-auto py-2">
                      <option>Semester 1</option>
                      <option>Semester 2</option>
                    </Form.Select>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="field-shell">
                    <label className="field-label">Academic Year</label>
                    <Form.Control name="academic_year" defaultValue="2025/2026" className="form-control-sm h-auto py-2" />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="field-shell">
                    <label className="field-label">Window Start</label>
                    <Form.Control type="datetime-local" name="session_start" defaultValue={toLocalDateTimeInputValue(now)} className="form-control-sm h-auto py-2" />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="field-shell">
                    <label className="field-label">Window End</label>
                    <Form.Control type="datetime-local" name="session_end" defaultValue={toLocalDateTimeInputValue(oneHourFromNow)} className="form-control-sm h-auto py-2" />
                  </div>
                </div>
              </div>

              <div className="callout-panel teal mt-4 mb-4">
                <i className="ti ti-info-circle fs-4" />
                <div className="small">
                  This session is created directly from the selected course and venue. Attendance stays dormant until the lecturer starts the live QR inside the session monitor.
                </div>
              </div>

              <div className="d-flex gap-2">
                <Button type="submit" variant="primary" disabled={isPending} className="px-4 fw-bold">
                  {isPending ? <Spinner size="sm" className="me-2" /> : <i className="ti ti-calendar-check me-2" />}
                  Create Session
                </Button>
                <Link to="/sessions"><Button variant="outline-secondary">Cancel</Button></Link>
              </div>
            </Form>
      </div>
    </div>
  );
}
