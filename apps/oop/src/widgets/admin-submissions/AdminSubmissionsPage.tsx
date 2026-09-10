import {
  AdminMilestoneType,
  AdminPresentationEvaluationTeamDto,
  type AdminSectionMilestoneDto,
} from '@aics/api-client';
import {
  Button,
  Card,
  EmptyState,
  Heading,
  proportional,
  Table,
  Text,
} from '@aics/design-system';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { type KeyboardEvent, useMemo, useRef, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import { AdminMilestoneSubmissionCard } from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionCard';
import {
  AdminMilestoneSubmissionBulkDownloadAction,
  AdminMilestoneSubmissionDetailAction,
} from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionDetailAction';
import {
  isPresentationEvaluationMilestone,
  isPresentationSubmissionMilestone,
  type AdminMilestoneSubmissionView,
  type AdminSubmissionVersionDetailView,
} from '~/features/admin-milestone-review/model';
import {
  useAdminMilestoneSubmissionsQuery,
  useAdminPresentationEvaluationsQuery,
  useAdminSectionMilestonesQuery,
  useAdminSubmissionVersionDetailsQueries,
  useDownloadAdminSubmissionArtifactsMutation,
} from '~/features/admin-milestone-review/queries';
import * as readStateStyles from '~/features/admin-read-state/adminReadState.css';
import { useAdminReadState } from '~/features/admin-read-state/useAdminReadState';
import { useAuthStore } from '~/features/auth/authStore';

import { AdminPresentationEvaluationSettingsDialog } from './AdminPresentationEvaluationSettingsDialog';
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

const milestoneTypeByTab: Partial<Record<MilestoneTabId, AdminMilestoneType>> =
  {
    'final-report': 'FINAL_REPORT',
    midterm: 'MID_REPORT',
    'peer-review': 'PEER_EVALUATION',
    'presentation-submit': 'PRESENTATION',
    proposal: 'PROPOSAL',
  };

const versionDetailMilestoneIds = new Set<MilestoneTabId>([
  'midterm',
  'proposal',
]);

const versionMetadataMilestoneIds = new Set<MilestoneTabId>([
  'final-report',
  'midterm',
  'presentation-submit',
  'proposal',
]);

function isMilestoneTabId(value: string | undefined): value is MilestoneTabId {
  return MILESTONE_TABS.some(tab => tab.id === value);
}

function findMilestoneForTab(
  milestones: readonly AdminSectionMilestoneDto[] | undefined,
  tabId: MilestoneTabId,
) {
  if (tabId === 'presentation-evaluate') {
    return milestones?.find(isPresentationEvaluationMilestone);
  }

  if (tabId === 'presentation-submit') {
    return milestones?.find(isPresentationSubmissionMilestone);
  }

  const type = milestoneTypeByTab[tabId];
  if (!type) return undefined;

  return milestones?.find(milestone => milestone.type === type);
}

function getSubmissionMetadata(
  submission: AdminMilestoneSubmissionView,
  version: AdminSubmissionVersionDetailView | undefined,
) {
  if (!submission.submissionId || !version) return null;

  return (
    <>
      <Text className={styles.submissionMetadataText}>
        {formatSeoulDateTime(version.submittedAt)}
      </Text>
      <Text className={styles.submissionMetadataText}>
        제출자: {version.submittedBy}
      </Text>
    </>
  );
}

function getReviewSummary(submission: AdminMilestoneSubmissionView) {
  return <>{submission.hasPendingReview ? <Text>검토 대기 중</Text> : null}</>;
}

function getProposalSummary(submission: AdminMilestoneSubmissionView) {
  return (
    <>
      <Text>프로젝트 주제: {submission.projectTitle ?? '-'}</Text>
      {getReviewSummary(submission)}
    </>
  );
}

function getDownloadSummary(
  submission: AdminMilestoneSubmissionView,
  version: AdminSubmissionVersionDetailView | undefined,
  isVersionError: boolean,
  isVersionPending: boolean,
) {
  const artifacts = version?.artifacts.filter(
    artifact => artifact.type === 'FILE' || artifact.type === 'LINK',
  );

  return (
    <>
      <Text>
        현재 버전:{' '}
        {submission.currentVersion > 0 ? `${submission.currentVersion}차` : '-'}
      </Text>
      {submission.presentationOrder !== null ? (
        <Text>발표 순서: {submission.presentationOrder}번</Text>
      ) : null}
      {!submission.submissionId ? null : isVersionPending ? (
        <Text>제출 파일을 불러오는 중입니다.</Text>
      ) : isVersionError ? (
        <Text>제출 파일 정보를 불러오지 못했습니다.</Text>
      ) : version ? (
        <>
          {artifacts && artifacts.length > 0 ? (
            <ul className={styles.submissionArtifactList}>
              {artifacts.map((artifact, index) => (
                <li
                  key={`${artifact.type}-${artifact.fileName ?? artifact.url ?? index}`}
                >
                  {artifact.type === 'FILE' &&
                  artifact.downloadUrl &&
                  artifact.fileName ? (
                    <a
                      className={styles.submissionArtifactLink}
                      download={artifact.fileName}
                      href={artifact.downloadUrl}
                    >
                      {artifact.fileName}
                    </a>
                  ) : artifact.type === 'LINK' && artifact.url ? (
                    <a
                      className={styles.submissionArtifactLink}
                      href={artifact.url}
                      rel='noreferrer'
                      target='_blank'
                    >
                      {artifact.url}
                    </a>
                  ) : (
                    (artifact.fileName ?? artifact.url ?? '이름 없는 제출물')
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <Text>제출된 파일이 없습니다.</Text>
          )}
        </>
      ) : null}
    </>
  );
}

export default function AdminSubmissionsPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const navigate = useNavigate();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isEvaluationSettingsOpen, setIsEvaluationSettingsOpen] =
    useState(false);
  const downloadArtifactsMutation =
    useDownloadAdminSubmissionArtifactsMutation();
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
  const selectedMilestoneType = milestoneTypeByTab[activeMilestoneId];
  const shouldLoadSectionMilestones =
    isAccessibleSection &&
    (activeMilestoneId === 'presentation-evaluate' ||
      selectedMilestoneType !== undefined);
  const sectionMilestonesQuery = useAdminSectionMilestonesQuery(
    shouldLoadSectionMilestones ? effectiveSectionId : undefined,
  );
  const selectedMilestone = findMilestoneForTab(
    sectionMilestonesQuery.data?.content,
    activeMilestoneId,
  );
  const submissionsQuery = useAdminMilestoneSubmissionsQuery(
    selectedMilestone ? String(selectedMilestone.id) : undefined,
    isAccessibleSection && selectedMilestone !== undefined,
  );
  const versionMetadataTargets = useMemo(
    () =>
      versionMetadataMilestoneIds.has(activeMilestoneId)
        ? (submissionsQuery.data?.submissions ?? []).flatMap(submission =>
            submission.submissionId && submission.currentVersion > 0
              ? [
                  {
                    submissionId: submission.submissionId,
                    version: submission.currentVersion,
                  },
                ]
              : [],
          )
        : [],
    [activeMilestoneId, submissionsQuery.data?.submissions],
  );
  const versionMetadataQueries = useAdminSubmissionVersionDetailsQueries(
    versionMetadataTargets,
    versionMetadataMilestoneIds.has(activeMilestoneId),
  );
  const versionMetadataQueriesBySubmissionId = new Map(
    versionMetadataTargets.map((target, index) => [
      target.submissionId,
      versionMetadataQueries[index],
    ]),
  );
  const readState = useAdminReadState('submissions', {
    adminId: currentUser?.id,
  });
  const presentationEvaluationsQuery = useAdminPresentationEvaluationsQuery(
    activeMilestoneId === 'presentation-evaluate' && isAccessibleSection
      ? effectiveSectionId
      : undefined,
  );
  const presentationEvaluationMilestone = findMilestoneForTab(
    sectionMilestonesQuery.data?.content,
    'presentation-evaluate',
  );
  const isPresentationMilestoneLoading = sectionMilestonesQuery.isPending;
  const isPresentationMilestoneError = sectionMilestonesQuery.isError;
  const isPresentationMilestoneMissing =
    sectionMilestonesQuery.isSuccess && !presentationEvaluationMilestone;
  const sectionLabel =
    accessibleSections.find(section => section.id === effectiveSectionId)
      ?.code ?? '담당 분반';

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
            !isAccessibleSection ? (
              <EmptyState
                description='담당 분반만 제출물을 조회할 수 있습니다.'
                title='접근할 수 없는 분반입니다.'
              />
            ) : (
              <>
                <div className={styles.evaluationHeader}>
                  <Heading level={2}>발표 평가 목록</Heading>
                  <div className={styles.evaluationActions}>
                    <Button
                      isDisabled={
                        isPresentationMilestoneLoading ||
                        isPresentationMilestoneError ||
                        isPresentationMilestoneMissing
                      }
                      label='순서 배정 및 평가'
                      onClick={() => setIsEvaluationSettingsOpen(true)}
                      tooltip={
                        isPresentationMilestoneLoading
                          ? '발표 평가 마일스톤을 불러오는 중입니다.'
                          : isPresentationMilestoneError
                            ? '발표 평가 마일스톤을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                            : isPresentationMilestoneMissing
                              ? '발표 평가 마일스톤을 먼저 설정해 주세요.'
                              : undefined
                      }
                    />
                    <Button
                      isDisabled
                      label='엑셀 다운로드'
                      tooltip='백엔드 다운로드 API 연동 후 제공 예정입니다.'
                    />
                  </div>
                </div>
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
                  <>
                    <Card>
                      <Table
                        columns={[
                          {
                            align: 'start',
                            header: '팀',
                            key: 'teamName',
                            renderCell: team => {
                              const unread = Boolean(
                                team.submissionId &&
                                !readState.isRead(
                                  effectiveSectionId!,
                                  team.submissionId,
                                ),
                              );
                              const label = team.teamName;
                              return (
                                <span>
                                  {unread ? (
                                    <span
                                      aria-label='읽지 않음'
                                      className={readStateStyles.unreadDot}
                                      role='img'
                                    />
                                  ) : null}
                                  {label}
                                </span>
                              );
                            },
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
                    {effectiveSectionId && presentationEvaluationMilestone ? (
                      <AdminPresentationEvaluationSettingsDialog
                        isOpen={isEvaluationSettingsOpen}
                        milestoneId={String(presentationEvaluationMilestone.id)}
                        sectionId={effectiveSectionId}
                        onClose={() => setIsEvaluationSettingsOpen(false)}
                        teams={presentationEvaluationsQuery.data.teams}
                      />
                    ) : null}
                  </>
                ) : null}
              </>
            )
          ) : activeTab.isListAvailable ? (
            <>
              <div className={styles.evaluationHeader}>
                <Heading level={2}>{activeTab.label} 목록</Heading>
                {activeMilestoneId === 'peer-review' ? (
                  <Button
                    isDisabled
                    label='엑셀 다운로드'
                    tooltip='백엔드 다운로드 API 연동 후 제공 예정입니다.'
                  />
                ) : null}
              </div>
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
              ) : sectionMilestonesQuery.isPending ? (
                <Text aria-live='polite' role='status'>
                  마일스톤 정보를 불러오는 중입니다.
                </Text>
              ) : sectionMilestonesQuery.isError ? (
                <EmptyState
                  description='잠시 후 다시 시도해 주세요.'
                  title='마일스톤 정보를 불러오지 못했습니다.'
                />
              ) : !selectedMilestone ? (
                <EmptyState
                  description={`분반에 ${activeTab.label} 마일스톤을 먼저 설정해 주세요.`}
                  title='표시할 제출물이 없습니다.'
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
                  description='이 마일스톤의 팀별 제출 정보가 없습니다.'
                  title='표시할 제출물이 없습니다.'
                />
              ) : (
                <div className={styles.list}>
                  {submissionsQuery.data?.submissions.map(submission => {
                    const submissionSectionId = effectiveSectionId;
                    const submissionId = submission.submissionId;
                    const isVersionDetailAvailable =
                      versionDetailMilestoneIds.has(activeMilestoneId);
                    const versionMetadataQuery =
                      versionMetadataQueriesBySubmissionId.get(
                        submission.submissionId ?? '',
                      );
                    return (
                      <AdminMilestoneSubmissionCard
                        isUnread={Boolean(
                          submissionSectionId &&
                          submission.submissionId &&
                          !readState.isRead(
                            submissionSectionId,
                            submission.submissionId,
                          ),
                        )}
                        action={
                          activeMilestoneId === 'final-report' ||
                          activeMilestoneId === 'presentation-submit' ? (
                            <AdminMilestoneSubmissionBulkDownloadAction
                              isLoading={downloadArtifactsMutation.isPending}
                              onClick={
                                submissionId
                                  ? () => {
                                      downloadArtifactsMutation.mutate(
                                        submissionId,
                                      );
                                    }
                                  : undefined
                              }
                            />
                          ) : (
                            <AdminMilestoneSubmissionDetailAction
                              milestoneId={activeTab.id}
                              sectionId={effectiveSectionId}
                              submissionId={submissionId}
                              unavailableReason={
                                isVersionDetailAvailable
                                  ? undefined
                                  : '이 마일스톤의 전용 상세 조회 API 확인 후 제공 예정입니다.'
                              }
                            />
                          )
                        }
                        key={submission.teamId}
                        label={submission.teamName}
                        secondaryLabel={submission.statusLabel}
                        submissionMetadata={getSubmissionMetadata(
                          submission,
                          versionMetadataQuery?.data,
                        )}
                        summary={
                          activeMilestoneId === 'proposal'
                            ? getProposalSummary(submission)
                            : activeMilestoneId === 'final-report' ||
                                activeMilestoneId === 'presentation-submit'
                              ? getDownloadSummary(
                                  submission,
                                  versionMetadataQuery?.data,
                                  Boolean(versionMetadataQuery?.isError),
                                  Boolean(versionMetadataQuery?.isPending),
                                )
                              : getReviewSummary(submission)
                        }
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
