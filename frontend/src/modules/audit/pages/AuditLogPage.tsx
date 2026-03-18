import { useState } from 'react';
import { Link } from 'react-router';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useAudit } from '../hooks/useAudit';
import { useUser } from '@/modules/users/hooks/useUser';
import { buildLookupMap, getUserDisplayName } from '@/utils/entityLabels';

type AuditScope = 'All' | 'Auth' | 'Mutation' | 'Attendance' | 'Other';

function classifyAuditAction(action: string): AuditScope {
  const normalized = action.toLowerCase();
  if (normalized.includes('login') || normalized.includes('logout') || normalized.includes('token')) return 'Auth';
  if (normalized.includes('checkin') || normalized.includes('attendance') || normalized.includes('session')) return 'Attendance';
  if (normalized.includes('create') || normalized.includes('update') || normalized.includes('delete')) return 'Mutation';
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
  const normalized = tableName.toLowerCase();
  if (normalized.includes('appuser') || normalized.includes('student') || normalized.includes('lecturer') || normalized.includes('admin')) {
    return `/users/${recordId}`;
  }
  if (normalized.includes('course')) return `/courses/${recordId}`;
  if (normalized.includes('venue')) return `/venues/${recordId}`;
  if (normalized.includes('attendancesession')) return `/sessions/${recordId}`;
  if (normalized.includes('attendancerecord')) return '/attendance-review';
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
  const users = (usersData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const userLookup = buildLookupMap(users, 'user_id', (user) => getUserDisplayName(user, user.user_id as number));

  const filteredLogs = logs.filter((log) => {
    const action = String(log.action ?? '');
    const entityType = String(log.table_name ?? '');
    const entityId = String(log.record_id ?? '');
    const userId = String(log.user_id ?? '');
    const detail = String(log.detail ?? '');
    const term = search.trim().toLowerCase();
    const matchesSearch =
      !term ||
      action.toLowerCase().includes(term) ||
      entityType.toLowerCase().includes(term) ||
      entityId.includes(term) ||
      userId.includes(term) ||
      detail.toLowerCase().includes(term);
    const matchesScope = scope === 'All' || classifyAuditAction(action) === scope;
    return matchesSearch && matchesScope;
  });

  const authEvents = logs.filter((log) => classifyAuditAction(String(log.action ?? '')) === 'Auth').length;
  const mutationEvents = logs.filter((log) => classifyAuditAction(String(log.action ?? '')) === 'Mutation').length;
  const actorlessEvents = logs.filter((log) => !log.user_id).length;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Audit evidence"
        subtitle="Inspect system actions, actor traces, and operational records that support platform accountability."
        icon="file-text"
        tone="purple"
      />

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Evidence filters</h3>
                <div className="section-subtle">Focus the event stream by actor, entity, or audit class.</div>
              </div>
              <span className="status-pill purple"><i className="ti ti-shield-search" />Traceable</span>
            </div>

            <div className="field-shell" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="auditSearch" className="field-label">Search action, entity, or actor ID</label>
              <div className="field-wrap">
                <i className="ti ti-search" />
                <input
                  id="auditSearch"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="e.g. login, attendance, user, 14"
                />
              </div>
            </div>

            <div className="field-shell" style={{ marginBottom: 0 }}>
              <label className="field-label">Audit class</label>
              <div className="segmented-filter">
                {(['All', 'Auth', 'Mutation', 'Attendance', 'Other'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={scope === item ? 'active' : ''}
                    onClick={() => setScope(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Signal quality</h3>
                <div className="section-subtle">How much of the current audit trail is attributable and actionable</div>
              </div>
            </div>
            <div className="session-stat-row">
              <div className="session-stat">
                <label>Total logs</label>
                <strong>{logs.length}</strong>
              </div>
              <div className="session-stat">
                <label>Auth events</label>
                <strong>{authEvents}</strong>
              </div>
              <div className="session-stat">
                <label>Mutations</label>
                <strong>{mutationEvents}</strong>
              </div>
            </div>
            <div className="session-stat-row" style={{ marginTop: '0.75rem', gridTemplateColumns: '1fr' }}>
              <div className="session-stat">
                <label>Actorless events</label>
                <strong>{actorlessEvents}</strong>
              </div>
            </div>
          </div>

          <div className="callout-panel purple">
            <i className="ti ti-alert-circle" style={{ color: 'var(--purple)' }} />
            <div>
              <div className="callout-title">Audit logs are evidence, not decoration</div>
              <div className="callout-copy">
                If actors, timestamps, or entity references are vague, the admin experience loses credibility the moment a dispute appears.
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>Event stream</h3>
              <div className="section-subtle">Showing {filteredLogs.length} of {logs.length} audit events in the current evidence view</div>
            </div>
            <span className={`status-pill ${getAuditTone(scope === 'All' ? 'Other' : scope)}`}>
              <i className="ti ti-activity" />
              {scope}
            </span>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={10} columns={5} />
          ) : logs.length === 0 ? (
            <EmptyState icon="ti-file-off" title="No audit logs" message="No system events have been recorded yet." />
          ) : filteredLogs.length === 0 ? (
            <EmptyState icon="ti-filter-off" title="No matching events" message="Broaden the search or switch to a different audit class." />
          ) : (
            <div className="table-shell">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Actor</th>
                    <th>Entity</th>
                    <th>Class</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const action = String(log.action ?? 'Unknown action');
                    const auditClass = classifyAuditAction(action);
                    const tableName = (log.table_name as string | null) ?? null;
                    const recordId = (log.record_id as number | null) ?? null;
                    const destination = getAuditDestination(tableName, recordId);
                    return (
                      <tr key={log.log_id as number}>
                        <td>
                          <div className="entity-copy">
                            <strong>{action}</strong>
                            <span>{String(log.detail ?? `Audit ID #${String(log.log_id ?? '-')}`)}</span>
                          </div>
                        </td>
                        <td className="text-secondary">{log.user_id ? (userLookup.get(Number(log.user_id)) ?? `User #${String(log.user_id)}`) : '-'}</td>
                        <td className="text-secondary small">
                          {destination ? (
                            <Link to={destination} className="audit-entity-link">
                              {String(tableName ?? 'System')}
                              {recordId !== null ? ` #${String(recordId)}` : ''}
                            </Link>
                          ) : (
                            <>
                              {String(tableName ?? 'System')}
                              {recordId !== null ? ` #${String(recordId)}` : ''}
                            </>
                          )}
                        </td>
                        <td>
                          <span className={`status-pill ${getAuditTone(auditClass)}`}>
                            <i className={`ti ti-${auditClass === 'Auth' ? 'lock' : auditClass === 'Mutation' ? 'edit' : auditClass === 'Attendance' ? 'calendar-check' : 'alert-circle'}`} />
                            {auditClass}
                          </span>
                        </td>
                        <td className="text-secondary small">
                          {log.created_at ? new Date(log.created_at as string).toLocaleString() : '-'}
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
