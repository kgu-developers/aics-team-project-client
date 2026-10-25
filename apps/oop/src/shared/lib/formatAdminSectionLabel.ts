import type { CurrentUserSection } from '@aics/core';

type AdminSectionLabelSource = Pick<CurrentUserSection, 'code'> &
  Partial<Pick<CurrentUserSection, 'classTime'>>;

export function formatAdminSectionLabel(section: AdminSectionLabelSource) {
  const classTime = section.classTime?.trim();
  const duplicateCodeSuffix = `/${section.code}`;
  const normalizedClassTime = classTime?.endsWith(duplicateCodeSuffix)
    ? classTime.slice(0, -duplicateCodeSuffix.length).trim()
    : classTime;

  return normalizedClassTime
    ? `${section.code} · ${normalizedClassTime}`
    : section.code;
}
