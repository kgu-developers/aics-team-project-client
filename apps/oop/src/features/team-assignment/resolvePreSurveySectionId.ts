import type { CurrentUserSection, SectionResponse } from '@aics/core';

function validSectionId(value: number) {
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

/**
 * Resolves the numeric server section identity without treating a legacy
 * projection slug as an int64 API identifier.
 */
export function resolvePreSurveySectionId(
  currentSection: CurrentUserSection | undefined,
  sections: readonly SectionResponse[] | undefined,
) {
  if (!currentSection || !sections?.length) return undefined;

  if (/^\d+$/.test(currentSection.id)) {
    const currentSectionId = Number(currentSection.id);
    const idMatch = sections.find(section => section.id === currentSectionId);
    if (idMatch) return validSectionId(idMatch.id);
  }

  const codeMatches = sections.filter(
    section => section.code === currentSection.code,
  );
  if (codeMatches.length === 1) return validSectionId(codeMatches[0]!.id);

  // A single active section is not proof that it belongs to the current user.
  // Never submit a pre-survey until the legacy projection maps to a stable
  // server identity.
  return undefined;
}
