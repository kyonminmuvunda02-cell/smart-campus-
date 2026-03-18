import { useEffect, useState } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useAttendanceReview } from '../hooks/useAttendanceReview';
import { getErrorMessage } from '@/utils/errors';
import { useToast } from '@/components/common/ToastManager';
import { useUser } from '@/modules/users/hooks/useUser';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import {
  buildLookupMap,
  getCourseDisplayName,
  getStudentDisplayName,
  getUserDisplayName,
  getVenueDisplayName,
} from '@/utils/entityLabels';

type ReviewFilter = 'All' | 'Pending' | 'Rejected' | 'Verified';

export default function AttendanceReviewPage() {
  const [filter, setFilter] = useState<ReviewFilter>('All');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const { showToast } = useToast();
  const { useQueue, review } = useAttendanceReview();
  const { useList: useUserList } = useUser();
  const { useList: useCourseList } = useCourse();
  const { useList: useVenueList } = useVenue();
  const { data, isLoading } = useQueue({
    verification_status: filter === 'All' ? undefined : filter,
    limit: 100,
  });
  const { data: usersData } = useUserList({ query: { limit: 500 } });
  const { data: coursesData } = useCourseList({ query: { limit: 500 } });
  const { data: venuesData } = useVenueList({ query: { limit: 500 } });

  const items = data?.items ?? [];
  const users = (usersData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const courses = (coursesData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const venues = (venuesData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const userLookup = buildLookupMap(users, 'user_id', (user) => getUserDisplayName(user, user.user_id as number));
  const studentLookup = buildLookupMap(users, 'user_id', (user) => getStudentDisplayName(user, user.user_id as number));
  const courseLookup = buildLookupMap(courses, 'course_id', (course) => getCourseDisplayName(course, course.course_id as number));
  const venueLookup = buildLookupMap(venues, 'venue_id', (venue) => getVenueDisplayName(venue, venue.venue_id as number));
  const pendingCount = items.filter((item) => item.verification_status === 'Pending').length;
  const rejectedCount = items.filter((item) => item.verification_status === 'Rejected').length;
  const selectedItem = items.find((item) => item.attendance_id === selectedId) ?? items[0] ?? null;

  useEffect(() => {
    setSelectedId(selectedItem?.attendance_id ?? null);
    setReviewNote(selectedItem?.review_note ?? '');
  }, [selectedItem?.attendance_id, selectedItem?.review_note]);

  async function handleDecision(verificationStatus: 'Verified' | 'Rejected' | 'Pending') {
    if (!selectedItem) return;
    try {
      await review.mutateAsync({
        attendanceId: selectedItem.attendance_id,
        body: {
          verification_status: verificationStatus,
          review_note: reviewNote.trim() || null,
        },
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
        subtitle="Resolve flagged scans, capture a review note, and keep an auditable decision trail for disputed attendance."
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

          {selectedItem ? (
            <div className="surface-card section-card">
              <div className="section-title">
                <div>
                  <h3>Review detail</h3>
                  <div className="section-subtle">Record the decision and why the scan should be trusted or rejected.</div>
                </div>
              </div>

              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-label">Student</span>
                  <span className="detail-value">{studentLookup.get(selectedItem.student_id) ?? `Student #${selectedItem.student_id}`}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Session</span>
                  <span className="detail-value">{selectedItem.session_type} - {courseLookup.get(selectedItem.course_id) ?? `Course #${selectedItem.course_id}`}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Scanned at</span>
                  <span className="detail-value">{new Date(selectedItem.checked_in_at).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">GPS accuracy</span>
                  <span className="detail-value">{selectedItem.gps_accuracy ? `${Math.round(selectedItem.gps_accuracy)} m` : 'Unavailable'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Current status</span>
                  <span className="detail-value">{selectedItem.verification_status}</span>
                </div>
              </div>

              <div className="field-shell">
                <Form.Label className="field-label">Review note</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Record why this scan is approved, rejected, or still pending."
                />
              </div>

              <div className="ph-actions attendance-review-actions">
                <Button variant="outline-success" onClick={() => void handleDecision('Verified')} disabled={review.isPending}>
                  <i className="ti ti-check" />Approve
                </Button>
                <Button variant="outline-danger" onClick={() => void handleDecision('Rejected')} disabled={review.isPending}>
                  <i className="ti ti-x" />Reject
                </Button>
                <Button variant="outline-secondary" onClick={() => void handleDecision('Pending')} disabled={review.isPending}>
                  <i className="ti ti-clock-hour-4" />Keep pending
                </Button>
              </div>

              {selectedItem.reviewed_at ? (
                <Alert variant="info" className="mb-0">
                  <i className="ti ti-info-circle me-2" />
                  Last reviewed {new Date(selectedItem.reviewed_at).toLocaleString()}
                  {selectedItem.reviewed_by ? ` by ${userLookup.get(selectedItem.reviewed_by) ?? `User #${selectedItem.reviewed_by}`}` : ''}.
                </Alert>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>Flagged attendance</h3>
              <div className="section-subtle">Select a record to inspect its evidence and complete the decision</div>
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
                    <th className="text-end">Inspect</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.attendance_id} className={selectedId === item.attendance_id ? 'table-primary-subtle' : ''}>
                      <td>
                        <div className="entity-copy">
                          <strong>{studentLookup.get(item.student_id) ?? `Student #${item.student_id}`}</strong>
                          <span>{new Date(item.checked_in_at).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="text-secondary small">
                        {item.session_type} - {courseLookup.get(item.course_id) ?? `Course #${item.course_id}`} - {venueLookup.get(item.venue_id) ?? `Venue #${item.venue_id}`}
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
                        <div className="table-actions">
                          <Button variant="outline-primary" size="sm" onClick={() => setSelectedId(item.attendance_id)}>
                            <i className="ti ti-eye" />Inspect
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
