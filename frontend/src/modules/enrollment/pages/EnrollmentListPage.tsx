import { useEffect, useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageHeader from '@/components/common/PageHeader';
import SearchableSelect from '@/components/common/SearchableSelect';
import Pagination from '@/components/common/Pagination';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useUser } from '@/modules/users/hooks/useUser';
import EnrollmentFormModal from '../components/EnrollmentFormModal';
import { useEnrollment } from '../hooks/useEnrollment';

function currentAcademicYear() {
  const now = new Date();
  return `${now.getFullYear()}/${now.getFullYear() + 1}`;
}

export default function EnrollmentListPage() {
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    student_id: '',
    course_id: '',
    semester: '',
    academic_year: currentAcademicYear(),
    enrollment_status: 'Enrolled',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { useList } = useEnrollment();
  const { useList: useCourses } = useCourse();
  const { useList: useUsers } = useUser();

  const { data, isLoading } = useList({
    student_id: Number(filters.student_id) || undefined,
    course_id: Number(filters.course_id) || undefined,
    semester: filters.semester || undefined,
    academic_year: filters.academic_year || undefined,
    enrollment_status: filters.enrollment_status || undefined,
    limit: 1000,
  });

  const { data: coursesData } = useCourses({ query: { limit: 500 } });
  const { data: usersData } = useUsers({ query: { limit: 500 } });

  const enrollments = ((data as any)?.items ?? []) as any[];
  const courses = ((coursesData as any)?.items ?? []) as any[];
  const users = ((usersData as any)?.items ?? []) as any[];
  const students = users.filter((u: any) => u.role === 'Student');

  const counts = {
    enrolled: enrollments.filter((e: any) => e.enrollment_status === 'Enrolled').length,
    completed: enrollments.filter((e: any) => e.enrollment_status === 'Completed').length,
  };

  const totalPages = Math.max(1, Math.ceil(enrollments.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedEnrollments = enrollments.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.student_id, filters.course_id, filters.semester, filters.academic_year, filters.enrollment_status]);

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Academic Enrollment"
        subtitle="Govern period-specific student registrations and course access control."
        icon="list-check"
        tone="purple"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Enrollment Registry' }]}
      >
        <Button variant="primary" onClick={() => setShowModal(true)}>
          <i className="ti ti-plus" />
          Register Enrollment
        </Button>
      </PageHeader>

      <div className="row g-4">
        <div className="col-md-3">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-purple-lt text-purple p-2 fs-3 rounded-3">
              <i className="ti ti-users" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Active Enrolled</span>
              <strong className="h4 mb-0 d-block">{counts.enrolled}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-teal-lt text-teal p-2 fs-3 rounded-3">
              <i className="ti ti-award" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Alumni Completed</span>
              <strong className="h4 mb-0 d-block">{counts.completed}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="surface-card p-3 shadow-sm border-0 bg-light-subtle d-flex align-items-center gap-3 h-100">
            <div className="flex-grow-1">
              <SearchableSelect
                name="filter_student"
                placeholder="Filter student..."
                value={filters.student_id}
                onValueChange={(v) => setFilters((p) => ({ ...p, student_id: v }))}
                options={students.map((s) => ({ value: String(s.user_id), label: `${s.first_name} ${s.last_name}` }))}
              />
            </div>
            <div className="flex-grow-1">
              <SearchableSelect
                name="filter_course"
                placeholder="Filter course..."
                value={filters.course_id}
                onValueChange={(v) => setFilters((p) => ({ ...p, course_id: v }))}
                options={courses.map((c) => ({ value: String(c.course_id), label: `${c.course_code}` }))}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
        {enrollments.length === 0 ? (
          <div className="p-5"><EmptyState title="No Evidence" message="No enrollment records matching current criteria." /></div>
        ) : (
          <>
            <div className="d-none d-md-block table-responsive">
              <Table hover className="mb-0 border-0">
                <thead className="bg-light-subtle text-secondary small fw-bold uppercase tracking-wider">
                  <tr>
                    <th className="ps-4 border-0 py-3">Academic Course</th>
                    <th className="border-0 py-3">Student Identity</th>
                    <th className="border-0 py-3">Term Period</th>
                    <th className="text-end pe-4 border-0 py-3">Registration Status</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {paginatedEnrollments.map((e: any) => {
                    const course = courses.find((c: any) => Number(c.course_id) === Number(e.course_id));
                    const user = users.find((u: any) => Number(u.user_id) === Number(e.student_id));

                    return (
                      <tr key={`${e.student_id}-${e.course_id}-${e.semester}-${e.academic_year}`}>
                        <td className="ps-4 py-3">
                          <strong className="text-navy d-block">{course?.course_code || `CID-${e.course_id}`}</strong>
                          <span className="smaller text-muted">{course?.course_name}</span>
                        </td>
                        <td className="py-3">
                          <div className="d-flex align-items-center gap-2">
                            <div className="sb-avatar sm bg-purple text-white small fw-bold">
                              {user?.first_name?.[0] || 'S'}
                            </div>
                            <span className="small text-navy fw-medium">
                              {user?.first_name} {user?.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-secondary small">{e.semester} | {e.academic_year}</td>
                        <td className="text-end pe-4 py-3">
                          <span className={`status-pill ${e.enrollment_status === 'Enrolled' ? 'green' : 'teal'}`}>
                            <i className={`ti ti-${e.enrollment_status === 'Enrolled' ? 'circle-check' : 'award'}`} />
                            {e.enrollment_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            <div className="d-md-none p-3">
              <div className="mobile-record-list">
                {paginatedEnrollments.map((e: any) => {
                  const course = courses.find((c: any) => Number(c.course_id) === Number(e.course_id));
                  const user = users.find((u: any) => Number(u.user_id) === Number(e.student_id));

                  return (
                    <div key={`${e.student_id}-${e.course_id}-${e.semester}-${e.academic_year}`} className="mobile-record-card">
                      <div className="mobile-record-head">
                        <div>
                          <span className="mobile-record-title">{course?.course_name || `Course #${e.course_id}`}</span>
                          <span className="mobile-record-meta">{course?.course_code || `CID-${e.course_id}`}</span>
                        </div>
                        <span className={`status-pill ${e.enrollment_status === 'Enrolled' ? 'green' : 'teal'}`}>
                          <i className={`ti ti-${e.enrollment_status === 'Enrolled' ? 'circle-check' : 'award'}`} />
                          {e.enrollment_status}
                        </span>
                      </div>

                      <div className="detail-list">
                        <div className="detail-row">
                          <div className="detail-label">Student</div>
                          <div className="detail-value">{user ? `${user.first_name} ${user.last_name}` : `Student #${e.student_id}`}</div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">Academic Period</div>
                          <div className="detail-value">{e.semester} | {e.academic_year}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {enrollments.length > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={enrollments.length}
                pageSize={pageSize}
              />
            )}
          </>
        )}
      </div>

      <EnrollmentFormModal
        show={showModal}
        onHide={() => setShowModal(false)}
      />
    </div>
  );
}
