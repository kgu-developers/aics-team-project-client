import { fetchSectionAnnouncements } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { noticeId } from '../noticeScope';
import { adminNoticeKeys } from './adminNoticeKeys';

function publishedTime(value: string) {
  // Legacy timestamps without an offset describe the course's Seoul time.
  const normalized = value.trim().replace(' ', 'T');
  const timestamp = Date.parse(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(normalized)
      ? `${normalized}+09:00`
      : normalized,
  );
  return Number.isNaN(timestamp) ? -Infinity : timestamp;
}

export function useAdminAccessibleNoticesQuery() {
  const user = useAuthStore(state => state.currentUser);
  const ids = [
    ...new Set(
      user?.sections
        .filter(section => section.status === 'ACTIVE')
        .map(section => noticeId(section.id))
        .filter(id => id !== undefined) ?? [],
    ),
  ];
  // Unknown status cannot establish ACTIVE scope, even when other sections load.
  const hasUnknownSectionStatus = user?.sections.some(
    section => noticeId(section.id) !== undefined && section.status == null,
  );
  const queries = useQueries({
    queries: ids.map(id => ({
      queryKey: adminNoticeKeys.list(user?.id, id),
      queryFn: () => fetchSectionAnnouncements(id),
    })),
  });
  return {
    scopeStatus: hasUnknownSectionStatus
      ? ('unknown-status' as const)
      : ids.length === 0
        ? ('no-active-sections' as const)
        : ('ready' as const),
    data: queries
      .flatMap(query => query.data ?? [])
      .sort((a, b) => {
        const left = publishedTime(a.publishedAt);
        const right = publishedTime(b.publishedAt);
        return left === right ? 0 : right - left;
      }),
    isPending: queries.some(query => query.isPending),
    isError: queries.some(query => query.isError),
  };
}
