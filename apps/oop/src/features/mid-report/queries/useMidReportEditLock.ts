import { fetchLiveEditLock } from '@aics/api-client';
import type { LiveEditLockTarget, MidReport } from '@aics/core';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import {
  liveEditLockKeys,
  useDocumentSectionLock,
} from '~/features/editor/queries';

/** 서버의 계정 단위 잠금. 획득·해제·갱신 정책은 공용 훅이 소유한다. */
export function useMidReportEditLock(
  report: MidReport | undefined,
  section: string,
) {
  const session = useAuthStore();
  const client = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const reportId = Number(report?.id);
  const target: LiveEditLockTarget | null =
    report &&
    Number.isSafeInteger(reportId) &&
    reportId > 0 &&
    report.blocks.some(block => block.key === section)
      ? {
          targetType: 'MID_REPORT_BLOCK',
          targetId: reportId,
          sectionKey: section,
        }
      : null;
  const expired = Boolean(report && Date.parse(report.dueDate) <= Date.now());
  const mutable = Boolean(report && report.status !== 'SUBMITTED' && !expired);
  const lock = useDocumentSectionLock({ target, isWritable: mutable });
  const assertSession = () => {
    if (useAuthStore.getState() !== session)
      throw new Error('로그인 상태가 변경되었어요.');
  };
  const startEditing = async () => {
    setError(null);
    try {
      const status = await lock.retry();
      assertSession();
      if (!status?.locked) throw new Error('편집 권한을 얻지 못했어요.');
    } catch {
      if (useAuthStore.getState() !== session) return;
      setError(
        '편집 권한을 얻지 못했어요. 잠금 상태를 확인하고 다시 시도해 주세요.',
      );
    }
  };
  const ensureWrite = async (documentId: string, blockKey: string) => {
    assertSession();
    if (!report || report.id !== documentId || blockKey !== section || !mutable)
      throw new Error('편집 권한을 확인한 뒤 제출 기간 안에 저장해 주세요.');
    try {
      await lock.ensureWrite();
      assertSession();
    } catch (cause) {
      if (useAuthStore.getState() !== session) throw cause;
      setError(
        '편집 권한이 만료되었거나 확인에 실패했어요. 입력은 유지되며 권한을 다시 확인한 뒤 저장할 수 있어요.',
      );
      throw cause;
    }
  };
  /** 제출은 문서 전체를 잠그므로 다른 영역의 소유자까지 확인한다. */
  const ensureCanSubmit = async () => {
    assertSession();
    setError(null);
    if (!report) throw new Error('중간보고서를 먼저 불러와 주세요.');
    try {
      for (const block of report.blocks) {
        const blockTarget: LiveEditLockTarget = {
          targetType: 'MID_REPORT_BLOCK',
          targetId: Number(report.id),
          sectionKey: block.key,
        };
        const status = await client.fetchQuery({
          queryKey: liveEditLockKeys.detail(session, blockTarget),
          queryFn: () => fetchLiveEditLock(blockTarget),
          staleTime: 0,
        });
        assertSession();
        if (
          status.locked &&
          status.lockedBy !== session.currentUser?.studentNumber
        )
          throw new Error(
            `${status.lockedByName ?? '다른 팀원'}님이 ${block.title} 영역을 편집 중이라 제출할 수 없어요.`,
          );
      }
    } catch (cause) {
      if (useAuthStore.getState() !== session) throw cause;
      setError(
        cause instanceof Error
          ? cause.message
          : '다른 작성 영역의 편집 상태를 확인하지 못했어요.',
      );
      throw cause;
    }
  };
  return {
    canEdit: lock.canEdit,
    startEditing,
    ensureWrite,
    ensureCanSubmit,
    error,
    pending: lock.pending,
    notice: expired
      ? '제출 기간이 종료되어 읽기 전용으로 확인할 수 있어요.'
      : (error ??
        (lock.isUnavailable
          ? '편집 권한을 확인하지 못했어요. 다시 시도해 주세요.'
          : lock.lockedByOther
            ? `${lock.ownerName ?? '다른 팀원'}님이 편집 중이에요.`
            : undefined)),
  };
}
