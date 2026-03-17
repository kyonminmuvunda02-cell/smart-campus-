import { useParams, Link } from 'react-router';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import { useCourse } from '../hooks/useCourse';

export default function CourseViewPage() {
  const { id } = useParams<{ id: string }>();
  const { useDetail } = useCourse();
  const { data: course, isLoading } = useDetail(id ? Number(id) : undefined);

  if (isLoading) return <div className="empty-panel"><i className="ti ti-loader" /><div>Loading course...</div></div>;
  if (!course) return <div className="empty-panel"><i className="ti ti-mood-empty" /><div>Course not found.</div></div>;

  const currentCourse = course as Record<string, unknown>;
  const credits = Number(currentCourse.credits ?? 0);

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
                <label>Status</label>
                <strong>Active</strong>
              </div>
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
      </div>
    </div>
  );
}
