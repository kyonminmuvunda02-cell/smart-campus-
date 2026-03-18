import { useState } from 'react';
import { Alert, Button, Form, Spinner } from 'react-bootstrap';
import EmptyState from '@/components/common/EmptyState';
import ErrorAlert from '@/components/common/ErrorAlert';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageHeader from '@/components/common/PageHeader';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useUser } from '@/modules/users/hooks/useUser';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';
import { useEnrollment } from '../hooks/useEnrollment';

function currentAcademicYear() {
  const now = new Date();
  return `${now.getFullYear()}/${now.getFullYear() + 1}`;
}

export default function EnrollmentListPage() {
  const [createError, setCreateError] = useState<string | null>(null);
  const [newEnrollment, setNewEnrollment] = useState({
    student_id: '',
    course_id: '',
    semester: 'Semester 1',
    academic_year: currentAcademicYear(),
  });
  const [filters, setFilters] = useState({
    student_id: '',
    course_id: '',
    semester: '',
    academic_year: currentAcademicYear(),
    enrollment_status: 'Enrolled',
  });

  const { showToast } = useToast();
  const { useList, create } = useEnrollment();
  const { useList: useCourses } = useCourse();
  const { useList: useUsers } = useUser();
  const { data, isLoading } = useList({
    student_id: Number(filters.student_id) || undefined,
    course_id: Number(filters.course_id) || undefined,
    semester: filters.semester || undefined,
    academic_year: filters.academic_year || undefined,
    enrollment_status: filters.enrollment_status || undefined,
    skip: 0,
    limit: 200,
  });
  const { data: coursesData } = useCourses({ query: { skip: 0, limit: 200 } });
  const { data: usersData } = useUsers({ query: { skip: 0, limit: 200 } });

  const enrollments = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const courses = (coursesData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const users = (usersData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const students = users.filter((user) => user.role === 'Student');

  const enrollmentCounts = {
    enrolled: enrollments.filter((item) => item.enrollment_status === 'Enrolled').length,
    completed: enrollments.filter((item) => item.enrollment_status === 'Completed').length,
    dropped: enrollments.filter((item) => item.enrollment_status === 'Dropped').length,
  };

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
      setFilters((prev) => ({
        ...prev,
        student_id: newEnrollment.student_id,
        course_id: '',
      }));
    } catch (error) {
      setCreateError(getErrorMessage(error));
    }
  }

  function resetFilters() {
    setFilters({
      student_id: '',
      course_id: '',
      semester: '',
      academic_year: currentAcademicYear(),
      enrollment_status: 'Enrolled',
    });
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
        subtitle="Control which students may legitimately attend which courses in each teaching period."
        icon="list-check"
        tone="purple"
      >
        <Button variant="outline-secondary" onClick={resetFilters}>
          <i className="ti ti-rotate-2" />
          Reset filters
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
                <h3>Enrollment filters</h3>
                <div className="section-subtle">Browse the academic register by student, course, term, or status.</div>
              </div>
              <span className="status-pill purple"><i className="ti ti-filter" />Live browser</span>
            </div>

            <div className="field-shell">
              <label htmlFor="filter_student_id" className="field-label">Student</label>
              <Form.Select
                id="filter_student_id"
                value={filters.student_id}
                onChange={(event) => setFilters((prev) => ({ ...prev, student_id: event.target.value }))}
              >
                <option value="">All students</option>
                {students.map((student) => (
                  <option key={String(student.user_id)} value={String(student.user_id)}>
                    {`${String(student.first_name ?? '')} ${String(student.last_name ?? '')}`.trim()}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="field-shell">
              <label htmlFor="filter_course_id" className="field-label">Course</label>
              <Form.Select
                id="filter_course_id"
                value={filters.course_id}
                onChange={(event) => setFilters((prev) => ({ ...prev, course_id: event.target.value }))}
              >
                <option value="">All courses</option>
                {courses.map((course) => (
                  <option key={String(course.course_id)} value={String(course.course_id)}>
                    {`${String(course.course_code ?? '')} - ${String(course.course_name ?? '')}`}
                  </option>
                ))}
              </Form.Select>
            </div>

            <div className="session-stat-row">
              <div className="field-shell">
                <label htmlFor="filter_semester" className="field-label">Semester</label>
                <Form.Select
                  id="filter_semester"
                  value={filters.semester}
                  onChange={(event) => setFilters((prev) => ({ ...prev, semester: event.target.value }))}
                >
                  <option value="">All semesters</option>
                  <option value="Semester 1">Semester 1</option>
                  <option value="Semester 2">Semester 2</option>
                </Form.Select>
              </div>
              <div className="field-shell">
                <label htmlFor="filter_status" className="field-label">Status</label>
                <Form.Select
                  id="filter_status"
                  value={filters.enrollment_status}
                  onChange={(event) => setFilters((prev) => ({ ...prev, enrollment_status: event.target.value }))}
                >
                  <option value="">All statuses</option>
                  <option value="Enrolled">Enrolled</option>
                  <option value="Completed">Completed</option>
                  <option value="Dropped">Dropped</option>
                </Form.Select>
              </div>
            </div>

            <div className="field-shell">
              <label htmlFor="filter_year" className="field-label">Academic year</label>
              <Form.Control
                id="filter_year"
                value={filters.academic_year}
                onChange={(event) => setFilters((prev) => ({ ...prev, academic_year: event.target.value }))}
                placeholder="2026/2027"
              />
            </div>
          </div>

          <div className="callout-panel purple">
            <i className="ti ti-info-circle" style={{ color: 'var(--purple)' }} />
            <div>
              <div className="callout-title">Enrollment is a trust boundary</div>
              <div className="callout-copy">
                Attendance should only succeed for students with an explicit, term-specific course registration. This screen is the operational browser for that rule.
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Enrollment summary</h3>
                <div className="section-subtle">Result set size and status distribution for the current scope</div>
              </div>
            </div>

            <div className="session-stat-row">
              <div className="session-stat">
                <label>Visible rows</label>
                <strong>{enrollments.length}</strong>
              </div>
              <div className="session-stat">
                <label>Enrolled</label>
                <strong>{enrollmentCounts.enrolled}</strong>
              </div>
              <div className="session-stat">
                <label>Completed</label>
                <strong>{enrollmentCounts.completed}</strong>
              </div>
              <div className="session-stat">
                <label>Dropped</label>
                <strong>{enrollmentCounts.dropped}</strong>
              </div>
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={6} columns={5} />
          ) : enrollments.length === 0 ? (
            <div className="surface-card section-card">
              <EmptyState
                icon="ti-list-check"
                title="No enrollments in this scope"
                message="Adjust the filters or create a new enrollment to begin populating the academic register."
              />
            </div>
          ) : (
            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Enrollment records</h3>
                  <div className="section-subtle">Academic registrations currently visible under the selected filters</div>
                </div>
                <span className="status-pill green"><i className="ti ti-check" />{enrollments.length} tracked rows</span>
              </div>

              <Alert variant="light" className="mb-3 border">
                <i className="ti ti-shield-check me-2" />
                These records directly affect whether attendance check-in is accepted for the selected academic scope.
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
                    {enrollments.map((enrollment: Record<string, unknown>) => {
                      const status = String(enrollment.enrollment_status ?? 'Enrolled');
                      return (
                        <tr key={`${enrollment.student_id as number}-${enrollment.course_id as number}-${enrollment.academic_year as string}-${enrollment.semester as string}`}>
                          <td className="fw-semibold">{getCourseLabel(Number(enrollment.course_id ?? 0))}</td>
                          <td className="text-secondary">{getStudentLabel(Number(enrollment.student_id ?? 0))}</td>
                          <td className="text-secondary">
                            {(enrollment.semester as string) || '-'} / {(enrollment.academic_year as string) || '-'}
                          </td>
                          <td>
                            <span className={`status-pill ${status === 'Enrolled' ? 'green' : status === 'Completed' ? 'teal' : 'purple'}`}>
                              <i className={`ti ti-${status === 'Enrolled' ? 'circle-check' : status === 'Completed' ? 'rosette-discount-check' : 'clock-pause'}`} />
                              {status}
                            </span>
                          </td>
                          <td className="text-secondary small">
                            {enrollment.created_at ? new Date(enrollment.created_at as string).toLocaleDateString() : '-'}
                          </td>
                        </tr>
                      );
                    })}
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
