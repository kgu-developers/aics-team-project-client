import type { AdminPresentationEvaluationTeamDto } from '@aics/api-client';
import {
  Card,
  EmptyState,
  Heading,
  proportional,
  Table,
  Text,
} from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { type KeyboardEvent, useRef } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';

import { AdminFinalReportDownloadSummary } from '~/features/admin-milestone-review/components/AdminFinalReportDownloadSummary';
import { AdminMilestoneSubmissionCard } from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionCard';
import { AdminMilestoneSubmissionDetailAction } from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionDetailAction';
import type { AdminMilestoneSubmissionView } from '~/features/admin-milestone-review/model';
import {
  useAdminMilestoneSubmissionsQuery,
  useAdminPresentationEvaluationsQuery,
} from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminSubmissionsPage.css';

const MILESTONE_TABS = [
  { id: 'proposal', isListAvailable: true, label: '제안서' },
  { id: 'midterm', isListAvailable: true, label: '중간 점검' },
  {
    id: 'presentation-submit',
    isListAvailable: true,
    label: '발표 자료 제출',
  },
  {
    id: 'presentation-evaluate',
    isListAvailable: true,
    label: '발표 평가',
  },
  { id: 'final-report', isListAvailable: true, label: '최종 보고서' },
  { id: 'peer-review', isListAvailable: true, label: '상호 평가' },
] as const;

type MilestoneTabId = (typeof MILESTONE_TABS)[number]['id'];

function isMilestoneTabId(value: string | undefined): value is MilestoneTabId {
  return MILESTONE_TABS.some(tab => tab.id === value);
}

function getSubmissionSummary(
  milestoneId: MilestoneTabId,
  submission: AdminMilestoneSubmissionView,
) {
  switch (milestoneId) {
    case 'midterm':
      return (
        <>
          <Text>
            {submission.summary.attachmentCountLabel ?? '첨부 파일 수: -'}
          </Text>
          <Text>{submission.summary.feedbackCountLabel ?? '피드백: -'}</Text>
        </>
      );
    case 'presentation-submit':
      return (
        <>
          <Text>
            PPT 파일: {submission.summary.presentationFileName ?? '-'}
          </Text>
          <Text>
            시연 파일(zip): {submission.summary.sourceArchiveFileName ?? '-'}
          </Text>
          <Text>링크: {submission.summary.linkLabel ?? '-'}</Text>
        </>
      );
    case 'final-report':
      return (
        <AdminFinalReportDownloadSummary
          files={[
            {
              downloadUrl: submission.summary.reportDownloadUrl,
              downloadLabel: 'PDF 다운로드',
              fileName: submission.summary.reportFileName,
              label: '보고서(pdf)',
            },
            {
              downloadUrl: submission.summary.sourceArchiveDownloadUrl,
              downloadLabel: 'ZIP 다운로드',
              fileName: submission.summary.sourceArchiveFileName,
              label: '전체 파일(zip)',
            },
          ]}
        />
      );
    case 'peer-review':
      return (
        <Text>
          제출자 수:{' '}
          {submission.summary.submittedMemberCountLabel?.replace(
            '제출자 수: ',
            '',
          ) ?? '-'}{' '}
          / {submission.summary.memberCount ?? '-'}
        </Text>
      );
    default:
      return (
        <>
          <Text className={styles.topic}>
            주제: {submission.summary.projectTopic ?? '-'}
          </Text>
          <Text>팀장: {submission.summary.leaderName ?? '-'}</Text>
        </>
      );
  }
}

