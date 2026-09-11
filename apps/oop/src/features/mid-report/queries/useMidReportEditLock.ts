import { fetchLiveEditLock } from '@aics/api-client';
import type { LiveEditLockTarget, MidReport } from '@aics/core';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import {
  liveEditLockKeys,
  useAcquireLiveEditLockMutation,
  useLiveEditLockQuery,
} from '~/features/editor/queries';

/** 서버의 계정 단위 잠금. 탭 이탈 시 타 탭의 잠금을 삭제하지 않고 TTL로 만료한다. */
export function useMidReportEditLock(
  report: MidReport | undefined,
  section: string,
) {
  const session = useAuthStore();
  const client = useQueryClient();
  const acquire = useAcquireLiveEditLockMutation();
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
  const query = useLiveEditLockQuery(target);
  const grants = useRef(new Set<string>());
  const grantSession = useRef(session);
  if (grantSession.current !== session) {
    grants.current.clear();
    grantSession.current = session;
  }
  const [, setRevision] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const identity = (id: string, key: string) => `${id}:${key}`;
  const activeKey = report ? identity(report.id, section) : '';
  const expired = Boolean(report && Date.parse(report.dueDate) <= Date.now());
  const mutable = Boolean(report && report.status !== 'SUBMITTED' && !expired);
  const granted = grants.current.has(activeKey);
  const owner =
    query.data?.locked &&
    query.data.lockedBy === session.currentUser?.studentNumber;
  const canEdit = Boolean(mutable && granted && owner && !query.isError);
  const assertSession = useCallback(() => {
    if (useAuthStore.getState() !== session)
      throw new Error('로그인 상태가 변경되었어요.');
  }, [session]);
  const startEditing = async () => {
    if (!target || !mutable || acquire.isPending) return;
    setError(null);
    try {
      const status = await acquire.mutateAsync(target);
      assertSession();
      if (
        !status.locked ||
        status.lockedBy !== session.currentUser?.studentNumber
      )
        throw new Error('편집 권한을 얻지 못했어요.');
      grants.current.add(activeKey);
      setRevision(value => value + 1);
    } catch {
      if (useAuthStore.getState() !== session) return;
      setError(
        '편집 권한을 얻지 못했어요. 잠금 상태를 확인하고 다시 시도해 주세요.',
      );
    }
  };
  const ensureWrite = async (documentId: string, blockKey: string) => {
    assertSession();
    if (
      !report ||
      report.id !== documentId ||
      report.status === 'SUBMITTED' ||
      Date.parse(report.dueDate) <= Date.now() ||
      !grants.current.has(identity(documentId, blockKey))
    )
      throw new Error('편집을 시작한 뒤 제출 기간 안에 저장해 주세요.');
    const writeTarget: LiveEditLockTarget = {
      targetType: 'MID_REPORT_BLOCK',
      targetId: Number(documentId),
      sectionKey: blockKey,
    };
    try {
      const status = await client.fetchQuery({
        queryKey: liveEditLockKeys.detail(session, writeTarget),
        queryFn: () => fetchLiveEditLock(writeTarget),
        staleTime: 0,
      });
      assertSession();
      if (
        !status.locked ||
        status.lockedBy !== session.currentUser?.studentNumber
      )
        throw new Error('편집 잠금이 만료되었어요.');
      const renewed = await acquire.mutateAsync(writeTarget);
      assertSession();
      if (
        !renewed.locked ||
        renewed.lockedBy !== session.currentUser?.studentNumber
      )
        throw new Error('편집 권한을 확인할 수 없어요.');
    } catch (cause) {
      if (useAuthStore.getState() !== session) throw cause;
      grants.current.delete(identity(documentId, blockKey));
      setRevision(value => value + 1);
      setError(
        '편집 권한이 만료되었거나 확인에 실패했어요. 입력은 유지되며 편집 시작 후 다시 저장할 수 있어요.',
      );
      throw cause;
    }
  };
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
  const ensureWriteRef = useRef(ensureWrite);
  ensureWriteRef.current = ensureWrite;
  useEffect(() => {
    if (!report) return;
    const timer = window.setInterval(() => {
      setRevision(value => value + 1);
      if (canEdit)
        void ensureWriteRef.current(report.id, section).catch(() => undefined);
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [canEdit, report?.id, section]);
  return {
    canEdit,
    startEditing,
    ensureWrite,
    ensureCanSubmit,
    error,
    pending: acquire.isPending || query.isPending,
    notice: expired
      ? '제출 기간이 종료되어 읽기 전용으로 확인할 수 있어요.'
      : (error ??
        (query.isError
          ? '편집 권한을 확인하지 못했어요. 다시 시도해 주세요.'
          : query.data?.locked && !owner
            ? `${query.data.lockedByName ?? '다른 팀원'}님이 편집 중이에요.`
            : '편집 시작을 누르면 이 영역을 수정할 수 있어요.')),
  };
}
