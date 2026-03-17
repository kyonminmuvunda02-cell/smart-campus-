import { useActionState } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { Button, Form, Spinner } from 'react-bootstrap';
import PageHeader from '@/components/common/PageHeader';
import ErrorAlert from '@/components/common/ErrorAlert';
import { useVenue } from '@/modules/venues/hooks/useVenue';
import { useToast } from '@/components/common/ToastManager';
import { getErrorMessage } from '@/utils/errors';

interface ActionState {
  error: string | null;
}

export default function VenueFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { useDetail, create, update } = useVenue();

  const { data: venue, isLoading: loadingVenue } = useDetail(id ? Number(id) : undefined);

  async function handleSubmit(_prev: ActionState, formData: FormData): Promise<ActionState> {
    try {
      const payload = {
        venue_name: String(formData.get('venue_name')),
        building: String(formData.get('building')),
        capacity: Number(formData.get('capacity')) || 100,
      };

      if (isEditing) {
        await update.mutateAsync({ path: { venue_id: Number(id) }, body: payload });
        showToast('success', 'Venue updated', 'Changes saved successfully.');
      } else {
        await create.mutateAsync({ body: payload });
        showToast('success', 'Venue created', 'New venue has been added.');
      }

      navigate('/venues');
      return { error: null };
    } catch (err) {
      return { error: getErrorMessage(err) };
    }
  }

  const [state, formAction, isPending] = useActionState(handleSubmit, { error: null });

  if (loadingVenue) {
    return <div className="empty-panel"><i className="ti ti-loader" /><div>Loading venue...</div></div>;
  }

  const currentVenue = venue as Record<string, unknown> | undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={isEditing ? 'Edit venue' : 'Create venue'}
        subtitle={isEditing ? `Refining ${String(currentVenue?.venue_name ?? '')}` : 'Register a physical space for trusted attendance capture.'}
        icon="building"
        tone="teal"
      >
        <Link to="/venues">
          <Button variant="outline-secondary"><i className="ti ti-arrow-left" />Back to venues</Button>
        </Link>
      </PageHeader>

      <div className="ops-grid">
        <div className="stack">
          <div className="surface-card section-card">
            <div className="section-title">
              <div>
                <h3>Venue guidance</h3>
                <div className="section-subtle">Physical spaces must be explicit enough to support geofenced trust and reporting.</div>
              </div>
              <span className="status-pill teal"><i className="ti ti-map-pin" />Approved space</span>
            </div>

            <div className="detail-list">
              <div className="detail-row">
                <span className="detail-label">Venue name</span>
                <span className="detail-value">Classroom or hall identifier</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Building</span>
                <span className="detail-value">Campus location anchor</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Capacity</span>
                <span className="detail-value">Expected attendance limit</span>
              </div>
            </div>
          </div>

          <div className="callout-panel teal">
            <i className="ti ti-shield-check" style={{ color: 'var(--teal)' }} />
            <div>
              <div className="callout-title">Wrong venue data breaks attendance trust</div>
              <div className="callout-copy">
                Sessions depend on these spaces for physical validation. A bad record can block legitimate scans or certify the wrong room.
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card section-card">
          <div className="section-title">
            <div>
              <h3>{isEditing ? 'Update venue record' : 'New venue record'}</h3>
              <div className="section-subtle">Capture the essential physical details before publishing the space.</div>
            </div>
          </div>

          <ErrorAlert error={state.error} dismissible />

          <Form action={formAction}>
            <div className="field-shell">
              <Form.Label className="field-label">Venue name</Form.Label>
              <Form.Control
                name="venue_name"
                defaultValue={currentVenue?.venue_name as string | undefined}
                required
                placeholder="e.g. Lecture Theatre 1"
              />
            </div>

            <div className="field-shell">
              <Form.Label className="field-label">Building</Form.Label>
              <Form.Control
                name="building"
                defaultValue={currentVenue?.building as string | undefined}
                placeholder="e.g. Science Block A"
              />
            </div>

            <div className="field-shell">
              <Form.Label className="field-label">Capacity</Form.Label>
              <Form.Control
                type="number"
                name="capacity"
                defaultValue={(currentVenue?.capacity as number | undefined) ?? 100}
                required
                min={1}
              />
            </div>

            <div className="ph-actions" style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? <Spinner animation="border" size="sm" /> : <i className={`ti ti-${isEditing ? 'device-floppy' : 'plus'}`} />}
                {isEditing ? 'Save changes' : 'Create venue'}
              </Button>
              <Link to="/venues">
                <Button variant="outline-secondary">Cancel</Button>
              </Link>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}
