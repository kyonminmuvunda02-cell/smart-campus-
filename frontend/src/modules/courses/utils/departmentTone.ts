function normalizeDepartment(department: string | null | undefined) {
  return String(department ?? '')
    .trim()
    .toLowerCase();
}

export function getDepartmentTone(department: string | null | undefined) {
  const value = normalizeDepartment(department);

  if (value.includes('computer') || value.includes('software') || value.includes('information') || value.includes('it')) {
    return 'royal';
  }

  if (value.includes('engineer')) {
    return 'teal';
  }

  if (value.includes('business') || value.includes('commerce') || value.includes('finance') || value.includes('account')) {
    return 'amber';
  }

  if (value.includes('math') || value.includes('stat')) {
    return 'purple';
  }

  return 'navy';
}
