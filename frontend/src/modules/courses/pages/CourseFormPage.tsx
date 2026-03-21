import { useActionState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Button, Form, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useCourse } from '@/modules/courses/hooks/useCourse';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';

interface ActionState {
  error: string | null;
}

export default function CourseFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { useDetail, create, update } = useCourse();

  const { data: course, isLoading: loadingCourse } = useDetail(id ? Number(id) : undefined);

  async function handleSubmit(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      const payload = {
        course_code: String(formData.get('course_code')),
        course_name: String(formData.get('course_name')),
        department: String(formData.get('department')),
        credits: Number(formData.get('credits')) || 0,
      };

      if (isEditing) {
        await update.mutateAsync({ path: { course_id: Number(id) }, body: payload });
        showToast('success', 'Course updated', 'Changes saved successfully.');
      } else {
        await create.mutateAsync({ body: payload });
        showToast('success', 'Course created', 'New course has been added.');
      }

      navigate('/courses');
      return { error: null };
    } catch (err) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, { error: null });

  if (loadingCourse) {
    return <div className="empty-panel"><i className="ti ti-loader" /><div>Loading course...</div></div>;
  }

  const currentCourse = course as Record<string, unknown> | undefined;

  return (
    <div>
      <PageHeader
        title={isEditing ? 'Edit course' : 'Create course'}
        subtitle={isEditing ? `Refining ${String(currentCourse?.course_code ?? '')}` : 'Add a new course to the academic catalog.'}
        icon="books"
        tone="green"
        breadcrumbs={[
          { label: 'Administration', path: '/courses' },
          { label: 'Courses', path: '/courses' },
          { label: isEditing ? 'Edit' : 'Create' }
        ]}
      >
        <Link to="/courses">
          <Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back to catalog</Button>
        </Link>
      </PageHeader>

      <div className="surface-card p-4 shadow-sm border-0">
          <div className="section-title">
            <div>
              <h3>{isEditing ? 'Update course record' : 'New course record'}</h3>
              <div className="section-subtle">Complete the core metadata before saving the catalog entry.</div>
            </div>
          </div>

          <ErrorAlert error={state.error} dismissible />

          <Form action={formAction}>
            <div className="field-shell">
              <Form.Label className="field-label">Course code</Form.Label>
              <Form.Control
                name="course_code"
                defaultValue={currentCourse?.course_code as string | undefined}
                required
                placeholder="e.g. CS301"
                className="mono"
              />
            </div>

            <div className="field-shell">
              <Form.Label className="field-label">Course name</Form.Label>
              <Form.Control
                name="course_name"
                defaultValue={currentCourse?.course_name as string | undefined}
                required
                placeholder="e.g. Web Development"
              />
            </div>

            <div className="field-shell">
              <Form.Label className="field-label">Department</Form.Label>
              <Form.Control
                name="department"
                defaultValue={currentCourse?.department as string | undefined}
                required
                placeholder="e.g. Computer Science"
              />
            </div>

            <div className="field-shell">
              <Form.Label className="field-label">Credits</Form.Label>
              <Form.Control
                type="number"
                name="credits"
                defaultValue={(currentCourse?.credits as number | undefined) ?? 3}
                min={1}
                required
              />
            </div>

            <div className="ph-actions" style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? <Spinner animation="border" size="sm" /> : <i className={`ti ti-${isEditing ? 'device-floppy' : 'plus'}`} />}
                {isEditing ? 'Save changes' : 'Create course'}
              </Button>
              <Link to="/courses">
                <Button variant="outline-secondary">Cancel</Button>
              </Link>
            </div>
          </Form>
        </div>
    </div>
  );
}
