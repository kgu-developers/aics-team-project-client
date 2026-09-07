import { Button } from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import { formatTeamAssignmentDate } from './formatTeamAssignmentDate';
import * as styles from './TeamAssignmentFlow.css';
const mockDevelopmentMode = isMockDevelopmentMode(
  import.meta.env.DEV,
  import.meta.env.VITE_ENABLE_MSW,
);
export default function ResultWaiting({
  resultReleasesAt,
}: {
  resultReleasesAt?: string;
}) {
  const navigate = useNavigate();

  return (
    <section
      className={styles.page}
      aria-labelledby='team-result-waiting-heading'
    >
      <div className={styles.waitingContent}>
        <img
          alt='설문 제출 완료'
          className={styles.illustration}
          src='/team-survey-illustration.svg'
        />
        <h1 className={styles.headline} id='team-result-waiting-heading'>
          설문에 응답해 주셔서 감사합니다.
        </h1>
        {resultReleasesAt ? (
          <p>
            팀 선정 결과는 {formatTeamAssignmentDate(resultReleasesAt)}에
            공개됩니다.
          </p>
        ) : (
          <p>팀원 공개 일정은 추후 안내됩니다.</p>
        )}
      </div>
      {mockDevelopmentMode ? (
        <div className={`${styles.actions} ${styles.centeredActions}`}>
          <Button
            label='개발용: 팀 선정 결과 보기'
            onClick={() =>
              void navigate({
                search: { teamAssignmentPreview: 'result' },
                to: ROUTES.ONBOARDING.TEAM,
              })
            }
            variant='secondary'
          />
        </div>
      ) : null}
    </section>
  );
}