export default function AdminSubmissionsPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const search = useSearch({ from: '/admin/submissions' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const { milestoneId, sectionId } = search;
  const activeMilestoneId = isMilestoneTabId(milestoneId)
    ? milestoneId
    : 'proposal';
  const activeTab = MILESTONE_TABS.find(tab => tab.id === activeMilestoneId);
  const accessibleSections = currentUser?.sections ?? [];
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const effectiveSectionId = sectionId ?? accessibleSectionIds[0];
  const isAccessibleSection = Boolean(
    effectiveSectionId && accessibleSectionIds.includes(effectiveSectionId),
  );
  const submissionsQuery = useAdminMilestoneSubmissionsQuery(
    effectiveSectionId,
    activeMilestoneId,
    isAccessibleSection &&
      activeMilestoneId !== 'presentation-evaluate' &&
      activeTab?.isListAvailable === true,
  );
  const presentationEvaluationsQuery = useAdminPresentationEvaluationsQuery(
    activeMilestoneId === 'presentation-evaluate' && isAccessibleSection
      ? effectiveSectionId
      : undefined,
  );
  const sectionLabel =
    submissionsQuery.data?.sectionLabel ??
    accessibleSections.find(section => section.id === effectiveSectionId)
      ?.code ??
    '담당 분반';

  if (!activeTab) return null;

  function selectTab(index: number) {
    const tab = MILESTONE_TABS[index];
    if (!tab) return;

    navigate({
      search: { milestoneId: tab.id, sectionId: effectiveSectionId },
      to: ROUTES.ADMIN_SUBMISSIONS,
    });
    tabRefs.current[index]?.focus();
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % MILESTONE_TABS.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + MILESTONE_TABS.length) % MILESTONE_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = MILESTONE_TABS.length - 1;
    }

    if (nextIndex === null) return;

    event.preventDefault();
    selectTab(nextIndex);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Heading level={1}>분반별 제출물</Heading>
          <Text className={styles.description}>
            {sectionLabel} · {activeTab.label}
          </Text>
        </div>
      </div>

      <section className={styles.listSection}>
        <div aria-label='마일스톤 선택' className={styles.tabs} role='tablist'>
          {MILESTONE_TABS.map((tab, index) => {
            const isActive = tab.id === activeTab.id;

            return (
              <button
                aria-controls={`submission-panel-${tab.id}`}
                aria-selected={isActive}
                className={cx(styles.tab, isActive ? styles.tabActive : '')}
                id={`submission-tab-${tab.id}`}
                key={tab.id}
                onClick={() => selectTab(index)}
                onKeyDown={event => handleTabKeyDown(event, index)}
                ref={element => {
                  tabRefs.current[index] = element;
                }}
                role='tab'
                tabIndex={isActive ? 0 : -1}
                type='button'
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          aria-labelledby={`submission-tab-${activeTab.id}`}
          className={styles.tabPanel}
          id={`submission-panel-${activeTab.id}`}
          role='tabpanel'
        >
          {activeMilestoneId === 'presentation-evaluate' ? (
            <>
              <Heading level={2}>발표 평가 목록</Heading>
              {presentationEvaluationsQuery.isPending ? (
                <Text aria-live='polite' role='status'>
                  발표 평가 목록을 불러오는 중입니다.
                </Text>
              ) : presentationEvaluationsQuery.isError ? (
                <EmptyState
                  description='잠시 후 다시 시도해 주세요.'
                  title='발표 평가 목록을 불러오지 못했습니다.'
                />
              ) : presentationEvaluationsQuery.data ? (
                <Card>
                  <Table
                    columns={[
                      {
                        align: 'start',
                        header: '팀',
                        key: 'teamName',
                        renderCell: team => (
                          <Link
                            params={{ submissionId: team.submissionId }}
                            search={{
                              milestoneId: 'presentation-evaluate',
                              sectionId: effectiveSectionId,
                            }}
                            to={ROUTES.ADMIN_SUBMISSION_DETAIL}
                          >
                            {team.teamName}
                          </Link>
                        ),
                        width: proportional(1, { minWidth: 128 }),
                      },
                      {
                        align: 'start',
                        header: '주제',
                        key: 'projectTopic',
                        renderCell: team => team.projectTopic ?? '-',
                        width: proportional(2, { minWidth: 200 }),
                      },
                      ...presentationEvaluationsQuery.data.criteria.map(
                        criterion => ({
                          align: 'center' as const,
                          header: criterion.label,
                          key: criterion.id,
                          renderCell: (
                            team: AdminPresentationEvaluationTeamDto,
                          ) => team.criteria[criterion.id] ?? '-',
                          width: proportional(1, { minWidth: 116 }),
                        }),
                      ),
                      {
                        align: 'center',
                        header: '합계',
                        key: 'total',
                        renderCell: team => {
                          const scores =
                            presentationEvaluationsQuery.data.criteria.map(
                              criterion => team.criteria[criterion.id],
                            );
                          const submittedScores = scores.filter(
                            (score): score is number => score !== null,
                          );
                          return submittedScores.length === scores.length
                            ? submittedScores.reduce(
                                (sum, score) => sum + score,
                                0,
                              )
                            : '-';
                        },
                        width: proportional(0.7, { minWidth: 72 }),
                      },
                    ]}
                    data={presentationEvaluationsQuery.data.teams}
                    dividers='rows'
                    textOverflow='wrap'
                    verticalAlign='middle'
                  />
                </Card>
              ) : null}
            </>
          ) : activeTab.isListAvailable ? (
            <>
              <Heading level={2}>{activeTab.label} 목록</Heading>
              {accessibleSectionIds.length === 0 ? (
                <EmptyState
                  description='담당 분반이 없어 제출물을 조회할 수 없습니다.'
                  title='표시할 제출물이 없습니다.'
                />
              ) : !isAccessibleSection ? (
                <EmptyState
                  description='담당 분반만 제출물을 조회할 수 있습니다.'
                  title='접근할 수 없는 분반입니다.'
                />
              ) : submissionsQuery.isPending ? (
                <Text aria-live='polite' role='status'>
                  제출물 목록을 불러오는 중입니다.
                </Text>
              ) : submissionsQuery.isError ? (
                <EmptyState
                  description='잠시 후 다시 시도해 주세요.'
                  title='제출물 목록을 불러오지 못했습니다.'
                />
              ) : submissionsQuery.data?.submissions.length === 0 ? (
                <EmptyState
                  description='이 마일스톤에 제출한 팀이 없습니다.'
                  title='표시할 제출물이 없습니다.'
                />
              ) : (
                <div className={styles.list}>
                  {submissionsQuery.data?.submissions.map(submission => {
                    const detailSubmissionId =
                      submission.submittedAt !== null
                        ? submission.submissionId
                        : null;
                    return (
                      <AdminMilestoneSubmissionCard
                        action={
                          activeMilestoneId === 'final-report' ? null : (
                            <AdminMilestoneSubmissionDetailAction
                              milestoneId={activeTab.id}
                              sectionId={effectiveSectionId}
                              submissionId={detailSubmissionId}
                            />
                          )
                        }
                        key={submission.id}
                        label={submission.teamName}
                        meetingCountLabel={submission.meetingCountLabel}
                        messageCountLabel={submission.messageCountLabel}
                        secondaryLabel={submission.submittedAtLabel}
                        summary={getSubmissionSummary(activeTab.id, submission)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              description={`${activeTab.label} 결과를 확인하는 화면은 후속 작업에서 연결합니다.`}
              title={`${activeTab.label} 목록을 준비하고 있습니다.`}
            />
          )}
        </div>
      </section>
    </div>
  );
}
