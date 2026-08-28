import { Button, Card, EmptyState, Heading, Text } from '@aics/design-system';
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { findMilestoneTemplate } from '~/features/admin-milestone-review/model';
import { useAdminMilestoneScheduleQuery } from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMilestoneDetailPage.css';

function getDeadlineLabel(summary: string) {
  const [deadline] = summary.split('\n');

  return deadline?.replace(/^~/, '') ?? '-';
}

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
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const isAccessibleSection = Boolean(
    search.sectionId && accessibleSectionIds.includes(search.sectionId),
  );
  const scheduleQuery = useAdminMilestoneScheduleQuery(accessibleSectionIds);
  const section = scheduleQuery.data?.sections.find(
    item => item.sectionId === search.sectionId,
  );
  const milestone = section?.milestones.find(item => item.id === milestoneId);
  const template = findMilestoneTemplate(milestone?.id);

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

  if (scheduleQuery.isPending) {
    return (
      <div className={styles.page}>
        <Text aria-live='polite' role='status'>
          마일스톤을 불러오는 중입니다.
        </Text>
      </div>
    );
  }

  if (scheduleQuery.isError) {
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

  const templateLabel = template?.label ?? '기본 양식 정보 없음';
  const templateDescription =
    template?.description ??
    '현재 마일스톤 API 응답에는 양식 설명이 포함되지 않았습니다.';

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
            <ReadOnlyField label='대상 분반' value={section.sectionLabel} />
            <ReadOnlyField label='마일스톤 기본 양식' value={templateLabel} />
          </div>
          <ReadOnlyField label='제목' value={milestone.title} />
          <ReadOnlyField label='설명' value={templateDescription} />
        </section>

        <section className={styles.section}>
          <Heading className={styles.sectionTitle} level={2}>
            공개 및 제출 일정
          </Heading>
          <article className={styles.sectionSchedule}>
            <Heading level={3}>{section.sectionLabel}</Heading>
            <div className={styles.readOnlyGrid}>
              <ReadOnlyField
                label='공개 시작 일시'
                value='현재 일정 조회 응답에 포함되지 않음'
              />
              <ReadOnlyField
                label='제출 마감 일시'
                value={getDeadlineLabel(milestone.summary)}
              />
              <ReadOnlyField
                label='공개 상태'
                value={milestone.isPublished ? '공개' : '미공개'}
              />
            </div>
            <div>
              <Text className={styles.policyTitle} weight='medium'>
                제출 정책
              </Text>
              <div className={styles.policyList}>
                <Text color='secondary' type='supporting'>
                  제출 마감 전 수정 허용: 현재 일정 조회 응답에 포함되지 않음
                </Text>
                <Text color='secondary' type='supporting'>
                  지각 제출 허용: 현재 일정 조회 응답에 포함되지 않음
                </Text>
              </div>
            </div>
          </article>
        </section>

        <section className={styles.section}>
          <Heading className={styles.sectionTitle} level={2}>
            기본 양식 미리보기
          </Heading>
          <div className={styles.preview}>
            <Text className={styles.previewEyebrow} type='supporting'>
              학생 화면 기본 양식 미리보기
            </Text>
            <Heading className={styles.previewTitle} level={3}>
              {milestone.title}
            </Heading>
            <Text className={styles.previewTemplate} weight='medium'>
              기본 양식: {templateLabel}
            </Text>
            <Text className={styles.previewDescription} color='secondary'>
              {templateDescription}
            </Text>
            <Text className={styles.previewBlocksTitle} weight='medium'>
              학생에게 표시되는 고정 블록
            </Text>
            {template ? (
              <ol className={styles.previewList}>
                {template.fields.map((field, index) => (
                  <li className={styles.previewItem} key={field}>
                    <span className={styles.previewItemNumber}>
                      {index + 1}
                    </span>
                    <span>{field}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Text color='secondary' type='supporting'>
                현재 선택된 양식의 고정 블록 정보를 확인할 수 없습니다.
              </Text>
            )}
            <Text
              className={styles.previewNote}
              color='secondary'
              type='supporting'
            >
              기본 양식의 블록 구성은 현재 학생 화면과 동일한 고정 구조입니다.
              블록 추가·삭제·순서 변경과 실제 저장은 양식 API 계약 확정 후
              지원합니다.
            </Text>
          </div>
        </section>

        <section className={styles.section}>
          <Heading className={styles.sectionTitle} level={2}>
            현재 진행 현황
          </Heading>
          <Text className={styles.summary}>{milestone.summary}</Text>
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
