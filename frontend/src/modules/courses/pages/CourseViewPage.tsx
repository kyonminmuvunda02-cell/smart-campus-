import { useState } from 'react';
import { useParams } from 'react-router';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useCourse } from '../hooks/useCourse';
import { useToast } from '@/components/common/ToastManager';
import CourseFormModal from '../components/CourseFormModal';
import AssignLecturerModal from '../components/AssignLecturerModal';
import { getDepartmentTone } from '../utils/departmentTone';

export default function CourseViewPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = id ? Number(id) : undefined;
  const { showToast } = useToast();
  const { useDetail, useAssignments, removeLecturer } = useCourse();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const { data: course, isLoading } = useDetail(courseId);
  const { data: assignmentsData, isLoading: loadingAssignments } = useAssignments(courseId);

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={8} /></div>;
  if (!course) return <EmptyState title="Course Not Found" message="The course record you are looking for might have been archived." />;

  const currentCourse = course as Record<string, any>;
  const assignments = (assignmentsData as { items?: Array<Record<string, any>> })?.items ?? [];
  const department = String(currentCourse.department ?? 'N/A');
  const departmentTone = getDepartmentTone(department);

  const handleRemoveLecturer = async (lecturerId: number) => {
    if (!courseId) return;
    try {
      await removeLecturer.mutateAsync({ path: { lecturer_id: lecturerId, course_id: courseId } });
      showToast('success', 'Assignment Removed', 'The lecturer has been unassigned from this course.');
    } catch (err) {
      showToast('danger', 'Error', 'Failed to remove assignment.');
    }
  };

  return (
    <div>
      <PageHeader
        title={String(currentCourse.course_name ?? 'Course Details')}
        subtitle={String(currentCourse.course_code ?? '-')}
        icon="books"
        tone="green"
        breadcrumbs={[
          { label: 'Administration', path: '/courses' },
          { label: 'Courses', path: '/courses' },
          { label: currentCourse.course_code as string },
        ]}
      >
        <Button variant="outline-secondary" onClick={() => setShowEditModal(true)}>
          <i className="ti ti-edit" />
          Edit Course
        </Button>
        <Button variant="primary" onClick={() => setShowAssignModal(true)}>
          <i className="ti ti-user-plus" />
          Assign Lecturer
        </Button>
      </PageHeader>

      <div className="stack gap-4">
        <div className="surface-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="h5 mb-0 fw-bold text-navy">Course Overview</h3>
            <span className="status-pill green">Active catalog</span>
          </div>
          
          <div className="row g-4">
            <div className="col-md-4">
              <div className="metric-card border-0 bg-light-subtle shadow-none p-4">
                <label className="text-secondary small fw-bold uppercase mb-2">Academic Unit</label>
                <div className="d-flex align-items-center">
                  <span className={`status-pill ${departmentTone}`}>{department}</span>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="metric-card border-0 bg-light-subtle shadow-none p-4 text-center">
                <label className="text-secondary small fw-bold uppercase mb-2">Weight</label>
                <div className="h5 mb-0 fw-bold text-navy">{Number(currentCourse.credits ?? 0)} Cr</div>
              </div>
            </div>
            <div className="col-md-2">
              <div className="metric-card border-0 bg-light-subtle shadow-none p-4 text-center">
                <label className="text-secondary small fw-bold uppercase mb-2">Staff</label>
                <div className="h5 mb-0 fw-bold text-navy">{assignments.length}</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="metric-card border-0 bg-light-subtle shadow-none p-4">
                <label className="text-secondary small fw-bold uppercase mb-2">Catalog Integrity</label>
                <div className="small text-muted">Immutable link to all class history records.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3 className="h5 mb-0 fw-bold text-navy">Teaching Roster</h3>
            <Button variant="link" className="p-0 text-decoration-none small" onClick={() => setShowAssignModal(true)}>
              Assign New Lecturer
            </Button>
          </div>

          {loadingAssignments ? (
            <LoadingSkeleton rows={3} />
          ) : assignments.length === 0 ? (
            <EmptyState icon="ti-user-off" title="Empty Roster" message="No lecturers are currently assigned to this course." />
          ) : (
            <div className="row g-3">
              {assignments.map((a) => (
                <div key={a.lecturer_id} className="col-md-4">
                  <div className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white shadow-sm hover-shadow transition-all">
                    <div className="d-flex align-items-center gap-3">
                      <div className="sb-avatar bg-navy-mid text-white small">
                        {String(a.lecturer_first_name?.[0] ?? 'L')}{String(a.lecturer_last_name?.[0] ?? '')}
                      </div>
                      <div className="entity-copy">
                        <strong className="text-navy">{String(a.lecturer_first_name ?? '')} {String(a.lecturer_last_name ?? '')}</strong>
                        <span className="text-secondary smaller">{String(a.lecturer_email ?? 'No email')}</span>
                      </div>
                    </div>
                    <Button variant="outline-danger" size="sm" className="border-0" onClick={() => handleRemoveLecturer(a.lecturer_id)}>
                      <i className="ti ti-trash" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CourseFormModal show={showEditModal} onHide={() => setShowEditModal(false)} courseId={courseId} />
      <AssignLecturerModal show={showAssignModal} onHide={() => setShowAssignModal(false)} courseId={courseId!} />
    </div>
  );
}
