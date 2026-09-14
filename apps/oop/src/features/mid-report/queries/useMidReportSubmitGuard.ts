import { fetchLiveEditLock } from '@aics/api-client';
import type { LiveEditLockTarget, MidReport } from '@aics/core';
import { useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { liveEditLockKeys } from '~/features/editor/queries';

/** 제출은 문서 전체를 확정하므로 모든 영역이 비어 있어야 한다. */
export function useMidReportSubmitGuard() {
  const session = useAuthStore();
  const client = useQueryClient();
  return async (report: MidReport) => {
    const locks = await Promise.all(
      report.blocks.map(async block => {
        const target: LiveEditLockTarget = {
          targetType: 'MID_REPORT_BLOCK',
          targetId: Number(report.id),
          sectionKey: block.key,
        };
        const status = await client.fetchQuery({
          queryKey: liveEditLockKeys.detail(session, target),
          queryFn: () => fetchLiveEditLock(target),
          staleTime: 0,
        });
        return { block, status };
      }),
    );
    if (useAuthStore.getState() !== session)
      throw new Error('로그인 상태가 변경되었어요.');
    for (const { block, status } of locks) {
      if (
        status.locked &&
        status.lockedBy !== session.currentUser?.studentNumber
      )
        throw new Error(
          `${status.lockedByName ?? '다른 팀원'}님이 ${block.title} 영역을 편집 중이라 제출할 수 없어요.`,
        );
    }
  };
}
