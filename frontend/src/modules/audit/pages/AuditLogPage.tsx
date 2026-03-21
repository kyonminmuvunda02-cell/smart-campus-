import { useState } from 'react';
import { Link } from 'react-router';
import { Table, Form, Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useAudit } from '../hooks/useAudit';
import { useUser } from '@/modules/users/hooks/useUser';
import { buildLookupMap, getUserDisplayName } from '@/utils/entityLabels';

type AuditScope = 'All' | 'Auth' | 'Mutation' | 'Attendance' | 'Other';

function classifyAuditAction(action: string): AuditScope {
  const norm = action.toLowerCase();
  if (norm.includes('login') || norm.includes('logout') || norm.includes('token')) return 'Auth';
  if (norm.includes('checkin') || norm.includes('attendance') || norm.includes('session')) return 'Attendance';
  if (norm.includes('create') || norm.includes('update') || norm.includes('delete')) return 'Mutation';
  return 'Other';
}

function getAuditTone(scope: AuditScope) {
  if (scope === 'Auth') return 'royal';
  if (scope === 'Mutation') return 'purple';
  if (scope === 'Attendance') return 'teal';
  return 'amber';
}

function getAuditDestination(tableName: string | null, recordId: number | null) {
  if (!tableName || recordId === null) return null;
  const norm = tableName.toLowerCase();
  if (norm.includes('appuser') || norm.includes('student') || norm.includes('lecturer')) return `/users/${recordId}`;
  if (norm.includes('course')) return `/courses/${recordId}`;
  if (norm.includes('venue')) return `/venues/${recordId}`;
  if (norm.includes('attendancesession')) return `/sessions/${recordId}`;
  if (norm.includes('attendancerecord')) return '/attendance-review';
  return null;
}

