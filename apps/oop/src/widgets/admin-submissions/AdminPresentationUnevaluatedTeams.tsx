import { Badge, Card, Heading, StatusDot, Text } from '@aics/design-system';
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
  const sortedTeams = [...professorEvaluationStatuses.data].sort(
    (left, right) =>
      (left.presentationOrder ?? Number.POSITIVE_INFINITY) -
        (right.presentationOrder ?? Number.POSITIVE_INFINITY) ||
      left.teamName.localeCompare(right.teamName, 'ko'),
  );
  const unevaluatedCount = sortedTeams.filter(
    team => !team.isPending && !team.isError && !team.submittedAt,
  ).length;
  const hasUnknownEvaluationStatus =
    professorEvaluationStatuses.isPending ||
    professorEvaluationStatuses.isError;

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <Heading level={2}>교수자 평가 현황</Heading>
        {!hasUnknownEvaluationStatus && sortedTeams.length > 0 ? (
          <Badge
            label={`미평가 ${unevaluatedCount}팀`}
            variant={unevaluatedCount > 0 ? 'error' : 'success'}
          />
        ) : null}
      </div>
      <Card padding={4}>
        {sortedTeams.length ? (
          <>
            {hasUnknownEvaluationStatus ? (
              <Text aria-live='polite' role='status'>
                일부 팀의 교수자 평가 상태를 확인하는 중이거나 확인하지
                못했습니다.
              </Text>
            ) : null}
            <ul className={styles.teamList}>
              {sortedTeams.map(team => {
                const evaluationLabel = team.isPending
                  ? '평가 확인 중'
                  : team.isError
                    ? '평가 확인 불가'
                    : team.submittedAt
                      ? '평가 완료'
                      : '미평가';
                const teamContent = (
                  <span className={styles.teamMain}>
                    <span className={styles.teamStatus}>
                      <StatusDot
                        aria-hidden='true'
                        label={evaluationLabel}
                        variant={
                          team.isPending || team.isError
                            ? 'neutral'
                            : team.submittedAt
                              ? 'success'
                              : 'error'
                        }
                      />
                      {evaluationLabel}
                    </span>
                    <span className={styles.teamName} title={team.teamName}>
                      {team.teamName}
                    </span>
                  </span>
                );
                return (
                  <li key={team.teamId}>
                    <Link
                      aria-label={`${team.teamName}, ${evaluationLabel}, ${team.presentationOrder != null ? `${team.presentationOrder}번째 발표` : '발표 순서 미정'}, 발표 기록 보기`}
                      className={styles.teamLink}
                      search={{
                        milestoneId,
                        sectionId,
                        teamId: String(team.teamId),
                      }}
                      to={ROUTES.ADMIN_PRESENTATION_PROGRESS}
                    >
                      {teamContent}
                      <span className={styles.teamLinkAction}>
                        <span className={styles.teamOrder}>
                          {team.presentationOrder != null
                            ? `${team.presentationOrder}번째`
                            : '순서 미정'}
                        </span>
                        <span>기록 보기 →</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <Text role='status'>표시할 발표 팀이 없습니다.</Text>
        )}
      </Card>
    </section>
  );
}
