import { useEffect, useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import EmptyState from '@/components/common/EmptyState';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import PageHeader from '@/components/common/PageHeader';
import Pagination from '@/components/common/Pagination';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useUser } from '@/modules/users/hooks/useUser';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { buildLookupMap, getStudentDisplayName, getVenueDisplayName } from '@/utils/entityLabels';
import ForensicAuditModal from '../components/ForensicAuditModal';
import { useAttendanceReview } from '../hooks/useAttendanceReview';

type ReviewFilter = 'All' | 'Pending' | 'Rejected' | 'Verified';

export default function AttendanceReviewPage() {
  const [filter, setFilter] = useState<ReviewFilter>('Pending');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { role } = useAuth();
  const { useQueue } = useAttendanceReview();
  const { useList: useUserList } = useUser();
  const { useList: useVenueList } = useVenue();

  const { data, isLoading } = useQueue({ verification_status: filter === 'All' ? undefined : filter, limit: 100 });
  const { data: usersData } = useUserList({ query: { limit: 500 } }, role === 'Admin' || role === 'Lecturer');
  const { data: venuesData } = useVenueList({ query: { limit: 500 } });

  const items = (data as any)?.items ?? [];
  const users = (usersData as any)?.items ?? [];
  const venues = (venuesData as any)?.items ?? [];

  const studentLookup = buildLookupMap(users, 'user_id', (u) => getStudentDisplayName(u, u.user_id as number));
  const venueLookup = buildLookupMap(venues, 'venue_id', (v) => getVenueDisplayName(v, v.venue_id as number));

  const pendingCount = items.filter((i: any) => i.verification_status === 'Pending').length;
  const selectedItem = items.find((i: any) => i.attendance_id === selectedId) || null;

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedItems = items.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Evidence Audit"
        subtitle="Verify identity markers and location integrity for flagged academic check-ins."
        icon="shield-search"
        tone="purple"
        breadcrumbs={[{ label: 'Administration' }, { label: 'Attendance Audit' }]}
      />

      <div className="row g-4">
        <div className="col-md-3">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-purple-lt text-purple p-2 fs-3 rounded-3">
              <i className="ti ti-list-check" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Unresolved Cases</span>
              <strong className="h4 mb-0 d-block">{pendingCount}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-red-lt text-red p-2 fs-3 rounded-3">
              <i className="ti ti-alert-square-rounded" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Risk Flagged</span>
              <strong className="h4 mb-0 d-block">{items.filter((i: any) => i.fraud_flag).length}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-6 text-end">
          <div className="surface-card p-3 shadow-sm border-0 bg-light-subtle d-inline-flex align-items-center gap-3 h-100">
            <div className="segmented-filter sm d-flex gap-1 bg-white p-1 rounded-3 border">
              {(['Pending', 'Verified', 'Rejected', 'All'] as const).map((f) => (
                <button
                  key={f}
                  className={filter === f ? 'active' : ''}
                  onClick={() => {
                    setFilter(f);
                    setSelectedId(null);
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
        {items.length === 0 ? (
          <div className="p-5"><EmptyState icon="ti-shield-check" title="Registry Clear" message="No pending records match your current criteria." /></div>
        ) : (
          <>
            <div className="d-none d-md-block table-responsive">
              <Table hover className="mb-0 border-0">
                <thead className="bg-light-subtle text-secondary small fw-bold uppercase tracking-wider">
                  <tr>
                    <th className="ps-4 border-0 py-3">Trace Identity</th>
                    <th className="border-0 py-3 text-center">Integrity Score</th>
                    <th className="text-end pe-4 border-0 py-3">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {paginatedItems.map((i: any) => (
                    <tr key={i.attendance_id}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className="sb-avatar sm bg-light-subtle text-purple fw-bold">{studentLookup.get(i.student_id)?.[0]}</div>
                          <div className="entity-copy">
                            <strong className="text-navy d-block">{studentLookup.get(i.student_id)}</strong>
                            <span className="smaller text-muted">{new Date(i.checked_in_at).toLocaleTimeString()} | {venueLookup.get(i.venue_id)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <span className={`status-pill ${i.fraud_flag ? 'red' : 'green'}`}>
                          <i className={`ti ti-${i.fraud_flag ? 'alert-octagon' : 'shield-check'}`} />
                          {i.fraud_flag ? 'High Risk' : 'Passed Verified'}
                        </span>
                      </td>
                      <td className="text-end pe-4 py-3">
                        <Button variant="outline-purple" size="sm" className="fw-bold px-3" onClick={() => setSelectedId(i.attendance_id)}>
                          Forensic Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>

            <div className="d-md-none p-3">
              <div className="mobile-record-list">
                {paginatedItems.map((i: any) => (
                  <div key={i.attendance_id} className="mobile-record-card">
                    <div className="mobile-record-head">
                      <div>
                        <span className="mobile-record-title">{studentLookup.get(i.student_id) || `Student #${i.student_id}`}</span>
                        <span className="mobile-record-meta">{new Date(i.checked_in_at).toLocaleString()}</span>
                      </div>
                      <span className={`status-pill ${i.fraud_flag ? 'red' : 'green'}`}>
                        <i className={`ti ti-${i.fraud_flag ? 'alert-octagon' : 'shield-check'}`} />
                        {i.fraud_flag ? 'High Risk' : 'Verified'}
                      </span>
                    </div>

                    <div className="detail-list">
                      <div className="detail-row">
                        <div className="detail-label">Venue</div>
                        <div className="detail-value">{venueLookup.get(i.venue_id) || `Venue #${i.venue_id}`}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Status</div>
                        <div className="detail-value">{String(i.verification_status ?? 'Pending')}</div>
                      </div>
                    </div>

                    <div className="mobile-record-actions">
                      <Button variant="outline-purple" size="sm" onClick={() => setSelectedId(i.attendance_id)}>
                        <i className="ti ti-shield-search" />
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {items.length > pageSize && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={items.length}
                pageSize={pageSize}
              />
            )}
          </>
        )}
      </div>

      {selectedItem && (
        <ForensicAuditModal
          show={!!selectedId}
          onHide={() => setSelectedId(null)}
          attendanceRecord={selectedItem}
          studentName={studentLookup.get(selectedItem.student_id) || ''}
        />
      )}
    </div>
  );
}
