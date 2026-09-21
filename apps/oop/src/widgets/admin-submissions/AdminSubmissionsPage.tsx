import {
  AdminMilestoneType,
  type AdminSectionMilestoneDto,
} from '@aics/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  proportional,
  Selector,
  SelectorOption,
  Table,
  type TableProps,
  Text,
} from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';
import { paginate } from '~/shared/lib/pagination';
import ListPagination from '~/shared/ui/ListPagination/ListPagination';

import {
  useAdminPeerEvaluationsQuery,
  useAdminPresentationEvaluationsQuery,
} from '~/features/admin-evaluation/queries';
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
  useAdminSectionMilestonesQuery,
  useAdminSubmissionVersionDetailsQueries,
  useDownloadAdminSubmissionArtifactsMutation,
} from '~/features/admin-milestone-review/queries';
import { useAdminSectionTeamsQuery } from '~/features/admin-student-team/queries';
import { useAdminSubmissionReadState } from '~/features/admin-submission-read/useAdminSubmissionReadState';
import { useAuthStore } from '~/features/auth/authStore';

import { AdminPresentationEvaluationSettingsDialog } from './AdminPresentationEvaluationSettingsDialog';
import { getPresentationEvaluationSetupStatus } from './adminPresentationOrder';
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

type PresentationEvaluationTeam = NonNullable<
  ReturnType<typeof useAdminPresentationEvaluationsQuery>['data']
>['teams'][number];

type PeerEvaluationTeam = NonNullable<
  ReturnType<typeof useAdminPeerEvaluationsQuery>['data']
>['teams'][number];

type PresentationEvaluationTablePlugin = NonNullable<
  TableProps<PresentationEvaluationTeam>['plugins']
>[string];

type PeerEvaluationTablePlugin = NonNullable<
  TableProps<PeerEvaluationTeam>['plugins']
