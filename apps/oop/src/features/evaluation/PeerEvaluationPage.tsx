import type {
  MyPeerEvaluationResponse,
  PeerEvaluationTarget,
  PeerEvaluationTeammateAnswer,
} from '@aics/core';
import {
  Badge,
  Button,
  Dialog,
  EmptyState,
  Heading,
  HStack,
  proportional,
  Table,
  Text,
  TextArea,
  TextInput,
  useToast,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { SurveyFlow, SurveyQuestion } from '~/shared/ui/SurveyFlow';
import { SurveyShell } from '~/shared/ui/SurveyShell';

import { useAuthStore } from '~/features/auth/authStore';

import { getEvaluationErrorMessage } from './getEvaluationErrorMessage';
import * as styles from './PeerEvaluationPage.css';
import {
  useEvaluationContextQuery,
  usePeerEvaluationTargetsQuery,
  useSubmitPeerEvaluationResponseMutation,
} from './queries';

type PeerEvaluationFormProps = {
  formId: string;
  isWindowClosed: boolean;
  response?: MyPeerEvaluationResponse;
  sectionId: string;
  targets: PeerEvaluationTarget[];
  userId: string;
};

type PeerEvaluationTargetDraft = {
  contributionPercent: string;
  contributionDetail: string;
  teammateAssessment: string;
};

function initialTargetDrafts(
  targets: PeerEvaluationTarget[],
  response?: MyPeerEvaluationResponse,
) {
  const previous = new Map(
    response?.answers
      .filter(
        (answer): answer is PeerEvaluationTeammateAnswer =>
          answer.kind === 'TEAMMATE_CONTRIBUTION',
      )
      .map(answer => [answer.targetUserId, answer]),
  );
  return Object.fromEntries(
    targets.map(target => {
      const answer = previous.get(target.userId);
      return [
        target.userId,
        {
          contributionPercent:
            answer ? String(answer.contributionPercent) : '0',
          contributionDetail: answer?.contributionDetail ?? '',
          teammateAssessment: answer?.teammateAssessment ?? '',
        },
      ];
    }),
  );
}

function initialStep(response?: MyPeerEvaluationResponse): 0 | 1 {
  if (response?.status !== 'DRAFT') return 0;

  const hasProjectDraft = Boolean(
    response.selfContribution.trim() || response.projectReviewComment.trim(),
  );
  const hasTeammateDraft = response.answers.some(
    answer =>
      answer.kind === 'TEAMMATE_CONTRIBUTION' &&
      (answer.contributionPercent > 0 ||
        Boolean(answer.contributionDetail.trim()) ||
        Boolean(answer.teammateAssessment.trim())),
  );
  return hasProjectDraft || hasTeammateDraft ? 1 : 0;
}

function PeerEvaluationForm({
  formId,
  isWindowClosed,
  response,
  sectionId,
  targets,
  userId,
}: PeerEvaluationFormProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<0 | 1>(() => initialStep(response));
  const [targetDrafts, setTargetDrafts] = useState<
    Record<string, PeerEvaluationTargetDraft>
  >(() => initialTargetDrafts(targets, response));
  const [selfContribution, setSelfContribution] = useState(
    response?.selfContribution ?? '',
  );
  const [projectReviewComment, setProjectReviewComment] = useState(
    response?.projectReviewComment ?? '',
  );
  const [reflectionComment, setReflectionComment] = useState(
    response?.answers.find(answer => answer.kind === 'REFLECTION')?.comment ?? '',
  );
  const [clientError, setClientError] = useState('');
  const [editingTargetId, setEditingTargetId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] =
    useState<PeerEvaluationTargetDraft | null>(null);
  const draftMutation = useSubmitPeerEvaluationResponseMutation(
    sectionId,
    userId,
    formId,
  );
  const submitMutation = useSubmitPeerEvaluationResponseMutation(
    sectionId,
    userId,
    formId,
  );
  const currentResponse = submitMutation.data ?? response;
  const isSubmitted = currentResponse?.status === 'SUBMITTED';
  const isReadOnly = isSubmitted || isWindowClosed;
  const total = targets.reduce(
    (sum, target) =>
      sum + (Number(targetDrafts[target.userId]?.contributionPercent) || 0),
    0,
  );

  const buildInput = (
    submit: boolean,
    drafts: Record<string, PeerEvaluationTargetDraft> = targetDrafts,
  ) => ({
    selfContribution,
    projectReviewComment,
    answers: [
      ...targets.map(target => ({
        kind: 'TEAMMATE_CONTRIBUTION' as const,
        targetUserId: target.userId,
        contributionPercent:
          Number(drafts[target.userId]?.contributionPercent) || 0,
        contributionDetail: drafts[target.userId]?.contributionDetail ?? '',
        teammateAssessment: drafts[target.userId]?.teammateAssessment ?? '',
      })),
      { kind: 'REFLECTION' as const, comment: reflectionComment },
    ],
    submit,
  });

  const saveDraft = async (
    drafts: Record<string, PeerEvaluationTargetDraft> = targetDrafts,
  ) => {
    if (isReadOnly) return;
    draftMutation.reset();
    await draftMutation.mutateAsync(buildInput(false, drafts));
  };

  const changeStep = async (nextStep: 0 | 1) => {
    try {
      await saveDraft();
    } catch {
      // The mutation error is rendered without blocking survey navigation.
    } finally {
      setStep(nextStep);
    }
  };

  const openTargetDialog = (target: PeerEvaluationTarget) => {
    setEditingTargetId(target.userId);
    setEditingDraft({
      contributionPercent:
        targetDrafts[target.userId]?.contributionPercent ?? '0',
      contributionDetail: targetDrafts[target.userId]?.contributionDetail ?? '',
      teammateAssessment: targetDrafts[target.userId]?.teammateAssessment ?? '',
    });
  };

  const closeTargetDialog = () => {
    setEditingTargetId(null);
    setEditingDraft(null);
  };

  const saveTargetDialog = async () => {
    if (!editingTargetId || !editingDraft) return;
    const nextDrafts = {
      ...targetDrafts,
      [editingTargetId]: editingDraft,
    };
    setTargetDrafts(nextDrafts);
    try {
      await saveDraft(nextDrafts);
    } catch {
      // Keep the local edit and surface the mutation error in the form.
    } finally {
      closeTargetDialog();
    }
  };

  const submit = () => {
    setClientError('');
    submitMutation.reset();
    const input = buildInput(true);
    const teammateAnswers = input.answers.filter(
      (answer): answer is PeerEvaluationTeammateAnswer =>
        answer.kind === 'TEAMMATE_CONTRIBUTION',
    );
    if (total !== 100) {
      setClientError('제출하려면 팀원 기여도 합계를 100%로 맞춰 주세요.');
      return;
    }
    if (
      !selfContribution.trim() ||
      !projectReviewComment.trim() ||
      !reflectionComment.trim() ||
      teammateAnswers.some(
        answer =>
          !answer.contributionDetail.trim() ||
          !answer.teammateAssessment.trim(),
      )
    ) {
      setClientError(
        '제출하려면 모든 개인보고서와 팀원 평가 항목을 작성해 주세요.',
      );
      return;
    }
    submitMutation.mutate(
      input,
      {
        onSuccess: () => {
          toast({ body: '상호평가를 제출했어요.' });
          void navigate({ to: ROUTES.STUDENT.HOME });
        },
      },
    );
  };

  const editingTarget = targets.find(
    target => target.userId === editingTargetId,
  );
  const teammateRows = targets.map(target => {
    const draft = targetDrafts[target.userId];
    return {
      id: target.userId,
      name: target.name,
      role: target.role,
      score: `${Number(draft?.contributionPercent) || 0}%`,
      isCompleted: Boolean(
        draft?.contributionDetail.trim() && draft.teammateAssessment.trim(),
      ),
      target,
    };
  });
  const allTeammatesCompleted = teammateRows.every(row => row.isCompleted);
  const projectEvaluationCompleted = Boolean(
    selfContribution.trim() &&
    projectReviewComment.trim() &&
    reflectionComment.trim(),
  );

  const flowActions = (
    <>
      {step === 1 ? (
        <Button
          label='이전 설문'
          onClick={() => {
            void changeStep(0);
          }}
          variant='secondary'
        />
      ) : null}
      {step === 0 ? (
        <Button
          label='다음 설문'
          onClick={() => {
            void changeStep(1);
          }}
          variant='secondary'
        />
      ) : (
        <Button
          isDisabled={
            isReadOnly ||
            total !== 100 ||
            !allTeammatesCompleted ||
            !projectEvaluationCompleted
          }
          isLoading={submitMutation.isPending}
          label='제출하기'
          onClick={submit}
          tooltip={
            isSubmitted
              ? '제출한 응답은 수정할 수 없어요.'
              : total !== 100
                ? '팀원 기여도 합계를 100%로 맞춰 주세요.'
                : !allTeammatesCompleted
                  ? '모든 팀원의 상세 평가를 완료해 주세요.'
                  : !projectEvaluationCompleted
                    ? '프로젝트 평가 항목을 모두 작성해 주세요.'
                    : '제출 후에는 수정할 수 없어요.'
          }
          variant='primary'
        />
      )}
    </>
  );

  return (
    <SurveyShell surfaceClassName={styles.stableSurface}>
      <form className={styles.form} onSubmit={event => event.preventDefault()}>
        <SurveyFlow
          actions={flowActions}
          activeStep={step}
          ariaLabel='상호평가 입력'
          onStepChange={nextStep => {
            void changeStep(nextStep as 0 | 1);
          }}
          steps={[{ label: '프로젝트 평가' }, { label: '팀원 기여도' }]}
        >
          {step === 0 ? (
            <SurveyQuestion
              description='자신의 역할과 프로젝트 경험을 간단히 작성해 주세요.'
              title='프로젝트 평가'
            >
              <TextArea
                description='맡은 역할과 실제 수행 작업'
                isDisabled={isReadOnly}
                isRequired
                label='자신의 역할 요약'
                onChange={setSelfContribution}
                rows={2}
                value={selfContribution}
                width='100%'
              />
              <TextArea
                description='결과물/협업의 잘된 점·아쉬운 점'
                isDisabled={isReadOnly}
                isRequired
                label='팀 프로젝트 평가'
                onChange={setProjectReviewComment}
                rows={2}
                value={projectReviewComment}
                width='100%'
              />
              <TextArea
                description='소감이나 칭찬할 팀원의 기여'
                isDisabled={isReadOnly}
                isRequired
                label='소감 또는 팀원 칭찬'
                onChange={setReflectionComment}
                rows={2}
                value={reflectionComment}
                width='100%'
              />
            </SurveyQuestion>
          ) : (
            <SurveyQuestion
              description='본인을 제외한 팀원에게 기여도 합계 100%를 배분해 주세요.'
              title='팀원 기여도 평가'
            >
              {isWindowClosed ? (
                <p className={styles.helper}>
                  평가 기간이 종료되어 내 제출 내역만 확인할 수 있어요.
                </p>
              ) : null}
              <Table
                columns={[
                  {
                    align: 'start',
                    header: '팀원',
                    key: 'name',
                    width: proportional(1.2, { minWidth: 96 }),
                  },
                  {
                    align: 'end',
                    header: '점수',
                    key: 'score',
                    width: proportional(0.55, { minWidth: 52 }),
                  },
                  {
                    align: 'center',
                    header: '평가 여부',
                    key: 'isCompleted',
                    renderCell: row => (
                      <Badge
                        label={row.isCompleted ? '완료' : '미작성'}
                        variant={row.isCompleted ? 'success' : 'neutral'}
                      />
                    ),
                    width: proportional(0.8, { minWidth: 72 }),
                  },
                  {
                    align: 'end',
                    header: '입력',
                    key: 'target',
                    renderCell: row => (
                      <Button
                        label={
                          isReadOnly
                            ? '보기'
                            : row.isCompleted
                              ? '수정'
                              : '평가'
                        }
                        onClick={() => openTargetDialog(row.target)}
                        size='sm'
                        variant='primary'
                      />
                    ),
                    width: proportional(0.65, { minWidth: 58 }),
                  },
                ]}
                data={teammateRows}
                density='compact'
                dividers='rows'
                textOverflow='wrap'
                verticalAlign='middle'
              />
              <div className={styles.total}>
                <p className={styles.totalValue}>기여도 합계 {total}%</p>
                <Badge
                  label={total === 100 ? '합계 충족' : '100% 필요'}
                  variant={total === 100 ? 'success' : 'neutral'}
                />
              </div>
            </SurveyQuestion>
          )}
          {clientError ? (
            <p className={styles.error} role='alert'>
              {clientError}
            </p>
          ) : null}
          {draftMutation.isError ? (
            <p className={styles.error} role='alert'>
              임시 저장하지 못했어요.{' '}
              {getEvaluationErrorMessage(draftMutation.error)}
            </p>
          ) : null}
          {submitMutation.isError ? (
            <p className={styles.error} role='alert'>
              {getEvaluationErrorMessage(submitMutation.error)}
            </p>
          ) : null}
        </SurveyFlow>
        <Dialog
          aria-label={`${editingTarget?.name ?? '팀원'} 기여도 평가`}
          isOpen={Boolean(editingTarget && editingDraft)}
          onOpenChange={open => {
            if (!open) closeTargetDialog();
          }}
          purpose='form'
        >
          {editingTarget && editingDraft ? (
            <div className={styles.dialogContent}>
              <div className={styles.dialogHeader}>
                <Heading level={2}>{editingTarget.name} 평가</Heading>
                <Text color='secondary'>{editingTarget.role}</Text>
              </div>
              <TextInput
                description='0~100 사이 정수'
                isDisabled={isReadOnly}
                isRequired
                label='기여도 (%)'
                onChange={value => {
                  if (/^\d{0,3}$/.test(value) && Number(value || 0) <= 100)
                    setEditingDraft(current =>
                      current
                        ? { ...current, contributionPercent: value }
                        : current,
                    );
                }}
                value={editingDraft.contributionPercent}
              />
              <TextArea
                isDisabled={isReadOnly}
                isRequired
                label='기여 내용'
                onChange={value =>
                  setEditingDraft(current =>
                    current
                      ? { ...current, contributionDetail: value }
                      : current,
                  )
                }
                placeholder='담당한 작업과 실제 기여를 구체적으로 작성해 주세요.'
                rows={4}
                value={editingDraft.contributionDetail}
              />
              <TextInput
                isDisabled={isReadOnly}
                isRequired
                label='한줄평가'
                onChange={value =>
                  setEditingDraft(current =>
                    current
                      ? { ...current, teammateAssessment: value }
                      : current,
                  )
                }
                placeholder='협업 과정에서 확인한 기여를 한 줄로 작성해 주세요.'
                value={editingDraft.teammateAssessment}
              />
              <HStack
                className={styles.dialogActions}
                gap={2}
                justify='end'
              >
                <Button
                  label={isReadOnly ? '닫기' : '취소'}
                  onClick={closeTargetDialog}
                  variant='secondary'
                />
                {!isReadOnly ? (
                  <Button
                    isLoading={draftMutation.isPending}
                    label='평가 저장'
                    onClick={() => {
                      void saveTargetDialog();
                    }}
                    variant='primary'
                  />
                ) : null}
              </HStack>
            </div>
          ) : null}
        </Dialog>
      </form>
    </SurveyShell>
  );
}

export default function PeerEvaluationPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const sectionId =
    currentUser?.sections.find(section => section.role === 'STUDENT')?.id ?? '';
  const userId = currentUser?.studentNumber ?? '';
  const contextQuery = useEvaluationContextQuery(sectionId, userId);
  const formId = contextQuery.data?.peerEvaluationFormId ?? '';
  const query = usePeerEvaluationTargetsQuery(sectionId, userId, formId);

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
        상호평가를 불러오는 중...
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
        title='상호평가를 불러오지 못했어요.'
      />
    );
  if (!formId)
    return (
      <EmptyState
        description='현재 분반에 열린 상호평가 폼이 없어요.'
        title='평가할 팀원이 없어요.'
      />
    );
  if (query.isPending)
    return (
      <p className={styles.status} role='status'>
        상호평가를 불러오는 중...
      </p>
    );
  if (query.isError || !query.data)
    return (
      <EmptyState
        actions={
          <Button
            clickAction={async () => {
              await query.refetch();
            }}
            label='다시 시도'
            variant='primary'
          />
        }
        description={getEvaluationErrorMessage(query.error)}
        title='상호평가를 불러오지 못했어요.'
      />
    );
  if (
    query.data.windowState === 'NOT_CONFIGURED' ||
    query.data.targets.length === 0
  )
    return (
      <EmptyState
        description={query.data.windowMessage}
        title='평가할 팀원이 없어요.'
      />
    );

  return (
    <div className={styles.root}>
      <PeerEvaluationForm
        formId={formId}
        isWindowClosed={query.data.windowState === 'CLOSED'}
        response={query.data.myResponse}
        sectionId={sectionId}
        targets={query.data.targets}
        userId={userId}
      />
    </div>
  );
}
