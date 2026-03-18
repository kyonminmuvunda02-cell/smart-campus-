type EntityRecord = Record<string, unknown>;

export function getUserDisplayName(user: EntityRecord | undefined, fallbackId?: number | string) {
  if (!user) return `User #${fallbackId ?? '-'}`;
  const fullName = `${String(user.first_name ?? '')} ${String(user.last_name ?? '')}`.trim();
  return fullName || String(user.full_name ?? '') || String(user.email ?? `User #${fallbackId ?? '-'}`);
}

export function getStudentDisplayName(user: EntityRecord | undefined, fallbackId?: number | string) {
  if (!user) return `Student #${fallbackId ?? '-'}`;
  const fullName = `${String(user.first_name ?? '')} ${String(user.last_name ?? '')}`.trim();
  return fullName || String(user.email ?? `Student #${fallbackId ?? '-'}`);
}

export function getCourseDisplayName(course: EntityRecord | undefined, fallbackId?: number | string) {
  if (!course) return `Course #${fallbackId ?? '-'}`;
  const code = String(course.course_code ?? '').trim();
  const name = String(course.course_name ?? '').trim();
  if (code && name) return `${code} - ${name}`;
  return code || name || `Course #${fallbackId ?? '-'}`;
}

export function getVenueDisplayName(venue: EntityRecord | undefined, fallbackId?: number | string) {
  if (!venue) return `Venue #${fallbackId ?? '-'}`;
  return String(venue.venue_name ?? `Venue #${fallbackId ?? '-'}`);
}

export function buildLookupMap<T extends EntityRecord>(
  items: T[],
  key: keyof T,
  formatter: (item: T) => string
) {
  const lookup = new Map<number, string>();
  items.forEach((item) => {
    const rawKey = item[key];
    const numericKey = typeof rawKey === 'number' ? rawKey : Number(rawKey);
    if (!Number.isNaN(numericKey)) {
      lookup.set(numericKey, formatter(item));
    }
  });
  return lookup;
}
