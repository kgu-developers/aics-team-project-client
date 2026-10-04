import { Card, Heading, Text, VStack } from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAdminProfessorPresentationEvaluationStatusesQuery } from '~/features/admin-milestone-review/queries';

import * as styles from './AdminPresentationUnevaluatedTeams.css';

type PresentationTeam = {
  presentationOrder: number | null;
  teamId: number;
  teamName: string;
};

type AdminPresentationUnevaluatedTeamsProps = {
  milestoneId: string;
  sectionId: string;
  teams: readonly PresentationTeam[];
};

export function AdminPresentationUnevaluatedTeams({
  milestoneId,
  sectionId,
  teams,
}: AdminPresentationUnevaluatedTeamsProps) {
  const professorEvaluationStatuses =
    useAdminProfessorPresentationEvaluationStatusesQuery(
      sectionId,
      milestoneId,
      teams,
      true,
    );
  const unevaluatedTeams = professorEvaluationStatuses.data
    .filter(team => team.submittedAt === null)
    .sort(
      (left, right) =>
        (left.presentationOrder ?? Number.POSITIVE_INFINITY) -
          (right.presentationOrder ?? Number.POSITIVE_INFINITY) ||
        left.teamName.localeCompare(right.teamName, 'ko'),
    );

  return (
    <Card padding={4}>
      <VStack gap={3}>
        <div>
          <Heading level={3}>교수자 평가 현황</Heading>
          <Text color='secondary' type='supporting'>
            미저장 팀을 선택하면 해당 팀의 발표 자료 보기·평가 화면으로
            이동합니다.
          </Text>
        </div>
        {professorEvaluationStatuses.isPending ? (
          <Text aria-live='polite' role='status'>
            교수자 평가 현황을 불러오는 중입니다.
          </Text>
        ) : professorEvaluationStatuses.isError ? (
          <Text role='alert'>
            교수자 평가 현황을 불러오지 못했습니다. 발표 자료 보기·평가 화면에서
            팀별 상태를 확인해 주세요.
          </Text>
        ) : unevaluatedTeams.length > 0 ? (
          <VStack gap={2}>
            <Text weight='medium'>
              교수자 평가 미저장 {unevaluatedTeams.length}팀
            </Text>
            <ul className={styles.teamList}>
              {unevaluatedTeams.map(team => (
                <li key={team.teamId}>
                  <Link
                    aria-label={`${team.teamName} 발표 자료 보기·평가로 이동`}
                    className={styles.teamLink}
                    search={{
                      milestoneId,
                      sectionId,
                      teamId: String(team.teamId),
                    }}
                    to={ROUTES.ADMIN_PRESENTATION_PROGRESS}
                  >
                    <span>
                      {team.presentationOrder
                        ? `${team.presentationOrder}번째 발표 · `
                        : ''}
                      {team.teamName}
                    </span>
                    <span className={styles.teamLinkAction}>
                      발표 자료 보기·평가 →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </VStack>
        ) : (
          <Text role='status'>모든 팀의 교수자 평가가 저장되었습니다.</Text>
        )}
      </VStack>
    </Card>
  );
}
