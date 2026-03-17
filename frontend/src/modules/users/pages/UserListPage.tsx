import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useUser } from '../hooks/useUser';

type UserRoleFilter = 'All' | 'Student' | 'Lecturer' | 'Admin';

function getRoleTone(role: string) {
  if (role === 'Admin') return 'purple';
  if (role === 'Lecturer') return 'teal';
  return 'royal';
}

export default function UserListPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('All');
  const { useList } = useUser();
  const { data, isLoading } = useList();

  const users = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const filteredUsers = users.filter((user) => {
    const role = String(user.role ?? '');
    const fullName = `${String(user.first_name ?? '')} ${String(user.last_name ?? '')}`.trim().toLowerCase();
    const email = String(user.email ?? '').toLowerCase();
    const term = search.trim().toLowerCase();
    const matchesRole = roleFilter === 'All' || role === roleFilter;
    const matchesSearch =
      !term ||
      fullName.includes(term) ||
      email.includes(term) ||
      String(user.user_id ?? '').includes(term);

    return matchesRole && matchesSearch;
  });

  const studentCount = users.filter((user) => user.role === 'Student').length;
  const lecturerCount = users.filter((user) => user.role === 'Lecturer').length;
  const adminCount = users.filter((user) => user.role === 'Admin').length;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Identity directory"
        subtitle="Govern the people who can access campus workflows, teaching surfaces, and attendance controls."
        icon="users"
        tone="purple"
      >
        <Link to="/users/new">
          <Button variant="primary"><i className="ti ti-plus" />Add user</Button>
        </Link>
      </PageHeader>

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Directory filters</h3>
                <div className="section-subtle">Narrow the identity space before taking action.</div>
              </div>
              <span className="status-pill purple"><i className="ti ti-shield" />Governed</span>
            </div>

            <div className="field-shell" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="userSearch" className="field-label">Search by name, email, or ID</label>
              <div className="field-wrap">
                <i className="ti ti-search" />
                <input
                  id="userSearch"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="e.g. Mwewa, lecturer@campus.edu, 104"
                />
              </div>
            </div>

            <div className="field-shell" style={{ marginBottom: 0 }}>
              <label className="field-label">Role scope</label>
              <div className="segmented-filter">
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
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Identity mix</h3>
                <div className="section-subtle">Current composition of the user directory</div>
              </div>
            </div>

            <div className="session-stat-row">
              <div className="session-stat">
                <label>Total users</label>
                <strong>{users.length}</strong>
              </div>
              <div className="session-stat">
                <label>Students</label>
                <strong>{studentCount}</strong>
              </div>
              <div className="session-stat">
                <label>Lecturers</label>
                <strong>{lecturerCount}</strong>
              </div>
            </div>
            <div className="session-stat-row" style={{ marginTop: '0.75rem', gridTemplateColumns: '1fr' }}>
              <div className="session-stat">
                <label>Admins</label>
                <strong>{adminCount}</strong>
              </div>
            </div>
          </div>

          <div className="callout-panel purple">
            <i className="ti ti-lock-access" style={{ color: 'var(--purple)' }} />
            <div>
              <div className="callout-title">Identity quality matters first</div>
              <div className="callout-copy">
                Poor user governance cascades into weak attendance trust, bad enrollment reporting, and permission confusion across the product.
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>Directory records</h3>
              <div className="section-subtle">Showing {filteredUsers.length} of {users.length} identities under the current filter scope</div>
            </div>
            <span className="status-pill royal"><i className="ti ti-users" />{roleFilter}</span>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={8} columns={5} />
          ) : users.length === 0 ? (
            <EmptyState icon="ti-users-minus" title="No users found" message="Create your first user to establish the campus directory.">
              <Link to="/users/new"><Button variant="primary">Add user</Button></Link>
            </EmptyState>
          ) : filteredUsers.length === 0 ? (
            <EmptyState icon="ti-filter-off" title="No matching users" message="Adjust the search term or selected role to widen the directory view." />
          ) : (
            <div className="table-shell">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Contact</th>
                    <th>Role</th>
                    <th>ID</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const role = String(user.role ?? 'Student');
                    const firstName = String(user.first_name ?? '');
                    const lastName = String(user.last_name ?? '');
                    const initials = `${firstName.slice(0, 1)}${lastName.slice(0, 1) || firstName.slice(1, 2)}`.toUpperCase() || 'U';

                    return (
                      <tr key={user.user_id as number}>
                        <td>
                          <div className="entity-row">
                            <div className="entity-avatar">{initials}</div>
                            <div className="entity-copy">
                              <strong>{`${firstName} ${lastName}`.trim() || 'Unnamed user'}</strong>
                              <span>Directory identity record</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-secondary">{String(user.email ?? '-')}</td>
                        <td>
                          <span className={`status-pill ${getRoleTone(role)}`}>
                            <i className={`ti ti-${role === 'Admin' ? 'shield' : role === 'Lecturer' ? 'user-star' : 'user'}`} />
                            {role}
                          </span>
                        </td>
                        <td className="mono">#{String(user.user_id ?? '-')}</td>
                        <td className="text-end">
                          <div className="table-actions">
                            <Link to={`/users/${user.user_id}`}>
                              <Button variant="outline-primary" size="sm"><i className="ti ti-eye" />View</Button>
                            </Link>
                            <Link to={`/users/${user.user_id}/edit`}>
                              <Button variant="outline-secondary" size="sm"><i className="ti ti-edit" />Edit</Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
