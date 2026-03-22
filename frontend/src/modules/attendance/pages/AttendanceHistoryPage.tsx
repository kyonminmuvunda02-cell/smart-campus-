import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Table } from 'react-bootstrap';
import ErrorAlert from '@/components/common/ErrorAlert';
import PageHeader from '@/components/common/PageHeader';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';
import EmptyState from '@/components/common/EmptyState';
import SearchableSelect from '@/components/common/SearchableSelect';
import { useAuth } from '@/modules/auth/context/AuthProvider';
import { useAttendance } from '../hooks/useAttendance';
import { useEnrollment } from '@/modules/enrollment/hooks/useEnrollment';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { getCourseDisplayName } from '@/utils/entityLabels';

export default function AttendanceHistoryPage() {
  const { userId } = useAuth();
  const { useStudentRecords } = useAttendance();
  const { useStudentEnrollments } = useEnrollment();
  const { useList: useCourseList } = useCourse();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCourseKey, setSelectedCourseKey] = useState('');
  const requestedCourseKey = searchParams.get('course') ?? '';

  const {
    data,
    isLoading,
    error: recordsError,
  } = useStudentRecords(userId ?? undefined, { limit: 500 });
  const {
    data: enrollmentData,
    isLoading: loadingEnrollments,
    error: enrollmentsError,
  } = useStudentEnrollments(userId ?? 0);
  const {
    data: coursesData,
    isLoading: loadingCourses,
    error: coursesError,
  } = useCourseList({ query: { limit: 500 } });

  const records = (data as { items?: Array<Record<string, unknown>> })?.items ?? [];
  const enrollments = (enrollmentData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const courses = (coursesData as { items?: Array<Record<string, unknown>> } | undefined)?.items ?? [];
  const courseLookup = new Map(courses.map((course) => [Number(course.course_id), course]));

  const attendanceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    records.forEach((record) => {
      const key = `${Number(record.course_id)}|${String(record.semester ?? '')}|${String(record.academic_year ?? '')}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [records]);

  const courseOptions = useMemo(() => {
    const options = new Map<string, { value: string; label: string; meta: string; keywords: string; attended: number; latestTime: number }>();

    const upsertOption = (
      key: string,
      label: string,
      meta: string,
      keywords: string,
      latestTime = 0,
    ) => {
      const attended = attendanceCounts.get(key) ?? 0;
      const existing = options.get(key);
      if (!existing) {
        options.set(key, { value: key, label, meta, keywords, attended, latestTime });
        return;
      }

      options.set(key, {
        ...existing,
        label: existing.label || label,
        meta: existing.meta || meta,
        keywords: `${existing.keywords} ${keywords}`.trim(),
        attended,
        latestTime: Math.max(existing.latestTime, latestTime),
      });
    };

    enrollments.forEach((enrollment) => {
      const courseId = Number(enrollment.course_id);
      const semester = String(enrollment.semester ?? '');
      const academicYear = String(enrollment.academic_year ?? '');
      const key = `${courseId}|${semester}|${academicYear}`;
      const course = courseLookup.get(courseId);
      const courseLabel = getCourseDisplayName(course, courseId);

      upsertOption(
        key,
        courseLabel,
        `${semester} | ${academicYear}`,
        `${courseLabel} ${semester} ${academicYear}`,
      );
    });

    records.forEach((record) => {
      const courseId = Number(record.course_id);
      const semester = String(record.semester ?? '');
      const academicYear = String(record.academic_year ?? '');
      const key = `${courseId}|${semester}|${academicYear}`;
      const course = courseLookup.get(courseId);
      const courseLabel = String(record.course_label ?? getCourseDisplayName(course, courseId));
      const latestTime = record.session_start ? new Date(String(record.session_start)).getTime() : 0;

      upsertOption(
        key,
        courseLabel,
        `${semester} | ${academicYear}`,
        `${courseLabel} ${semester} ${academicYear}`,
        latestTime,
      );
    });

    return Array.from(options.values())
      .sort((a, b) => {
        if (b.attended !== a.attended) return b.attended - a.attended;
        return b.latestTime - a.latestTime;
      })
      .map(({ attended, latestTime, ...option }) => option);
  }, [attendanceCounts, courseLookup, enrollments, records]);

  useEffect(() => {
    const selectedStillExists = courseOptions.some((option) => option.value === selectedCourseKey);
    const requestedOption = requestedCourseKey
      ? courseOptions.find((option) => option.value === requestedCourseKey)
      : null;

    if (requestedOption && requestedOption.value !== selectedCourseKey) {
      setSelectedCourseKey(requestedOption.value);
      return;
    }

    if ((!selectedCourseKey || !selectedStillExists) && courseOptions.length > 0) {
      setSelectedCourseKey(courseOptions[0].value);
    }
  }, [courseOptions, requestedCourseKey, selectedCourseKey]);

  useEffect(() => {
    if (!selectedCourseKey) return;
    if (searchParams.get('course') === selectedCourseKey) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('course', selectedCourseKey);
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, selectedCourseKey, setSearchParams]);

  const [selectedCourseId, selectedSemester, selectedAcademicYear] = selectedCourseKey.split('|');
  const filteredRecords = selectedCourseKey
    ? records.filter((record) => (
        Number(record.course_id) === Number(selectedCourseId)
        && String(record.semester ?? '') === selectedSemester
        && String(record.academic_year ?? '') === selectedAcademicYear
      ))
    : [];

  const attendedCount = filteredRecords.length;
  const verifiedCount = filteredRecords.filter((record) => !record.fraud_flag).length;
  const flaggedCount = filteredRecords.filter((record) => record.fraud_flag).length;
  const selectedCourse = courseOptions.find((option) => option.value === selectedCourseKey);
  const selectedCourseRecord = selectedCourseId ? courseLookup.get(Number(selectedCourseId)) : undefined;
  const attendanceRequirement = Number(selectedCourseRecord?.minimum_attendance_percent ?? 80);
  const queryError = recordsError ?? enrollmentsError ?? coursesError;

  if (isLoading || loadingEnrollments || loadingCourses) return <div className="p-4"><LoadingSkeleton rows={10} /></div>;

  return (
    <div className="stack gap-4">
      <PageHeader
        title="Attendance"
        subtitle="Comprehensive record of your class check-ins and compliance status."
        icon="history"
        tone="royal"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'Attendance' }]}
      />

      <ErrorAlert error={queryError} />

      {courseOptions.length === 0 ? (
        <div className="surface-card p-5">
          <EmptyState
            icon="ti-calendar-off"
            title={queryError ? 'Attendance could not be loaded' : 'No course attendance available'}
            message={queryError
              ? 'The page could not load your attendance data. Check the API and try again.'
              : 'Enroll into a course first. Your class attendance records will appear here once you start checking in.'}
          />
        </div>
      ) : (
        <>
          <div className="surface-card p-4 shadow-sm border-0">
            <div className="row g-3 align-items-end">
              <div className="col-lg-8">
                <div className="field-shell mb-0">
                  <label className="field-label">Course</label>
                  <SearchableSelect
                    name="attendance_course"
                    value={selectedCourseKey}
                    onValueChange={(value) => setSelectedCourseKey(value)}
                    options={courseOptions}
                    placeholder="Select a course"
                    searchPlaceholder="Search enrolled courses..."
                    emptyMessage="No enrolled courses found."
                  />
                </div>
              </div>
              <div className="col-lg-4">
                <div className="callout-panel teal mb-0">
                  <i className="ti ti-calendar-check" />
                  <div className="smaller">
                    {selectedCourse
                      ? `Showing classes attended for ${selectedCourse.label} in ${selectedCourse.meta}. Minimum attendance requirement is ${attendanceRequirement}%.`
                      : 'Select a course to review your class attendance.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-royal-lt text-royal p-2 fs-3 rounded-3">
              <i className="ti ti-clipboard-check" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Classes Attended</span>
              <strong className="h4 mb-0 d-block">{attendedCount}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-green-lt text-green p-2 fs-3 rounded-3">
              <i className="ti ti-shield-check" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Verified</span>
              <strong className="h4 mb-0 d-block">{verifiedCount}</strong>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="surface-card p-3 d-flex align-items-center gap-3 shadow-sm border-0 h-100">
            <div className="sb-avatar bg-amber-lt text-amber p-2 fs-3 rounded-3">
              <i className="ti ti-alert-triangle" />
            </div>
            <div className="entity-copy">
              <span className="text-secondary small fw-bold uppercase">Flagged</span>
              <strong className="h4 mb-0 d-block">{flaggedCount}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-0 overflow-hidden shadow-sm border-0 mb-4">
        <div className="px-4 py-3 border-bottom d-flex align-items-center justify-content-between bg-light-subtle">
          <h3 className="h6 mb-0 fw-bold uppercase tracking-wider text-secondary">Class Sessions</h3>
          <div className="text-secondary small fw-medium">
            {attendedCount} attended
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="ti-calendar-off" title="No Attendance Found" message="No class attendance records were found for the selected course." />
          </div>
        ) : (
          <>
            <div className="d-none d-md-block table-responsive">
              <Table hover className="mb-0 border-0">
              <thead className="bg-light-subtle text-secondary small fw-bold uppercase tracking-wider">
                <tr>
                  <th className="border-0 py-3">Class Number</th>
                  <th className="border-0 py-3">Class Type</th>
                  <th className="border-0 py-3">Timestamp</th>
                  <th className="text-end pe-4 border-0 py-3">Integrity Status</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {filteredRecords.map((record) => {
                  const date = record.checked_in_at ? new Date(String(record.checked_in_at)) : null;

                  return (
                    <tr key={String(record.attendance_id)}>
                      <td className="py-3">
                        <div className="entity-copy">
                          <strong className="small text-navy d-block">#{String(record.session_id)}</strong>
                          <span className="smaller text-muted">{String(record.course_label ?? selectedCourse?.label ?? 'Selected Course')}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="entity-copy">
                          <strong className="small text-navy d-block">{String(record.session_type ?? 'Class')}</strong>
                          <span className="smaller text-muted">{String(record.semester ?? selectedSemester)}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="entity-copy">
                          <strong className="small text-navy d-block">{date?.toLocaleDateString()}</strong>
                          <span className="smaller text-muted mono">{date?.toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="text-end pe-4 py-3">
                        <span className={`status-pill ${record.fraud_flag ? 'amber' : 'green'}`}>
                          <i className={`ti ti-${record.fraud_flag ? 'shield-exclamation' : 'circle-check'}`} />
                          {record.fraud_flag ? 'Flagged for Review' : (String(record.verification_status) || 'Verified')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
            </div>

            <div className="d-md-none p-3">
              <div className="stack gap-3">
                {filteredRecords.map((record) => {
                  const date = record.checked_in_at ? new Date(String(record.checked_in_at)) : null;

                  return (
                    <div key={String(record.attendance_id)} className="border rounded-3 p-3 bg-white">
                      <div className="d-flex align-items-start justify-content-between gap-3 mb-3">
                        <div>
                          <strong className="text-navy d-block">Class #{String(record.session_id)}</strong>
                          <span className="smaller text-muted">{String(record.session_type ?? 'Class')}</span>
                        </div>
                        <span className={`status-pill ${record.fraud_flag ? 'amber' : 'green'}`}>
                          <i className={`ti ti-${record.fraud_flag ? 'shield-exclamation' : 'circle-check'}`} />
                          {record.fraud_flag ? 'Flagged' : (String(record.verification_status) || 'Verified')}
                        </span>
                      </div>
                      <div className="detail-list">
                        <div className="detail-row">
                          <div className="detail-label">Course</div>
                          <div className="detail-value">{String(record.course_label ?? selectedCourse?.label ?? 'Selected Course')}</div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">Date</div>
                          <div className="detail-value">{date?.toLocaleDateString() ?? '-'}</div>
                        </div>
                        <div className="detail-row">
                          <div className="detail-label">Time</div>
                          <div className="detail-value mono">{date?.toLocaleTimeString() ?? '-'}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
        </>
      )}
    </div>
  );
}
