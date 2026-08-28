import { Button, Card, EmptyState, Heading, Text } from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAdminMilestoneScheduleQuery } from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMilestonesPage.css';

const allSectionsValue = 'all';

function getDeadlineLabel(summary: string) {
  const [deadline] = summary.split('\n');

  return deadline?.replace(/^~/, '') ?? '-';
}

export default function AdminMilestonesPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/milestones/' }) as {
    sectionId?: string;
  };
  const accessibleSections = currentUser?.sections ?? [];
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const selectedSectionId =
    search.sectionId && accessibleSectionIds.includes(search.sectionId)
      ? search.sectionId
      : allSectionsValue;
  const scheduleQuery = useAdminMilestoneScheduleQuery(accessibleSectionIds);
  const milestones = (scheduleQuery.data?.sections ?? [])
    .filter(
      section =>
        selectedSectionId === allSectionsValue ||
        section.sectionId === selectedSectionId,
    )
    .flatMap(section =>
      section.milestones.map(milestone => ({
        ...milestone,
        sectionId: section.sectionId,
        sectionLabel: section.sectionLabel,
      })),
    );

  function selectSection(sectionId: string) {
    void navigate({
      search: sectionId === allSectionsValue ? {} : { sectionId },
      to: ROUTES.ADMIN_MILESTONES,
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>마일스톤 설정</Heading>
        <Link className={styles.backLink} to={ROUTES.ADMIN}>
          ← 홈으로
        </Link>
      </div>
      <Text className={styles.description} type='supporting'>
        담당 분반의 마일스톤 공개 일정과 제출 마감 일시를 확인하고 설정합니다.
      </Text>

      <div className={styles.filterRow}>
        <div className={styles.filters} role='group' aria-label='분반 필터'>
          {[
            { label: '전체', value: allSectionsValue },
            ...accessibleSections.map(section => ({
              label: section.code,
              value: section.id,
            })),
          ].map(section => (
            <button
              aria-pressed={selectedSectionId === section.value}
              className={
                selectedSectionId === section.value
                  ? styles.filterActive
                  : styles.filter
              }
              key={section.value}
              onClick={() => selectSection(section.value)}
              type='button'
            >
              {section.label}
            </button>
          ))}
        </div>
        <Button
          label='마일스톤 추가'
          onClick={() => navigate({ to: ROUTES.ADMIN_MILESTONE_NEW })}
          variant='primary'
        />
      </div>

      {accessibleSectionIds.length === 0 ? (
        <EmptyState
          description='담당 분반이 없어 마일스톤을 조회할 수 없습니다.'
          title='표시할 마일스톤이 없습니다.'
        />
      ) : scheduleQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          마일스톤을 불러오는 중입니다.
        </Text>
      ) : scheduleQuery.isError ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='마일스톤을 불러오지 못했습니다.'
        />
      ) : milestones.length === 0 ? (
        <EmptyState
          description='마일스톤 추가 버튼으로 새 일정을 설정할 수 있습니다.'
          title='등록된 마일스톤이 없습니다.'
        />
      ) : (
        <Card className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>적용 분반</th>
                <th>마감일</th>
                <th>공개 상태</th>
                <th>제목</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map(milestone => (
                <tr key={`${milestone.sectionId}-${milestone.id}`}>
                  <td>{milestone.sectionLabel}</td>
                  <td>{getDeadlineLabel(milestone.summary)}</td>
                  <td>{milestone.isPublished ? '공개' : '미공개'}</td>
                  <td>
                    <Link
                      className={styles.titleLink}
                      search={{
                        milestoneId: milestone.id,
                        sectionId: milestone.sectionId,
                      }}
                      to={ROUTES.ADMIN_MILESTONE_NEW}
                    >
                      {milestone.title}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
