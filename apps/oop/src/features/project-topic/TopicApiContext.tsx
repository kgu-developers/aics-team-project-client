import type { SubmitTopicCandidateInput } from '@aics/core';
import {
  createContext,
  useContext,
  useRef,
  type PropsWithChildren,
} from 'react';

import { useTeamKickoffQuery } from '~/features/team-assignment/queries';

import {
  isUncertainTopicWrite,
  mapLiveTopicCandidates,
  type TopicParticipationEligibility,
} from './liveTopicBoard';
import {
  useLiveTopicCandidatesQuery,
  useLiveTopicParticipationMutation,
} from './queries';

function useTopicApiState({
  sectionId,
  teamId,
  studentNumber,
  eligibility,
}: TopicApiProps) {
  const candidates = useLiveTopicCandidatesQuery(
    sectionId,
    teamId,
    studentNumber,
  );
  const kickoff = useTeamKickoffQuery(teamId);
  const mutation = useLiveTopicParticipationMutation(teamId, sectionId);
  const inFlight = useRef(false);
  const items = mapLiveTopicCandidates(
    candidates.data ?? [],
    teamId ?? '',
    studentNumber ?? '',
    kickoff.data,
  );
  const ready = Boolean(sectionId && teamId && studentNumber);
  const canParticipate =
    ready &&
    eligibility.status === 'open' &&
    !candidates.isError &&
    candidates.isSuccess &&
    !kickoff.isError &&
    kickoff.isSuccess &&
    String(kickoff.data.id) === teamId &&
    kickoff.data.members.some(member => member.studentNumber === studentNumber);
  const busy =
    mutation.isPending || candidates.isFetching || kickoff.isFetching;
  const reason =
    eligibility.status !== 'open'
      ? (eligibility.reason ?? '지금은 제안서 주제 선정 참여 기간이 아니에요.')
      : !canParticipate
        ? '팀원과 주제 후보 정보를 확인해 주세요.'
        : undefined;
  async function perform(action: Parameters<typeof mutation.mutateAsync>[0]) {
    if (!canParticipate || busy || inFlight.current) return false;
    if (
      eligibility.window &&
      (Date.now() < eligibility.window.opensAt ||
        Date.now() >= eligibility.window.dueAt)
    )
      return false;
    if (isUncertainTopicWrite(mutation.error)) {
      const result = await candidates.refetch();
      if (result.isSuccess) mutation.reset();
      return false;
    }
    if (action.type === 'candidate' && items.some(item => item.isMine))
      return false;
    inFlight.current = true;
    try {
      await mutation.mutateAsync(action);
      return true;
    } finally {
      inFlight.current = false;
    }
  }
  return {
    scope: { sectionId, teamId, studentNumber, eligibility },
    ready,
    canParticipate,
    busy,
    reason,
    mutation,
    boardQuery: {
      ...candidates,
      data: candidates.data
        ? {
            candidates: items,
            participation: {
              votedMemberCount: items.reduce(
                (sum, item) => sum + item.voteCount,
                0,
              ),
              totalMemberCount: kickoff.data?.members.length ?? 0,
            },
          }
        : undefined,
      refetch: async () => {
        const result = await candidates.refetch();
        await kickoff.refetch();
        if (result.isSuccess) mutation.reset();
        return result;
      },
    },
    submit: (input: SubmitTopicCandidateInput) =>
      perform({ type: 'candidate', input }),
    vote: (candidateId: string) => perform({ type: 'vote', candidateId }),
    cancel: (candidateId: string) => perform({ type: 'cancel', candidateId }),
  };
}
type TopicApiProps = {
  sectionId?: string;
  teamId?: string;
  studentNumber?: string;
  eligibility: TopicParticipationEligibility;
};
const TopicApiContext = createContext<ReturnType<
  typeof useTopicApiState
> | null>(null);
export function TopicApiProvider({
  children,
  ...props
}: PropsWithChildren<TopicApiProps>) {
  return (
    <ScopedTopicApiProvider
      key={`${props.sectionId}/${props.teamId}/${props.studentNumber}`}
      {...props}
    >
      {children}
    </ScopedTopicApiProvider>
  );
}
function ScopedTopicApiProvider({
  children,
  ...props
}: PropsWithChildren<TopicApiProps>) {
  const state = useTopicApiState(props);
  return (
    <TopicApiContext.Provider value={state}>
      {children}
    </TopicApiContext.Provider>
  );
}
export function useTopicApi() {
  return useContext(TopicApiContext);
}
