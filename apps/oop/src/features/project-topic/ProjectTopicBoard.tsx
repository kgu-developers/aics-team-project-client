import {
  Badge,
  Button,
  EmptyState,
  RadioList,
  RadioListItem,
} from '@aics/design-system';

import { useAuthStore } from '~/features/auth/authStore';

import { getTopicErrorMessage } from './getTopicErrorMessage';
import * as styles from './ProjectTopicBoard.css';
import {
  useRemoveTopicVoteMutation,
  useSubmitTopicVoteMutation,
  useTopicBoardQuery,
} from './queries';

type ProjectTopicBoardProps = {
  embedded?: boolean;
};

export default function ProjectTopicBoard({
  embedded = false,
}: ProjectTopicBoardProps) {
  const currentUser = useAuthStore(state => state.currentUser);
  const sectionId =
    currentUser?.sections.find(section => section.role === 'STUDENT')?.id ?? '';
  const boardQuery = useTopicBoardQuery(sectionId);
  const voteMutation = useSubmitTopicVoteMutation(sectionId);
  const removeVoteMutation = useRemoveTopicVoteMutation(sectionId);
  const mutationError = voteMutation.error ?? removeVoteMutation.error;

  if (!sectionId) {
    return (
      <EmptyState
        description='팀 배정 후 주제 후보를 등록하고 투표할 수 있어요.'
        title='소속 팀이 없어요.'
      />
    );
  }
  if (boardQuery.isPending) {
    return <p role='status'>주제 후보를 불러오는 중...</p>;
  }
  if (boardQuery.isError || !boardQuery.data) {
    return (
      <EmptyState
        actions={
          <Button
            clickAction={async () => {
              await boardQuery.refetch();
            }}
            label='다시 시도'
            variant='primary'
          />
        }
        description={getTopicErrorMessage(boardQuery.error)}
        title='주제 후보를 불러오지 못했어요.'
      />
    );
  }

  const board = boardQuery.data;
  const isVotePending = voteMutation.isPending || removeVoteMutation.isPending;

  return (
    <section
      aria-labelledby={embedded ? undefined : 'project-topic-heading'}
      className={styles.root}
    >
      {!embedded ? (
        <header className={styles.header}>
          <h1 className={styles.title} id='project-topic-heading'>
            프로젝트 주제
          </h1>
          <p className={styles.description}>
            후보를 비교한 뒤, 한 후보에 투표해 주세요.
          </p>
        </header>
      ) : null}

      <div className={styles.boardHeader}>
        <div>
          <h2 className={styles.boardTitle}>우리 팀 투표</h2>
          <p className={styles.description}>
            내 후보를 제외한 한 후보를 선택할 수 있어요.
          </p>
        </div>
        <p className={styles.participation}>
          투표 참여 {board.participation.votedMemberCount}/
          {board.participation.totalMemberCount}명
        </p>
      </div>
      {mutationError ? (
        <p className={styles.error} role='alert'>
          {getTopicErrorMessage(mutationError)}
        </p>
      ) : null}
      {board.candidates.length === 0 ? (
        <EmptyState
          description='첫 후보를 등록해 팀의 주제 논의를 시작해 보세요.'
          title='등록된 후보가 없어요.'
        />
      ) : (
        <RadioList
          description='후보를 선택하면 즉시 투표됩니다. 선택한 후보를 다시 누르면 투표를 취소할 수 있어요.'
          isDisabled={isVotePending}
          label='주제 후보 선택'
          onChange={candidateId => {
            removeVoteMutation.reset();
            voteMutation.mutate(candidateId);
          }}
          value={
            board.candidates.find(candidate => candidate.isMyVote)?.id ?? ''
          }
        >
          {board.candidates.map(candidate => (
            <RadioListItem
              description={`제안자 ${candidate.proposerName} · ${candidate.description}`}
              endContent={
                <span className={styles.candidateEnd}>
                  {candidate.isMine ? <Badge label='내 후보' /> : null}
                  {candidate.isMyVote ? <Badge label='내 투표' /> : null}
                  <span className={styles.voteCount}>
                    {candidate.voteCount}표
                  </span>
                </span>
              }
              isDisabled={candidate.isMine}
              key={candidate.id}
              label={candidate.title}
              onClick={() => {
                if (candidate.isMyVote && !isVotePending) {
                  voteMutation.reset();
                  removeVoteMutation.mutate();
                }
              }}
              value={candidate.id}
            />
          ))}
        </RadioList>
      )}
    </section>
  );
}
