import {
  Badge,
  Button,
  EmptyState,
  RadioList,
  RadioListItem,
  TextArea,
  TextInput,
} from '@aics/design-system';
import { useId, useRef, useState } from 'react';

import {
  isValidPositiveTeamId,
  useTeamKickoffQuery,
} from '~/features/team-assignment/queries';

import { getTopicErrorMessage } from './getTopicErrorMessage';
import {
  isUncertainTopicWrite,
  mapLiveTopicCandidates,
  type TopicParticipationEligibility,
} from './liveTopicBoard';
import * as styles from './LiveTopicBoardView.css';
import {
  useLiveTopicCandidatesQuery,
  useLiveTopicParticipationMutation,
} from './queries';

export type LiveTopicBoardViewProps = {
  sectionId?: string;
  teamId?: string;
  studentNumber?: string;
  /** Only pass open after the current milestone's participation policy is verified. */
  eligibility?: TopicParticipationEligibility;
};

export default function LiveTopicBoardView(props: LiveTopicBoardViewProps) {
  // A different account or team must not inherit a draft or a pending-write error.
  return (
    <LiveTopicBoard
      key={`${props.sectionId}/${props.teamId}/${props.studentNumber}`}
      {...props}
    />
  );
}

function LiveTopicBoard({
  sectionId,
  teamId,
  studentNumber,
  eligibility = { status: 'unknown' },
}: LiveTopicBoardViewProps) {
  const headingId = useId();
  const prerequisitesReady =
    Boolean(sectionId && studentNumber) && isValidPositiveTeamId(teamId);
  const candidatesQuery = useLiveTopicCandidatesQuery(
    sectionId,
    teamId,
    studentNumber,
  );
  const kickoffQuery = useTeamKickoffQuery(
    prerequisitesReady ? teamId : undefined,
  );
  const mutation = useLiveTopicParticipationMutation(teamId, sectionId);
  const requestInFlight = useRef(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notice, setNotice] = useState('');

  if (!prerequisitesReady) {
    return (
      <EmptyState
        title='주제 후보를 볼 팀을 확인해 주세요.'
        description='소속 분반과 팀이 확인되면 주제 후보를 볼 수 있어요.'
      />
    );
  }
  if (candidatesQuery.isPending) {
    return <p role='status'>주제 후보를 불러오는 중...</p>;
  }
  if (!candidatesQuery.data) {
    return (
      <EmptyState
        title='주제 후보를 불러오지 못했어요.'
        description={getTopicErrorMessage(candidatesQuery.error)}
        actions={
          <Button
            label='주제 후보 다시 불러오기'
            clickAction={async () => {
              await candidatesQuery.refetch();
            }}
          />
        }
      />
    );
  }

  const candidates = mapLiveTopicCandidates(
    candidatesQuery.data,
    teamId!,
    studentNumber!,
    kickoffQuery.data,
  );
  const ownCandidate = candidates.find(candidate => candidate.isMine);
  const selectedCandidate = candidates.find(candidate => candidate.isMyVote);
  const membershipVerified =
    !kickoffQuery.isError &&
    String(kickoffQuery.data?.id) === teamId &&
    kickoffQuery.data?.members.some(
      member => member.studentNumber === studentNumber,
    );
  const uncertainWrite = isUncertainTopicWrite(mutation.error);
  const busy =
    mutation.isPending || candidatesQuery.isFetching || kickoffQuery.isFetching;
  const canParticipate =
    eligibility.status === 'open' &&
    membershipVerified &&
    !candidatesQuery.isError &&
    !busy &&
    !uncertainWrite;
  const disabledReason =
    eligibility.status !== 'open'
      ? (eligibility.reason ??
        (eligibility.status === 'closed'
          ? '지금은 주제 후보 등록·투표 기간이 아니에요.'
          : '주제 참여 기간을 확인한 뒤 후보 등록과 투표를 이용할 수 있어요.'))
      : !membershipVerified
        ? '팀원 정보를 확인한 뒤 후보 등록과 투표를 이용할 수 있어요.'
        : undefined;

  const perform = async (
    action: Parameters<typeof mutation.mutateAsync>[0],
  ) => {
    if (!canParticipate || requestInFlight.current) return;
    if (action.type === 'candidate' && ownCandidate) return;
    requestInFlight.current = true;
    setNotice('');
    try {
      await mutation.mutateAsync(action);
      if (action.type === 'candidate') {
        setTitle('');
        setDescription('');
        setIsFormOpen(false);
      }
      setNotice(
        action.type === 'candidate'
          ? '주제 후보를 추가했어요.'
          : action.type === 'vote'
            ? '투표를 반영했어요.'
            : '투표를 취소했어요.',
      );
    } catch {
      // Keep entered text and show the mutation error. Never replay the write.
    } finally {
      requestInFlight.current = false;
    }
  };

  return (
    <section aria-labelledby={headingId} className={styles.root}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.title} id={headingId}>
            우리 팀 주제 후보
          </h2>
          <p className={styles.description}>
            내 후보를 제외한 한 후보에 투표할 수 있어요.
          </p>
        </div>
        <p className={styles.description}>
          총{' '}
          {candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0)}
          표
        </p>
      </header>
      {disabledReason ? <p role='status'>{disabledReason}</p> : null}
      {kickoffQuery.isError ? (
        <Button
          label='팀원 정보 다시 불러오기'
          clickAction={async () => {
            await kickoffQuery.refetch();
          }}
        />
      ) : null}
      {candidatesQuery.isError ? (
        <div role='alert'>
          <p>
            최신 투표 현황을 확인하지 못했어요. 다시 불러온 뒤 참여해 주세요.
          </p>
          <Button
            label='주제 후보 다시 불러오기'
            clickAction={async () => {
              await candidatesQuery.refetch();
            }}
          />
        </div>
      ) : null}
      {mutation.error ? (
        <p className={styles.error} role='alert'>
          {uncertainWrite
            ? '요청 결과를 확인하지 못했어요. 다시 보내기 전에 목록에서 반영 여부를 확인해 주세요.'
            : getTopicErrorMessage(mutation.error)}
        </p>
      ) : null}
      {uncertainWrite ? (
        <Button
          isDisabled={busy}
          label='요청 결과 확인'
          clickAction={async () => {
            const result = await candidatesQuery.refetch();
            if (result.isSuccess) {
              mutation.reset();
              setNotice(
                '최신 목록을 불러왔어요. 내 후보와 투표 결과를 확인해 주세요.',
              );
            }
          }}
        />
      ) : null}
      {notice ? <p role='status'>{notice}</p> : null}
      {candidates.length === 0 ? (
        <EmptyState
          title='등록된 후보가 없어요.'
          description='참여 기간에 첫 주제 후보를 등록해 주세요.'
        />
      ) : (
        <RadioList
          label='주제 후보 선택'
          description='다른 후보를 선택하면 기존 투표가 변경됩니다.'
          isDisabled={!canParticipate}
          value={selectedCandidate?.id ?? ''}
          onChange={candidateId => {
            const candidate = candidates.find(item => item.id === candidateId);
            if (candidate && !candidate.isMine && !candidate.isMyVote)
              void perform({ type: 'vote', candidateId });
          }}
        >
          {candidates.map(candidate => (
            <RadioListItem
              key={candidate.id}
              value={candidate.id}
              label={candidate.title}
              description={`제안자 ${candidate.proposerName} · ${candidate.description}`}
              isDisabled={candidate.isMine}
              endContent={
                <span className={styles.candidateEnd}>
                  {candidate.isMine ? <Badge label='내 후보' /> : null}
                  {candidate.isMyVote ? <Badge label='내 투표' /> : null}
                  <span>{candidate.voteCount}표</span>
                </span>
              }
            />
          ))}
        </RadioList>
      )}
      {selectedCandidate ? (
        <Button
          label='선택한 후보 투표 취소'
          isDisabled={!canParticipate}
          clickAction={() =>
            perform({ type: 'cancel', candidateId: selectedCandidate.id })
          }
        />
      ) : null}
      {ownCandidate ? (
        <p>
          등록한 내 후보가 있어요. 후보는 한 사람당 하나씩 등록할 수 있어요.
        </p>
      ) : null}
      {!isFormOpen ? (
        <Button
          label='새 후보 추가'
          isDisabled={!canParticipate || Boolean(ownCandidate)}
          onClick={() => setIsFormOpen(true)}
        />
      ) : (
        <form
          className={styles.form}
          onSubmit={event => {
            event.preventDefault();
            if (
              !title.trim() ||
              title.trim().length > 200 ||
              !description.trim()
            )
              return;
            void perform({ type: 'candidate', input: { title, description } });
          }}
        >
          <TextInput
            label='후보 제목'
            value={title}
            onChange={setTitle}
            width='100%'
          />
          <TextArea
            label='후보 설명'
            value={description}
            onChange={setDescription}
          />
          <p className={styles.description}>
            제목은 200자 이내로 입력해 주세요.
          </p>
          <div className={styles.actions}>
            <Button
              label='입력 접기'
              isDisabled={mutation.isPending}
              onClick={() => setIsFormOpen(false)}
            />
            <Button
              label='후보 추가'
              type='submit'
              variant='primary'
              isLoading={
                mutation.isPending && mutation.variables?.type === 'candidate'
              }
              isDisabled={
                !canParticipate ||
                Boolean(ownCandidate) ||
                !title.trim() ||
                title.trim().length > 200 ||
                !description.trim()
              }
            />
          </div>
        </form>
      )}
    </section>
  );
}
