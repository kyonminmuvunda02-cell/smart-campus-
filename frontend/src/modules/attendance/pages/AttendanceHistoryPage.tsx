import { Card, Table } from 'react-bootstrap';
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
  sessions.forEach((session) => {
    sessionLookup.set(Number(session.session_id), session);
  });

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
                  <td className="fw-semibold">
                    {(() => {
                      const session = sessionLookup.get(r.session_id as number);
                      if (!session) return `Session #${r.session_id as number}`;
                      return `${String(session.session_type ?? 'Session')} - ${courseLookup.get(Number(session.course_id)) ?? `Course #${String(session.course_id ?? '-')}`}`;
                    })()}
                  </td>
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
