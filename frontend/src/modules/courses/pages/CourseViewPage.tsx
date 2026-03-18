import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Button, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import ErrorAlert from '@/components/common/ErrorAlert';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useCourse } from '../hooks/useCourse';
import { useUser } from '@/modules/users/hooks/useUser';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';

export default function CourseViewPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = id ? Number(id) : undefined;
  const [selectedLecturerId, setSelectedLecturerId] = useState('');
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { useDetail, useAssignments, assignLecturer, removeLecturer } = useCourse();
  const { useList: useUsers } = useUser();

  const { data: course, isLoading } = useDetail(courseId);
  const { data: assignmentsData, isLoading: loadingAssignments } = useAssignments(courseId);
  const { data: usersData } = useUsers({ query: { skip: 0, limit: 200 } });

  if (isLoading) return <div className="empty-panel"><i className="ti ti-loader" /><div>Loading course...</div></div>;
  if (!course) return <div className="empty-panel"><i className="ti ti-mood-empty" /><div>Course not found.</div></div>;

  const currentCourse = course as Record<string, unknown>;
  const credits = Number(currentCourse.credits ?? 0);
  const assignments = (assignmentsData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const users = (usersData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const lecturers = users.filter((user) => user.role === 'Lecturer');
  const activeLecturerIds = new Set(assignments.map((assignment) => Number(assignment.lecturer_id ?? 0)));
  const availableLecturers = lecturers.filter((lecturer) => !activeLecturerIds.has(Number(lecturer.user_id ?? 0)));

  async function handleAssignLecturer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!courseId || !Number(selectedLecturerId)) return;

    try {
      setAssignmentError(null);
      await assignLecturer.mutateAsync({
        body: {
          course_id: courseId,
          lecturer_id: Number(selectedLecturerId),
        },
      });
      showToast('success', 'Lecturer assigned', 'The lecturer can now teach and run sessions for this course.');
      setSelectedLecturerId('');
    } catch (error) {
      setAssignmentError(getErrorMessage(error));
    }
  }

  async function handleRemoveLecturer(lecturerId: number) {
    if (!courseId) return;

    try {
      setAssignmentError(null);
      await removeLecturer.mutateAsync({
        path: {
          lecturer_id: lecturerId,
          course_id: courseId,
        },
      });
      showToast('success', 'Assignment removed', 'The lecturer no longer has active teaching access for this course.');
    } catch (error) {
      setAssignmentError(getErrorMessage(error));
    }
  }

  function getLecturerLabel(lecturerId: number) {
    const lecturer = lecturers.find((user) => Number(user.user_id ?? 0) === lecturerId);
    if (!lecturer) return `Lecturer #${lecturerId}`;
    return `${String(lecturer.first_name ?? '')} ${String(lecturer.last_name ?? '')}`.trim() || `Lecturer #${lecturerId}`;
  }

  function getLecturerMeta(lecturerId: number) {
    const lecturer = lecturers.find((user) => Number(user.user_id ?? 0) === lecturerId);
    if (!lecturer) return 'Staff profile unavailable';
    return String(lecturer.email ?? 'No email');
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={String(currentCourse.course_name ?? 'Course')}
        subtitle={`Catalog reference ${String(currentCourse.course_code ?? '-')}`}
        icon="books"
        tone="green"
      >
        <Link to="/courses"><Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back</Button></Link>
        <Link to={`/courses/${id}/edit`}><Button variant="primary"><i className="ti ti-edit" />Edit</Button></Link>
      </PageHeader>

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Course snapshot</h3>
                <div className="section-subtle">High-signal catalog metadata for this academic record</div>
              </div>
            </div>
            <div className="session-stat-row">
              <div className="session-stat">
                <label>Course ID</label>
                <strong>{String(currentCourse.course_id ?? '-')}</strong>
              </div>
              <div className="session-stat">
                <label>Credits</label>
                <strong>{credits || '-'}</strong>
              </div>
              <div className="session-stat">
                <label>Assigned lecturers</label>
                <strong>{assignments.length}</strong>
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Teaching assignment control</h3>
                <div className="section-subtle">Only assigned lecturers should be able to open sessions and inspect course enrollments.</div>
              </div>
              <span className="status-pill green"><i className="ti ti-users-group" />Admin only</span>
            </div>

            <ErrorAlert error={assignmentError} dismissible />

            <form onSubmit={handleAssignLecturer}>
              <div className="field-shell">
                <label htmlFor="lecturerId" className="field-label">Assign lecturer</label>
                <SearchableSelect
                  id="lecturerId"
                  name="lecturerId"
                  value={selectedLecturerId}
                  onValueChange={setSelectedLecturerId}
                  disabled={assignLecturer.isPending || availableLecturers.length === 0}
                  placeholder="Select a lecturer..."
                  searchPlaceholder="Search lecturer name or email..."
                  options={availableLecturers.map((lecturer) => ({
                    value: String(lecturer.user_id),
                    label: `${String(lecturer.first_name ?? '')} ${String(lecturer.last_name ?? '')}`.trim() || `Lecturer #${String(lecturer.user_id)}`,
                    meta: String(lecturer.email ?? ''),
                    keywords: `${String(lecturer.first_name ?? '')} ${String(lecturer.last_name ?? '')} ${String(lecturer.email ?? '')}`,
                  }))}
                />
              </div>

              <div className="ph-actions">
                <Button type="submit" variant="primary" disabled={!selectedLecturerId || assignLecturer.isPending}>
                  {assignLecturer.isPending ? <Spinner animation="border" size="sm" /> : <i className="ti ti-user-plus" />}
                  Assign lecturer
                </Button>
              </div>
            </form>

            <div className="login-hint">
              Lecturer assignment is the control point for who may legitimately teach, launch QR attendance sessions, and inspect student enrollment under this course.
            </div>
          </div>

          <div className="callout-panel green">
            <i className="ti ti-book" style={{ color: 'var(--green)' }} />
            <div>
              <div className="callout-title">Catalog records should be stable</div>
              <div className="callout-copy">
                Frequent ad hoc changes to codes, departments, or credit loads undermine session history and enrollment reporting.
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Course details</h3>
                <div className="section-subtle">Administrative metadata associated with this catalog entry</div>
              </div>
            </div>

            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Course code</span>
                <span className="detail-value"><span className="detail-chip mono">{String(currentCourse.course_code ?? '-')}</span></span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Course name</span>
                <span className="detail-value">{String(currentCourse.course_name ?? '-')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Department</span>
                <span className="detail-value">{String(currentCourse.department ?? '-')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Credits</span>
                <span className="detail-value mono">{credits || '-'}</span>
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Assigned lecturers</h3>
                <div className="section-subtle">Current teaching roster with direct removal controls</div>
              </div>
              <span className="status-pill green"><i className="ti ti-check" />{assignments.length} active</span>
            </div>

            {loadingAssignments ? (
              <div className="empty-panel"><i className="ti ti-loader" /><div>Loading assignments...</div></div>
            ) : assignments.length === 0 ? (
              <div className="empty-panel"><i className="ti ti-user-off" /><div>No lecturer has been assigned to this course yet.</div></div>
            ) : (
              <div className="detail-list">
                {assignments.map((assignment) => {
                  const lecturerId = Number(assignment.lecturer_id ?? 0);
                  return (
                    <div key={`${lecturerId}-${String(assignment.assigned_at ?? '')}`} className="detail-row">
                      <span className="detail-label">
                        <span className="detail-chip">{getLecturerLabel(lecturerId)}</span>
                      </span>
                      <span className="detail-value d-flex align-items-center gap-2 flex-wrap justify-content-end">
                        <span className="text-secondary small">{getLecturerMeta(lecturerId)}</span>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleRemoveLecturer(lecturerId)}
                          disabled={removeLecturer.isPending}
                        >
                          <i className="ti ti-user-minus" />
                          Remove
                        </Button>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
