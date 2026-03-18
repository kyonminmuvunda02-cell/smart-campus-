import { useActionState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useUser } from '@/modules/users/hooks/useUser';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { useTimetable } from '../hooks/useTimetable';
import { getErrorMessage } from '@/utils/errors';
import { useToast } from '@/components/common/ToastManager';

interface ActionState {
  error: string | null;
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SESSION_TYPES = ['Lecture', 'Tutorial', 'Lab', 'Seminar', 'Exam', 'Other'];

function formatTimeRange(startTime: string, endTime: string) {
  return `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
}

export default function TimetablePage() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const { useList: useCourseList } = useCourse();
  const { useList: useUserList } = useUser();
  const { useList: useVenueList } = useVenue();
  const { useList, create, remove, generateSessions } = useTimetable();

  const { data, isLoading } = useList();
  const { data: courseData } = useCourseList();
  const { data: userData } = useUserList();
  const { data: venueData } = useVenueList();

  const entries = data?.items ?? [];
  const courses = (courseData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const users = (userData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const venues = (venueData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const lecturers = users.filter((user) => String(user.role ?? '') === 'Lecturer');

  const activeEntries = entries.filter((entry) => entry.is_active);
  const weekCoverage = new Set(activeEntries.map((entry) => entry.weekday)).size;

  async function handleCreate(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      await create.mutateAsync({
        course_id: Number(formData.get('course_id')),
        lecturer_id: Number(formData.get('lecturer_id')),
        venue_id: Number(formData.get('venue_id')),
        weekday: String(formData.get('weekday')),
        start_time: String(formData.get('start_time')),
        end_time: String(formData.get('end_time')),
        session_type: String(formData.get('session_type')),
        semester: String(formData.get('semester')),
        academic_year: String(formData.get('academic_year')),
        effective_start_date: String(formData.get('effective_start_date') || '').trim() || null,
        effective_end_date: String(formData.get('effective_end_date') || '').trim() || null,
      });
      showToast('success', 'Timetable updated', 'The recurring teaching slot is now available for session generation.');
      return { error: null };
    } catch (error) {
      return { error: getErrorMessage(error) };
    }
  }

  const [createState, createAction, createPending] = useActionState(handleCreate, { error: null });

  async function handleGenerate() {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 13);
    try {
      const result = await generateSessions.mutateAsync({
        start_date: today.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      });
      showToast(
        'success',
        'Sessions generated',
        `${result.created_session_ids.length} scheduled session${result.created_session_ids.length === 1 ? '' : 's'} created for the next two weeks.`,
      );
    } catch (error) {
      showToast('danger', 'Generation failed', getErrorMessage(error));
    }
  }

  async function handleArchive(timetableId: number) {
    try {
      await remove.mutateAsync(timetableId);
      showToast('success', 'Timetable archived', 'The recurring slot has been retired.');
    } catch (error) {
      showToast('danger', 'Archive failed', getErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Teaching operations"
        title="Recurring timetable"
        subtitle="Define repeatable teaching slots, then generate scheduled attendance sessions before the week starts."
        icon="calendar-time"
        tone="teal"
      >
        <Button variant="primary" onClick={() => void handleGenerate()} disabled={generateSessions.isPending}>
          {generateSessions.isPending ? <Spinner animation="border" size="sm" /> : <i className="ti ti-calendar-plus" />}
          Generate 14 days
        </Button>
      </PageHeader>

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Coverage snapshot</h3>
                <div className="section-subtle">Recurring teaching slots currently active in the timetable</div>
              </div>
            </div>
            <div className="session-stat-row">
              <div className="session-stat">
                <label>Active slots</label>
                <strong>{activeEntries.length}</strong>
              </div>
              <div className="session-stat">
                <label>Weekdays covered</label>
                <strong>{weekCoverage}</strong>
              </div>
              <div className="session-stat">
                <label>Generated range</label>
                <strong>14 days</strong>
              </div>
            </div>
          </div>

          <div className="callout-panel teal">
            <i className="ti ti-clock-hour-4" style={{ color: 'var(--teal)' }} />
            <div>
              <div className="callout-title">Timetable first, attendance second</div>
              <div className="callout-copy">
                Lecturers should activate attendance from a scheduled class, not create ad hoc records that drift away from the academic calendar.
              </div>
            </div>
          </div>

          {role === 'Admin' ? (
            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Create recurring slot</h3>
                  <div className="section-subtle">Only lecturers assigned to the course and venues with geofences are valid timetable targets.</div>
                </div>
              </div>

              <ErrorAlert error={createState.error} dismissible />

              <Form action={createAction}>
                <div className="field-shell">
                  <Form.Label className="field-label">Course</Form.Label>
                  <Form.Select name="course_id" required>
                    <option value="">Select course</option>
                    {courses.map((course) => (
                      <option key={Number(course.course_id)} value={Number(course.course_id)}>
                        {String(course.course_code ?? course.course_id)} - {String(course.course_name ?? 'Unnamed')}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div className="field-shell">
                  <Form.Label className="field-label">Lecturer</Form.Label>
                  <Form.Select name="lecturer_id" required>
                    <option value="">Select lecturer</option>
                    {lecturers.map((lecturer) => (
                      <option key={Number(lecturer.user_id)} value={Number(lecturer.user_id)}>
                        {String(lecturer.full_name ?? lecturer.email ?? `User #${lecturer.user_id}`)}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div className="field-shell">
                  <Form.Label className="field-label">Venue</Form.Label>
                  <Form.Select name="venue_id" required>
                    <option value="">Select venue</option>
                    {venues.map((venue) => {
                      const ready = [venue.latitude, venue.longitude, venue.radius_meters].every((value) => value !== null && value !== undefined);
                      return (
                        <option key={Number(venue.venue_id)} value={Number(venue.venue_id)}>
                          {String(venue.venue_name ?? venue.venue_id)}{ready ? '' : ' (needs geofence)'}
                        </option>
                      );
                    })}
                  </Form.Select>
                </div>

                <div className="session-stat-row timetable-form-grid">
                  <div className="field-shell">
                    <Form.Label className="field-label">Weekday</Form.Label>
                    <Form.Select name="weekday" defaultValue="Monday" required>
                      {WEEKDAYS.map((weekday) => <option key={weekday} value={weekday}>{weekday}</option>)}
                    </Form.Select>
                  </div>
                  <div className="field-shell">
                    <Form.Label className="field-label">Session type</Form.Label>
                    <Form.Select name="session_type" defaultValue="Lecture" required>
                      {SESSION_TYPES.map((sessionType) => <option key={sessionType} value={sessionType}>{sessionType}</option>)}
                    </Form.Select>
                  </div>
                </div>

                <div className="session-stat-row timetable-form-grid">
                  <div className="field-shell">
                    <Form.Label className="field-label">Start time</Form.Label>
                    <Form.Control type="time" name="start_time" required />
                  </div>
                  <div className="field-shell">
                    <Form.Label className="field-label">End time</Form.Label>
                    <Form.Control type="time" name="end_time" required />
                  </div>
                </div>

                <div className="session-stat-row timetable-form-grid">
                  <div className="field-shell">
                    <Form.Label className="field-label">Semester</Form.Label>
                    <Form.Select name="semester" defaultValue="Semester 1" required>
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                    </Form.Select>
                  </div>
                  <div className="field-shell">
                    <Form.Label className="field-label">Academic year</Form.Label>
                    <Form.Control name="academic_year" defaultValue="2025/2026" required />
                  </div>
                </div>

                <div className="session-stat-row timetable-form-grid">
                  <div className="field-shell">
                    <Form.Label className="field-label">Effective from</Form.Label>
                    <Form.Control type="date" name="effective_start_date" />
                  </div>
                  <div className="field-shell">
                    <Form.Label className="field-label">Effective to</Form.Label>
                    <Form.Control type="date" name="effective_end_date" />
                  </div>
                </div>

                <div className="ph-actions attendance-review-actions" style={{ marginTop: '1rem' }}>
                  <Button type="submit" variant="primary" disabled={createPending}>
                    {createPending ? <Spinner animation="border" size="sm" /> : <i className="ti ti-plus" />}
                    Save slot
                  </Button>
                </div>
              </Form>
            </div>
          ) : null}
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>Recurring slots</h3>
              <div className="section-subtle">Timetable entries visible to the current workspace</div>
            </div>
            <span className="status-pill teal"><i className="ti ti-calendar-event" />{entries.length} slots</span>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={8} columns={6} />
          ) : entries.length === 0 ? (
            <EmptyState icon="ti-calendar-off" title="No timetable slots" message="Create recurring classes before generating scheduled attendance sessions." />
          ) : (
            <div className="table-shell">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Academic context</th>
                    <th>Ownership</th>
                    <th>Status</th>
                    {role === 'Admin' ? <th className="text-end">Actions</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.timetable_id}>
                      <td>
                        <div className="entity-copy">
                          <strong>{entry.weekday}</strong>
                          <span>{formatTimeRange(entry.start_time, entry.end_time)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="entity-copy">
                          <strong>{entry.session_type}</strong>
                          <span>Course #{entry.course_id} · {entry.semester} · {entry.academic_year}</span>
                        </div>
                      </td>
                      <td className="text-secondary small">
                        Lecturer #{entry.lecturer_id} · Venue #{entry.venue_id}
                      </td>
                      <td>
                        <span className={`status-pill ${entry.is_active ? 'green' : 'amber'}`}>
                          <i className={`ti ti-${entry.is_active ? 'calendar-check' : 'calendar-off'}`} />
                          {entry.is_active ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      {role === 'Admin' ? (
                        <td className="text-end">
                          <div className="table-actions">
                            <Button variant="outline-secondary" size="sm" onClick={() => void handleArchive(entry.timetable_id)} disabled={remove.isPending}>
                              <i className="ti ti-archive" />Archive
                            </Button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
