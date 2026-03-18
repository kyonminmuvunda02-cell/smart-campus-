import { useState } from 'react';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useAttendanceReview } from '../hooks/useAttendanceReview';
import { getErrorMessage } from '@/utils/errors';
import { useToast } from '@/components/common/ToastManager';

type ReviewFilter = 'All' | 'Pending' | 'Rejected' | 'Verified';

export default function AttendanceReviewPage() {
  const [filter, setFilter] = useState<ReviewFilter>('All');
  const { showToast } = useToast();
  const { useQueue, review } = useAttendanceReview();
  const { data, isLoading } = useQueue({
    verification_status: filter === 'All' ? undefined : filter,
  });

  const items = data?.items ?? [];
  const pendingCount = items.filter((item) => item.verification_status === 'Pending').length;
  const rejectedCount = items.filter((item) => item.verification_status === 'Rejected').length;

  async function handleDecision(attendanceId: number, verificationStatus: 'Verified' | 'Rejected' | 'Pending') {
    try {
      await review.mutateAsync({
        attendanceId,
        body: { verification_status: verificationStatus },
      });
      showToast('success', 'Review updated', `Attendance record marked as ${verificationStatus}.`);
    } catch (error) {
      showToast('danger', 'Review failed', getErrorMessage(error));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Teaching operations"
        title="Attendance review queue"
        subtitle="Resolve flagged scans, weak GPS submissions, and pending attendance evidence before reporting locks in."
        icon="shield-search"
        tone="purple"
      />

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Queue filters</h3>
                <div className="section-subtle">Focus the review workload by current decision state.</div>
              </div>
              <span className="status-pill purple"><i className="ti ti-alert-triangle" />Risk review</span>
            </div>
            <div className="segmented-filter">
              {(['All', 'Pending', 'Rejected', 'Verified'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  className={filter === item ? 'active' : ''}
                  onClick={() => setFilter(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Queue health</h3>
                <div className="section-subtle">How much unresolved attendance evidence is still in play</div>
              </div>
            </div>
            <div className="session-stat-row">
              <div className="session-stat">
                <label>Total items</label>
                <strong>{items.length}</strong>
              </div>
              <div className="session-stat">
                <label>Pending</label>
                <strong>{pendingCount}</strong>
              </div>
              <div className="session-stat">
                <label>Rejected</label>
                <strong>{rejectedCount}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>Flagged attendance</h3>
              <div className="section-subtle">Only scans requiring a decision remain in this queue</div>
            </div>
            <span className="status-pill purple"><i className="ti ti-list-details" />{items.length} records</span>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={8} columns={6} />
          ) : items.length === 0 ? (
            <EmptyState icon="ti-shield-check" title="Review queue is clear" message="No flagged attendance records currently need intervention." />
          ) : (
            <div className="table-shell">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Attendance</th>
                    <th>Context</th>
                    <th>GPS confidence</th>
                    <th>Status</th>
                    <th className="text-end">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.attendance_id}>
                      <td>
                        <div className="entity-copy">
                          <strong>Student #{item.student_id}</strong>
                          <span>{new Date(item.checked_in_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="text-secondary small">
                        Session #{item.session_id} · Course #{item.course_id} · Venue #{item.venue_id}
                      </td>
                      <td>
                        <div className="entity-copy">
                          <strong>{item.gps_accuracy ? `${Math.round(item.gps_accuracy)} m` : 'No accuracy'}</strong>
                          <span>{item.fraud_flag ? 'Flagged by trust checks' : 'Reviewed state'}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${item.verification_status === 'Verified' ? 'green' : item.verification_status === 'Rejected' ? 'red' : 'amber'}`}>
                          <i className={`ti ti-${item.verification_status === 'Verified' ? 'circle-check' : item.verification_status === 'Rejected' ? 'circle-x' : 'alert-triangle'}`} />
                          {item.verification_status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="table-actions attendance-review-actions">
                          <Button variant="outline-success" size="sm" onClick={() => void handleDecision(item.attendance_id, 'Verified')} disabled={review.isPending}>
                            <i className="ti ti-check" />Approve
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => void handleDecision(item.attendance_id, 'Rejected')} disabled={review.isPending}>
                            <i className="ti ti-x" />Reject
                          </Button>
                        </div>
                      </td>
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