export default function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<AuditScope>('All');
  const { useList } = useAudit();
  const { useList: useUserList } = useUser();
  
  const { data, isLoading } = useList();
  const { data: usersData } = useUserList({ query: { limit: 500 } });
  const logs = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const users = (usersData as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const userLookup = buildLookupMap(users, 'user_id', (u) => getUserDisplayName(u, u.user_id as number));

  const filteredLogs = logs.filter((log) => {
    const action = String(log.action ?? '').toLowerCase();
    const detail = String(log.detail ?? '').toLowerCase();
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || action.includes(term) || detail.includes(term);
    const matchesScope = scope === 'All' || classifyAuditAction(String(log.action)) === scope;
    return matchesSearch && matchesScope;
  });

  if (isLoading) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Audit Evidence Registry"
        subtitle="Unalterable system ledger for monitoring identity actions and operational shifts."
        icon="file-shield"
        tone="purple"
        breadcrumbs={[{ label: 'Administration' }, { label: 'System Audit' }]}
      />

      <div className="row g-4">
        <div className="col-md-3">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-purple-lt text-purple p-2 fs-3 rounded-3">
              <i className="ti ti-activity" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Total Events</span>
              <strong className="h4 mb-0 d-block">{logs.length}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-royal-lt text-royal p-2 fs-3 rounded-3">
              <i className="ti ti-lock-access" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Auth Traffic</span>
              <strong className="h4 mb-0 d-block">{logs.filter(l => classifyAuditAction(String(l.action)) === 'Auth').length}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-6">
           <div className="surface-card p-3 shadow-sm border-0 bg-light-subtle d-flex align-items-center gap-3 h-100">
             <div className="flex-grow-1 position-relative">
               <i className="ti ti-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
               <Form.Control 
                 className="ps-5 bg-white border-0 shadow-none rounded-3" 
                 placeholder="Search by action, detail or entity..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
             </div>
             <div className="segmented-filter d-flex gap-1 bg-white p-1 rounded-3 border">
                {(['All', 'Auth', 'Mutation', 'Attendance'] as const).map(f => (
                  <Button 
                    key={f} 
                    variant={scope === f ? 'purple' : 'ghost'} 
                    size="sm" 
                    className="fw-bold px-3"
                    onClick={() => setScope(f)}
                  >
                    {f}
                  </Button>
                ))}
             </div>
           </div>
        </div>
      </div>

      <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
        {filteredLogs.length === 0 ? (
          <div className="p-5"><EmptyState title="No Evidence" message="No audit logs match the current filters." /></div>
        ) : (
          <>
          <div className="d-none d-md-block table-responsive">
            <Table hover className="mb-0 border-0">
               <thead className="bg-light-subtle text-secondary small fw-bold uppercase tracking-wider">
                <tr>
                  <th className="ps-4 border-0 py-3">Trace Action</th>
                  <th className="border-0 py-3">Actor Identity</th>
                  <th className="border-0 py-3">Target Entity</th>
                  <th className="text-end pe-4 border-0 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {filteredLogs.map(l => {
                  const s = classifyAuditAction(String(l.action));
                  const dest = getAuditDestination(String(l.table_name), Number(l.record_id));
                  return (
                    <tr key={String(l.log_id)}>
                      <td className="ps-4 py-3">
                        <div className="d-flex align-items-center gap-3">
                          <div className={`sb-avatar sm rounded-3 bg-${getAuditTone(s)}-lt text-${getAuditTone(s)}`}>
                            <i className={`ti ti-${s === 'Auth' ? 'key' : s === 'Mutation' ? 'edit' : s === 'Attendance' ? 'user-check' : 'circle'}`} />
                          </div>
                          <div className="entity-copy">
                            <strong className="text-navy d-block uppercase smaller tracking-wider">{String(l.action)}</strong>
                            <span className="smaller text-muted">{String(l.detail)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="small text-navy fw-medium">
                          {l.user_id ? (userLookup.get(Number(l.user_id)) ?? `User #${String(l.user_id)}`) : 'System Account'}
                        </span>
                      </td>
                      <td className="py-3">
                         {dest ? (
                           <Link to={dest} className="status-pill royal text-decoration-none">
                             <i className="ti ti-external-link" />
                             {String(l.table_name)} #{String(l.record_id)}
                           </Link>
                         ) : (
                           <span className="smaller text-muted">{String(l.table_name ?? 'Global')}</span>
                         )}
                      </td>
                      <td className="text-end pe-4 py-3">
                        <div className="entity-copy text-end">
                           <strong className="small text-navy d-block">{new Date(String(l.created_at)).toLocaleDateString()}</strong>
                           <span className="smaller text-muted mono">{new Date(String(l.created_at)).toLocaleTimeString()}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          <div className="d-md-none p-3">
            <div className="mobile-record-list">
              {filteredLogs.map((l) => {
                const s = classifyAuditAction(String(l.action));
                const dest = getAuditDestination(String(l.table_name), Number(l.record_id));

                return (
                  <div key={String(l.log_id)} className="mobile-record-card">
                    <div className="mobile-record-head">
                      <div>
                        <span className="mobile-record-title">{String(l.action)}</span>
                        <span className="mobile-record-meta">{new Date(String(l.created_at)).toLocaleString()}</span>
                      </div>
                      <span className={`status-pill ${getAuditTone(s)}`}>
                        <i className={`ti ti-${s === 'Auth' ? 'key' : s === 'Mutation' ? 'edit' : s === 'Attendance' ? 'user-check' : 'circle'}`} />
                        {s}
                      </span>
                    </div>

                    <div className="detail-list">
                      <div className="detail-row">
                        <div className="detail-label">Actor</div>
                        <div className="detail-value">{l.user_id ? (userLookup.get(Number(l.user_id)) ?? `User #${String(l.user_id)}`) : 'System Account'}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Entity</div>
                        <div className="detail-value">{String(l.table_name ?? 'Global')}</div>
                      </div>
                      <div className="detail-row">
                        <div className="detail-label">Detail</div>
                        <div className="detail-value">{String(l.detail ?? 'No detail')}</div>
                      </div>
                    </div>

                    {dest ? (
                      <div className="mobile-record-actions">
                        <Link to={dest}>
                          <Button variant="outline-secondary" size="sm">
                            <i className="ti ti-external-link" />
                            Open Record
                          </Button>
                        </Link>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
