import { useAuthStore } from '~/features/auth/authStore';

import { noticeId } from '../noticeScope';
import { useAdminAllNoticesQuery } from './useAdminAllNoticesQuery';

export function useAdminAccessibleNoticesQuery(
  activeSectionIds?: readonly string[],
) {
  const user = useAuthStore(state => state.currentUser);
  const activeSectionIdSet = activeSectionIds
    ? new Set(activeSectionIds.map(noticeId).filter(id => id !== undefined))
    : undefined;
  const ids = [
    ...new Set(
      user?.sections
        .filter(section => section.status === 'ACTIVE')
        .map(section => noticeId(section.id))
        .filter(
          (id): id is number =>
            id !== undefined &&
            (!activeSectionIdSet || activeSectionIdSet.has(id)),
        ) ?? [],
    ),
  ];
  // Unknown status cannot establish ACTIVE scope, even when other sections load.
  const hasUnknownSectionStatus = user?.sections.some(
    section => noticeId(section.id) !== undefined && section.status == null,
  );
  const query = useAdminAllNoticesQuery(ids);
  return {
    ...query,
    scopeStatus: hasUnknownSectionStatus
      ? ('unknown-status' as const)
      : ids.length === 0
        ? ('no-active-sections' as const)
        : ('ready' as const),
  };
}
