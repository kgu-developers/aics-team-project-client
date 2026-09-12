import {
  Card,
  EmptyState,
  Heading,
  proportional,
  Table,
  Text,
} from '@aics/design-system';

import {
  useAdminPeerEvaluationTeamDetailQuery,
  useAdminPresentationEvaluationTeamDetailQuery,
} from '~/features/admin-evaluation/queries';

type Props = {
  sectionId: string;
  teamId: string;
};

export default function AdminTeamEvaluationTables({
  sectionId,
  teamId,
}: Props) {
  const numericTeamId = Number(teamId);
  const peerQuery = useAdminPeerEvaluationTeamDetailQuery(
    sectionId,
    numericTeamId,
  );
  const presentationQuery = useAdminPresentationEvaluationTeamDetailQuery(
    sectionId,
    numericTeamId,
  );

  return (
    <section aria-label='팀 평가 결과'>
      <section>
        <Heading level={2}>발표 평가</Heading>
        {presentationQuery.isPending ? (
          <Text role='status'>발표평가 결과를 불러오는 중입니다.</Text>
        ) : presentationQuery.isError || !presentationQuery.data ? (
          <EmptyState
            description='잠시 후 다시 시도해 주세요.'
            title='발표평가 결과를 불러오지 못했습니다.'
          />
        ) : presentationQuery.data.evaluations.length === 0 ? (
          <Text>제출된 발표평가가 없습니다.</Text>
        ) : (
          <Card>
            <Table
              columns={[
                {
                  align: 'start',
                  header: '평가자',
                  key: 'evaluator',
                  renderCell: evaluation => evaluation.evaluatorName,
                  width: proportional(1, { minWidth: 120 }),
                },
                {
                  align: 'start',
                  header: '소속 팀',
                  key: 'teamName',
                  renderCell: evaluation => evaluation.teamName,
                  width: proportional(1.2, { minWidth: 140 }),
                },
                ...[...presentationQuery.data.criteria]
                  .sort((a, b) => a.displayOrder - b.displayOrder)
                  .map(criterion => ({
                    align: 'center' as const,
                    header: `${criterion.title} (${criterion.maxScore})`,
                    key: String(criterion.criterionId),
                    renderCell: (
                      evaluation: (typeof presentationQuery.data.evaluations)[number],
                    ) =>
                      evaluation.scores.find(
                        score => score.criterionId === criterion.criterionId,
                      )?.score ?? '-',
                    width: proportional(1, { minWidth: 130 }),
                  })),
                {
                  align: 'center',
                  header: '총점',
                  key: 'total',
                  renderCell: evaluation => evaluation.totalScore ?? '-',
                  width: proportional(0.7, { minWidth: 80 }),
                },
                {
                  align: 'center',
                  header: '제출 상태',
                  key: 'submitted',
                  renderCell: evaluation =>
                    evaluation.isSubmitted ? '제출' : '미제출',
                  width: proportional(1, { minWidth: 100 }),
                },
              ]}
              data={presentationQuery.data.evaluations}
              dividers='rows'
              verticalAlign='middle'
            />
          </Card>
        )}
      </section>

      <section>
        <Heading level={2}>상호평가</Heading>
        {peerQuery.isPending ? (
          <Text role='status'>상호평가 결과를 불러오는 중입니다.</Text>
        ) : peerQuery.isError || !peerQuery.data ? (
          <EmptyState
            description='잠시 후 다시 시도해 주세요.'
            title='상호평가 결과를 불러오지 못했습니다.'
          />
        ) : peerQuery.data.evaluations.length === 0 ? (
          <Text>제출된 상호평가가 없습니다.</Text>
        ) : (
          <Card>
            <Table
              columns={[
                {
                  align: 'start',
                  header: '평가자',
                  key: 'evaluator',
                  renderCell: evaluation =>
                    `${evaluation.evaluatorName}${evaluation.isLeader ? ' (팀장)' : ''}`,
                  width: proportional(1, { minWidth: 140 }),
                },
                ...peerQuery.data.members.map(member => ({
                  align: 'center' as const,
                  header: member.name,
                  key: member.userId,
                  renderCell: (
                    evaluation: (typeof peerQuery.data.evaluations)[number],
                  ) =>
                    evaluation.scores.find(
                      score => score.targetUserId === member.userId,
                    )?.contributionPercent ?? '-',
                  width: proportional(1, { minWidth: 110 }),
                })),
                {
                  align: 'center',
                  header: '평균',
                  key: 'average',
                  renderCell: evaluation => evaluation.averageScore ?? '-',
                  width: proportional(0.7, { minWidth: 84 }),
                },
              ]}
              data={peerQuery.data.evaluations}
              dividers='rows'
              verticalAlign='middle'
            />
          </Card>
        )}
      </section>
    </section>
  );
}
