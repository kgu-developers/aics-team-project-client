import {
  fetchLiveEditLock,
  submitLiveEditLock,
  removeLiveEditLock,
} from '@aics/api-client';
import {
  isSupportedLiveEditLockTarget,
  type LiveEditLockTarget,
  type LiveEditLockStatus,
} from '@aics/core';
import { skipToken, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

type Operation = 'acquire' | 'confirm' | 'release';

/** Contract preparation only. Account ownership never enables document writes. */
export function useLiveEditLock(target: LiveEditLockTarget | null | undefined) {
  const authenticated = useAuthStore(selectHasAuthenticatedSession);
  const user = useAuthStore(state => state.currentUser);
  const revision = useAuthStore(state => state.sessionRevision);
  const client = useQueryClient();
  const valid = isSupportedLiveEditLockTarget(target);
  const allowed =
    authenticated &&
    user?.globalRole === 'STUDENT' &&
    Boolean(user.studentNumber?.trim()) &&
    valid;
  const queryKey = [
    'live-edit-lock',
    revision,
    user?.studentNumber,
    target?.targetType,
    target?.targetId,
  ] as const;
  const scope = JSON.stringify(queryKey);
  const generation = useRef({ scope, number: 0, mounted: true });
  if (generation.current.scope !== scope)
    generation.current = {
      scope,
      number: generation.current.number + 1,
      mounted: true,
    };
  useEffect(() => {
    generation.current.mounted = true;
    return () => {
      generation.current.mounted = false;
      generation.current.number += 1;
    };
  }, []);
  const query = useQuery({
    queryKey,
    queryFn: allowed ? () => fetchLiveEditLock(target) : skipToken,
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
  const busy = useRef<{ scope: string; token: number } | undefined>(undefined);
  const [operation, setOperation] = useState<{
    scope: string;
    generation: number;
    pending: boolean;
    error?: unknown;
  }>();
  const activeOperation =
    operation?.scope === scope &&
    operation.generation === generation.current.number
      ? operation
      : undefined;
  const current = (token: number) => {
    const auth = useAuthStore.getState();
    return (
      generation.current.mounted &&
      generation.current.scope === scope &&
      generation.current.number === token &&
      auth.sessionRevision === revision &&
      auth.currentUser?.studentNumber === user?.studentNumber &&
      selectHasAuthenticatedSession(auth)
    );
  };
  const run = async (
    kind: Operation,
  ): Promise<LiveEditLockStatus | undefined> => {
    if (
      !allowed ||
      (busy.current?.scope === scope &&
        busy.current.token === generation.current.number) ||
      !current(generation.current.number)
    )
      return undefined;
    const token = ++generation.current.number;
    busy.current = { scope, token };
    setOperation({ scope, generation: token, pending: true });
    try {
      // Cancel a pre-mutation status request so it cannot replace the newer result.
      await client.cancelQueries({ queryKey, exact: true });
      if (!current(token)) return undefined;
      let status =
        kind === 'acquire'
          ? await submitLiveEditLock(target)
          : await fetchLiveEditLock(target);
      if (!current(token)) return undefined;
      if (
        kind === 'release' &&
        status.locked &&
        status.lockedBy === user.studentNumber
      ) {
        await removeLiveEditLock(target);
        if (!current(token)) return undefined;
        status = await fetchLiveEditLock(target);
      }
      if (!current(token)) return undefined;
      await client.cancelQueries({ queryKey, exact: true });
      if (!current(token)) return undefined;
      client.setQueryData(queryKey, status);
      return status;
    } catch (error) {
      if (current(token))
        setOperation({ scope, generation: token, pending: false, error });
      return undefined;
    } finally {
      if (busy.current?.scope === scope && busy.current.token === token)
        busy.current = undefined;
      if (current(token))
        setOperation(previous => ({
          ...previous,
          scope,
          generation: token,
          pending: false,
        }));
    }
  };
  const status = allowed ? query.data : undefined;
  const isError = allowed && (query.isError || Boolean(activeOperation?.error));
  const pending =
    allowed &&
    ((!isError && query.isPending) || Boolean(activeOperation?.pending));
  return {
    state:
      !authenticated || user?.globalRole !== 'STUDENT'
        ? 'unauthenticated'
        : !target
          ? 'missing-target'
          : !valid
            ? 'unsupported-target'
            : pending
              ? 'loading'
              : isError
                ? 'error'
                : !status?.locked
                  ? 'unlocked'
                  : status.lockedBy === user.studentNumber
                    ? 'owned-by-account'
                    : 'locked',
    status: isError ? undefined : status,
    pending,
    error: activeOperation?.error ?? query.error,
    canEdit: false as const,
    canAcquire: allowed && !pending && !query.isFetching,
    canRelease:
      allowed &&
      !pending &&
      !isError &&
      status?.lockedBy === user.studentNumber,
    acquire: () => run('acquire'),
    confirmOwnership: () => run('confirm'),
    release: () => run('release'),
    refetch: () => run('confirm'),
  };
}
