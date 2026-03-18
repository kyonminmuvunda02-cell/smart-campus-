import { useActionState, useMemo, useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorAlert from '@/components/common/ErrorAlert';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useUser } from '@/modules/users/hooks/useUser';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { useTimetable, type TimetableItem } from '../hooks/useTimetable';
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

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getInitialRange() {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 13);
  return { start: toDateInput(start), end: toDateInput(end) };
}

export default function TimetablePage() {
  const { role } = useAuth();
  const { showToast } = useToast();
  const { useList: useCourseList } = useCourse();
  const { useList: useUserList } = useUser();
  const { useList: useVenueList } = useVenue();
  const { useList, create, update, remove, generateSessions } = useTimetable();
  const [selectedEntry, setSelectedEntry] = useState<TimetableItem | null>(null);
  const [generationRange, setGenerationRange] = useState(getInitialRange);
  const [generationSummary, setGenerationSummary] = useState<{ created: number; skipped: number } | null>(null);

  const { data, isLoading } = useList({ limit: 200 });
  const { data: courseData } = useCourseList({ query: { limit: 200 } });
  const { data: userData } = useUserList({ query: { limit: 200 } });
  const { data: venueData } = useVenueList({ query: { limit: 200 } });

  const entries = data?.items ?? [];
  const courses = (courseData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const users = (userData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const venues = (venueData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const lecturers = users.filter((user) => String(user.role ?? '') === 'Lecturer');

  const activeEntries = entries.filter((entry) => entry.is_active);
  const weekCoverage = new Set(activeEntries.map((entry) => entry.weekday)).size;
  const archivedEntries = entries.filter((entry) => !entry.is_active).length;
  const formKey = selectedEntry ? `edit-${selectedEntry.timetable_id}` : 'create';

  const schedulePressure = useMemo(
    () => activeEntries.reduce((acc, entry) => acc + (entry.weekday === 'Friday' ? 1 : 0), 0),
    [activeEntries],
  );

  async function handleCreateOrUpdate(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      const payload = {
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
      };

      if (selectedEntry) {
        await update.mutateAsync({
          timetableId: selectedEntry.timetable_id,
          body: payload,
        });
        showToast('success', 'Timetable updated', 'The recurring teaching slot has been refreshed.');
        setSelectedEntry(null);
      } else {
        await create.mutateAsync(payload);
        showToast('success', 'Timetable updated', 'The recurring teaching slot is now available for session generation.');
      }
      return { error: null };
    } catch (error) {
      return { error: getErrorMessage(error) };
    }
  }

  const [createState, createAction, createPending] = useActionState(handleCreateOrUpdate, { error: null });

  async function handleGenerate() {
    try {
      const result = await generateSessions.mutateAsync({
        start_date: generationRange.start,
        end_date: generationRange.end,
      });
      setGenerationSummary({
        created: result.created_session_ids.length,
        skipped: result.skipped_dates.length,
      });
      showToast(
        'success',
        'Sessions generated',
        `${result.created_session_ids.length} scheduled session${result.created_session_ids.length === 1 ? '' : 's'} created in the selected range.`,
      );
    } catch (error) {
      showToast('danger', 'Generation failed', getErrorMessage(error));
    }
  }

  async function handleArchive(timetableId: number) {
    try {
      await remove.mutateAsync(timetableId);
      if (selectedEntry?.timetable_id === timetableId) {
        setSelectedEntry(null);
      }
      showToast('success', 'Timetable archived', 'The recurring slot has been retired.');
    } catch (error) {
      showToast('danger', 'Archive failed', getErrorMessage(error));
    }
  }

  if (isLoading) {
    return <LoadingSkeleton rows={8} columns={6} />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Teaching operations"
        title="Recurring timetable"
        subtitle="Define repeatable teaching slots, generate scheduled sessions in batches, and keep the timetable aligned with reality."
        icon="calendar-time"
        tone="teal"
      >
        <Button variant="primary" onClick={() => void handleGenerate()} disabled={generateSessions.isPending}>
          {generateSessions.isPending ? <Spinner animation="border" size="sm" /> : <i className="ti ti-calendar-plus" />}
          Generate sessions
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
                <label>Archived slots</label>
                <strong>{archivedEntries}</strong>
              </div>
            </div>
            <div className="callout-panel teal" style={{ marginTop: '0.9rem' }}>
              <i className="ti ti-calendar-stats" style={{ color: 'var(--teal)' }} />
              <div>
                <div className="callout-title">Friday load</div>
                <div className="callout-copy">
                  {schedulePressure} active recurring slot{schedulePressure === 1 ? '' : 's'} currently land on Friday.
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Generation range</h3>
                <div className="section-subtle">Choose the date window used to create scheduled attendance sessions from the timetable.</div>
              </div>
            </div>
            <div className="session-stat-row timetable-form-grid">
              <div className="field-shell">
                <Form.Label className="field-label">Start date</Form.Label>
                <Form.Control
                  type="date"
                  value={generationRange.start}
                  onChange={(event) => setGenerationRange((current) => ({ ...current, start: event.target.value }))}
                />
              </div>
              <div className="field-shell">
                <Form.Label className="field-label">End date</Form.Label>
                <Form.Control
                  type="date"
                  value={generationRange.end}
                  onChange={(event) => setGenerationRange((current) => ({ ...current, end: event.target.value }))}
                />
              </div>
            </div>

            {generationSummary ? (
              <Alert variant="info" className="mb-0">
                <i className="ti ti-info-circle me-2" />
                Created {generationSummary.created} session{generationSummary.created === 1 ? '' : 's'} and skipped {generationSummary.skipped} already-existing slot{generationSummary.skipped === 1 ? '' : 's'} in the last run.
              </Alert>
            ) : null}
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
                  <h3>{selectedEntry ? `Edit recurring slot #${selectedEntry.timetable_id}` : 'Create recurring slot'}</h3>
                  <div className="section-subtle">Only lecturers assigned to the course and venues with geofences are valid timetable targets.</div>
                </div>
                {selectedEntry ? (
                  <Button variant="outline-secondary" onClick={() => setSelectedEntry(null)}>
                    <i className="ti ti-x" />Cancel edit
                  </Button>
                ) : null}
              </div>

              <ErrorAlert error={createState.error} dismissible />

              <Form key={formKey} action={createAction}>
                <div className="field-shell">
                  <Form.Label className="field-label">Course</Form.Label>
                  <SearchableSelect
                    name="course_id"
                    required
                    defaultValue={selectedEntry ? String(selectedEntry.course_id) : ''}
                    placeholder="Select course"
                    searchPlaceholder="Search course code or title..."
                    options={courses.map((course) => ({
                      value: String(Number(course.course_id)),
                      label: `${String(course.course_code ?? course.course_id)} - ${String(course.course_name ?? 'Unnamed')}`,
                      meta: String(course.department ?? ''),
                      keywords: `${String(course.course_code ?? '')} ${String(course.course_name ?? '')} ${String(course.department ?? '')}`,
                    }))}
                  />
                </div>

                <div className="field-shell">
                  <Form.Label className="field-label">Lecturer</Form.Label>
                  <SearchableSelect
                    name="lecturer_id"
                    required
                    defaultValue={selectedEntry ? String(selectedEntry.lecturer_id) : ''}
                    placeholder="Select lecturer"
                    searchPlaceholder="Search lecturer..."
                    options={lecturers.map((lecturer) => ({
                      value: String(Number(lecturer.user_id)),
                      label: String(lecturer.full_name ?? lecturer.email ?? `User #${lecturer.user_id}`),
                      meta: String(lecturer.email ?? ''),
                      keywords: `${String(lecturer.full_name ?? '')} ${String(lecturer.email ?? '')}`,
                    }))}
                  />
                </div>

                <div className="field-shell">
                  <Form.Label className="field-label">Venue</Form.Label>
                  <SearchableSelect
                    name="venue_id"
                    required
                    defaultValue={selectedEntry ? String(selectedEntry.venue_id) : ''}
                    placeholder="Select venue"
                    searchPlaceholder="Search venue or building..."
                    options={venues.map((venue) => {
                      const ready = [venue.latitude, venue.longitude, venue.radius_meters].every((value) => value !== null && value !== undefined);
                      return {
                        value: String(Number(venue.venue_id)),
                        label: String(venue.venue_name ?? venue.venue_id),
                        meta: ready ? 'Geofence ready' : 'Needs geofence',
                        keywords: `${String(venue.venue_name ?? '')} ${String(venue.building ?? '')}`,
                      };
                    })}
                  />
                </div>

                <div className="session-stat-row timetable-form-grid">
                  <div className="field-shell">
                    <Form.Label className="field-label">Weekday</Form.Label>
                    <Form.Select name="weekday" defaultValue={selectedEntry?.weekday ?? 'Monday'} required>
                      {WEEKDAYS.map((weekday) => <option key={weekday} value={weekday}>{weekday}</option>)}
                    </Form.Select>
                  </div>
                  <div className="field-shell">
                    <Form.Label className="field-label">Session type</Form.Label>
                    <Form.Select name="session_type" defaultValue={selectedEntry?.session_type ?? 'Lecture'} required>
                      {SESSION_TYPES.map((sessionType) => <option key={sessionType} value={sessionType}>{sessionType}</option>)}
                    </Form.Select>
                  </div>
                </div>

                <div className="session-stat-row timetable-form-grid">
                  <div className="field-shell">
                    <Form.Label className="field-label">Start time</Form.Label>
                    <Form.Control type="time" name="start_time" required defaultValue={selectedEntry?.start_time?.slice(0, 5) ?? ''} />
                  </div>
                  <div className="field-shell">
                    <Form.Label className="field-label">End time</Form.Label>
                    <Form.Control type="time" name="end_time" required defaultValue={selectedEntry?.end_time?.slice(0, 5) ?? ''} />
                  </div>
                </div>

                <div className="session-stat-row timetable-form-grid">
                  <div className="field-shell">
                    <Form.Label className="field-label">Semester</Form.Label>
                    <Form.Select name="semester" defaultValue={selectedEntry?.semester ?? 'Semester 1'} required>
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                    </Form.Select>
                  </div>
                  <div className="field-shell">
                    <Form.Label className="field-label">Academic year</Form.Label>
                    <Form.Control name="academic_year" defaultValue={selectedEntry?.academic_year ?? '2025/2026'} required />
                  </div>
                </div>

                <div className="session-stat-row timetable-form-grid">
                  <div className="field-shell">
                    <Form.Label className="field-label">Effective from</Form.Label>
                    <Form.Control type="date" name="effective_start_date" defaultValue={selectedEntry?.effective_start_date ?? ''} />
                  </div>
                  <div className="field-shell">
                    <Form.Label className="field-label">Effective to</Form.Label>
                    <Form.Control type="date" name="effective_end_date" defaultValue={selectedEntry?.effective_end_date ?? ''} />
                  </div>
                </div>

                <div className="ph-actions attendance-review-actions" style={{ marginTop: '1rem' }}>
                  <Button type="submit" variant="primary" disabled={createPending}>
                    {createPending ? <Spinner animation="border" size="sm" /> : <i className={`ti ti-${selectedEntry ? 'device-floppy' : 'plus'}`} />}
                    {selectedEntry ? 'Save changes' : 'Save slot'}
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

          {entries.length === 0 ? (
            <EmptyState icon="ti-calendar-off" title="No timetable slots" message="Create recurring classes before generating scheduled attendance sessions." />
          ) : (
            <div className="table-shell">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Academic context</th>
                    <th>Lifecycle</th>
                    <th>Ownership</th>
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
                          <span>Course #{entry.course_id} - {entry.semester} - {entry.academic_year}</span>
                        </div>
                      </td>
                      <td className="text-secondary small">
                        {entry.effective_start_date || entry.effective_end_date
                          ? `${entry.effective_start_date ?? 'Start now'} -> ${entry.effective_end_date ?? 'Open-ended'}`
                          : 'Open-ended recurring slot'}
                      </td>
                      <td className="text-secondary small">
                        Lecturer #{entry.lecturer_id} - Venue #{entry.venue_id}
                      </td>
                      {role === 'Admin' ? (
                        <td className="text-end">
                          <div className="table-actions">
                            <Button variant="outline-primary" size="sm" onClick={() => setSelectedEntry(entry)} disabled={remove.isPending || update.isPending}>
                              <i className="ti ti-edit" />Edit
                            </Button>
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
