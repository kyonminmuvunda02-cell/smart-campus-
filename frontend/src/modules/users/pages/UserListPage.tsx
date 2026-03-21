import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, Table } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useUser } from '../hooks/useUser';
import UserFormModal from '../components/UserFormModal';
import Pagination from '@/components/common/Pagination';

type RoleFilter = 'All' | 'Student' | 'Lecturer' | 'Admin';

export default function UserListPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>();

  const { useList } = useUser();
  const { data, isLoading } = useList({ query: { skip: 0, limit: 1000 } });
  const pageSize = 10;

  const users = (data as { items?: Array<Record<string, any>> })?.items ?? [];
  
  const filteredUsers = users.filter((u) => {
    const term = search.trim().toLowerCase();
    const fullName = `${String(u.first_name ?? '')} ${String(u.last_name ?? '')}`.toLowerCase();
    const email = String(u.email ?? '').toLowerCase();
    const idStr = String(u.user_id ?? '');
    
    const matchesSearch = !term || fullName.includes(term) || email.includes(term) || idStr.includes(term);
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(pageStart, pageStart + pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const handleCreate = () => {
    setSelectedUserId(undefined);
    setShowModal(true);
  };

  const handleEdit = (id: number) => {
    setSelectedUserId(id);
    setShowModal(true);
  };

  const getRoleTone = (role: string) => {
    switch (role) {
      case 'Admin': return 'navy';
      case 'Lecturer': return 'purple';
      case 'Student': return 'royal';
      default: return 'green';
    }
  };

  return (
    <div>
      <PageHeader
        title="Identity Directory"
        subtitle="Govern campus identities, managing access and profile data across the academic ecosystem."
        icon="users"
        tone="purple"
        breadcrumbs={[
          { label: 'Administration', path: '/users' },
          { label: 'Users' }
        ]}
      >
        <Button variant="primary" onClick={handleCreate}>
          <i className="ti ti-user-plus" />
          Add User
        </Button>
      </PageHeader>

      <div className="stack gap-4">
        {/* Stat Cards Section */}
        <div className="row g-4">
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-purple-lt text-purple p-2 fs-3 rounded-3">
                <i className="ti ti-users" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Total Users</span>
                <strong className="h4 mb-0 d-block">{users.length}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0">
              <div className="sb-avatar bg-navy-mid text-white p-2 fs-3 rounded-3">
                <i className="ti ti-school" />
              </div>
              <div className="entity-copy">
                <span className="text-secondary small fw-bold uppercase">Lecturers</span>
                <strong className="h4 mb-0 d-block">{users.filter(u => u.role === 'Lecturer').length}</strong>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="surface-card p-3 shadow-sm border-0 bg-purple text-white d-flex align-items-center justify-content-between">
              <div>
                <span className="small fw-bold uppercase opacity-75">Access Governance</span>
                <p className="mb-0 small">User roles determine access to sensitive academic data and session management controls.</p>
              </div>
              <i className="ti ti-lock fs-1 opacity-25" />
            </div>
          </div>
        </div>

        <div className="surface-card p-0 overflow-hidden mb-4">
          <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light-subtle">
            <div className="d-flex align-items-center gap-3 flex-grow-1" style={{ maxWidth: '700px' }}>
              <div className="field-shell mb-0 flex-grow-1">
                <div className="field-wrap py-1">
                  <i className="ti ti-search" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, email, or ID..."
                    className="form-control-sm border-0 bg-transparent"
                  />
                </div>
              </div>
              <div className="segmented-filter sm">
                {(['All', 'Student', 'Lecturer', 'Admin'] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={roleFilter === role ? 'active' : ''}
                    onClick={() => setRoleFilter(role)}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-secondary small fw-medium">
              {filteredUsers.length} Identities Found
            </div>
          </div>

          {isLoading ? (
            <div className="p-4"><LoadingSkeleton rows={10} columns={4} /></div>
          ) : users.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="ti-users-minus" title="No Identities Found" message="The user directory is currently empty. Start by adding students or staff.">
                <Button variant="primary" onClick={handleCreate}>Add Your First User</Button>
              </EmptyState>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-5">
              <EmptyState icon="ti-filter-off" title="No Matching Records" message="Try broadening your search or switching role filters." />
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 border-0">
                <thead className="bg-light-subtle">
                  <tr>
                    <th className="ps-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Identity</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Role & Status</th>
                    <th className="border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">System ID</th>
                    <th className="text-end pe-4 border-0 py-3 small fw-bold text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {paginatedUsers.map((u) => {
                    const role = String(u.role ?? 'User');
                    const initials = `${String(u.first_name?.[0] ?? 'U')}${String(u.last_name?.[0] ?? '')}`;
                    return (
                      <tr key={u.user_id}>
                        <td className="ps-4 py-3">
                          <div className="d-flex align-items-center gap-3">
                            <div className={`sb-avatar ${role === 'Admin' ? 'bg-navy' : role === 'Lecturer' ? 'bg-purple-bg text-purple-text' : 'bg-accent-lt text-accent'}`}>
                              {initials}
                            </div>
                            <div className="entity-copy">
                              <strong className="text-navy">{String(u.first_name ?? '')} {String(u.last_name ?? '')}</strong>
                              <span className="text-secondary smaller">{String(u.email ?? '-')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`status-pill ${getRoleTone(role)}`}>
                            <i className={`ti ti-${role === 'Admin' ? 'shield-lock' : role === 'Lecturer' ? 'school' : 'user'}`} />
                            {role}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className="mono small text-secondary">ID-{String(u.user_id).padStart(4, '0')}</span>
                        </td>
                        <td className="text-end pe-4 py-3">
                          <div className="d-flex gap-1 justify-content-end">
                            <Link to={`/users/${u.user_id}`}>
                              <Button variant="outline-secondary" size="sm" className="border-0 shadow-none">
                                <i className="ti ti-eye fs-5" />
                              </Button>
                            </Link>
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              className="border-0 shadow-none"
                              onClick={() => handleEdit(u.user_id as number)}
                            >
                              <i className="ti ti-edit fs-5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}

          {filteredUsers.length > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filteredUsers.length}
              pageSize={pageSize}
            />
          )}
        </div>
      </div>

      <UserFormModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setSelectedUserId(undefined);
        }}
        userId={selectedUserId}
      />
    </div>
  );
}
