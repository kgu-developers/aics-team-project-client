import { useQueries } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { noticeId, noticeSection } from '../noticeScope';
import { adminNoticeOptions } from './adminNoticeOptions';

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

export function useAdminAllNoticesQuery(sectionIds: (string | number)[]) {
  const user = useAuthStore(state => state.currentUser);
  const ids = [
    ...new Set(
      sectionIds
        .map(noticeId)
        .filter(id => id !== undefined && noticeSection(user, id)),
    ),
  ];
  const queries = useQueries({
    queries: ids.map(id => adminNoticeOptions(user, id)),
  });
  return {
    data: queries
      .flatMap(query => query.data ?? [])
      .sort((a, b) => {
        const left = publishedTime(a.publishedAt);
        const right = publishedTime(b.publishedAt);
        return left === right ? 0 : right - left;
      }),
    isError: queries.some(query => query.isError),
    isPending: queries.some(query => query.isPending),
  };
}
