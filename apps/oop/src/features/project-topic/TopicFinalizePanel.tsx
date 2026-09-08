import type { TopicFinalizeResponse } from '@aics/core';
import {
  Button,
  Dialog,
  Heading,
  RadioList,
  RadioListItem,
  Text,
  TextArea,
} from '@aics/design-system';
import { useMutationState } from '@tanstack/react-query';
import { useRef, useState } from 'react';

import { useTeamProjectQuery } from '~/features/student-home/queries';
import {
  isValidPositiveTeamId,
  useTeamKickoffQuery,
} from '~/features/team-assignment/queries';

import {
  hasAllTopicVotes,
  isUncertainTopicWrite,
  type TopicParticipationEligibility,
} from './liveTopicBoard';
import {
  topicKeys,
  useLiveTopicCandidatesQuery,
  useUpdateTopicFinalizationMutation,
} from './queries';
import { getTopicFinalizationError } from './topicFinalization';
import * as styles from './TopicFinalizePanel.css';

export type TopicFinalizePanelProps = {
  sectionId?: string;
  teamId?: string;
  studentNumber?: string;
  eligibility: TopicParticipationEligibility;
  participationBusy?: boolean;
  className?: string;
  onFinalized?: (result: TopicFinalizeResponse) => void;
};

export default function TopicFinalizePanel(props: TopicFinalizePanelProps) {
  return (
    <TopicFinalization
      key={`${props.sectionId}/${props.teamId}/${props.studentNumber}`}
      {...props}
    />
  );
}

