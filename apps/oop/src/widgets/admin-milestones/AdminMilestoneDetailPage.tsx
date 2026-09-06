import { Button, Card, EmptyState, Heading, Text } from '@aics/design-system';
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import {
  formatAdminMilestoneDate,
  getAdminMilestoneStatusLabel,
  getAdminMilestoneTypeLabel,
} from '~/features/admin-milestone-review/model';
import { useAdminSectionMilestoneQuery } from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMilestoneDetailPage.css';

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.readOnlyField}>
      <Text color='secondary' type='supporting'>
        {label}
      </Text>
      <Text className={styles.readOnlyValue} weight='medium'>
        {value}
      </Text>
    </div>
  );
}

export default function AdminMilestoneDetailPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const { milestoneId } = useParams({
    from: '/admin/milestones/$milestoneId',
  });
  const search = useSearch({
    from: '/admin/milestones/$milestoneId',
  }) as { sectionId?: string };
  const accessibleSections = currentUser?.sections ?? [];
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const isAccessibleSection = Boolean(
    search.sectionId && accessibleSectionIds.includes(search.sectionId),
  );
  const section = accessibleSections.find(item => item.id === search.sectionId);
  const milestoneQuery = useAdminSectionMilestoneQuery(
    isAccessibleSection ? search.sectionId : undefined,
    isAccessibleSection ? milestoneId : undefined,
  );
  const milestone = milestoneQuery.data;

  if (!search.sectionId || !isAccessibleSection) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='담당 분반의 마일스톤만 조회할 수 있습니다.'
          title='접근할 수 없는 분반입니다.'
        />
      </div>
    );
  }

  if (milestoneQuery.isPending) {
    return (
      <div className={styles.page}>
        <Text aria-live='polite' role='status'>
          마일스톤을 불러오는 중입니다.
        </Text>
      </div>
    );
  }

  if (milestoneQuery.isError) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='마일스톤을 불러오지 못했습니다.'
        />
      </div>
    );
  }

  if (!section || !milestone) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='삭제되었거나 존재하지 않는 마일스톤입니다.'
          title='마일스톤을 찾을 수 없습니다.'
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.titleRow}>
        <div>
          <Heading level={1}>마일스톤 &gt; {milestone.title}</Heading>
          <Text color='secondary' type='supporting'>
            설정된 내용을 읽기 전용으로 확인합니다.
          </Text>
        </div>
        <Link
          className={styles.backLink}
          search={{ sectionId: search.sectionId }}
          to={ROUTES.ADMIN_MILESTONES}
        >
          ← 마일스톤 목록으로
        </Link>
      </header>

      <Card className={styles.detailCard} padding={4}>
        <section className={styles.section}>
          <Heading className={styles.sectionTitle} level={2}>
            기본 설정
          </Heading>
          <div className={styles.readOnlyGrid}>
            <ReadOnlyField label='대상 분반' value={section.code} />
            <ReadOnlyField
              label='마일스톤 유형'
              value={getAdminMilestoneTypeLabel(milestone.type)}
            />
            <ReadOnlyField
              label='진행 주차'
              value={`${milestone.weekNumber}주차`}
            />
          </div>
          <ReadOnlyField label='제목' value={milestone.title} />
          <ReadOnlyField label='설명' value={milestone.description ?? '-'} />
        </section>

        <section className={styles.section}>
          <Heading className={styles.sectionTitle} level={2}>
            공개 및 제출 일정
          </Heading>
          <article className={styles.sectionSchedule}>
            <Heading level={3}>{section.code}</Heading>
            <div className={styles.readOnlyGrid}>
              <ReadOnlyField
                label='공개 시작 일시'
                value={formatAdminMilestoneDate(milestone.schedule.opensAt)}
              />
              <ReadOnlyField
                label='제출 마감 일시'
                value={formatAdminMilestoneDate(milestone.schedule.dueAt)}
              />
              <ReadOnlyField
                label='공개 상태'
                value={getAdminMilestoneStatusLabel(milestone.status)}
              />
            </div>
            <div>
              <Text className={styles.policyTitle} weight='medium'>
                제출 정책
              </Text>
              <div className={styles.policyList}>
                <Text color='secondary' type='supporting'>
                  제출 마감 전 수정:{' '}
                  {milestone.allowResubmissionBeforeDueAt ? '허용' : '불가'}
                </Text>
                <Text color='secondary' type='supporting'>
                  지각 제출 가능 기한:{' '}
                  {formatAdminMilestoneDate(
                    milestone.schedule.lateSubmissionUntil,
                  )}
                </Text>
              </div>
            </div>
          </article>
        </section>

        <div className={styles.actions}>
          <Button
            label='수정'
            onClick={() =>
              navigate({
                search: {
                  milestoneId,
                  sectionId: search.sectionId,
                },
                to: ROUTES.ADMIN_MILESTONE_NEW,
              })
            }
            variant='primary'
          />
        </div>
      </Card>
    </div>
  );
}
