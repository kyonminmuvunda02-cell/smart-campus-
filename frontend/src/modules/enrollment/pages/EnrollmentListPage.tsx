import { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useEnrollment } from '../hooks/useEnrollment';

export default function EnrollmentListPage() {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(0);
  const { useStudentEnrollments } = useEnrollment();
  const { data, isLoading } = useStudentEnrollments(selectedStudentId);

  const enrollments = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const hasLookup = selectedStudentId > 0;

  function handleLookup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSelectedStudentId(Number(studentIdInput) || 0);
  }

  function resetLookup() {
    setStudentIdInput('');
    setSelectedStudentId(0);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Enrollment lookup"
        subtitle="Inspect a student's course registrations from a focused admin search surface."
        icon="list-check"
        tone="purple"
      >
        <Button variant="outline-secondary" onClick={resetLookup} disabled={!studentIdInput && !selectedStudentId}>
          <i className="ti ti-rotate-2" />
          Clear
        </Button>
      </PageHeader>

      <div className="checkin-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Student search</h3>
                <div className="section-subtle">Run an explicit lookup instead of filtering records as you type.</div>
              </div>
              <span className="status-pill purple"><i className="ti ti-search" />Admin scope</span>
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

              <div className="login-hint">
                Current backend scope is student-based lookup, so this screen is optimized for one precise identity search at a time.
              </div>

              <div className="ph-actions">
                <Button variant="primary" type="submit" disabled={!Number(studentIdInput)}>
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
              <div className="callout-title">Why this flow is narrow</div>
              <div className="callout-copy">
                Enrollment management is more trustworthy when admins search with a clear target student instead of browsing partial or stale records.
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
                <strong>{hasLookup ? selectedStudentId : '--'}</strong>
              </div>
              <div className="session-stat">
                <label>Records found</label>
                <strong>{hasLookup ? enrollments.length : 0}</strong>
              </div>
              <div className="session-stat">
                <label>Search mode</label>
                <strong>{hasLookup ? 'Focused' : 'Idle'}</strong>
              </div>
            </div>
          </div>

          {!hasLookup ? (
            <div className="surface-card section-card">
              <EmptyState
                icon="ti-search"
                title="Select a student"
                message="Run a student lookup to view enrollment records for a single academic profile."
              />
            </div>
          ) : isLoading ? (
            <LoadingSkeleton rows={6} columns={5} />
          ) : enrollments.length === 0 ? (
            <div className="surface-card section-card">
              <EmptyState
                icon="ti-list-check"
                title="No enrollments found"
                message="This student currently has no records in the available enrollment dataset."
              />
            </div>
          ) : (
            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Enrollment records</h3>
                  <div className="section-subtle">Academic registrations returned for student #{selectedStudentId}</div>
                </div>
                <span className="status-pill green"><i className="ti ti-check" />{enrollments.length} active rows</span>
              </div>

              <Alert variant="light" className="mb-3 border">
                <i className="ti ti-shield-check me-2" />
                Use this view to verify enrollment integrity before trusting attendance trends for the student.
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
                        <td className="fw-semibold">Course #{enrollment.course_id as number}</td>
                        <td className="text-secondary">Student #{enrollment.student_id as number}</td>
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
