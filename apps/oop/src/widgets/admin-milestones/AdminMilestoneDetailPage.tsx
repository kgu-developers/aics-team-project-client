import type { RequiredArtifactType } from '@aics/api-client';
import {
  Button,
  Card,
  CheckboxList,
  CheckboxListItem,
  DateInput,
  EmptyState,
  Heading,
  MultiSelector,
  NumberInput,
  Selector,
  SelectorOption,
  Text,
  TextArea,
  TextInput,
  TimeInput,
  type DateInputProps,
  type TimeInputProps,
} from '@aics/design-system';
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import AdminPeerEvaluationStudentPreview from '~/features/admin-milestone-review/components/AdminPeerEvaluationStudentPreview';
import AdminPresentationEvaluationQuestions from '~/features/admin-milestone-review/components/AdminPresentationEvaluationQuestions';
import AdminStudentMilestonePreview from '~/features/admin-milestone-review/components/AdminStudentMilestonePreview';
import {
  createAdminMilestoneSectionScheduleDraftFromDto,
  formatRequiredArtifactFileSize,
  getAdminMilestoneStatusLabel,
  getAdminMilestoneTypeLabel,
  getStudentMilestonePreviewTemplateId,
} from '~/features/admin-milestone-review/model';
import {
  useAdminRequiredArtifactsQuery,
  useAdminSectionMilestoneQuery,
} from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMilestoneDetailPage.css';

function DisabledDateTimeFields({
  dateLabel,
  timeLabel,
  value,
}: {
  dateLabel: string;
  timeLabel: string;
  value: { date: string; time: string };
}) {
  return (
    <div className={styles.scheduleInputs}>
      <DateInput
        className={styles.readOnlyControl}
        isDisabled
        label={dateLabel}
        value={(value.date || undefined) as DateInputProps['value']}
        width='100%'
      />
      <TimeInput
        className={styles.readOnlyControl}
        hourFormat='24h'
        isDisabled
        label={timeLabel}
        value={(value.time || undefined) as TimeInputProps['value']}
        width='100%'
      />
    </div>
  );
}

const artifactTypeLabels: Record<RequiredArtifactType, string> = {
  CHEERPJ_RUN: 'CheerpJ 실행',
  FILE: '파일',
  LINK: '링크',
  TEXT: '텍스트',
};