function TopicFinalization({
  sectionId,
  teamId,
  studentNumber,
  eligibility,
  participationBusy = false,
  className,
  onFinalized,
}: TopicFinalizePanelProps) {
  const ready =
    Boolean(sectionId && studentNumber) && isValidPositiveTeamId(teamId);
  const project = useTeamProjectQuery(ready ? teamId : undefined);
  const kickoff = useTeamKickoffQuery(ready ? teamId : undefined);
  const candidates = useLiveTopicCandidatesQuery(
    sectionId,
    teamId,
    studentNumber,
  );
  const mutation = useUpdateTopicFinalizationMutation(
    teamId,
    sectionId,
    studentNumber,
    result => {
      setIsOpen(false);
      onFinalized?.(result);
    },
  );
  const attempts = useMutationState({
    filters: {
      mutationKey: topicKeys.finalization(teamId, studentNumber, sectionId),
      exact: true,
    },
    select: item => ({
      status: item.state.status,
      error: item.state.error,
      data: item.state.data as TopicFinalizeResponse | undefined,
    }),
  });
  const lastAttempt = attempts.at(-1);
  const uncertain = isUncertainTopicWrite(lastAttempt?.error);
  const receipt =
    lastAttempt?.status === 'success' ? lastAttempt.data : undefined;
  const [isOpen, setIsOpen] = useState(false);
  const [candidateId, setCandidateId] = useState('');
  const [goal, setGoal] = useState('');
  const inFlight = useRef(false);
  const isLeader =
    !kickoff.isError &&
    String(kickoff.data?.id) === teamId &&
    kickoff.data?.members.some(
      member => member.studentNumber === studentNumber && member.isLeader,
    );
  const busy =
    participationBusy ||
    mutation.isPending ||
    lastAttempt?.status === 'pending' ||
    project.isFetching ||
    kickoff.isFetching ||
    candidates.isFetching;
  const completed = Boolean(project.data?.proposalCompletedAt);
  const canFinalize =
    ready &&
    isLeader &&
    hasAllTopicVotes(
      candidates.data ?? [],
      kickoff.data?.members.length ?? 0,
    ) &&
    eligibility.status === 'open' &&
    !busy &&
    !uncertain &&
    !completed &&
    project.isSuccess &&
    !project.isError &&
    candidates.isSuccess &&
    !candidates.isError;
  const chosen = candidates.data?.find(
    candidate => String(candidate.id) === candidateId,
  );

  if (!ready) return <Text>소속 분반과 팀을 확인해 주세요.</Text>;

  return (
    <div className={styles.root}>
      {project.isPending ? (
        <Text role='status'>프로젝트를 불러오는 중...</Text>
      ) : null}
      {project.isError ? (
        <Text role='alert'>프로젝트를 불러오지 못했어요.</Text>
      ) : null}
      {receipt ? (
        <Text role='status'>주제를 확정했어요: {receipt.title}</Text>
      ) : null}
      {uncertain ? (
        <Text role='alert'>
          확정 요청의 결과를 확인하지 못했어요. 프로젝트를 다시 확인하고, 재요청
          전 담당자에게 문의해 주세요.
        </Text>
      ) : null}
      {completed ? (
        <Text>제안서 작성이 완료되어 주제를 변경할 수 없어요.</Text>
      ) : null}
      {!isLeader && !kickoff.isPending ? (
        <Text>
          {kickoff.isError
            ? '팀장 정보를 확인하지 못했어요.'
            : '팀장이 주제를 확정할 수 있어요.'}
        </Text>
      ) : null}
      <div className={styles.actions}>
        <Button
          label='주제 확정'
          variant='primary'
          className={className}
          isDisabled={!canFinalize || !candidates.data?.length}
          onClick={() => setIsOpen(true)}
        />
        {project.isError || kickoff.isError || uncertain ? (
          <Button
            label='프로젝트 다시 확인'
            isDisabled={busy}
            clickAction={async () => {
              await Promise.all([project.refetch(), kickoff.refetch()]);
            }}
          />
        ) : null}
      </div>
      {isOpen ? (
        <Dialog
          aria-label='팀 주제 확정'
          purpose='form'
          isOpen={isOpen}
          onOpenChange={next => {
            if (!mutation.isPending) setIsOpen(next);
          }}
        >
          <form
            className={styles.root}
            onSubmit={event => {
              event.preventDefault();
              if (!canFinalize || !chosen || !goal.trim() || inFlight.current)
                return;
              if (
                eligibility.window &&
                (Date.now() < eligibility.window.opensAt ||
                  Date.now() >= eligibility.window.dueAt)
              )
                return;
              inFlight.current = true;
              mutation.mutate(
                { candidateId: chosen.id, goal },
                {
                  onSettled: () => {
                    inFlight.current = false;
                  },
                },
              );
            }}
          >
            <Heading level={2}>팀 주제 확정</Heading>
            <Text>팀에서 합의한 후보와 프로젝트 목표를 확인해 주세요.</Text>
            {project.data ? (
              <Text>
                현재 프로젝트의 제목·설명·목표가 선택한 내용으로 바뀌고, 기존
                팀원 동의가 초기화됩니다.
              </Text>
            ) : null}
            <RadioList
              label='확정할 주제 후보'
              value={candidateId}
              onChange={setCandidateId}
              isDisabled={!canFinalize}
            >
              {candidates.data?.map(candidate => (
                <RadioListItem
                  key={candidate.id}
                  value={String(candidate.id)}
                  label={candidate.title}
                  description={candidate.description}
                />
              ))}
            </RadioList>
            <TextArea
              label='프로젝트 목표'
              value={goal}
              onChange={setGoal}
              isDisabled={busy}
            />
            {mutation.isError ? (
              <Text role='alert'>
                {getTopicFinalizationError(mutation.error)}
              </Text>
            ) : null}
            <div className={styles.actions}>
              <Button
                label='닫기'
                variant='secondary'
                isDisabled={mutation.isPending}
                onClick={() => setIsOpen(false)}
              />
              <Button
                label='이 주제로 확정'
                type='submit'
                variant='primary'
                isLoading={mutation.isPending}
                isDisabled={!canFinalize || !chosen || !goal.trim()}
              />
            </div>
          </form>
        </Dialog>
      ) : null}
    </div>
  );
}
