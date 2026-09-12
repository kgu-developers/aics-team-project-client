import type { LiveEditLockStatus } from '@aics/core';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';
import {
  liveEditLockKeys,
  useAcquireLiveEditLockMutation,
  useLiveEditLockQuery,
  useReleaseLiveEditLockMutation,
} from '~/features/editor/queries';

import { meetingEditLockTarget } from '../model/meetingEditLock';
import type { StudentMeetingRecord } from '../model/studentMeeting';

type LockState = {
  scope: string;
  phase: 'acquiring' | 'editing' | 'lost' | 'error' | 'finished';
  pending: boolean;
  record?: StudentMeetingRecord;
  message?: string;
};
const HEARTBEAT_MS = 45_000;
// Be conservative relative to the server's two-minute TTL and clock precision.
const CONFIRM_WINDOW_MS = 90_000;

export function useMeetingEditLock(
  meetingId: string,
  reloadRecord: () => Promise<StudentMeetingRecord>,
) {
  const session = useAuthStore();
  const client = useQueryClient();
  const target = meetingEditLockTarget(meetingId);
  const key = liveEditLockKeys.detail(session, target);
  const scope = JSON.stringify(key);
  const query = useLiveEditLockQuery(target);
  const acquire = useAcquireLiveEditLockMutation();
  const release = useReleaseLiveEditLockMutation();
  const callbacks = useRef({ query, acquire, release, reloadRecord });
  callbacks.current = { query, acquire, release, reloadRecord };
  const [state, setState] = useState<LockState>({
    scope,
    phase: 'acquiring',
    pending: true,
  });
  const controls = useRef({
    start: async () => false,
    confirm: async () => false,
    finish: async () => true,
  });

  useEffect(() => {
    let active = true;
    let currentState: LockState = { scope, phase: 'acquiring', pending: true };
    let confirmedAt = 0;
    let queue = Promise.resolve();
    const current = () => active && useAuthStore.getState() === session;
    const publish = (patch: Partial<LockState>) => {
      currentState = { ...currentState, ...patch };
      if (current()) setState(currentState);
    };
    const owns = (status: LiveEditLockStatus | undefined) =>
      Boolean(
        status?.locked &&
        status.lockedBy === session.currentUser?.studentNumber,
      );
    const serial = (run: () => Promise<boolean>) => {
      const next = queue.then(() => (current() ? run() : false));
      queue = next.then(
        () => undefined,
        () => undefined,
      );
      return next;
    };
    const lose = () => {
      publish({
        phase: 'lost',
        pending: false,
        message:
          '편집 잠금을 유지하지 못했어요. 입력 내용을 보관하고 회의록 상세에서 다시 수정해 주세요.',
      });
      return false;
    };
    const start = () =>
      serial(async () => {
        if (currentState.record) return false;
        if (
          !target ||
          !selectHasAuthenticatedSession(session) ||
          session.currentUser?.globalRole !== 'STUDENT'
        ) {
          publish({
            phase: 'error',
            pending: false,
            message: '로그인한 학생과 유효한 회의록이 필요해요.',
          });
          return false;
        }
        publish({ phase: 'acquiring', pending: true, message: undefined });
        try {
          const requestedAt = Date.now();
          const status = await callbacks.current.acquire.mutateAsync(target);
          if (!current()) return false;
          if (!owns(status)) throw new Error('잠금을 획득하지 못했어요.');
          const record = await callbacks.current.reloadRecord();
          if (!current()) return false;
          if (
            record.id !== meetingId ||
            Date.now() - requestedAt >= CONFIRM_WINDOW_MS
          )
            return lose();
          confirmedAt = requestedAt;
          publish({
            phase: 'editing',
            pending: false,
            record,
            message: undefined,
          });
          return true;
        } catch {
          if (!current()) return false;
          const status = client.getQueryData<LiveEditLockStatus>(key);
          publish({
            phase: 'error',
            pending: false,
            message:
              status?.locked && !owns(status)
                ? `${status.lockedByName ?? '다른 팀원'}님이 수정 중이에요. 잠시 후 다시 시도해 주세요.`
                : '편집을 시작하지 못했어요. 잠금과 회의록을 다시 확인해 주세요.',
          });
          return false;
        }
      });
    const confirm = () =>
      serial(async () => {
        if (!target || currentState.phase !== 'editing') return false;
        if (Date.now() - confirmedAt >= CONFIRM_WINDOW_MS) return lose();
        publish({ pending: true });
        try {
          // Never turn a lost/expired lock into an implicit takeover while editing.
          const result = await callbacks.current.query.refetch({
            throwOnError: true,
          });
          if (!current()) return false;
          if (
            !owns(result.data) ||
            Date.now() - confirmedAt >= CONFIRM_WINDOW_MS
          )
            return lose();
          const requestedAt = Date.now();
          const renewed = await callbacks.current.acquire.mutateAsync(target);
          if (!current()) return false;
          if (!owns(renewed) || Date.now() - requestedAt >= CONFIRM_WINDOW_MS)
            return lose();
          confirmedAt = requestedAt;
          publish({ pending: false });
          return true;
        } catch {
          return current() ? lose() : false;
        }
      });
    const finish = () =>
      serial(async () => {
        const wasEditing = currentState.phase === 'editing';
        publish({ phase: 'finished', pending: true });
        try {
          // Account-only DELETE cannot safely release an old or lost ownership.
          if (
            target &&
            wasEditing &&
            Date.now() - confirmedAt < CONFIRM_WINDOW_MS
          ) {
            const result = await callbacks.current.query.refetch({
              throwOnError: true,
            });
            if (!current()) return false;
            if (
              owns(result.data) &&
              Date.now() - confirmedAt < CONFIRM_WINDOW_MS
            )
              await callbacks.current.release.mutateAsync(target);
          }
          return current();
        } catch {
          // The document may already be saved. Do not turn release failure into a save retry.
          return false;
        } finally {
          if (current()) publish({ pending: false });
        }
      });
    controls.current = { start, confirm, finish };
    publish(currentState);
    // Let StrictMode cleanup cancel the first mount before it sends a POST.
    void Promise.resolve().then(() => {
      if (current()) void start();
    });
    const heartbeat = window.setInterval(() => {
      if (currentState.phase === 'editing' && !currentState.pending)
        void confirm();
    }, HEARTBEAT_MS);
    const onFocus = () => {
      if (currentState.phase === 'editing' && !currentState.pending)
        void confirm();
    };
    window.addEventListener('focus', onFocus);
    return () => {
      active = false;
      window.clearInterval(heartbeat);
      window.removeEventListener('focus', onFocus);
      // Without a tab lease, late cleanup could delete a newer editor's lock.
      // Explicit save/leave releases; closing the tab relies on the server TTL.
    };
    // Resource and auth snapshot own this lifecycle; callback identities do not.
  }, [scope, session, meetingId, client]);

  const visible = state.scope === scope ? state : undefined;
  return {
    record: visible?.record,
    canEdit: visible?.phase === 'editing' && !visible.pending,
    pending: !visible || visible.pending,
    message: visible?.message,
    lost: visible?.phase === 'lost',
    retry: () => controls.current.start(),
    confirmOwnership: () => controls.current.confirm(),
    finish: () => controls.current.finish(),
  };
}

export type MeetingEditLock = ReturnType<typeof useMeetingEditLock>;
