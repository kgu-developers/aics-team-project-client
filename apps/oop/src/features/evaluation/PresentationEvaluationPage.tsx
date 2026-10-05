import type {
  MilestonePresentation,
  MyTeamEvaluationsResponse,
  TeamEvaluationCriterionDto,
  TeamEvaluationDto,
} from '@aics/core';
import {
  BottomSheet,
  Button,
  Card,
  Dialog,
  Divider,
  EmptyState,
  Heading,
  HStack,
  RadioList,
  RadioListItem,
  StatusDot,
  Text,
  TextInput,
  useToast,
} from '@aics/design-system';
import { useEffect, useRef, useState } from 'react';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';
import { formatCourseScheduleDateTime } from '~/shared/lib/formatCourseScheduleDateTime';
import { PdfPreview } from '~/shared/ui/PdfPreview';

import { useAuthStore } from '~/features/auth/authStore';
import StudentContextState from '~/features/section/StudentContextState';
import { useStudentContext } from '~/features/section/useStudentContext';
import {
  safeDisplayUrl,
  safeSubmissionUrl,
} from '~/features/submission/submissionUploadInput';

import { formatEvaluationRemainingTime } from './formatEvaluationRemainingTime';
import { getEvaluationErrorMessage } from './getEvaluationErrorMessage';
import * as styles from './PresentationEvaluationPage.css';
import {
  useEvaluationContextQuery,
  useMilestonePresentationsQuery,
  useMyTeamEvaluationsQuery,
  useSubmitTeamEvaluationMutation,
} from './queries';

const windowCopy: Record<MyTeamEvaluationsResponse['windowState'], string> = {
  UNAVAILABLE: '평가 기간이 설정되지 않아 자료만 확인할 수 있어요.',
  UPCOMING: '평가 기간이 시작되면 점수를 입력할 수 있어요.',
  OPEN: '평가 기간이에요. 팀별로 점수를 입력하고 제출해 주세요.',
  CLOSED: '평가가 마감되어 자료와 제출한 점수만 확인할 수 있어요.',
};

function EvaluationTimer({
  label,
  onComplete,
  targetAt,
}: {
  label: string;
  onComplete?: () => void;
  targetAt: string;
}) {
  const [now, setNow] = useState(Date.now());
  const hasCompleted = useRef(false);

  useEffect(() => {
    hasCompleted.current = false;
    setNow(Date.now());
    const timerId = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timerId);
  }, [targetAt]);

  const remainingTime = formatEvaluationRemainingTime(targetAt, now);
  const isExpired = remainingTime === '00:00:00';
  useEffect(() => {
    if (isExpired && !hasCompleted.current && onComplete) {
      hasCompleted.current = true;
      onComplete();
    }
  }, [isExpired, onComplete]);

  // Once the client clock passes the deadline the server state is re-read;
  // until it answers, hiding the timer avoids showing "00:00:00" next to
  // the still-open copy.
  if (!remainingTime || isExpired) return null;

  return (
    <p className={styles.timer} role='timer'>
      {label} {remainingTime}
    </p>
  );
}

/** Course times are fixed to Asia/Seoul regardless of the viewer's timezone. */
function formatEvaluationWindow(opensAt: string, closesAt: string) {
  const formattedOpensAt = formatCourseScheduleDateTime(opensAt);
  const formattedClosesAt = formatCourseScheduleDateTime(closesAt);
  return `${formattedOpensAt === opensAt ? '-' : formattedOpensAt} ~ ${formattedClosesAt === closesAt ? '-' : formattedClosesAt}`;
}

function findPdfArtifact(team: MilestonePresentation) {
  for (const artifact of team.artifacts) {
    if (artifact.type !== 'FILE') continue;
    const label = artifact.fileName ?? '';
    if (artifact.mimeType !== 'application/pdf' && !/\.pdf$/i.test(label))
      continue;
    const href = safeSubmissionUrl(artifact.downloadUrl);
    if (href)
      return {
        href,
        key: String(artifact.fileId ?? artifact.requiredArtifactId ?? label),
        label: label || '발표 자료',
      };
  }
  return null;
}