export default function AdminMilestoneDetailPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const { milestoneId } = useParams({
    from: '/admin/milestones/$milestoneId',
  });
  const rawSearch = useSearch({
    from: '/admin/milestones/$milestoneId',
  }) as { sectionId?: string | number };
  // Hand-typed URLs arrive as numbers; router links serialize strings.
  const search = {
    sectionId:
      rawSearch.sectionId === undefined
        ? undefined
        : String(rawSearch.sectionId),
  };
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
  const studentPreviewTemplateId = milestone
    ? getStudentMilestonePreviewTemplateId(milestone.type)
    : undefined;
  const supportsRequiredArtifacts =
    milestone?.type === 'PRESENTATION' || milestone?.type === 'FINAL_REPORT';
  const requiredArtifactsQuery = useAdminRequiredArtifactsQuery(
    isAccessibleSection && supportsRequiredArtifacts
      ? search.sectionId
      : undefined,
    isAccessibleSection && supportsRequiredArtifacts ? milestoneId : undefined,
  );
  const scheduleDraft = milestone
    ? createAdminMilestoneSectionScheduleDraftFromDto(
        milestone.schedule,
        milestone.status,
        milestone.allowResubmissionBeforeDueAt,
        milestone.type,
        milestone.peerEvaluationForm,
      )
    : undefined;

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

  if (!section || !milestone || !scheduleDraft) {
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
        <div className={styles.titleContent}>
          <Heading className={styles.pageTitle} level={1}>
            {milestone.title} · {section.code}
          </Heading>
        </div>
        <Link
          className={styles.backLink}
          search={{ sectionId: search.sectionId }}
          to={ROUTES.ADMIN_MILESTONES}
        >
          ← 마일스톤 목록으로
        </Link>
      </header>

      <div className={styles.detailStack}>
        <Card padding={4}>
          <section className={styles.section}>
            <Heading className={styles.sectionTitle} level={2}>
              기본 설정
            </Heading>
            <div className={styles.basicGrid}>
              <MultiSelector
                className={styles.readOnlyControl}
                isDisabled
                label='대상 분반'
                onChange={() => undefined}
                options={[
                  {
                    label: `${section.code} · ${section.name}`,
                    value: section.id,
                  },
                ]}
                triggerDisplay='labels'
                value={[section.id]}
                width='100%'
              />
              <Selector
                className={styles.readOnlyControl}
                isDisabled
                label='마일스톤 유형'
                options={[
                  {
                    label: getAdminMilestoneTypeLabel(milestone.type),
                    value: milestone.type,
                  },
                ]}
                renderOption={option => (
                  <SelectorOption label={option.label ?? option.value} />
                )}
                value={milestone.type}
                width='100%'
              />
              <TextInput
                className={styles.readOnlyControl}
                isDisabled
                label='제목'
                value={milestone.title}
                width='100%'
              />
              <NumberInput
                className={styles.readOnlyControl}
                isIntegerOnly
                isDisabled
                label='진행 주차'
                min={1}
                onChange={() => undefined}
                value={milestone.weekNumber}
                width='100%'
              />
              <div className={styles.fullWidthField}>
                <TextArea
                  className={styles.readOnlyControl}
                  isDisabled
                  label='설명'
                  value={milestone.description ?? ''}
                  width='100%'
                />
              </div>
            </div>
          </section>
        </Card>

        <Card padding={4}>
          <section className={styles.section}>
            <Heading className={styles.sectionTitle} level={2}>
              공개 및 제출 일정
            </Heading>
            <article className={styles.sectionSchedule}>
              <Heading level={3}>{section.code}</Heading>
              <div className={styles.scheduleGrid}>
                {milestone.type === 'PEER_EVALUATION' ? (
                  <>
                    <DisabledDateTimeFields
                      dateLabel='상호 평가 시작일'
                      timeLabel='평가 시작 시간'
                      value={scheduleDraft.evaluationOpensAt}
                    />
                    <DisabledDateTimeFields
                      dateLabel='상호 평가 종료일'
                      timeLabel='평가 종료 시간'
                      value={scheduleDraft.evaluationClosesAt}
                    />
                  </>
                ) : (
                  <>
                    {scheduleDraft.opensAt.date ? (
                      <DisabledDateTimeFields
                        dateLabel='공개 시작일'
                        timeLabel='공개 시작 시간'
                        value={scheduleDraft.opensAt}
                      />
                    ) : null}
                    <DisabledDateTimeFields
                      dateLabel='제출 마감일'
                      timeLabel='제출 마감 시간'
                      value={scheduleDraft.dueAt}
                    />
                  </>
                )}
              </div>
              <Selector
                className={styles.readOnlyControl}
                isDisabled
                label='공개 상태'
                options={[
                  {
                    label: getAdminMilestoneStatusLabel(milestone.status),
                    value: milestone.status,
                  },
                ]}
                renderOption={option => (
                  <SelectorOption label={option.label ?? option.value} />
                )}
                value={milestone.status}
                width={180}
              />
              {milestone.type === 'PRESENTATION' ? (
                <div className={styles.evaluationWindow}>
                  <Text color='secondary' type='supporting'>
                    {milestone.schedule.evaluationOpensAt &&
                    milestone.schedule.evaluationClosesAt
                      ? '발표 평가 기간이 설정되어 있습니다. 발표 순서, 평가 항목과 평가 시작은 제출물 관리의 발표 평가 탭에서 관리합니다.'
                      : '발표 순서와 평가 항목을 확인한 뒤 제출물 관리의 발표 평가 탭에서 평가를 시작할 수 있습니다.'}
                  </Text>
                  <Button
                    label='발표 평가 관리로 이동'
                    onClick={() =>
                      void navigate({
                        search: {
                          milestoneId: 'presentation-evaluate',
                          sectionId: search.sectionId,
                        },
                        to: ROUTES.ADMIN_SUBMISSIONS,
                      })
                    }
                    size='sm'
                    variant='secondary'
                  />
                </div>
              ) : null}
              {milestone.type !== 'PEER_EVALUATION' ? (
                <div className={styles.policyGroup}>
                  <CheckboxList
                    description='현재 마일스톤에 저장된 제출 정책입니다.'
                    isDisabled
                    label='제출 정책'
                    onChange={() => undefined}
                    value={[
                      ...(scheduleDraft.allowSubmissionEditBeforeDueAt
                        ? ['allow-submission-edit-before-due-at']
                        : []),
                      ...(scheduleDraft.allowLateSubmission
                        ? ['allow-late-submission']
                        : []),
                    ]}
                  >
                    <CheckboxListItem
                      description='제출 마감 일시 전까지 이미 제출한 내용을 수정할 수 있습니다.'
                      label='제출 마감 전 수정 허용'
                      value='allow-submission-edit-before-due-at'
                    />
                    <CheckboxListItem
                      description='제출 마감 이후에도 지각 상태로 제출할 수 있습니다.'
                      label='지각 제출 허용'
                      value='allow-late-submission'
                    />
                  </CheckboxList>
                  {scheduleDraft.allowLateSubmission &&
                  scheduleDraft.lateSubmissionUntil.date ? (
                    <DisabledDateTimeFields
                      dateLabel='지각 제출 마감일'
                      timeLabel='지각 제출 마감 시간'
                      value={scheduleDraft.lateSubmissionUntil}
                    />
                  ) : null}
                </div>
              ) : null}
            </article>
          </section>
        </Card>

        {milestone.type === 'PRESENTATION' ? (
          <Card padding={4}>
            <AdminPresentationEvaluationQuestions
              sections={[
                {
                  code: section.code,
                  id: section.id,
                  name: section.name,
                },
              ]}
            />
          </Card>
        ) : null}

        {supportsRequiredArtifacts ? (
          <Card padding={4}>
            <section className={styles.section}>
              <Heading className={styles.sectionTitle} level={2}>
                필수 산출물
              </Heading>
              {requiredArtifactsQuery.isPending ? (
                <Text aria-live='polite' role='status'>
                  필수 산출물을 불러오는 중입니다.
                </Text>
              ) : requiredArtifactsQuery.isError ? (
                <Text color='secondary' type='supporting'>
                  필수 산출물을 불러오지 못했습니다. 수정 화면에서 다시
                  시도해주세요.
                </Text>
              ) : (requiredArtifactsQuery.data?.contents?.length ?? 0) === 0 ? (
                <Text color='secondary' type='supporting'>
                  등록된 필수 산출물이 없습니다.
                </Text>
              ) : (
                <div className={styles.artifactList}>
                  {requiredArtifactsQuery.data?.contents?.map(artifact => (
                    <article className={styles.artifact} key={artifact.id}>
                      <div className={styles.artifactContent}>
                        <Text weight='medium'>
                          {artifact.label ?? '이름 없는 산출물'}
                        </Text>
                        <Text color='secondary' type='supporting'>
                          유형:{' '}
                          {artifact.type
                            ? artifactTypeLabels[artifact.type]
                            : '-'}{' '}
                          · {artifact.required ? '필수 제출' : '선택 제출'}
                        </Text>
                        {artifact.type === 'FILE' ? (
                          <Text color='secondary' type='supporting'>
                            허용 확장자:{' '}
                            {artifact.allowedExtensions?.join(', ') ||
                              '제한 없음'}{' '}
                            ·{' '}
                            {formatRequiredArtifactFileSize(
                              artifact.maxFileSizeMb,
                            )}
                          </Text>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </Card>
        ) : null}

        {studentPreviewTemplateId ? (
          <Card padding={4}>
            <AdminStudentMilestonePreview
              artifacts={requiredArtifactsQuery.data?.contents ?? []}
              artifactState={
                requiredArtifactsQuery.isPending
                  ? 'loading'
                  : requiredArtifactsQuery.isError
                    ? 'error'
                    : undefined
              }
              onRetryArtifacts={() => void requiredArtifactsQuery.refetch()}
              templateId={studentPreviewTemplateId}
            />
          </Card>
        ) : null}

        {milestone.type === 'PEER_EVALUATION' ? (
          <Card padding={4}>
            <AdminPeerEvaluationStudentPreview />
          </Card>
        ) : null}

        <Card className={styles.actionCard} padding={3}>
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
    </div>
  );
}
