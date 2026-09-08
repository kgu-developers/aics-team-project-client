import {
  fetchStudentSubmission,
  fetchStudentSubmissionMemberConsent,
  updateStudentSubmissionMemberConsent,
  removeStudentSubmissionMemberConsent,
} from '@aics/api-client';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { liveSubmissionKeys } from '../../queries/liveSubmissionKeys';
import {
  hasConsentScope,
  requireMatchingConsentSubmission,
  SubmissionConsentContextError,
  type SubmissionConsentScope,
} from '../consentScope';

/** A verified read is still not a server-side expectedVersion precondition. */
export function useLiveSubmissionConsent(
  scope: SubmissionConsentScope,
  allowContractActions = false,
) {
  const client = useQueryClient();
  const authenticated = useAuthStore(selectHasAuthenticatedSession);
  const user = useAuthStore(state => state.currentUser);
  const revision = useAuthStore(state => state.sessionRevision);
  const accountMatches =
    authenticated &&
    user?.globalRole === 'STUDENT' &&
    user.studentNumber === scope.studentNumber;
  const allowed =
    accountMatches &&
    hasConsentScope(scope) &&
    scope.milestoneType === 'FINAL_REPORT';
  const queryKey = [
    'student-submission-member-consent',
    revision,
    ...liveSubmissionKeys.scope(scope),
    scope.submissionId,
    scope.currentVersion,
    scope.milestoneType,
  ] as const;
  const identity = JSON.stringify(queryKey);
  const generation = useRef({ identity, number: 0, mounted: true });
  if (generation.current.identity !== identity)
    generation.current = {
      identity,
      number: generation.current.number + 1,
      mounted: true,
    };
  const renderGeneration = generation.current.number;
  useEffect(() => {
    generation.current.mounted = true;
    return () => {
      generation.current.mounted = false;
      generation.current.number += 1;
    };
  }, []);
  function current(token: number, signal?: AbortSignal) {
    const auth = useAuthStore.getState();
    return (
      !signal?.aborted &&
      generation.current.mounted &&
      generation.current.identity === identity &&
      generation.current.number === token &&
      auth.sessionRevision === revision &&
      auth.currentUser?.studentNumber === scope.studentNumber &&
      auth.currentUser?.globalRole === 'STUDENT' &&
      selectHasAuthenticatedSession(auth)
    );
  }
  function assertCurrent(token: number, signal?: AbortSignal) {
    if (!current(token, signal))
      throw new Error('제출 대상이 변경되어 이전 요청을 표시하지 않습니다.');
  }
  async function verifySubmission(token: number, signal?: AbortSignal) {
    assertCurrent(token, signal);
    const submission = await fetchStudentSubmission(scope.submissionId!);
    assertCurrent(token, signal);
    return requireMatchingConsentSubmission(submission, scope);
  }
  async function readSnapshot(token: number, signal?: AbortSignal) {
    const submission = await verifySubmission(token, signal);
    if (submission.currentVersion === 0)
      return { submission, consent: undefined };
    const consent = await fetchStudentSubmissionMemberConsent(
      scope.submissionId!,
      signal,
    );
    // The consent DTO has no version; recheck the submission before displaying it.
    const verified = await verifySubmission(token, signal);
    return { submission: verified, consent };
  }
  const query = useQuery({
    queryKey,
    queryFn: allowed
      ? ({ signal }) => readSnapshot(generation.current.number, signal)
      : skipToken,
    retry: false,
    staleTime: 0,
  });
  const busy = useRef<{ identity: string; token: number } | undefined>(
    undefined,
  );
  const [operation, setOperation] = useState<{
    identity: string;
    token: number;
    pending: boolean;
    error?: unknown;
  }>();
  const activeOperation =
    operation?.identity === identity &&
    operation.token === generation.current.number
      ? operation
      : undefined;
  const pending = Boolean(activeOperation?.pending) || query.isFetching;
  const error = activeOperation?.error ?? query.error;
  const snapshot =
    allowed && query.isSuccess && !pending && !error ? query.data : undefined;
  const canChange =
    allowContractActions &&
    Boolean(snapshot?.consent) &&
    snapshot?.submission.status !== 'COMPLETED' &&
    scope.currentVersion !== 0;

  async function change(confirmed: boolean) {
    const previousToken = renderGeneration;
    if (
      !canChange ||
      !current(previousToken) ||
      (busy.current?.identity === identity &&
        busy.current.token === previousToken)
    )
      return;
    const token = ++generation.current.number;
    busy.current = { identity, token };
    setOperation({ identity, token, pending: true });
    try {
      await client.cancelQueries({ queryKey, exact: true });
      const before = await verifySubmission(token);
      if (before.currentVersion === 0 || before.status === 'COMPLETED')
        throw new Error('이 제출의 확인 상태를 변경할 수 없습니다.');
      // Never send userId or an invented expectedVersion: neither is in the API.
      if (before.memberConsent?.isConfirmedByMe !== confirmed) {
        await (confirmed
          ? updateStudentSubmissionMemberConsent(scope.submissionId!)
          : removeStudentSubmissionMemberConsent(scope.submissionId!));
        assertCurrent(token);
      }
      // Updating a confirmation never means completing the submission.
      const updated = await readSnapshot(token);
      assertCurrent(token);
      await client.cancelQueries({ queryKey, exact: true });
      assertCurrent(token);
      client.setQueryData(queryKey, updated);
      await client.invalidateQueries({
        queryKey: liveSubmissionKeys.scope(scope),
        refetchType: 'none',
      });
    } catch (error) {
      if (current(token))
        setOperation({ identity, token, pending: false, error });
    } finally {
      if (busy.current?.identity === identity && busy.current.token === token)
        busy.current = undefined;
      if (current(token))
        setOperation(previous => ({
          ...previous,
          identity,
          token,
          pending: false,
        }));
    }
  }
  async function refresh() {
    if (!allowed || pending || !current(renderGeneration)) return;
    setOperation(undefined);
    await query.refetch();
  }
  return {
    state: !accountMatches
      ? 'unauthenticated'
      : !hasConsentScope(scope)
        ? 'missing-context'
        : scope.milestoneType !== 'FINAL_REPORT'
          ? 'unsupported'
          : pending || query.isPending
            ? 'loading'
            : error instanceof SubmissionConsentContextError
              ? error.reason
              : error
                ? 'error'
                : snapshot?.submission.currentVersion === 0
                  ? 'not-submitted'
                  : snapshot?.submission.status === 'COMPLETED'
                    ? 'completed'
                    : 'ready',
    snapshot,
    error,
    pending,
    canChange,
    canRefresh: allowed && !pending,
    refresh,
    confirm: () => change(true),
    cancel: () => change(false),
    canComplete: false as const,
  };
}
