import { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useEnrollment } from '../hooks/useEnrollment';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useUser } from '@/modules/users/hooks/useUser';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';

function currentAcademicYear() {
  const now = new Date();
  return `${now.getFullYear()}/${now.getFullYear() + 1}`;
}

export default function EnrollmentListPage() {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newEnrollment, setNewEnrollment] = useState({
    student_id: '',
    course_id: '',
    semester: 'Semester 1',
    academic_year: currentAcademicYear(),
  });

  const { showToast } = useToast();
  const { useStudentEnrollments, create } = useEnrollment();
  const { useList: useCourses } = useCourse();
  const { useList: useUsers } = useUser();
  const { data, isLoading } = useStudentEnrollments(selectedStudentId);
  const { data: coursesData } = useCourses({ query: { skip: 0, limit: 200 } });
  const { data: usersData } = useUsers({ query: { skip: 0, limit: 200 } });

  const enrollments = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const courses = (coursesData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const users = (usersData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const students = users.filter((user) => user.role === 'Student');
  const hasLookup = selectedStudentId > 0;

  function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedStudentId(Number(studentIdInput) || 0);
  }

  function resetLookup() {
    setStudentIdInput('');
    setSelectedStudentId(0);
  }

  async function handleCreateEnrollment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreateError(null);
      await create.mutateAsync({
        body: {
          student_id: Number(newEnrollment.student_id),
          course_id: Number(newEnrollment.course_id),
          semester: newEnrollment.semester,
          academic_year: newEnrollment.academic_year,
        },
      });
      showToast('success', 'Enrollment created', 'The student can now be validated against this course during attendance.');
      setSelectedStudentId(Number(newEnrollment.student_id));
      setStudentIdInput(newEnrollment.student_id);
    } catch (error) {
      setCreateError(getErrorMessage(error));
    }
  }

  function getStudentLabel(studentId: number) {
    const student = students.find((user) => Number(user.user_id ?? 0) === studentId);
    if (!student) return `Student #${studentId}`;
    return `${String(student.first_name ?? '')} ${String(student.last_name ?? '')}`.trim() || `Student #${studentId}`;
  }

  function getCourseLabel(courseId: number) {
    const course = courses.find((item) => Number(item.course_id ?? 0) === courseId);
    if (!course) return `Course #${courseId}`;
    return `${String(course.course_code ?? '')} - ${String(course.course_name ?? '')}`;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Enrollment management"
        subtitle="Control which students may legitimately attend which courses in a given term."
        icon="list-check"
        tone="purple"
      >
        <Button variant="outline-secondary" onClick={resetLookup} disabled={!studentIdInput && !selectedStudentId}>
          <i className="ti ti-rotate-2" />
          Clear lookup
        </Button>
      </PageHeader>

      <div className="checkin-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Create enrollment</h3>
                <div className="section-subtle">Students must be explicitly enrolled before their attendance can be accepted.</div>
              </div>
              <span className="status-pill purple"><i className="ti ti-user-plus" />Admin control</span>
            </div>

            <ErrorAlert error={createError} dismissible />

            <form onSubmit={handleCreateEnrollment}>
              <div className="field-shell">
                <label htmlFor="new_student_id" className="field-label">Student</label>
                <Form.Select
                  id="new_student_id"
                  value={newEnrollment.student_id}
                  onChange={(event) => setNewEnrollment((prev) => ({ ...prev, student_id: event.target.value }))}
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map((student) => (
                    <option key={String(student.user_id)} value={String(student.user_id)}>
                      {`${String(student.first_name ?? '')} ${String(student.last_name ?? '')}`.trim()} - {String(student.email ?? '')}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="field-shell">
                <label htmlFor="new_course_id" className="field-label">Course</label>
                <Form.Select
                  id="new_course_id"
                  value={newEnrollment.course_id}
                  onChange={(event) => setNewEnrollment((prev) => ({ ...prev, course_id: event.target.value }))}
                  required
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={String(course.course_id)} value={String(course.course_id)}>
                      {`${String(course.course_code ?? '')} - ${String(course.course_name ?? '')}`}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="session-stat-row">
                <div className="field-shell">
                  <label htmlFor="semester" className="field-label">Semester</label>
                  <Form.Select
                    id="semester"
                    value={newEnrollment.semester}
                    onChange={(event) => setNewEnrollment((prev) => ({ ...prev, semester: event.target.value }))}
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                  </Form.Select>
                </div>
                <div className="field-shell">
                  <label htmlFor="academic_year" className="field-label">Academic year</label>
                  <Form.Control
                    id="academic_year"
                    value={newEnrollment.academic_year}
                    onChange={(event) => setNewEnrollment((prev) => ({ ...prev, academic_year: event.target.value }))}
                    placeholder="2026/2027"
                  />
                </div>
              </div>

              <div className="ph-actions">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={create.isPending || !newEnrollment.student_id || !newEnrollment.course_id}
                >
                  {create.isPending ? <Spinner animation="border" size="sm" /> : <i className="ti ti-plus" />}
                  Enroll student
                </Button>
              </div>
            </form>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Student lookup</h3>
                <div className="section-subtle">Inspect a student’s current enrollment footprint with a targeted search.</div>
              </div>
            </div>

            <form className="lookup-form" onSubmit={handleLookup}>
              <div className="field-shell" style={{ marginBottom: '0.25rem' }}>
                <label htmlFor="studentId" className="field-label">Student user ID</label>
                <div className="field-wrap">
                  <i className="ti ti-user-search" />
                  <input
                    id="studentId"
                    type="number"
                    min={1}
                    value={studentIdInput}
                    onChange={(event) => setStudentIdInput(event.target.value)}
                    placeholder="Enter a student user ID"
                  />
                </div>
              </div>

              <div className="ph-actions">
                <Button variant="outline-secondary" type="submit" disabled={!Number(studentIdInput)}>
                  <i className="ti ti-search" />
                  Load enrollments
                </Button>
                <Button variant="outline-secondary" type="button" onClick={resetLookup} disabled={!studentIdInput && !selectedStudentId}>
                  <i className="ti ti-x" />
                  Reset
                </Button>
              </div>
            </form>
          </div>

          <div className="callout-panel purple">
            <i className="ti ti-info-circle" style={{ color: 'var(--purple)' }} />
            <div>
              <div className="callout-title">Enrollment is a trust boundary</div>
              <div className="callout-copy">
                Attendance should only succeed for students with an explicit, term-specific course registration. This screen is the control surface for that rule.
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Lookup summary</h3>
                <div className="section-subtle">Scope and result count for the active enrollment search</div>
              </div>
            </div>

            <div className="session-stat-row">
              <div className="session-stat">
                <label>Selected student</label>
                <strong>{hasLookup ? getStudentLabel(selectedStudentId) : '--'}</strong>
              </div>
              <div className="session-stat">
                <label>Records found</label>
                <strong>{hasLookup ? enrollments.length : 0}</strong>
              </div>
              <div className="session-stat">
                <label>Academic mode</label>
                <strong>{hasLookup ? 'Verified view' : 'Idle'}</strong>
              </div>
            </div>
          </div>

          {!hasLookup ? (
            <div className="surface-card section-card">
              <EmptyState
                icon="ti-search"
                title="Select a student"
                message="Run a student lookup to review which courses the student is currently allowed to attend."
              />
            </div>
          ) : isLoading ? (
            <LoadingSkeleton rows={6} columns={5} />
          ) : enrollments.length === 0 ? (
            <div className="surface-card section-card">
              <EmptyState
                icon="ti-list-check"
                title="No enrollments found"
                message="This student does not currently have any tracked course registrations."
              />
            </div>
          ) : (
            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Enrollment records</h3>
                  <div className="section-subtle">Academic registrations returned for {getStudentLabel(selectedStudentId)}</div>
                </div>
                <span className="status-pill green"><i className="ti ti-check" />{enrollments.length} tracked rows</span>
              </div>

              <Alert variant="light" className="mb-3 border">
                <i className="ti ti-shield-check me-2" />
                These records directly affect whether attendance check-in is accepted for the selected student.
              </Alert>

              <div className="table-shell">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Course</th>
                      <th>Student</th>
                      <th>Term</th>
                      <th>Status</th>
                      <th>Enrolled date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment: Record<string, unknown>) => (
                      <tr key={`${enrollment.student_id as number}-${enrollment.course_id as number}-${enrollment.academic_year as string}-${enrollment.semester as string}`}>
                        <td className="fw-semibold">{getCourseLabel(Number(enrollment.course_id ?? 0))}</td>
                        <td className="text-secondary">{getStudentLabel(Number(enrollment.student_id ?? 0))}</td>
                        <td className="text-secondary">
                          {(enrollment.semester as string) || '-'} / {(enrollment.academic_year as string) || '-'}
                        </td>
                        <td>
                          <span className={`status-pill ${enrollment.enrollment_status === 'Enrolled' ? 'green' : 'purple'}`}>
                            <i className={`ti ti-${enrollment.enrollment_status === 'Enrolled' ? 'circle-check' : 'clock'}`} />
                            {(enrollment.enrollment_status as string) || 'Enrolled'}
                          </span>
                        </td>
                        <td className="text-secondary small">
                          {enrollment.created_at ? new Date(enrollment.created_at as string).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
