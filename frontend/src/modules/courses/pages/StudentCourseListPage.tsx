import { useMemo, useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { Link } from 'react-router';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useEnrollment } from '@/modules/enrollment/hooks/useEnrollment';
import { useCourse } from '../hooks/useCourse';
import { getDepartmentTone } from '../utils/departmentTone';

const PAGE_SIZE = 8;

export default function StudentCourseListPage() {
  const { userId } = useAuth();
  const { useStudentEnrollments } = useEnrollment();
  const { useList: useCourseList } = useCourse();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: enrollmentData, isLoading: loadingEnrollments } = useStudentEnrollments(userId ?? 0);
  const { data: courseData, isLoading: loadingCourses } = useCourseList({ query: { limit: 500 } });

  const enrollments = (enrollmentData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const courses = (courseData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const courseLookup = new Map(courses.map((course) => [Number(course.course_id), course]));

  const enrolledCourses = useMemo(() => {
    return enrollments
      .map((enrollment) => {
        const course = courseLookup.get(Number(enrollment.course_id));
        return {
          enrollment,
          course,
        };
      })
      .filter((item) => item.course);
  }, [courseLookup, enrollments]);

  const filteredCourses = enrolledCourses.filter(({ enrollment, course }) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      String(course?.course_name ?? '').toLowerCase().includes(term) ||
      String(course?.course_code ?? '').toLowerCase().includes(term) ||
      String(course?.department ?? '').toLowerCase().includes(term) ||
      String(enrollment.semester ?? '').toLowerCase().includes(term) ||
      String(enrollment.academic_year ?? '').toLowerCase().includes(term)
    );
  });

  const activeCount = enrollments.filter((enrollment) => String(enrollment.enrollment_status) === 'Enrolled').length;
  const completedCount = enrollments.filter((enrollment) => String(enrollment.enrollment_status) === 'Completed').length;
  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / PAGE_SIZE));
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const paginatedCourses = filteredCourses.slice(pageStart, pageStart + PAGE_SIZE);

  if (loadingEnrollments || loadingCourses) {
    return <div className="p-4"><LoadingSkeleton rows={10} /></div>;
  }

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Courses"
        subtitle="Courses you are currently or historically enrolled in, grouped by academic period."
        icon="books"
        tone="royal"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Courses' }]}
      />

      <div className="row g-4">
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-royal-lt text-royal p-2 fs-3 rounded-3">
              <i className="ti ti-books" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Total Courses</span>
              <strong className="h4 mb-0 d-block">{enrollments.length}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-green-lt text-green p-2 fs-3 rounded-3">
              <i className="ti ti-circle-check" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Active Now</span>
              <strong className="h4 mb-0 d-block">{activeCount}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-teal-lt text-teal p-2 fs-3 rounded-3">
              <i className="ti ti-award" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Completed</span>
              <strong className="h4 mb-0 d-block">{completedCount}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between gap-3 bg-light-subtle">
          <div className="field-shell mb-0 flex-grow-1" style={{ maxWidth: '420px' }}>
            <div className="field-wrap py-1">
              <i className="ti ti-search" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by code, course, department, or semester..."
                className="form-control-sm border-0 bg-transparent"
              />
            </div>
          </div>
          <div className="text-secondary small fw-medium">
            {filteredCourses.length} enrolled record{filteredCourses.length === 1 ? '' : 's'}
          </div>
        </div>

        {enrollments.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="ti-books-off"
              title="No enrolled courses"
              message="Your active and historical enrollments will appear here once they are registered."
            />
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon="ti-filter-off"
              title="No matching courses"
              message="Try a different course code, academic year, or department search."
            />
          </div>
        ) : (
          <>
          <div className="d-none d-md-block table-responsive">
            <Table hover className="mb-0 border-0">
              <thead className="bg-light-subtle">
                <tr>
                  <th className="ps-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Course</th>
                  <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Department</th>
                  <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Academic Period</th>
                  <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Requirement</th>
                  <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Status</th>
                  <th className="text-end pe-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Attendance</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {paginatedCourses.map(({ enrollment, course }) => {
                  const department = String(course?.department ?? 'General Studies');
                  const departmentTone = getDepartmentTone(department);
                  const status = String(enrollment.enrollment_status ?? 'Enrolled');
                  const statusTone = status === 'Completed' ? 'teal' : status === 'Dropped' ? 'amber' : 'green';
                  const attendanceHref = `/my-attendance?course=${encodeURIComponent(
                    `${Number(enrollment.course_id)}|${String(enrollment.semester)}|${String(enrollment.academic_year)}`
                  )}`;

                  return (
                    <tr key={`${enrollment.student_id}-${enrollment.course_id}-${enrollment.semester}-${enrollment.academic_year}`}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="sb-avatar bg-royal-lt text-royal mono small fw-bold">
                            {String(course?.course_code ?? '??').slice(0, 2)}
                          </div>
                          <div className="entity-copy">
                            <Link to={attendanceHref} className="text-decoration-none">
                              <strong className="text-navy">{String(course?.course_name ?? `Course #${enrollment.course_id}`)}</strong>
                            </Link>
                            <span className="mono small text-secondary">{String(course?.course_code ?? enrollment.course_id)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`status-pill ${departmentTone}`}>{department}</span>
                      </td>
                      <td className="py-3">
                        <div className="entity-copy">
                          <strong className="small text-navy">{String(enrollment.semester)}</strong>
                          <span className="smaller text-secondary">{String(enrollment.academic_year)}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="status-pill royal">{Number(course?.minimum_attendance_percent ?? 80)}%</span>
                      </td>
                      <td className="py-3">
                        <span className={`status-pill ${statusTone}`}>
                          <i className={`ti ti-${status === 'Completed' ? 'award' : status === 'Dropped' ? 'player-pause' : 'circle-check'}`} />
                          {status}
                        </span>
                      </td>
                      <td className="text-end pe-4 py-3">
                        <Link to={attendanceHref}>
                          <Button variant="outline-secondary" size="sm">
                            <i className="ti ti-history" />
                            Attendance
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          <div className="d-md-none p-3">
            <div className="mobile-record-list">
              {paginatedCourses.map(({ enrollment, course }) => {
                const department = String(course?.department ?? 'General Studies');
                const departmentTone = getDepartmentTone(department);
                const status = String(enrollment.enrollment_status ?? 'Enrolled');
                const statusTone = status === 'Completed' ? 'teal' : status === 'Dropped' ? 'amber' : 'green';
                const attendanceHref = `/my-attendance?course=${encodeURIComponent(
                  `${Number(enrollment.course_id)}|${String(enrollment.semester)}|${String(enrollment.academic_year)}`
                )}`;

                return (
                  <div key={`${enrollment.student_id}-${enrollment.course_id}-${enrollment.semester}-${enrollment.academic_year}`} className="mobile-record-card">
                    <div className="mobile-record-head">
                      <div>
                        <span className="mobile-record-title">{String(course?.course_name ?? `Course #${enrollment.course_id}`)}</span>
                        <span className="mobile-record-meta mono">{String(course?.course_code ?? enrollment.course_id)}</span>
                      </div>
                      <span className={`status-pill ${statusTone}`}>
                        <i className={`ti ti-${status === 'Completed' ? 'award' : status === 'Dropped' ? 'player-pause' : 'circle-check'}`} />
                        {status}
                      </span>
                    </div>

                    <div className="detail-list">
                      <div className="detail-row">
                        <div className="detail-label">Department</div>
                        <div className="detail-value">
                          <span className={`status-pill ${departmentTone}`}>{department}</span>
                        </div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Academic Period</div>
                        <div className="detail-value">{String(enrollment.semester)} | {String(enrollment.academic_year)}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Minimum Attendance</div>
                        <div className="detail-value">{Number(course?.minimum_attendance_percent ?? 80)}%</div>
                      </div>
                    </div>

                    <div className="mobile-record-actions">
                      <Link to={attendanceHref}>
                        <Button variant="outline-secondary" size="sm">
                          <i className="ti ti-history" />
                          View Attendance
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </>
        )}

        {filteredCourses.length > PAGE_SIZE ? (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredCourses.length}
            pageSize={PAGE_SIZE}
          />
        ) : null}
      </div>
    </div>
  );
}
