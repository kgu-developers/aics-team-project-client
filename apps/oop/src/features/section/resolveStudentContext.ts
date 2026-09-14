import type { CurrentUser, SectionResponse } from '@aics/core';

import { hasMeetingApiId } from '~/features/meeting/queries/api/meetingApiKeys';

export type StudentContextStatus =
  | 'loading'
  | 'error'
  | 'no-section'
  | 'selection-required'
  | 'no-team'
  | 'ready'
  | 'ambiguous';
export type StudentContext = {
  status: StudentContextStatus;
  section?: SectionResponse;
  teamId?: string;
};

export function studentSelectableSections(
  user: CurrentUser | undefined,
  sections: readonly SectionResponse[] | undefined,
) {
  return (
    sections?.filter(
      section =>
        section.status === 'ACTIVE' &&
        Number.isSafeInteger(section.id) &&
        section.id > 0 &&
        user?.sections.some(membership => membership.id === String(section.id)),
    ) ?? []
  );
}

/** A scalar /me.teamId has no section attribution when /me has multiple memberships. */
export function resolveStudentContext({
  user,
  sections,
  selectedId,
  isPending,
  isError,
}: {
  user?: CurrentUser;
  sections?: readonly SectionResponse[];
  selectedId?: number;
  isPending: boolean;
  isError: boolean;
}): StudentContext {
  // Never retain request IDs from stale successful data after a prerequisite fails.
  if (isError) return { status: 'error' };
  if (isPending || !user || !sections) return { status: 'loading' };
  if (user.globalRole !== 'STUDENT') return { status: 'error' };
  const selectable = studentSelectableSections(user, sections);
  if (!selectable.length) return { status: 'no-section' };
  const section =
    selectable.find(item => item.id === selectedId) ??
    (selectable.length === 1 ? selectable[0] : undefined);
  if (!section) return { status: 'selection-required' };
  if (user.teamId == null) return { status: 'no-team', section };
  if (
    user.sections.length !== 1 ||
    user.sections[0]?.id !== String(section.id) ||
    !hasMeetingApiId(user.teamId)
  ) {
    return { status: 'ambiguous', section };
  }
  return { status: 'ready', section, teamId: user.teamId };
}