>[string];

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
              {artifacts.map(artifact => (
                <li key={artifact.identityKey}>
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
  const submissionReadState = useAdminSubmissionReadState(currentUser?.id);
  const navigate = useNavigate();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isEvaluationSettingsOpen, setIsEvaluationSettingsOpen] =
    useState(false);
  const [presentationReadinessClock, setPresentationReadinessClock] = useState(
    () => Date.now(),
  );
  const downloadArtifactsMutation =
    useDownloadAdminSubmissionArtifactsMutation();
  const search = useSearch({ from: '/admin/submissions' }) as {
    milestoneId?: string;
    sectionId?: string | number;
  };
  const { milestoneId } = search;
  const sectionId =
    search.sectionId === undefined ? undefined : String(search.sectionId);
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
    undefined,
    activeMilestoneId === 'proposal',
  );
  const [submissionPage, setSubmissionPage] = useState(0);
  const submissionListKey = `${effectiveSectionId ?? ''}:${activeMilestoneId}`;
  const [pagedListKey, setPagedListKey] = useState(submissionListKey);
  if (pagedListKey !== submissionListKey) {
    // Reset paging when the tab or section changes (render-time state sync).
    setPagedListKey(submissionListKey);
    setSubmissionPage(0);
  }
  const pagedSubmissions = paginate(
    submissionsQuery.data?.submissions ?? [],
    submissionPage,
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
  const presentationEvaluationMilestone = findMilestoneForTab(
    sectionMilestonesQuery.data?.content,
    'presentation-evaluate',
  );
  const presentationSubmissionMilestone = findMilestoneForTab(
    sectionMilestonesQuery.data?.content,
    'presentation-submit',
  );
  const presentationEvaluationsQuery = useAdminPresentationEvaluationsQuery(
    activeMilestoneId === 'presentation-evaluate' && isAccessibleSection
      ? effectiveSectionId
      : undefined,
    presentationEvaluationMilestone
      ? { milestoneId: presentationEvaluationMilestone.id }
      : {},
  );
  const presentationTeamsQuery = useAdminSectionTeamsQuery(
    activeMilestoneId === 'presentation-evaluate' && isAccessibleSection
      ? effectiveSectionId
      : undefined,
  );
  // Existing orders belong to milestone submissions, but every section team must
  // be selectable before a team creates its presentation submission.
  const presentationOrdersQuery = useAdminMilestoneSubmissionsQuery(
    presentationEvaluationMilestone
      ? String(presentationEvaluationMilestone.id)
      : undefined,
    activeMilestoneId === 'presentation-evaluate' && isAccessibleSection,
  );
  const peerEvaluationsQuery = useAdminPeerEvaluationsQuery(
    activeMilestoneId === 'peer-review' && isAccessibleSection
      ? effectiveSectionId
      : undefined,
  );
  const presentationOrderTeams = useMemo(() => {
    const ordersByTeamId = new Map(
      (presentationOrdersQuery.data?.submissions ?? []).map(team => [
        Number(team.teamId),
        team.presentationOrder,
      ]),
    );

    return (presentationTeamsQuery.data?.contents ?? []).map(team => ({
      presentationOrder: ordersByTeamId.get(team.id) ?? null,
      teamId: team.id,
      teamName: team.name,
    }));
  }, [
    presentationOrdersQuery.data?.submissions,
    presentationTeamsQuery.data?.contents,
  ]);
  const presentationSetupStatus =
    presentationEvaluationMilestone &&
    presentationEvaluationsQuery.data &&
    presentationTeamsQuery.data &&
    presentationOrdersQuery.data
      ? getPresentationEvaluationSetupStatus({
          criteriaCount: presentationEvaluationsQuery.data.criteria.length,
          evaluationStartsAt:
            presentationEvaluationMilestone.schedule.evaluationOpensAt,
          now: presentationReadinessClock,
          teams: presentationOrderTeams,
        })
      : null;

  useEffect(() => {
    if (activeMilestoneId !== 'presentation-evaluate') return;
    const timer = window.setInterval(
      () => setPresentationReadinessClock(Date.now()),
      60_000,
    );
    return () => window.clearInterval(timer);
  }, [activeMilestoneId]);
  const isPresentationMilestoneLoading = sectionMilestonesQuery.isPending;
  const isPresentationMilestoneError = sectionMilestonesQuery.isError;
  const isPresentationMilestoneMissing =
    sectionMilestonesQuery.isSuccess && !presentationEvaluationMilestone;
  const sectionOptions = accessibleSections.map(section => ({
    label: `${section.code} · ${section.name}`,
    value: section.id,
  }));
  const presentationEvaluationTeams =
    presentationEvaluationsQuery.data?.teams ?? [];
  const presentationEvaluationRowPlugin =
    useMemo<PresentationEvaluationTablePlugin>(
      () => ({
        transformBodyRow: (rowRenderProps, team) => {
          const openEvaluation = () =>
            void navigate({
              params: {
                evaluationType: 'presentation',
                teamId: String(team.teamId),
              },
              search: {
                milestoneId: presentationEvaluationsQuery.data?.milestoneId,
                sectionId: effectiveSectionId,
              },
              to: ROUTES.ADMIN_EVALUATION_DETAIL,
            });
          const onClick = rowRenderProps.htmlProps.onClick;
          const onKeyDown = rowRenderProps.htmlProps.onKeyDown;

          return {
            ...rowRenderProps,
            htmlProps: {
              ...rowRenderProps.htmlProps,
              'aria-label': `${team.teamName} 발표 평가 보기`,
              className: cx(
                rowRenderProps.htmlProps.className,
                styles.clickableRow,
              ),
              style: {
                ...rowRenderProps.htmlProps.style,
                cursor: 'pointer',
              },
              onClick: event => {
                onClick?.(event);
                if (!event.defaultPrevented) openEvaluation();
              },
              onKeyDown: event => {
                onKeyDown?.(event);
                if (
                  event.defaultPrevented ||
                  (event.key !== 'Enter' && event.key !== ' ')
                )
                  return;
                event.preventDefault();
                openEvaluation();
              },
              tabIndex: 0,
            },
          };
        },
      }),
      [
        effectiveSectionId,
        navigate,
        presentationEvaluationsQuery.data?.milestoneId,
      ],
    );
  const peerEvaluationRowPlugin = useMemo<PeerEvaluationTablePlugin>(
    () => ({
      transformBodyRow: (rowRenderProps, team) => {
        const openEvaluation = () =>
          void navigate({
            params: {
              evaluationType: 'peer',
              teamId: String(team.teamId),
            },
            search: {
              formId: peerEvaluationsQuery.data?.formId ?? undefined,
              sectionId: effectiveSectionId,
            },
            to: ROUTES.ADMIN_EVALUATION_DETAIL,
          });
        const onClick = rowRenderProps.htmlProps.onClick;
        const onKeyDown = rowRenderProps.htmlProps.onKeyDown;

        return {
          ...rowRenderProps,
          htmlProps: {
            ...rowRenderProps.htmlProps,
            'aria-label': `${team.teamName} 상호평가 보기`,
            className: cx(
              rowRenderProps.htmlProps.className,
              styles.clickableRow,
            ),
            style: {
              ...rowRenderProps.htmlProps.style,
              cursor: 'pointer',
            },
            onClick: event => {
              onClick?.(event);
              if (!event.defaultPrevented) openEvaluation();
            },
            onKeyDown: event => {
              onKeyDown?.(event);
              if (
                event.defaultPrevented ||
                (event.key !== 'Enter' && event.key !== ' ')
              )
                return;
              event.preventDefault();
              openEvaluation();
            },
            tabIndex: 0,
          },
        };
      },
    }),
    [effectiveSectionId, navigate, peerEvaluationsQuery.data?.formId],
  );

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

  function selectSection(nextSectionId: string) {
    navigate({
      search: { milestoneId: activeMilestoneId, sectionId: nextSectionId },
      to: ROUTES.ADMIN_SUBMISSIONS,
    });
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
          {accessibleSections.length > 0 ? (
            <Selector
              aria-label='조회할 분반'
              label='분반 선택'
              onChange={selectSection}
              options={sectionOptions}
              renderOption={option => (
                <SelectorOption label={option.label ?? option.value} />
              )}
              value={effectiveSectionId}
              width={280}
            />
          ) : null}
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
                  <div className={styles.evaluationTitle}>
                    <Heading level={2}>발표 평가 목록</Heading>
                    {presentationSetupStatus ? (
                      <Badge
                        label={
                          presentationSetupStatus.isComplete
                            ? '설정 완료'
                            : '설정 필요'
                        }
                        variant={
                          presentationSetupStatus.isComplete
                            ? 'success'
                            : 'neutral'
                        }
                      />
                    ) : null}
                  </div>
                  <div className={styles.evaluationActions}>
                    <Button
                      isDisabled={
                        isPresentationMilestoneLoading ||
                        isPresentationMilestoneError ||
                        isPresentationMilestoneMissing ||
                        presentationEvaluationsQuery.isPending ||
                        presentationEvaluationsQuery.isError ||
                        !presentationEvaluationsQuery.data ||
                        presentationTeamsQuery.isPending ||
                        presentationTeamsQuery.isError ||
                        !presentationTeamsQuery.data ||
                        presentationOrdersQuery.isPending ||
                        presentationOrdersQuery.isError ||
                        !presentationOrdersQuery.data
                      }
                      label='발표 순서·평가 항목 설정'
                      onClick={() => setIsEvaluationSettingsOpen(true)}
                      tooltip={
                        isPresentationMilestoneLoading
                          ? '발표 평가 마일스톤을 불러오는 중입니다.'
                          : isPresentationMilestoneError
                            ? '발표 평가 마일스톤을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                            : isPresentationMilestoneMissing
                              ? '발표 마일스톤에 발표 평가 기간을 먼저 설정해 주세요.'
                              : presentationEvaluationsQuery.isPending
                                ? '발표 평가 결과를 불러오는 중입니다.'
                                : presentationEvaluationsQuery.isError
                                  ? '발표 평가 결과를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                                  : presentationTeamsQuery.isPending
                                    ? '분반 팀을 불러오는 중입니다.'
                                    : presentationTeamsQuery.isError
                                      ? '분반 팀을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                                      : presentationOrdersQuery.isPending
                                        ? '발표 순서를 불러오는 중입니다.'
                                        : presentationOrdersQuery.isError
                                          ? '발표 순서를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
                                          : undefined
                      }
                    />
                  </div>
                </div>
                {presentationSetupStatus &&
                !presentationSetupStatus.isComplete ? (
                  <div
                    className={cx(
                      styles.setupWarning,
                      presentationSetupStatus.urgency !== 'upcoming'
                        ? styles.setupWarningUrgent
                        : '',
                    )}
                    role='alert'
                  >
                    <Text>
                      {presentationSetupStatus.urgency === 'started'
                        ? '발표 평가가 시작되었지만 설정이 완료되지 않았습니다.'
                        : presentationSetupStatus.urgency === 'imminent'
                          ? '발표 평가 시작이 24시간 이내입니다. 지금 설정을 완료해 주세요.'
                          : '발표 평가 설정이 완료되지 않았습니다. 평가 시작 전에 확인해 주세요.'}
                    </Text>
                    <div className={styles.setupWarningList}>
                      {presentationSetupStatus.issues.map(issue => (
                        <Text key={issue}>{issue}</Text>
                      ))}
                    </div>
                  </div>
                ) : null}
                {isPresentationMilestoneMissing ? (
                  <EmptyState
                    actions={
                      presentationSubmissionMilestone && effectiveSectionId ? (
                        <Button
                          label='발표 마일스톤에서 평가 기간 설정'
                          onClick={() =>
                            void navigate({
                              params: {
                                milestoneId: String(
                                  presentationSubmissionMilestone.id,
                                ),
                              },
                              search: { sectionId: effectiveSectionId },
                              to: ROUTES.ADMIN_MILESTONE_DETAIL,
                            })
                          }
                          variant='secondary'
                        />
                      ) : (
                        <Button
                          label='발표 마일스톤 추가'
                          onClick={() =>
                            void navigate({
                              search: {
                                milestoneId: 'presentation-submit',
                                sectionId: effectiveSectionId,
                              },
                              to: ROUTES.ADMIN_MILESTONE_NEW,
                            })
                          }
                          variant='secondary'
                        />
                      )
                    }
                    description={
                      presentationSubmissionMilestone
                        ? '발표 평가는 별도 마일스톤이 아니라 발표 마일스톤의 평가 기간으로 동작합니다. 발표 마일스톤 상세에서 발표 평가 기간을 설정해 주세요.'
                        : '발표 마일스톤을 만들고 발표 평가 기간까지 설정하면 이 탭이 열립니다.'
                    }
                    title='발표 평가 기간이 설정되지 않았습니다.'
                  />
                ) : presentationEvaluationsQuery.isPending ? (
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
                    {presentationEvaluationsQuery.data.criteria.length < 2 ? (
                      <Card className={styles.criteriaNotice} variant='muted'>
                        <Text role='status'>
                          {presentationEvaluationsQuery.data.criteria.length ===
                          0
                            ? '이 분반에는 발표 평가 항목이 없습니다. 학생 발표 평가 화면에 평가할 항목이 나타나지 않으니, 평가 시작 전에 항목을 등록해 주세요.'
                            : '이 분반의 발표 평가 항목이 1개뿐입니다. 학생에게는 이 항목만 보이니, 의도한 구성인지 확인해 주세요.'}{' '}
                          평가 항목은 분반별로 관리자가 등록하며, 위 '발표
                          순서·평가 항목 설정'에서 추가할 수 있습니다.
                        </Text>
                      </Card>
                    ) : null}
                    <Card>
                      <Table
                        className={styles.clickableTable}
                        columns={[
                          {
                            align: 'start',
                            header: '팀',
                            key: 'teamName',
                            width: proportional(1, { minWidth: 128 }),
                          },
                          {
                            align: 'start',
                            header: '주제',
                            key: 'projectTitle',
                            renderCell: team => team.projectTitle ?? '-',
                            width: proportional(2, { minWidth: 200 }),
                          },
                          ...presentationEvaluationsQuery.data.criteria.map(
                            criterion => ({
                              align: 'center' as const,
                              header: `${criterion.title} (${criterion.maxScore})`,
                              key: String(criterion.criterionId),
                              renderCell: (
                                team: (typeof presentationEvaluationsQuery.data.teams)[number],
                              ) =>
                                team.scores.find(
                                  (score: (typeof team.scores)[number]) =>
                                    score.criterionId === criterion.criterionId,
                                )?.score ?? '-',
                              width: proportional(1, { minWidth: 116 }),
                            }),
                          ),
                          {
                            align: 'center',
                            header: '합계',
                            key: 'total',
                            renderCell: team => team.totalScore ?? '-',
                            width: proportional(0.7, { minWidth: 72 }),
                          },
                          {
                            align: 'center',
                            header: '평가 수',
                            key: 'evaluationCount',
                            renderCell: team => `${team.evaluationCount}건`,
                            width: proportional(0.7, { minWidth: 72 }),
                          },
                        ]}
                        data={presentationEvaluationTeams}
                        dividers='rows'
                        hasHover
                        idKey='teamId'
                        plugins={{
                          rowInteraction: presentationEvaluationRowPlugin,
                        }}
                        textOverflow='wrap'
                        verticalAlign='middle'
                      />
                    </Card>
                    {effectiveSectionId && presentationEvaluationMilestone ? (
                      <AdminPresentationEvaluationSettingsDialog
                        evaluationStartsAt={
                          presentationEvaluationMilestone.schedule
                            .evaluationOpensAt ?? null
                        }
                        isOpen={isEvaluationSettingsOpen}
                        milestoneId={String(presentationEvaluationMilestone.id)}
                        sectionId={effectiveSectionId}
                        onClose={() => setIsEvaluationSettingsOpen(false)}
                        teams={presentationOrderTeams}
                      />
                    ) : null}
                  </>
                ) : null}
              </>
            )
          ) : activeMilestoneId === 'peer-review' ? (
            !isAccessibleSection ? (
              <EmptyState
                description='담당 분반만 상호평가 결과를 조회할 수 있습니다.'
                title='접근할 수 없는 분반입니다.'
              />
            ) : peerEvaluationsQuery.isPending ? (
              <Text aria-live='polite' role='status'>
                상호평가 결과를 불러오는 중입니다.
              </Text>
            ) : peerEvaluationsQuery.isError ? (
              <EmptyState
                description='잠시 후 다시 시도해 주세요.'
                title='상호평가 결과를 불러오지 못했습니다.'
              />
            ) : peerEvaluationsQuery.data ? (
              <>
                <div className={styles.evaluationHeader}>
                  <div>
                    <Heading level={2}>상호평가 목록</Heading>
                    <Text>
                      {peerEvaluationsQuery.data.formId
                        ? `마감 ${peerEvaluationsQuery.data.closesAt ? formatSeoulDateTime(peerEvaluationsQuery.data.closesAt) : '-'}`
                        : '설정된 상호평가 양식이 없습니다.'}
                    </Text>
                  </div>
                </div>
                {peerEvaluationsQuery.data.teams.length === 0 ? (
                  <EmptyState
                    description='상호평가 양식 또는 팀 구성을 확인해 주세요.'
                    title='표시할 상호평가 결과가 없습니다.'
                  />
                ) : (
                  <Card>
                    <Table
                      className={styles.clickableTable}
                      columns={[
                        {
                          align: 'start',
                          header: '팀',
                          key: 'teamName',
                          width: proportional(1.3, { minWidth: 160 }),
                        },
                        {
                          align: 'center',
                          header: '제출 현황',
                          key: 'submitted',
                          renderCell: team =>
                            `${team.submittedCount}/${team.totalMemberCount}`,
                          width: proportional(0.9, { minWidth: 112 }),
                        },
                        {
                          align: 'center',
                          header: '최근 제출',
                          key: 'lastSubmittedAt',
                          renderCell: team =>
                            team.lastSubmittedAt
                              ? formatSeoulDateTime(team.lastSubmittedAt)
                              : '-',
                          width: proportional(1.3, { minWidth: 148 }),
                        },
                        {
                          align: 'center',
                          header: '회의록',
                          key: 'meetingRecordCount',
                          renderCell: team => `${team.meetingRecordCount}건`,
                          width: proportional(0.7, { minWidth: 84 }),
                        },
                      ]}
                      data={peerEvaluationsQuery.data.teams}
                      dividers='rows'
                      hasHover
                      idKey='teamId'
                      plugins={{ rowInteraction: peerEvaluationRowPlugin }}
                      verticalAlign='middle'
                    />
                  </Card>
                )}
              </>
            ) : null
          ) : activeTab.isListAvailable ? (
            <>
              <div className={styles.evaluationHeader}>
                <Heading level={2}>{activeTab.label} 목록</Heading>
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
                <>
                  <div className={styles.list}>
                    {pagedSubmissions.items.map(submission => {
                      const submissionId = submission.submissionId;
                      const readTarget = effectiveSectionId
                        ? {
                            milestoneId: selectedMilestone.id,
                            sectionId: effectiveSectionId,
                            submissionId,
                            version: submission.currentVersion,
                          }
                        : null;
                      const isVersionDetailAvailable =
                        versionDetailMilestoneIds.has(activeMilestoneId);
                      const versionMetadataQuery =
                        versionMetadataQueriesBySubmissionId.get(
                          submission.submissionId ?? '',
                        );
                      return (
                        <AdminMilestoneSubmissionCard
                          meetingCountLabel={
                            <Link
                              to={ROUTES.ADMIN_MEETINGS}
                              search={{
                                sectionId: effectiveSectionId,
                                teamId: String(submission.teamId),
                              }}
                            >
                              회의록 {submission.meetingRecordCount}건
                            </Link>
                          }
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
                                          {
                                            onSuccess: () => {
                                              if (readTarget)
                                                submissionReadState.markAsRead(
                                                  readTarget,
                                                );
                                            },
                                          },
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
                                teamId={submission.teamId}
                                onOpen={
                                  readTarget
                                    ? () =>
                                        submissionReadState.markAsRead(
                                          readTarget,
                                        )
                                    : undefined
                                }
                                unavailableReason={
                                  isVersionDetailAvailable
                                    ? undefined
                                    : '이 마일스톤의 전용 상세 조회 API 확인 후 제공 예정입니다.'
                                }
                              />
                            )
                          }
                          key={submission.teamId}
                          isUnread={
                            readTarget !== null &&
                            !submissionReadState.isRead(readTarget)
                          }
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
                  <ListPagination
                    label='제출물 페이지 이동'
                    onPageChange={setSubmissionPage}
                    page={pagedSubmissions.page}
                    pageCount={pagedSubmissions.pageCount}
                  />
                </>
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
