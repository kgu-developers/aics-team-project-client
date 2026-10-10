import type { CurrentUserSection } from '@aics/core';

type AdminSectionLabelSource = Pick<CurrentUserSection, 'code'> &
  Partial<Pick<CurrentUserSection, 'classTime'>>;

export function formatAdminSectionLabel(section: AdminSectionLabelSource) {
  const classTime = section.classTime?.trim();

  return classTime ? `${section.code} · ${classTime}` : section.code;
}
