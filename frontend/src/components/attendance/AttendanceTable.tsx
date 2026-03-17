import { Table, Badge } from 'react-bootstrap';
import type { AttendanceRecordResponse } from '../../client/types.gen';

interface Props { records: AttendanceRecordResponse[] }

export default function AttendanceTable({ records }: Props) {
  if (records.length === 0) return <p className="text-muted">No attendance records found.</p>;

  return (
    <Table striped hover responsive>
      <thead className="table-dark">
        <tr>
          <th>#</th><th>Session ID</th><th>Checked In At</th><th>Status</th><th>Fraud</th>
        </tr>
      </thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.attendance_id}>
            <td>{r.attendance_id}</td>
            <td>{r.session_id}</td>
            <td>{r.checked_in_at.toLocaleString()}</td>
            <td>
              <Badge bg={r.verification_status === 'Verified' ? 'success' : r.verification_status === 'Failed' ? 'danger' : 'warning'}>
                {r.verification_status}
              </Badge>
            </td>
            <td>{r.fraud_flag && <Badge bg="danger">🚩 Flagged</Badge>}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
