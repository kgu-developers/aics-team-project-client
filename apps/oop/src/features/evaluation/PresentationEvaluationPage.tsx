import type {
  EvaluationWindowState,
  MyPresentationEvaluation,
  PresentationEvaluationCriterion,
  PresentationEvaluationOverview,
  PresentationEvaluationTeam,
} from '@aics/core';
import {
  Button,
  Card,
  Carousel,
  Divider,
  EmptyState,
  RadioList,
  RadioListItem,
  useToast,
} from '@aics/design-system';
import { useEffect, useRef, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';

import { formatEvaluationRemainingTime } from './formatEvaluationRemainingTime';
import { getEvaluationErrorMessage } from './getEvaluationErrorMessage';
import * as styles from './PresentationEvaluationPage.css';
import {
  useEvaluationContextQuery,
  useMyPresentationEvaluationsQuery,
  useSubmitPresentationEvaluationMutation,
  useTeamEvaluationCriteriaQuery,
} from './queries';

type EvaluationFormProps = {
  criteria: PresentationEvaluationCriterion[];
  evaluation?: MyPresentationEvaluation;
  onScoresChange: (scores: Record<string, string>) => void;
  scores: Record<string, string>;
  team: PresentationEvaluationTeam;
  windowState: EvaluationWindowState;
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
  useEffect(() => {
    if (remainingTime === '00:00:00' && !hasCompleted.current && onComplete) {
      hasCompleted.current = true;
      onComplete();
    }
  }, [onComplete, remainingTime]);

  if (!remainingTime) return null;

  return (
    <p className={styles.timer} role='timer'>
      {label} {remainingTime}
    </p>
  );
}

function formatEvaluationWindow(opensAt: string, closesAt: string) {
  const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateFormatter.format(new Date(opensAt))} ~ ${timeFormatter.format(new Date(closesAt))}`;
}

function PresentationViewer({ team }: { team: PresentationEvaluationTeam }) {
  const presentation = team.presentation;
  const material = presentation.submittedMaterial;
  const submittedAt = new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(material.submittedAt));

  return (
    <>
      <Card padding={5} width='100%'>
        <article
          aria-label={`${team.name} 제출 발표 자료`}
          className={styles.cardContent}
        >
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>제출한 발표 자료</h3>
            <p className={styles.helper}>
              {material.fileName} · {submittedAt} 제출
            </p>
            <a
              className={styles.link}
              href={material.fileUrl}
              rel='noreferrer'
              target='_blank'
            >
              PDF 원본 열기
            </a>
          </div>
          <Carousel
            aria-label={`${team.name} 제출 PDF 미리보기`}
            gap={2}
            hasEdgeFade={false}
            hasSnap
          >
            {material.previewPages.map(page => (
              <figure className={styles.previewPage} key={page.id}>
                <img
                  alt={page.alt}
                  className={styles.previewImage}
                  src={page.imageUrl}
                />
                <figcaption className={styles.previewCaption}>
                  {page.pageNumber} / {material.previewPages.length}
                </figcaption>
              </figure>
            ))}
          </Carousel>
        </article>
      </Card>

      <Card padding={5} width='100%'>
        <article
          aria-label={`${team.name} 발표 보조 정보`}
          className={styles.cardContent}
        >
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>프로젝트 소개</h3>
            <p className={styles.bodyText}>
              {presentation.projectIntroduction}
            </p>
          </section>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>주요 기능</h3>
            <ul className={styles.detailList}>
              {presentation.mainFeatures.map(item => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.description}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>주요 화면</h3>
            <div className={styles.screenGrid}>
              {presentation.mainScreens.map(item => (
                <article className={styles.screenItem} key={item.id}>
                  {item.imageUrl ? (
                    <img
                      alt={`${item.name} 미리보기`}
                      className={styles.screenImage}
                      src={item.imageUrl}
                    />
                  ) : null}
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </section>
          {presentation.demoVideoUrl ? (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>시연 영상</h3>
              <a
                className={styles.link}
                href={presentation.demoVideoUrl}
                rel='noreferrer'
                target='_blank'
              >
                시연 영상 새 창에서 보기
              </a>
            </section>
          ) : null}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>시연 흐름</h3>
            <ol className={styles.detailList}>
              {presentation.demoFlow.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </section>
        </article>
      </Card>
    </>
  );
}

function PresentationEvaluationForm({
  criteria,
  evaluation,
  onScoresChange,
  scores,
  team,
  windowState,
}: EvaluationFormProps) {
  const isSubmitted = evaluation?.status === 'SUBMITTED';
  const isDisabled = team.isMyTeam || isSubmitted || windowState === 'UPCOMING';
  const disabledMessage = isSubmitted
    ? '제출한 평가는 수정할 수 없어요.'
    : windowState === 'UPCOMING'
      ? '발표 평가 수업 시간이 시작되면 입력할 수 있어요.'
      : undefined;

  return (
    <Card padding={5} width='100%'>
      <section
        aria-labelledby='evaluation-panel-heading'
        className={styles.form}
      >
        <div className={styles.section}>
          <h3 className={styles.sectionTitle} id='evaluation-panel-heading'>
            발표 평가
          </h3>
          <p className={styles.helper}>
            각 항목을 1점(보완 필요)부터 5점(매우 우수)까지 평가해 주세요.
          </p>
        </div>
        {team.isMyTeam ? (
          <p className={styles.helper}>
            자신의 팀 발표는 확인만 가능하며 평가 대상에서 제외돼요.
          </p>
        ) : null}
        {windowState === 'UPCOMING' ? (
          <p className={styles.helper}>
            수업 시간이 시작되기 전에는 발표 자료만 확인할 수 있어요.
          </p>
        ) : null}
        {windowState === 'CLOSED' ? (
          <p className={styles.helper}>
            발표 수업은 종료됐지만 평가는 계속 작성하고 제출할 수 있어요.
          </p>
        ) : null}
        {criteria.map(criterion => (
          <RadioList
            className={styles.scoreList}
            description={criterion.description}
            disabledMessage={disabledMessage}
            isDisabled={isDisabled}
            isRequired
            key={criterion.id}
            label={criterion.title}
            onChange={value =>
              onScoresChange({ ...scores, [criterion.id]: value })
            }
            orientation='horizontal'
            value={scores[criterion.id] ?? ''}
          >
            {[1, 2, 3, 4, 5].map(score => (
              <RadioListItem
                key={score}
                label={`${score}점`}
                value={String(score)}
              />
            ))}
          </RadioList>
        ))}
      </section>
    </Card>
  );
}

type PresentationEvaluationContentProps = {
  criteria: PresentationEvaluationCriterion[];
  milestoneId: string;
  onActivationReached: () => void;
  overview: PresentationEvaluationOverview;
  sectionId: string;
  userId: string;
};

function toScoreRecord(evaluation?: MyPresentationEvaluation) {
  return Object.fromEntries(
    evaluation?.scores.map(item => [item.criterionId, String(item.score)]) ??
      [],
  );
}

function PresentationEvaluationContent({
  criteria,
  milestoneId,
  onActivationReached,
  overview,
  sectionId,
  userId,
}: PresentationEvaluationContentProps) {
  const toast = useToast();
  const eligibleTeams = overview.teams.filter(team => !team.isMyTeam);
  const [selectedTeamId, setSelectedTeamId] = useState(
    eligibleTeams[0]?.id ?? overview.teams[0]?.id ?? '',
  );
  const [draftsByTeam, setDraftsByTeam] = useState<
    Record<string, Record<string, string>>
  >(() =>
    Object.fromEntries(
      eligibleTeams.map(team => {
        const evaluation = overview.myEvaluations.find(
          item => item.rateeTeamId === team.id,
        );
        return [team.id, toScoreRecord(evaluation)];
      }),
    ),
  );
  const [submittedTeamIds, setSubmittedTeamIds] = useState(
    () =>
      new Set(
        overview.myEvaluations
          .filter(item => item.status === 'SUBMITTED')
          .map(item => item.rateeTeamId),
      ),
  );
  const draftMutation = useSubmitPresentationEvaluationMutation(
    sectionId,
    userId,
    milestoneId,
  );
  const submitMutation = useSubmitPresentationEvaluationMutation(
    sectionId,
    userId,
    milestoneId,
  );

  useEffect(() => {
    setSubmittedTeamIds(current => {
      const next = new Set(current);
      for (const item of overview.myEvaluations)
        if (item.status === 'SUBMITTED') next.add(item.rateeTeamId);
      return next;
    });
  }, [overview.myEvaluations]);

  const isSubmitted = (teamId: string) => submittedTeamIds.has(teamId);
  const submittedTeamCount = eligibleTeams.filter(team =>
    isSubmitted(team.id),
  ).length;
  const selectedTeam =
    overview.teams.find(team => team.id === selectedTeamId) ??
    eligibleTeams[0] ??
    overview.teams[0];

  if (!selectedTeam)
    return (
      <EmptyState
        description='발표 팀 정보를 찾지 못했어요. 잠시 후 다시 시도해 주세요.'
        title='평가할 발표가 없어요.'
      />
    );

  const selectedIndex = overview.teams.findIndex(
    team => team.id === selectedTeam.id,
  );
  const evaluation = overview.myEvaluations.find(
    item => item.rateeTeamId === selectedTeam.id,
  );

  const selectedScores =
    draftsByTeam[selectedTeam.id] ?? toScoreRecord(evaluation);
  const selectedIsComplete = criteria.every(
    criterion => selectedScores[criterion.id],
  );
  const selectedIsSubmitted = isSubmitted(selectedTeam.id);
  const canSubmitSelected =
    !selectedTeam.isMyTeam &&
    !selectedIsSubmitted &&
    overview.windowState !== 'UPCOMING' &&
    selectedIsComplete;

  const saveSelectedDraft = async () => {
    if (
      selectedTeam.isMyTeam ||
      selectedIsSubmitted ||
      overview.windowState === 'UPCOMING' ||
      Object.keys(selectedScores).length === 0
    )
      return;

    await draftMutation.mutateAsync({
      rateeTeamId: selectedTeam.id,
      scores: criteria.flatMap(criterion => {
        const score = selectedScores[criterion.id];
        return score
          ? [{ criterionId: criterion.id, score: Number(score) }]
          : [];
      }),
      submit: false,
    });
  };

  const moveToTeam = async (nextTeamId: string) => {
    draftMutation.reset();
    try {
      await saveSelectedDraft();
    } catch {
      // The mutation error is rendered without blocking team navigation.
    } finally {
      submitMutation.reset();
      setSelectedTeamId(nextTeamId);
    }
  };

  const submitSelected = () => {
    submitMutation.reset();
    submitMutation.mutate(
      {
        rateeTeamId: selectedTeam.id,
        scores: criteria.map(criterion => ({
          criterionId: criterion.id,
          score: Number(selectedScores[criterion.id]),
        })),
        submit: true,
      },
      {
        onSuccess: () => {
          setSubmittedTeamIds(current => new Set(current).add(selectedTeam.id));
          toast({ body: `${selectedTeam.name} 발표 평가를 제출했어요.` });
        },
      },
    );
  };

  const submitTooltip = selectedTeam.isMyTeam
    ? '자신의 팀 발표는 평가 대상에서 제외돼요.'
    : selectedIsSubmitted
      ? '이 팀의 평가는 제출했어요.'
      : overview.windowState === 'UPCOMING'
        ? '발표 평가가 시작되면 작성하고 제출할 수 있어요.'
        : !selectedIsComplete
          ? '현재 팀의 모든 평가 항목을 입력해 주세요.'
          : '현재 팀 평가를 제출해요.';

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
            <p className={styles.description}>{overview.windowMessage}</p>
            <div className={styles.windowRow}>
              <p className={styles.windowTime}>
                발표 수업 시간{' '}
                {formatEvaluationWindow(
                  overview.evaluationOpensAt,
                  overview.evaluationClosesAt,
                )}
              </p>
              {overview.windowState === 'UPCOMING' ? (
                <EvaluationTimer
                  label='평가 시작까지'
                  onComplete={onActivationReached}
                  targetAt={overview.evaluationOpensAt}
                />
              ) : null}
            </div>
          </div>
        </Card>
      </header>
      <section
        aria-labelledby={`presentation-team-title-${selectedTeam.id}`}
        className={styles.dynamicContent}
        key={selectedTeam.id}
      >
        <div aria-live='polite' className={styles.teamHeader}>
          <p className={styles.teamEyebrow}>
            발표 {selectedIndex + 1} / {overview.teams.length}
          </p>
          <h2
            className={styles.teamTitle}
            id={`presentation-team-title-${selectedTeam.id}`}
          >
            {selectedTeam.presentation.projectTitle}
          </h2>
          <p className={styles.meta}>{selectedTeam.scheduledAt}</p>
        </div>
        <Divider className={styles.contentDivider} />
        <div className={styles.contentGrid}>
          <PresentationViewer team={selectedTeam} />
          <PresentationEvaluationForm
            criteria={criteria}
            evaluation={evaluation}
            onScoresChange={scores =>
              setDraftsByTeam(current => ({
                ...current,
                [selectedTeam.id]: scores,
              }))
            }
            scores={selectedScores}
            team={selectedTeam}
            windowState={overview.windowState}
          />
        </div>
      </section>
      <footer aria-label='발표 평가 작업'>
        <Card
          className={styles.actionFooter}
          padding={4}
          variant='muted'
          width='100%'
        >
          <nav aria-label='발표 팀 이동' className={styles.navigation}>
            <Button
              isDisabled={selectedIndex <= 0 || draftMutation.isPending}
              isLoading={draftMutation.isPending}
              label='이전 팀'
              onClick={() => {
                void moveToTeam(
                  overview.teams[selectedIndex - 1]?.id ?? selectedTeam.id,
                );
              }}
              variant='secondary'
            />
            <p className={`${styles.helper} ${styles.navigationStatus}`}>
              발표 {selectedIndex + 1} / {overview.teams.length} · 제출 완료{' '}
              {submittedTeamCount} / {eligibleTeams.length}팀
            </p>
            <Button
              isDisabled={
                selectedIndex >= overview.teams.length - 1 ||
                draftMutation.isPending
              }
              isLoading={draftMutation.isPending}
              label='다음 팀'
              onClick={() => {
                void moveToTeam(
                  overview.teams[selectedIndex + 1]?.id ?? selectedTeam.id,
                );
              }}
              variant='secondary'
            />
          </nav>
          <Divider />
          <section
            aria-label='현재 팀 발표 평가 제출'
            className={styles.submitPanel}
          >
            <div className={styles.section}>
              <p className={styles.submitTitle}>
                {selectedTeam.name}{' '}
                {selectedIsSubmitted ? '평가 제출 완료' : '평가 제출'}
              </p>
              <p className={styles.helper}>
                팀을 이동하면 작성한 점수는 임시 저장돼요. 최종 제출은 팀별로
                진행해 주세요.
              </p>
            </div>
            <Button
              isDisabled={!canSubmitSelected}
              isLoading={submitMutation.isPending}
              label={selectedIsSubmitted ? '제출 완료' : '제출하기'}
              onClick={submitSelected}
              tooltip={submitTooltip}
              variant='primary'
            />
          </section>
          {draftMutation.isError ? (
            <p className={styles.error} role='alert'>
              작성한 평가를 임시 저장하지 못했어요.{' '}
              {getEvaluationErrorMessage(draftMutation.error)}
            </p>
          ) : null}
          {submitMutation.isError ? (
            <p className={styles.error} role='alert'>
              평가를 제출하지 못했어요.{' '}
              {getEvaluationErrorMessage(submitMutation.error)}
            </p>
          ) : null}
        </Card>
      </footer>
    </div>
  );
}

export default function PresentationEvaluationPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const sectionId =
    currentUser?.sections.find(section => section.role === 'STUDENT')?.id ?? '';
  const userId = currentUser?.studentNumber ?? '';
  const contextQuery = useEvaluationContextQuery(sectionId, userId);
  const milestoneId = contextQuery.data?.presentationMilestoneId ?? '';
  const overviewQuery = useMyPresentationEvaluationsQuery(
    sectionId,
    userId,
    milestoneId,
  );
  const criteriaQuery = useTeamEvaluationCriteriaQuery(sectionId);

  if (!sectionId || !userId)
    return (
      <EmptyState
        description='소속 분반과 학생 계정을 확인해 주세요.'
        title='평가 범위가 없어요.'
      />
    );
  if (contextQuery.isPending)
    return (
      <p className={styles.status} role='status'>
        발표 평가를 불러오는 중...
      </p>
    );
  if (contextQuery.isError || !contextQuery.data)
    return (
      <EmptyState
        actions={
          <Button
            clickAction={async () => {
              await contextQuery.refetch();
            }}
            label='다시 시도'
            variant='primary'
          />
        }
        description={getEvaluationErrorMessage(contextQuery.error)}
        title='발표 평가를 불러오지 못했어요.'
      />
    );
  if (!milestoneId)
    return (
      <EmptyState
        description='현재 분반에 열린 발표 평가 일정이 없어요.'
        title='평가할 발표가 없어요.'
      />
    );
  if (overviewQuery.isPending || criteriaQuery.isPending)
    return (
      <p className={styles.status} role='status'>
        발표 평가를 불러오는 중...
      </p>
    );
  if (
    overviewQuery.isError ||
    criteriaQuery.isError ||
    !overviewQuery.data ||
    !criteriaQuery.data
  )
    return (
      <EmptyState
        actions={
          <Button
            clickAction={async () => {
              await Promise.all([
                overviewQuery.refetch(),
                criteriaQuery.refetch(),
              ]);
            }}
            label='다시 시도'
            variant='primary'
          />
        }
        description={getEvaluationErrorMessage(
          overviewQuery.error ?? criteriaQuery.error,
        )}
        title='발표 평가를 불러오지 못했어요.'
      />
    );

  const overview = overviewQuery.data;
  if (overview.windowState === 'NOT_CONFIGURED' || overview.teams.length === 0)
    return (
      <EmptyState
        description={overview.windowMessage}
        title='평가할 발표가 없어요.'
      />
    );

  return (
    <PresentationEvaluationContent
      criteria={criteriaQuery.data}
      milestoneId={milestoneId}
      onActivationReached={() => {
        void overviewQuery.refetch();
      }}
      overview={overview}
      sectionId={sectionId}
      userId={userId}
    />
  );
}
