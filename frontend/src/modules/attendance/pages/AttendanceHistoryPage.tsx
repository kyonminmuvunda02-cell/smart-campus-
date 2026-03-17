import { Card, Table } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useAttendance } from '../hooks/useAttendance';

export default function AttendanceHistoryPage() {
  const { userId } = useAuth();
  const { useStudentRecords } = useAttendance();
  const { data, isLoading } = useStudentRecords(userId ?? undefined);

  const records = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];

  return (
    <div>
      <PageHeader title="My Attendance" subtitle="Your check-in history" />

      {isLoading ? (
        <LoadingSkeleton rows={8} columns={4} />
      ) : records.length === 0 ? (
        <EmptyState icon="ti-calendar-off" title="No attendance records" message="You haven&apos;t checked into any sessions yet." />
      ) : (
        <Card className="border-0 shadow-sm">
          <Table responsive hover className="table-vcenter card-table mb-0">
            <thead><tr><th>Session</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
            <tbody>
              {records.map((r: Record<string, unknown>) => (
                <tr key={r.attendance_id as number}>
                  <td className="fw-semibold">Session #{r.session_id as number}</td>
                  <td className="text-secondary">{r.checked_in_at ? new Date(r.checked_in_at as string).toLocaleDateString() : '-'}</td>
                  <td className="text-secondary">{r.checked_in_at ? new Date(r.checked_in_at as string).toLocaleTimeString() : '-'}</td>
                  <td>
                    <span className={`badge ${(r.fraud_flag as boolean) ? 'bg-warning text-dark' : 'bg-success'}`}>
                      {((r.verification_status as string) || 'Verified') + ((r.fraud_flag as boolean) ? ' (Flagged)' : '')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