function PresentationViewer({
  onReloadMaterials,
  team,
}: {
  onReloadMaterials: () => void;
  team: MilestonePresentation;
}) {
  const project = team.project;
  const pdf = findPdfArtifact(team);
  const teamLabel = team.teamName ?? `${team.teamId}팀`;
  const screens = (project?.screenConfiguration ?? []).flatMap(screen => {
    const imageUrl = safeDisplayUrl(screen.imageUrl);
    return imageUrl ? [{ ...screen, imageUrl }] : [];
  });
  const dataItems = (project?.dataConfiguration ?? []).filter(item =>
    [item.name, item.description, item.expectedCount].some(value =>
      value?.trim(),
    ),
  );
  const members = project?.teamOperation?.members ?? [];
  return (
    <>
      <Card padding={5} width='100%'>
        <article
          aria-label={`${teamLabel} 제출 발표 자료`}
          className={styles.cardContent}
        >
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>제출한 발표 자료</h3>
            {team.artifacts.length ? (
              <ul className={styles.detailList}>
                {team.artifacts.map((artifact, index) => {
                  const href = safeSubmissionUrl(
                    artifact.type === 'FILE'
                      ? artifact.downloadUrl
                      : artifact.url,
                  );
                  const label =
                    artifact.fileName ??
                    artifact.url ??
                    `제출 자료 ${index + 1}`;
                  return (
                    <li
                      key={`${artifact.requiredArtifactId ?? index}:${label}`}
                    >
                      {href ? (
                        <a
                          className={styles.link}
                          href={href}
                          rel='noreferrer'
                          target='_blank'
                        >
                          {label}
                        </a>
                      ) : (
                        label
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={styles.helper}>등록된 발표 자료가 없어요.</p>
            )}
          </div>
          {pdf ? (
            <div className={styles.section}>
              <h4 className={styles.previewTitle}>{pdf.label}</h4>
              <PdfPreview
                fileKey={pdf.key}
                onReload={onReloadMaterials}
                title={pdf.label}
                url={pdf.href}
              />
            </div>
          ) : null}
        </article>
      </Card>

      <Card padding={5} width='100%'>
        <article
          aria-label={`${teamLabel} 프로젝트 정보`}
          className={styles.cardContent}
        >
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>프로젝트 소개</h3>
            <p className={styles.bodyText}>
              {project?.description ??
                project?.goal ??
                '프로젝트 설명이 등록되지 않았어요.'}
            </p>
          </section>
          {project?.goal && project.goal !== project.description ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>프로젝트 목표</h3>
              <p className={styles.bodyText}>{project.goal}</p>
            </section>
          ) : null}
          {project?.projectSchedule ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>진행 일정</h3>
              <p className={styles.bodyText}>{project.projectSchedule}</p>
            </section>
          ) : null}
          {safeSubmissionUrl(project?.repositoryUrl) ? (
            <a
              className={styles.link}
              href={safeSubmissionUrl(project?.repositoryUrl)}
              rel='noreferrer'
              target='_blank'
            >
              프로젝트 저장소 열기
            </a>
          ) : null}
        </article>
      </Card>

      {screens.length ? (
        <Card padding={5} width='100%'>
          <article
            aria-label={`${teamLabel} 화면 구성`}
            className={styles.cardContent}
          >
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>화면 구성</h3>
              <div className={styles.screenGrid}>
                {screens.map((screen, index) => (
                  <figure
                    className={styles.screenItem}
                    key={`${screen.imageFileId ?? index}:${screen.title ?? ''}`}
                  >
                    <img
                      alt={screen.title || `화면 ${index + 1}`}
                      className={styles.screenImage}
                      src={screen.imageUrl}
                    />
                    <figcaption className={styles.screenItem}>
                      <strong>{screen.title || `화면 ${index + 1}`}</strong>
                      {screen.description ? <p>{screen.description}</p> : null}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </section>
          </article>
        </Card>
      ) : null}

      {dataItems.length || members.length ? (
        <Card padding={5} width='100%'>
          <article
            aria-label={`${teamLabel} 프로젝트 구성`}
            className={styles.cardContent}
          >
            {dataItems.length ? (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>데이터 구성</h3>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope='col'>이름</th>
                        <th scope='col'>설명</th>
                        <th scope='col'>예상 개수</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataItems.map((item, index) => (
                        <tr key={`${item.name ?? ''}:${index}`}>
                          <td>{item.name || '-'}</td>
                          <td>{item.description || '-'}</td>
                          <td>{item.expectedCount || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
            {members.length ? (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}>팀원 역할</h3>
                <div className={styles.tableScroll}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th scope='col'>이름</th>
                        <th scope='col'>역할</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map(member => (
                        <tr key={member.id}>
                          <td>
                            {member.name || member.studentNumber}
                            {member.isLeader ? ' · 팀장' : ''}
                          </td>
                          <td>{member.projectRole || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}
          </article>
        </Card>
      ) : null}
    </>
  );
}

function EvaluationForm({
  compact,
  criteria,
  evaluation,
  isMyTeam,
  isSubmitting,
  onSubmit,
  windowState,
}: {
  compact: boolean;
  criteria: TeamEvaluationCriterionDto[];
  evaluation?: TeamEvaluationDto;
  isMyTeam: boolean;
  isSubmitting: boolean;
  onSubmit: (scores: Record<number, number>) => void;
  windowState: MyTeamEvaluationsResponse['windowState'];
}) {
  const submitted = Object.fromEntries(
    (evaluation?.scores ?? []).map(score => [score.criterionId, score.score]),
  );
  const [scores, setScores] = useState<Record<number, number>>(submitted);
  const [numericScoreInputs, setNumericScoreInputs] = useState<
    Record<number, string>
  >({});
  const [isResubmitConfirmationOpen, setIsResubmitConfirmationOpen] =
    useState(false);
  const scoreKey = JSON.stringify(submitted);
  const lastKey = useRef(scoreKey);
  if (lastKey.current !== scoreKey) {
    lastKey.current = scoreKey;
    setScores(submitted);
    setNumericScoreInputs({});
  }
  const editable = windowState === 'OPEN' && !isMyTeam;
  const invalid = criteria.filter(criterion => {
    const score = scores[criterion.id];
    return (
      score == null ||
      !Number.isInteger(score) ||
      score < 1 ||
      score > criterion.maxScore
    );
  });

  return (
    <section aria-label='발표 평가 입력' className={styles.form}>
      <div className={styles.section}>
        {isMyTeam || !compact ? (
          <p className={styles.helper}>
            {isMyTeam
              ? '우리 팀 발표는 평가 대상이 아니에요.'
              : windowCopy[windowState]}
          </p>
        ) : null}
        {evaluation?.submittedAt && !compact ? (
          <p className={styles.helper}>
            제출한 평가예요. 기간 안에는 다시 제출해 점수를 고칠 수 있어요.
          </p>
        ) : null}
      </div>
      <div className={styles.scoreTableScroll}>
        <table className={styles.scoreTable}>
          <thead>
            <tr>
              <th scope='col'>평가 항목</th>
              <th scope='col'>점수</th>
            </tr>
          </thead>
          <tbody>
            {criteria.map(criterion => (
              <tr key={criterion.id}>
                <th scope='row'>
                  {criterion.title}
                  <span className={styles.scoreMax}>
                    최대 {criterion.maxScore}점
                  </span>
                </th>
                <td>
                  {criterion.maxScore > 5 ? (
                    <TextInput
                      description={`1~${criterion.maxScore} 사이의 정수를 입력해 주세요.`}
                      isDisabled={!editable}
                      isLabelHidden
                      isRequired
                      label={`${criterion.title} (최대 ${criterion.maxScore}점)`}
                      onChange={value => {
                        setNumericScoreInputs(current => ({
                          ...current,
                          [criterion.id]: value,
                        }));
                        setScores(current => {
                          const score = Number(value);
                          if (
                            !/^\d+$/.test(value) ||
                            !Number.isInteger(score) ||
                            score < 1 ||
                            score > criterion.maxScore
                          ) {
                            const next = { ...current };
                            delete next[criterion.id];
                            return next;
                          }
                          return { ...current, [criterion.id]: score };
                        });
                      }}
                      placeholder={`1~${criterion.maxScore}`}
                      status={
                        (numericScoreInputs[criterion.id] ?? '').trim() &&
                        scores[criterion.id] == null
                          ? {
                              message: `1~${criterion.maxScore} 사이의 정수를 입력해 주세요.`,
                              type: 'error',
                            }
                          : undefined
                      }
                      value={
                        numericScoreInputs[criterion.id] ??
                        (scores[criterion.id] == null
                          ? ''
                          : String(scores[criterion.id]))
                      }
                      width='100%'
                    />
                  ) : (
                    <RadioList
                      className={styles.scoreList}
                      isDisabled={!editable}
                      isLabelHidden
                      isRequired
                      label={`${criterion.title} (최대 ${criterion.maxScore}점)`}
                      onChange={value =>
                        setScores(current => ({
                          ...current,
                          [criterion.id]: Number(value),
                        }))
                      }
                      orientation='horizontal'
                      value={
                        scores[criterion.id] == null
                          ? ''
                          : String(scores[criterion.id])
                      }
                    >
                      {Array.from(
                        { length: criterion.maxScore },
                        (_, index) => index + 1,
                      ).map(score => (
                        <RadioListItem
                          aria-label={`${score}점`}
                          key={score}
                          label={String(score)}
                          value={String(score)}
                        />
                      ))}
                    </RadioList>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable ? (
        <Button
          isDisabled={isSubmitting || invalid.length > 0}
          isLoading={isSubmitting}
          label={evaluation?.submittedAt ? '평가 다시 제출' : '평가 제출'}
          onClick={() => {
            if (evaluation?.submittedAt) {
              setIsResubmitConfirmationOpen(true);
              return;
            }
            if (!invalid.length) onSubmit(scores);
          }}
          tooltip={
            invalid.length
              ? `${invalid.map(criterion => criterion.title).join(', ')} 항목에 유효한 점수를 입력해 주세요.`
              : undefined
          }
        />
      ) : null}
      <Dialog
        aria-label='발표 평가 다시 제출 확인'
        isOpen={isResubmitConfirmationOpen}
        onOpenChange={setIsResubmitConfirmationOpen}
        purpose='info'
        role='alertdialog'
      >
        <div
          className={styles.confirmationDialog}
          onKeyDown={event => {
            if (
              event.key === 'Escape' &&
              isResubmitConfirmationOpen &&
              !isSubmitting
            ) {
              event.stopPropagation();
              setIsResubmitConfirmationOpen(false);
            }
          }}
        >
          <Heading level={2}>평가를 다시 제출할까요?</Heading>
          <Text>기존에 제출한 점수가 현재 입력한 점수로 바뀝니다.</Text>
          <HStack gap={2} justify='end'>
            <Button
              data-autofocus='true'
              label='계속 수정'
              onClick={() => setIsResubmitConfirmationOpen(false)}
              variant='secondary'
            />
            <Button
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              label='다시 제출'
              onClick={() => {
                if (isSubmitting) return;
                setIsResubmitConfirmationOpen(false);
                if (!invalid.length) onSubmit(scores);
              }}
              variant='primary'
            />
          </HStack>
        </div>
      </Dialog>
    </section>
  );
}

function useDesktopEvaluationLayout() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 1024px)').matches
      : false,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return isDesktop;
}

function PresentationEvaluationContent({
  evaluations,
  milestoneId,
  myTeamId,
  onReloadMaterials,
  onWindowClosed,
  presentations,
  userId,
}: {
  evaluations: MyTeamEvaluationsResponse;
  milestoneId: string;
  myTeamId: string | null;
  onReloadMaterials: () => void;
  onWindowClosed: () => void;
  presentations: MilestonePresentation[];
  userId: string;
}) {
  const toast = useToast();
  const submitMutation = useSubmitTeamEvaluationMutation(userId, milestoneId);
  const teams = [...presentations].sort(
    (left, right) =>
      (left.presentationOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.presentationOrder ?? Number.MAX_SAFE_INTEGER) ||
      left.teamId - right.teamId,
  );
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.teamId);
  const [isEvaluationOpen, setIsEvaluationOpen] = useState(false);
  const isDesktop = useDesktopEvaluationLayout();
  const evaluationPanelRef = useRef<HTMLDivElement>(null);
  const evaluationTriggerRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = teams.findIndex(team => team.teamId === selectedTeamId);
  const selectedTeam = teams[selectedIndex] ?? teams[0];
  if (!selectedTeam) return null;

  const criteria = [...evaluations.criteria].sort(
    (left, right) => left.displayOrder - right.displayOrder,
  );
  const teamLabel = selectedTeam.teamName ?? `${selectedTeam.teamId}팀`;
  const presentationLabel =
    selectedTeam.presentationOrder == null
      ? '발표 순서 미정'
      : `${selectedTeam.presentationOrder}번 발표`;
  const evaluation = evaluations.evaluations.find(
    item => item.teamId === selectedTeam.teamId,
  );

  const closeEvaluation = () => {
    setIsEvaluationOpen(false);
  };
  const submitScores = (scores: Record<number, number>) => {
    submitMutation.mutate(
      {
        teamId: String(selectedTeam.teamId),
        input: {
          scores: criteria.map(criterion => ({
            criterionId: criterion.id,
            score: scores[criterion.id] ?? 0,
          })),
        },
      },
      {
        onError: error =>
          toast({ body: getEvaluationErrorMessage(error), type: 'error' }),
        onSuccess: () => {
          if (evaluationPanelRef.current)
            evaluationPanelRef.current.scrollTop = 0;
          toast({ body: `${teamLabel} 평가를 제출했어요.` });
        },
      },
    );
  };

  return (
    <div className={styles.root}>
      <header>
        <Card
          className={styles.contextHeader}
          padding={5}
          variant='muted'
          width='100%'
        >
          <div className={styles.headerContent}>
            <h1 className={styles.title}>발표 평가</h1>
            <p className={styles.description}>
              {windowCopy[evaluations.windowState]}
            </p>
            {evaluations.evaluationOpensAt && evaluations.evaluationClosesAt ? (
              <div className={styles.windowRow}>
                <p className={styles.windowTime}>
                  {formatEvaluationWindow(
                    evaluations.evaluationOpensAt,
                    evaluations.evaluationClosesAt,
                  )}
                </p>
                {evaluations.windowState === 'OPEN' ? (
                  <EvaluationTimer
                    label='평가 마감까지'
                    onComplete={onWindowClosed}
                    targetAt={evaluations.evaluationClosesAt}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        </Card>
      </header>
      <aside aria-label='발표 평가 탐색과 입력' className={styles.sidebar}>
        <div className={styles.sidebarHeading}>
          <Heading level={2}>팀 발표 목록</Heading>
          <Text color='secondary' type='supporting'>
            {evaluations.evaluations.filter(item => item.submittedAt).length} /{' '}
            {teams.filter(team => String(team.teamId) !== myTeamId).length}팀
            평가 완료
          </Text>
        </div>
        <nav aria-label='팀 발표 빠른 탐색' className={styles.teamNavigation}>
          {teams.map((team, index) => {
            const isMyTeam = String(team.teamId) === myTeamId;
            const isEvaluated = Boolean(
              evaluations.evaluations.find(item => item.teamId === team.teamId)
                ?.submittedAt,
            );
            const statusLabel = isMyTeam
              ? '우리 팀'
              : isEvaluated
                ? '평가 완료'
                : '평가 전';
            const isSelected = team.teamId === selectedTeam.teamId;
            return (
              <div className={styles.teamNavigationItem} key={team.teamId}>
                <span className={styles.teamStatusDot}>
                  <StatusDot
                    label={statusLabel}
                    variant={isEvaluated ? 'success' : 'neutral'}
                  />
                </span>
                <Button
                  aria-current={isSelected ? 'true' : undefined}
                  className={styles.teamNavigationButton}
                  label={`${team.presentationOrder ?? index + 1}번 · ${team.teamName ?? `${team.teamId}팀`}`}
                  onClick={() => setSelectedTeamId(team.teamId)}
                  variant='secondary'
                >
                  <span
                    className={isSelected ? styles.selectedOrder : styles.order}
                  >
                    {team.presentationOrder ?? index + 1}번
                  </span>
                  {' · '}
                  {team.teamName ?? `${team.teamId}팀`}
                </Button>
              </div>
            );
          })}
        </nav>
        {isDesktop ? (
          <div
            aria-label={`${teamLabel} 평가 입력`}
            className={styles.evaluationPanel}
            id='presentation-evaluation-panel'
            ref={evaluationPanelRef}
            role='region'
          >
            <div className={styles.panelHeading}>
              <Heading level={3}>{teamLabel} 평가</Heading>
            </div>
            <EvaluationForm
              compact
              key={selectedTeam.teamId}
              criteria={criteria}
              evaluation={evaluation}
              isMyTeam={String(selectedTeam.teamId) === myTeamId}
              isSubmitting={submitMutation.isPending}
              onSubmit={submitScores}
              windowState={evaluations.windowState}
            />
          </div>
        ) : null}
      </aside>
      {!isDesktop ? (
        <BottomSheet
          finalFocusRef={evaluationTriggerRef}
          height='tall'
          isOpen={isEvaluationOpen}
          label={`${teamLabel} 평가 입력`}
          onOpenChange={setIsEvaluationOpen}
          purpose='form'
        >
          <div className={styles.mobileSheetContent}>
            <div className={styles.panelHeading}>
              <Heading level={3}>{teamLabel} 평가</Heading>
              <Button
                label='닫기'
                onClick={closeEvaluation}
                variant='secondary'
              />
            </div>
            <EvaluationForm
              compact={false}
              key={selectedTeam.teamId}
              criteria={criteria}
              evaluation={evaluation}
              isMyTeam={String(selectedTeam.teamId) === myTeamId}
              isSubmitting={submitMutation.isPending}
              onSubmit={submitScores}
              windowState={evaluations.windowState}
            />
          </div>
        </BottomSheet>
      ) : null}
      <div className={styles.mobileEvaluationTrigger}>
        <Button
          aria-expanded={isEvaluationOpen}
          label={isEvaluationOpen ? '평가 접기' : '평가하기'}
          onClick={() =>
            isEvaluationOpen ? closeEvaluation() : setIsEvaluationOpen(true)
          }
          ref={evaluationTriggerRef}
          variant='primary'
        />
      </div>
      <section
        aria-labelledby={`presentation-team-title-${selectedTeam.teamId}`}
        className={styles.dynamicContent}
        key={selectedTeam.teamId}
      >
        <div aria-live='polite' className={styles.teamHeader}>
          <p className={styles.teamEyebrow}>
            발표 {selectedIndex + 1} / {teams.length}
          </p>
          <div className={styles.teamIdentity}>
            <span
              aria-label={
                selectedTeam.presentationOrder == null
                  ? '발표 순서 미정'
                  : `발표 순서 ${selectedTeam.presentationOrder}번`
              }
              className={styles.orderBadge}
              role='img'
            >
              {selectedTeam.presentationOrder ?? '–'}
            </span>
            <div>
              <p className={styles.teamName}>
                {teamLabel} · {presentationLabel}
              </p>
              <h2
                className={styles.teamTitle}
                id={`presentation-team-title-${selectedTeam.teamId}`}
              >
                {selectedTeam.project?.title ?? teamLabel}
              </h2>
            </div>
          </div>
        </div>
        <Divider className={styles.contentDivider} />
        <div className={styles.contentGrid}>
          <PresentationViewer
            onReloadMaterials={onReloadMaterials}
            team={selectedTeam}
          />
        </div>
      </section>
      <footer aria-label='발표 팀 이동' className={styles.stickyFooter}>
        <Card
          className={styles.actionFooter}
          padding={2}
          variant='muted'
          width='100%'
        >
          <nav aria-label='발표 팀 이동' className={styles.navigation}>
            <Button
              isDisabled={selectedIndex <= 0}
              label='이전 팀'
              onClick={() =>
                setSelectedTeamId(teams[selectedIndex - 1]?.teamId)
              }
              variant='secondary'
            />
            <p className={`${styles.helper} ${styles.navigationStatus}`}>
              {presentationLabel} · {teamLabel} · {selectedIndex + 1} /{' '}
              {teams.length}
            </p>
            <Button
              isDisabled={selectedIndex >= teams.length - 1}
              label='다음 팀'
              onClick={() =>
                setSelectedTeamId(teams[selectedIndex + 1]?.teamId)
              }
              variant='secondary'
            />
          </nav>
        </Card>
      </footer>
    </div>
  );
}

export default function PresentationEvaluationPage() {
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
  const currentUser = useAuthStore(state => state.currentUser);
  const context = useStudentContext(!isDemo);
  const sectionId =
    isDemo && currentUser?.sections.length === 1
      ? currentUser.sections[0]!.id
      : context.status === 'ready'
        ? String(context.section!.id)
        : '';
  const userId = (isDemo ? currentUser : context.user)?.studentNumber ?? '';
  const contextQuery = useEvaluationContextQuery(sectionId, userId);
  const milestoneId =
    sectionId && contextQuery.isSuccess
      ? (contextQuery.data.presentationMilestoneId ?? '')
      : '';
  const rosterQuery = useMilestonePresentationsQuery(milestoneId);
  const evaluationsQuery = useMyTeamEvaluationsQuery(userId, milestoneId);

  if (!isDemo && context.status !== 'ready')
    return <StudentContextState context={context} />;
  if (!sectionId || !userId)
    return <EmptyState title='수강 분반과 학생 계정을 확인해 주세요.' />;
  if (contextQuery.isPending)
    return (
      <p className={styles.status} role='status'>
        발표 평가를 불러오는 중...
      </p>
    );
  if (contextQuery.isError)
    return (
      <EmptyState
        actions={
          <Button
            clickAction={async () => {
              await contextQuery.refetch();
            }}
            label='다시 시도'
            variant='secondary'
          />
        }
        description={getEvaluationErrorMessage(contextQuery.error)}
        title='발표 평가를 불러오지 못했어요.'
      />
    );
  if (!milestoneId)
    return (
      <EmptyState
        description='분반에 발표 마일스톤이 등록되면 평가할 수 있어요.'
        title='평가할 발표가 없어요.'
      />
    );
  if (rosterQuery.isPending || evaluationsQuery.isPending)
    return (
      <p className={styles.status} role='status'>
        발표 평가를 불러오는 중...
      </p>
    );
  if (rosterQuery.isError || evaluationsQuery.isError)
    return (
      <EmptyState
        actions={
          <Button
            clickAction={async () => {
              await Promise.all([
                rosterQuery.refetch(),
                evaluationsQuery.refetch(),
              ]);
            }}
            label='다시 시도'
            variant='secondary'
          />
        }
        description={getEvaluationErrorMessage(
          rosterQuery.error ?? evaluationsQuery.error,
        )}
        title='발표 평가를 불러오지 못했어요.'
      />
    );
  if (!rosterQuery.data.length)
    return (
      <EmptyState
        description='발표 자료가 제출된 팀이 아직 없어요.'
        title='조회할 발표가 없어요.'
      />
    );

  return (
    <PresentationEvaluationContent
      key={`${userId}:${sectionId}:${context.teamId}`}
      evaluations={evaluationsQuery.data}
      milestoneId={milestoneId}
      myTeamId={(isDemo ? currentUser?.teamId : context.teamId) ?? null}
      onReloadMaterials={() => {
        void rosterQuery.refetch();
      }}
      onWindowClosed={() => {
        void evaluationsQuery.refetch();
      }}
      presentations={rosterQuery.data}
      userId={userId}
    />
  );
}
