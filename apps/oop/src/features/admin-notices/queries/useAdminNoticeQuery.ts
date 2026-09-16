import { noticeId } from '../noticeScope';
import { useAdminNoticesQuery } from './useAdminNoticesQuery';

export function useAdminNoticeQuery(
  sectionId: number | undefined,
  routeId: string,
) {
  const id = noticeId(routeId);
  const query = useAdminNoticesQuery(id === undefined ? undefined : sectionId);
  return {
    ...query,
    data: query.data?.find(
      notice => notice.id === id && notice.sectionId === sectionId,
    ),
    hasValidId: id !== undefined,
  };
}
