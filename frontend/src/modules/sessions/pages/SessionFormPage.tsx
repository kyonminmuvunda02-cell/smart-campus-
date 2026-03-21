import { useActionState } from 'react';
import { useNavigate, Link, useParams } from 'react-router';
import { Button, Form, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import ErrorAlert from '@/components/common/ErrorAlert';
import SearchableSelect from '@/components/common/SearchableSelect';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
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
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { useDetail, create, update } = useSession();

  const { useList: useCourses } = useCourse();
  const { useList: useVenues } = useVenue();
  const sessionId = id ? Number(id) : undefined;
  const isEditing = !!sessionId;

  const { data: coursesData } = useCourses({ query: { limit: 500 } });
  const { data: venuesData } = useVenues({ query: { limit: 500 } });
  const { data: sessionData, isLoading: loadingSession } = useDetail(sessionId);

  async function handleSubmit(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      const courseId = Number(formData.get('course_id'));
      const venueId = Number(formData.get('venue_id'));
      const sessionType = String(formData.get('session_type') || 'Lecture');
      const semester = String(formData.get('semester'));
      const academicYear = String(formData.get('academic_year'));
      const sessionStart = new Date(String(formData.get('session_start')));
      const sessionEnd = new Date(String(formData.get('session_end')));

      const body = {
        course_id: courseId,
        venue_id: venueId,
        session_type: sessionType,
        semester,
        academic_year: academicYear,
        session_start: sessionStart,
        session_end: sessionEnd,
      };

      const result = isEditing
        ? await update.mutateAsync({
            path: { session_id: sessionId! },
            body,
          })
        : await create.mutateAsync({ body });

      showToast(
        'success',
        isEditing ? 'Class updated' : 'Class created',
        isEditing
          ? 'The scheduled class details have been updated.'
          : 'Open the class monitor when you are ready to start check-in.',
      );
      navigate(`/sessions/${result.session_id}`);
      return { error: null };
    } catch (err) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, { error: null });

  const courses = (coursesData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const venues = (venuesData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const sessionRecord = sessionData as Record<string, unknown> | undefined;
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const classStart = sessionRecord?.session_start ? new Date(sessionRecord.session_start as string | Date) : now;
  const classEnd = sessionRecord?.session_end ? new Date(sessionRecord.session_end as string | Date) : oneHourFromNow;
  const isEditable = sessionRecord
    ? !Boolean(sessionRecord.is_active) && classStart.getTime() > Date.now()
    : true;

  if (isEditing && loadingSession) {
    return <div className="p-4"><LoadingSkeleton rows={8} /></div>;
  }

  if (isEditing && !sessionRecord) {
    return <EmptyState title="Class Not Found" message="The class you are trying to edit does not exist." />;
  }

  if (isEditing && !isEditable) {
    return (
      <div className="stack gap-4">
        <PageHeader
          title="Edit Class"
          subtitle="Only scheduled classes can be edited."
          icon="edit"
          tone="teal"
          breadcrumbs={[{ label: 'Teaching Ops', path: '/sessions' }, { label: 'Classes', path: '/sessions' }, { label: 'Edit Class' }]}
        >
          <Link to={`/sessions/${sessionId}`}><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
        </PageHeader>
        <div className="surface-card p-5">
          <EmptyState title="Class Not Editable" message="This class is already live or has already passed. Scheduled classes can be edited before check-in opens.">
            <Link to={`/sessions/${sessionId}`}><Button variant="primary">Open Class</Button></Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  return (
    <div className="stack gap-4">
      <PageHeader
        title={isEditing ? 'Edit Class' : 'Create Class'}
        subtitle={isEditing ? 'Update the scheduled class before attendance begins.' : 'Select the course, choose an approved venue, and define when the class will run.'}
        icon={isEditing ? 'edit' : 'calendar-plus'}
        tone="teal"
        breadcrumbs={[{ label: 'Teaching Ops', path: '/sessions' }, { label: 'Classes', path: '/sessions' }, { label: isEditing ? 'Edit Class' : 'Create Class' }]}
      >
        <Link to={isEditing ? `/sessions/${sessionId}` : '/sessions'}><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
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
                      defaultValue={sessionRecord ? String(sessionRecord.course_id ?? '') : ''}
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
                      defaultValue={sessionRecord ? String(sessionRecord.venue_id ?? '') : ''}
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
                    <label className="field-label">Class Type</label>
                    <Form.Select name="session_type" defaultValue={String(sessionRecord?.session_type ?? 'Lecture')} className="form-control-sm h-auto py-2">
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
                    <Form.Select name="semester" defaultValue={String(sessionRecord?.semester ?? 'Semester 1')} className="form-control-sm h-auto py-2">
                      <option>Semester 1</option>
                      <option>Semester 2</option>
                    </Form.Select>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="field-shell">
                    <label className="field-label">Academic Year</label>
                    <Form.Control name="academic_year" defaultValue={String(sessionRecord?.academic_year ?? '2025/2026')} className="form-control-sm h-auto py-2" />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="field-shell">
                    <label className="field-label">Window Start</label>
                    <Form.Control type="datetime-local" name="session_start" defaultValue={toLocalDateTimeInputValue(classStart)} className="form-control-sm h-auto py-2" />
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="field-shell">
                    <label className="field-label">Window End</label>
                    <Form.Control type="datetime-local" name="session_end" defaultValue={toLocalDateTimeInputValue(classEnd)} className="form-control-sm h-auto py-2" />
                  </div>
                </div>
              </div>

              <div className="callout-panel teal mt-4 mb-4">
                <i className="ti ti-info-circle fs-4" />
                <div className="small">
                  {isEditing
                    ? 'Scheduled classes can be updated before the lecturer opens check-in. Live and completed classes are locked.'
                    : 'This class is created directly from the selected course and venue. Check-in stays closed until the lecturer opens the live QR inside the class monitor.'}
                </div>
              </div>

              <div className="d-flex gap-2">
                <Button type="submit" variant="primary" disabled={isPending || (isEditing ? update.isPending : create.isPending)} className="px-4 fw-bold">
                  {isPending ? <Spinner size="sm" className="me-2" /> : <i className="ti ti-calendar-check me-2" />}
                  {isEditing ? 'Save Changes' : 'Create Class'}
                </Button>
                <Link to={isEditing ? `/sessions/${sessionId}` : '/sessions'}><Button variant="outline-secondary">Cancel</Button></Link>
              </div>
            </Form>
      </div>
    </div>
  );
}
