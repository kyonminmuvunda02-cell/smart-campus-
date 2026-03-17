import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import { useCourse } from '../hooks/useCourse';

type CreditFilter = 'All' | 'Low' | 'Standard' | 'High';

function getCreditBand(credits: number) {
  if (credits >= 5) return 'High';
  if (credits >= 3) return 'Standard';
  return 'Low';
}

export default function CourseListPage() {
  const [search, setSearch] = useState('');
  const [creditFilter, setCreditFilter] = useState<CreditFilter>('All');
  const { useList } = useCourse();
  const { data, isLoading } = useList();

  const courses = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const filteredCourses = courses.filter((course) => {
    const term = search.trim().toLowerCase();
    const code = String(course.course_code ?? '').toLowerCase();
    const name = String(course.course_name ?? '').toLowerCase();
    const credits = Number(course.credits ?? 0);
    const band = getCreditBand(credits);
    const matchesSearch = !term || code.includes(term) || name.includes(term) || String(course.course_id ?? '').includes(term);
    const matchesCredits = creditFilter === 'All' || band === creditFilter;
    return matchesSearch && matchesCredits;
  });

  const totalCredits = courses.reduce((sum, course) => sum + Number(course.credits ?? 0), 0);
  const standardCount = courses.filter((course) => getCreditBand(Number(course.credits ?? 0)) === 'Standard').length;
  const highCreditCount = courses.filter((course) => getCreditBand(Number(course.credits ?? 0)) === 'High').length;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Academic catalog"
        subtitle="Keep the course structure clear, credit-balanced, and consistent for teaching and enrollment workflows."
        icon="books"
        tone="green"
      >
        <Link to="/courses/new"><Button variant="primary"><i className="ti ti-plus" />Add course</Button></Link>
      </PageHeader>

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Catalog filters</h3>
                <div className="section-subtle">Search the course map by code, title, or credit band.</div>
              </div>
              <span className="status-pill green"><i className="ti ti-book" />Structured</span>
            </div>

            <div className="field-shell" style={{ marginBottom: '0.75rem' }}>
              <label htmlFor="courseSearch" className="field-label">Search course code or title</label>
              <div className="field-wrap">
                <i className="ti ti-search" />
                <input
                  id="courseSearch"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="e.g. CS301 or Web Development"
                />
              </div>
            </div>

            <div className="field-shell" style={{ marginBottom: 0 }}>
              <label className="field-label">Credit band</label>
              <div className="segmented-filter">
                {(['All', 'Low', 'Standard', 'High'] as const).map((band) => (
                  <button
                    key={band}
                    type="button"
                    className={creditFilter === band ? 'active' : ''}
                    onClick={() => setCreditFilter(band)}
                  >
                    {band}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Catalog health</h3>
                <div className="section-subtle">Current credit distribution and course volume</div>
              </div>
            </div>
            <div className="session-stat-row">
              <div className="session-stat">
                <label>Total courses</label>
                <strong>{courses.length}</strong>
              </div>
              <div className="session-stat">
                <label>Total credits</label>
                <strong>{totalCredits}</strong>
              </div>
              <div className="session-stat">
                <label>Standard band</label>
                <strong>{standardCount}</strong>
              </div>
            </div>
            <div className="session-stat-row" style={{ marginTop: '0.75rem', gridTemplateColumns: '1fr' }}>
              <div className="session-stat">
                <label>High-credit courses</label>
                <strong>{highCreditCount}</strong>
              </div>
            </div>
          </div>

          <div className="callout-panel green">
            <i className="ti ti-sitemap" style={{ color: 'var(--green)' }} />
            <div>
              <div className="callout-title">A clean catalog improves everything downstream</div>
              <div className="callout-copy">
                Courses anchor sessions, enrollments, and attendance reporting. Weak catalog hygiene creates noise everywhere else.
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>Catalog records</h3>
              <div className="section-subtle">Showing {filteredCourses.length} of {courses.length} courses within the current search scope</div>
            </div>
            <span className="status-pill green"><i className="ti ti-book-2" />{creditFilter}</span>
          </div>

          {isLoading ? (
            <LoadingSkeleton rows={6} columns={5} />
          ) : courses.length === 0 ? (
            <EmptyState icon="ti-book-off" title="No courses yet" message="Create the academic catalog before lecturers start scheduling sessions.">
              <Link to="/courses/new"><Button variant="primary">Add course</Button></Link>
            </EmptyState>
          ) : filteredCourses.length === 0 ? (
            <EmptyState icon="ti-filter-off" title="No matching courses" message="Try a broader search or a different credit band." />
          ) : (
            <div className="table-shell">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course</th>
                    <th>Credits</th>
                    <th>Band</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCourses.map((course) => {
                    const credits = Number(course.credits ?? 0);
                    const band = getCreditBand(credits);
                    return (
                      <tr key={course.course_id as number}>
                        <td><span className="detail-chip mono">{String(course.course_code ?? '-')}</span></td>
                        <td>
                          <div className="entity-copy">
                            <strong>{String(course.course_name ?? 'Untitled course')}</strong>
                            <span>Catalog ID #{String(course.course_id ?? '-')}</span>
                          </div>
                        </td>
                        <td className="mono">{credits || '-'}</td>
                        <td>
                          <span className={`status-pill ${band === 'High' ? 'amber' : band === 'Standard' ? 'green' : 'royal'}`}>
                            <i className={`ti ti-${band === 'High' ? 'flame' : band === 'Standard' ? 'circle-check' : 'point'}`} />
                            {band}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="table-actions">
                            <Link to={`/courses/${course.course_id}`}><Button variant="outline-primary" size="sm"><i className="ti ti-eye" />View</Button></Link>
                            <Link to={`/courses/${course.course_id}/edit`}><Button variant="outline-secondary" size="sm"><i className="ti ti-edit" />Edit</Button></Link>
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
