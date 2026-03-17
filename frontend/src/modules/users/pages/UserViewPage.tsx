import { useParams, Link } from 'react-router';
import { Card, Row, Col, Badge, Button, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import { useUser } from '../hooks/useUser';

export default function UserViewPage() {
  const { id } = useParams<{ id: string }>();
  const { useDetail } = useUser();
  const { data: user, isLoading } = useDetail(id ? Number(id) : undefined);

  if (isLoading) {
    return <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>;
  }
  if (!user) {
    return <div className="text-center py-5 text-secondary">User not found.</div>;
  }

  const u = user as Record<string, unknown>;

  return (
    <div>
      <PageHeader title={`${u.first_name || ''} ${u.last_name || ''}`} subtitle="User Profile">
        <Link to="/users"><Button variant="outline-secondary"><i className="ti ti-arrow-left me-2" />Back</Button></Link>
        <Link to={`/users/${id}/edit`}><Button variant="primary"><i className="ti ti-edit me-2" />Edit</Button></Link>
      </PageHeader>

      <Row className="g-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm text-center p-4">
            <div className="avatar avatar-lg bg-primary-lt text-primary mx-auto mb-3 d-flex align-items-center justify-content-center" style={{ width: 80, height: 80, fontSize: '2rem' }}>
              <i className="ti ti-user" />
            </div>
            <h4 className="mb-1">{u.first_name as string} {u.last_name as string}</h4>
            <Badge bg={u.role === 'Admin' ? 'danger' : u.role === 'Lecturer' ? 'secondary' : 'primary'} className="mb-2">
              {u.role as string}
            </Badge>
            <p className="text-secondary small mb-0">{u.email as string}</p>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent"><h5 className="card-title mb-0">Details</h5></Card.Header>
            <Card.Body>
              <table className="table table-borderless mb-0">
                <tbody>
                  <tr><td className="text-secondary w-25">User ID</td><td>{u.user_id as number}</td></tr>
                  <tr><td className="text-secondary">Email</td><td>{u.email as string}</td></tr>
                  <tr><td className="text-secondary">Role</td><td>{u.role as string}</td></tr>
                  <tr><td className="text-secondary">Created</td><td>{u.created_at ? new Date(u.created_at as string).toLocaleString() : '-'}</td></tr>
                </tbody>
              </table>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
