import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, Table } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useCourse } from '../hooks/useCourse';
import CourseFormModal from '../components/CourseFormModal';
import Pagination from '@/components/common/Pagination';
import { getDepartmentTone } from '../utils/departmentTone';

export default function CourseListPage() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [courseId, setCourseId] = useState<number | undefined>();

  const { useList } = useCourse();
  const { data, isLoading } = useList({ query: { skip: 0, limit: 1000 } });
  const pageSize = 10;

  const courses = (data as { items?: Array<Record<string, any>> })?.items ?? [];
  const filteredCourses = courses.filter((c) => {
    const term = search.trim().toLowerCase();
    return !term || 
      String(c.course_name ?? '').toLowerCase().includes(term) || 
      String(c.course_code ?? '').toLowerCase().includes(term) ||
      String(c.department ?? '').toLowerCase().includes(term);
  });

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedCourses = filteredCourses.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleCreate = () => {
    setCourseId(undefined);
    setShowModal(true);
  };

  const handleEdit = (id: number) => {
    setCourseId(id);
    setShowModal(true);
  };

  return (
    <div>
      <PageHeader
        title="Course Catalog"
        subtitle="Academic records governing teaching assignments and class history."
        icon="books"
        tone="green"
        breadcrumbs={[{ label: 'Administration', path: '/courses' }, { label: 'Courses' }]}
      >
        <Button variant="primary" onClick={handleCreate}>
          <i className="ti ti-plus" />
          Add Course
        </Button>
      </PageHeader>

      <div className="stack gap-4">
        {/* Stat Cards Section */}
        <div className="row g-4">
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-green-lt text-green p-2 fs-3 rounded-3">
                <i className="ti ti-books" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Total Courses</span>
                <strong className="h4 mb-0 d-block">{courses.length}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-purple-lt text-purple p-2 fs-3 rounded-3">
                <i className="ti ti-school" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Departments</span>
                <strong className="h4 mb-0 d-block">{new Set(courses.map(c => c.department)).size}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="surface-card p-3 shadow-sm border-0 bg-green text-white d-flex align-items-center justify-content-between">
              <div>
                <span className="small fw-bold uppercase opacity-75">Catalog Integrity</span>
                <p className="mb-0 small">Course records are immutable once classes are attached to ensure reporting accuracy.</p>
              </div>
              <i className="ti ti-shield-check fs-1 opacity-25" />
            </div>
          </div>
        </div>

        {/* Main Content Table */}
        <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
          <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light-subtle">
            <div className="field-shell mb-0 flex-grow-1" style={{ maxWidth: '400px' }}>
              <div className="field-wrap py-1">
                <i className="ti ti-search" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code, name, or unit..."
                  className="form-control-sm border-0 bg-transparent"
                />
              </div>
            </div>
            <div className="text-secondary small fw-medium">
              Showing {filteredCourses.length} entries
            </div>
          </div>

          {isLoading ? (
            <div className="p-4"><LoadingSkeleton rows={8} columns={4} /></div>
          ) : courses.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="ti-books-off" title="Catalog is Empty" message="Begin by adding your first academic course record.">
                <Button variant="primary" onClick={handleCreate}>Add Course</Button>
              </EmptyState>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="ti-filter-off" title="No Results Found" message="Try searching for a different course code or department." />
            </div>
          ) : (
            <>
            <div className="d-none d-md-block table-responsive">
              <Table hover className="mb-0 border-0">
                <thead className="bg-light-subtle">
                  <tr>
                    <th className="ps-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Catalog Entry</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Department</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Credits</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Attendance</th>
                    <th className="text-end pe-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {paginatedCourses.map((c) => {
                    const department = String(c.department ?? 'N/A');
                    const departmentTone = getDepartmentTone(department);

                    return (
                      <tr key={c.course_id}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className="sb-avatar bg-green-lt text-green mono small fw-bold">
                              {String(c.course_code ?? '??').slice(0, 2)}
                            </div>
                            <div className="entity-copy">
                              <strong className="text-navy">{String(c.course_name ?? 'Unnamed Course')}</strong>
                              <span className="mono small text-secondary">{String(c.course_code ?? '-')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`status-pill ${departmentTone}`}>{department}</span>
                        </td>
                        <td className="py-3 mono small">{Number(c.credits ?? 0)} UNIT</td>
                        <td className="py-3">
                          <span className="status-pill royal">{Number(c.minimum_attendance_percent ?? 80)}%</span>
                        </td>
                        <td className="text-end pe-4 py-3">
                          <div className="d-flex gap-1 justify-content-end">
                            <Link to={`/courses/${c.course_id}`}>
                              <Button variant="outline-secondary" size="sm" className="border-0 shadow-none">
                                <i className="ti ti-eye fs-5" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="border-0 shadow-none"
                              onClick={() => handleEdit(Number(c.course_id))}
                            >
                              <i className="ti ti-edit fs-5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>

            <div className="d-md-none p-3">
              <div className="mobile-record-list">
                {paginatedCourses.map((c) => {
                  const department = String(c.department ?? 'N/A');
                  const departmentTone = getDepartmentTone(department);

                  return (
                    <div key={c.course_id} className="mobile-record-card">
                      <div className="mobile-record-head">
                        <div className="d-flex align-items-center gap-3">
                          <div className="sb-avatar bg-green-lt text-green mono small fw-bold">
                            {String(c.course_code ?? '??').slice(0, 2)}
                          </div>
                          <div>
                            <span className="mobile-record-title">{String(c.course_name ?? 'Unnamed Course')}</span>
                            <span className="mobile-record-meta mono">{String(c.course_code ?? '-')}</span>
                          </div>
                        </div>
                        <span className={`status-pill ${departmentTone}`}>{department}</span>
                      </div>

                      <div className="detail-list">
                        <div className="detail-row">
                          <div className="detail-label">Credits</div>
                          <div className="detail-value mono">{Number(c.credits ?? 0)} UNIT</div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">Minimum Attendance</div>
                          <div className="detail-value">{Number(c.minimum_attendance_percent ?? 80)}%</div>
                        </div>
                      </div>

                      <div className="mobile-record-actions">
                        <Link to={`/courses/${c.course_id}`}>
                          <Button variant="outline-secondary" size="sm">
                            <i className="ti ti-eye" />
                            Open
                          </Button>
                        </Link>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => handleEdit(Number(c.course_id))}
                        >
                          <i className="ti ti-edit" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </>
          )}

          {filteredCourses.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredCourses.length}
              pageSize={pageSize}
            />
          )}
        </div>
      </div>

      <CourseFormModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setCourseId(undefined);
        }}
        courseId={courseId}
      />
    </div>
  );
}
