import { Table } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useAttendance } from '../hooks/useAttendance';
import { useSession } from '@/modules/sessions/hooks/useSession';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { buildLookupMap, getCourseDisplayName } from '@/utils/entityLabels';

export default function AttendanceHistoryPage() {
  const { userId } = useAuth();
  const { useStudentRecords } = useAttendance();
  const { useList: useSessionList } = useSession();
  const { useList: useCourseList } = useCourse();
  
  const { data, isLoading } = useStudentRecords(userId ?? undefined);
  const { data: sessionsData } = useSessionList({ query: { limit: 200 } });
  const { data: coursesData } = useCourseList({ query: { limit: 500 } });

  const records = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const sessions = (sessionsData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const courses = (coursesData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  
  const courseLookup = buildLookupMap(courses, 'course_id', (course) => getCourseDisplayName(course, course.course_id as number));
  const sessionLookup = new Map<number, Record<string, unknown>>();
  sessions.forEach((s) => sessionLookup.set(Number(s.session_id), s));

  const verifiedCount = records.filter(r => !r.fraud_flag).length;
  const verifiedRate = records.length ? Math.round((verifiedCount / records.length) * 100) : 0;

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="My Attendance History"
        subtitle="Comprehensive record of your classroom check-ins and compliance status."
        icon="history"
        tone="royal"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Attendance History' }]}
      />

      <div className="row g-4">
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-royal-lt text-royal p-2 fs-3 rounded-3">
              <i className="ti ti-clipboard-check" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Total Scans</span>
              <strong className="h4 mb-0 d-block">{records.length}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-green-lt text-green p-2 fs-3 rounded-3">
              <i className="ti ti-shield-check" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Verified Rate</span>
              <strong className="h4 mb-0 d-block">{verifiedRate}%</strong>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-amber-lt text-amber p-2 fs-3 rounded-3">
              <i className="ti ti-alert-triangle" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Pending Flags</span>
              <strong className="h4 mb-0 d-block">{records.length - verifiedCount}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
        {records.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="ti-calendar-off" title="No History Found" message="You haven't checked into any sessions yet." />
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="mb-0 border-0">
              <thead className="bg-light-subtle text-secondary small fw-bold uppercase tracking-wider">
                <tr>
                  <th className="ps-4 border-0 py-3">Educational Session</th>
                  <th className="border-0 py-3">Timestamp</th>
                  <th className="text-end pe-4 border-0 py-3">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {records.map((r) => {
                  const s = sessionLookup.get(Number(r.session_id));
                  const courseName = s ? courseLookup.get(Number(s.course_id)) : `Session #${r.session_id}`;
                  const sType = s ? String(s.session_type) : '-';
                  const date = r.checked_in_at ? new Date(String(r.checked_in_at)) : null;

                  return (
                    <tr key={String(r.attendance_id)}>
                      <td className="ps-4 py-3">
                        <div className="entity-copy">
                          <strong className="text-navy d-block">{courseName}</strong>
                          <span className="smaller text-muted">{sType}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="entity-copy">
                          <strong className="small text-navy d-block">{date?.toLocaleDateString()}</strong>
                          <span className="smaller text-muted mono">{date?.toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="text-end pe-4 py-3">
                        <span className={`status-pill ${r.fraud_flag ? 'amber' : 'green'}`}>
                          <i className={`ti ti-${r.fraud_flag ? 'shield-exclamation' : 'circle-check'}`} />
                          {r.fraud_flag ? 'Flagged for Review' : (String(r.verification_status) || 'Verified')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
