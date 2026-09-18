import type { CurrentUserSection } from '@aics/core';

export function getSectionDisplayLabel(
  sections: readonly CurrentUserSection[],
  sectionId: number | string | undefined,
  fallback: string,
) {
  return (
    sections.find(section => String(section.id) === String(sectionId))?.code ??
    fallback
  );
}
