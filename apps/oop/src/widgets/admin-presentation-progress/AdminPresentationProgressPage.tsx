import type {
  MilestonePresentation,
  ProposalScreenItem,
  StudentSubmissionArtifact,
} from '@aics/core';
import {
  AlertDialog,
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  HStack,
  IconButton,
  NumberInput,
  Text,
  TextArea,
  VStack,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { RotateCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatCourseScheduleDateTime } from '~/shared/lib/formatCourseScheduleDateTime';
import { PdfPreview } from '~/shared/ui/PdfPreview';

import { toAdminMilestoneRequestError } from '~/features/admin-milestone-review/model';
import {
  useAdminMilestonePresentationsQuery,
  useAdminProfessorPresentationEvaluationQuery,
  useUpdateAdminProfessorPresentationEvaluationMutation,
} from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';
import {
  safeDisplayUrl,
  safeSubmissionUrl,
} from '~/features/submission/submissionUploadInput';

import * as styles from './AdminPresentationProgressPage.css';

type AdminPresentationProgressPageProps = {
  milestoneId?: string;
  sectionId?: string;
  teamId?: string;
};

type DisplayScreen = ProposalScreenItem & { imageUrl: string };
type DisplayTeamMember = {
  id: number;
  isLeader: boolean;
  name?: string | null;
  projectRole?: string | null;
  studentNumber: string;
};

function comparePresentations(
  left: MilestonePresentation,
  right: MilestonePresentation,
) {
  const leftOrder = left.presentationOrder ?? Number.POSITIVE_INFINITY;
  const rightOrder = right.presentationOrder ?? Number.POSITIVE_INFINITY;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return (left.teamName ?? '').localeCompare(right.teamName ?? '', 'ko');
}

function getDisplayScreens(team: MilestonePresentation): DisplayScreen[] {
  const configuredScreens = team.project?.screenConfiguration;
  if (!Array.isArray(configuredScreens)) return [];

  return configuredScreens.flatMap(screen => {
    if (!screen || typeof screen !== 'object') return [];
    const imageUrl = safeDisplayUrl(screen.imageUrl);
    return imageUrl ? [{ ...screen, imageUrl }] : [];
  });
}

function isDisplayArtifact(
  artifact: unknown,
): artifact is StudentSubmissionArtifact {
  if (!artifact || typeof artifact !== 'object') return false;
  const type = (artifact as { type?: unknown }).type;
  return (
    type === 'FILE' ||
    type === 'LINK' ||
    type === 'TEXT' ||
    type === 'CHEERPJ_RUN'
  );
}

function getDisplayArtifacts(team: MilestonePresentation) {
  return team.artifacts.filter(isDisplayArtifact);
}

function getDisplayMembers(team: MilestonePresentation): DisplayTeamMember[] {
  const members = team.project?.teamOperation?.members;
  if (!Array.isArray(members)) return [];

  return members.filter(
    (member): member is DisplayTeamMember =>
      Boolean(member) &&
      typeof member === 'object' &&
      Number.isSafeInteger((member as { id?: unknown }).id) &&
      typeof (member as { studentNumber?: unknown }).studentNumber ===
        'string' &&
      typeof (member as { isLeader?: unknown }).isLeader === 'boolean',
  );
}

function findPdfArtifact(artifacts: StudentSubmissionArtifact[]) {
  for (const artifact of artifacts) {
    if (artifact.type !== 'FILE') continue;
    const fileName = artifact.fileName ?? '';
    if (artifact.mimeType !== 'application/pdf' && !/\.pdf$/i.test(fileName))
      continue;
    const url = safeSubmissionUrl(artifact.downloadUrl);
    if (url)
      return {
        fileKey: String(
          artifact.fileId ?? artifact.requiredArtifactId ?? fileName,
        ),
        title: fileName || '발표 자료',
        url,
      };
  }
  return null;
}

function artifactLabel(artifact: StudentSubmissionArtifact, index: number) {
  if (artifact.type === 'TEXT') {
    return artifact.fileName ?? `텍스트 자료 ${index + 1}`;
  }
  return artifact.fileName ?? artifact.url ?? `제출 자료 ${index + 1}`;
}

function artifactTextContent(artifact: StudentSubmissionArtifact) {
  return artifact.type === 'TEXT' && artifact.content?.trim()
    ? artifact.content
    : null;
}

function artifactUrl(artifact: StudentSubmissionArtifact) {
  return safeSubmissionUrl(
    artifact.type === 'FILE' ? artifact.downloadUrl : artifact.url,
  );
}

function artifactTypeLabel(artifact: StudentSubmissionArtifact) {
  switch (artifact.type) {
    case 'FILE':
      return '파일';
    case 'LINK':
      return '링크';
    case 'TEXT':
      return '텍스트';
    case 'CHEERPJ_RUN':
      return '실행 자료';
  }
}

function toPositiveTeamId(value: string | undefined) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function AdminPresentationProgressPage({
  milestoneId,
  sectionId,
  teamId,
}: AdminPresentationProgressPageProps) {
  const currentUser = useAuthStore(state => state.currentUser);
  const isProfessor = currentUser?.globalRole === 'PROFESSOR';
  const presentationsQuery = useAdminMilestonePresentationsQuery(
    milestoneId,
    isProfessor && Boolean(sectionId),
  );
  const presentations = useMemo(
    () => [...(presentationsQuery.data ?? [])].sort(comparePresentations),
    [presentationsQuery.data],
  );
  const requestedTeamId = toPositiveTeamId(teamId);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    requestedTeamId,
  );
  const professorEvaluationQuery = useAdminProfessorPresentationEvaluationQuery(
    sectionId,
    milestoneId,
    selectedTeamId === null ? undefined : String(selectedTeamId),
    isProfessor,
  );
  const saveProfessorEvaluationMutation =
    useUpdateAdminProfessorPresentationEvaluationMutation();
  const [professorScores, setProfessorScores] = useState<
    Record<number, number | null>
  >({});
  const [professorMemo, setProfessorMemo] = useState('');
  const [professorEvaluationError, setProfessorEvaluationError] = useState<
    string | null
  >(null);
  const [professorEvaluationSavedAt, setProfessorEvaluationSavedAt] = useState<
    string | null
  >(null);
  const [materialRefreshVersion, setMaterialRefreshVersion] = useState(0);
  const [pendingTeamId, setPendingTeamId] = useState<number | null>(null);

  const hasUnsavedProfessorEvaluation = useMemo(() => {
    const evaluation = professorEvaluationQuery.data;
    if (!evaluation?.editable) return false;

    return (
      professorMemo !== (evaluation.memo ?? '') ||
      evaluation.scores.some(
        score => (professorScores[score.criterionId] ?? null) !== score.score,
      )
    );
  }, [professorEvaluationQuery.data, professorMemo, professorScores]);

  async function refreshPresentationMaterials() {
    const result = await presentationsQuery.refetch();
    if (!result.isError) {
      setMaterialRefreshVersion(current => current + 1);
    }
  }

  useEffect(() => {
    if (!presentations.length) {
      setSelectedTeamId(null);
      return;
    }
    if (
      requestedTeamId !== null &&
      presentations.some(team => team.teamId === requestedTeamId) &&
      selectedTeamId !== requestedTeamId
    ) {
      setSelectedTeamId(requestedTeamId);
      return;
    }
    if (!presentations.some(team => team.teamId === selectedTeamId)) {
      setSelectedTeamId(presentations[0]!.teamId);
    }
  }, [presentations, requestedTeamId, selectedTeamId]);

  useEffect(() => {
    if (!professorEvaluationQuery.data) return;
    setProfessorScores(
      Object.fromEntries(
        professorEvaluationQuery.data.scores.map(score => [
          score.criterionId,
          score.score,
        ]),
      ),
    );
    setProfessorMemo(professorEvaluationQuery.data.memo ?? '');
    setProfessorEvaluationError(null);
  }, [professorEvaluationQuery.data]);

  useEffect(() => {
    setProfessorEvaluationSavedAt(null);
    setProfessorEvaluationError(null);
    setPendingTeamId(null);
  }, [selectedTeamId]);

  function requestTeamChange(nextTeamId: number) {
    if (nextTeamId === selectedTeamId) return;
    if (hasUnsavedProfessorEvaluation) {
      setPendingTeamId(nextTeamId);
      return;
    }
    setSelectedTeamId(nextTeamId);
  }

  function confirmTeamChange() {
    if (pendingTeamId === null) return;
    setSelectedTeamId(pendingTeamId);
    setPendingTeamId(null);
  }

  const selectedIndex = Math.max(
    0,
    presentations.findIndex(team => team.teamId === selectedTeamId),
  );
  const selectedTeam = presentations[selectedIndex];

  if (!milestoneId) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={<BackToPresentationList sectionId={sectionId} />}
          description='발표 평가 목록에서 진행할 발표 마일스톤을 선택해 주세요.'
          title='발표 마일스톤을 확인할 수 없습니다.'
        />
      </main>
    );
  }

  if (!isProfessor) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={<BackToPresentationList sectionId={sectionId} />}
          description='발표 자료와 진행 화면은 해당 분반 담당 교수만 확인할 수 있습니다.'
          title='담당 교수 전용 화면입니다.'
        />
      </main>
    );
  }

  if (!sectionId) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={<BackToPresentationList />}
          description='발표 평가 목록에서 분반을 선택한 뒤 다시 열어 주세요.'
          title='분반 정보를 확인할 수 없습니다.'
        />
      </main>
    );
  }

  if (presentationsQuery.isPending) {
    return (
      <main className={styles.page}>
        <Text aria-live='polite' role='status'>
          발표 자료를 불러오는 중입니다.
        </Text>
      </main>
    );
  }

  if (presentationsQuery.isError && !presentationsQuery.data) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={
            <Button
              label='다시 시도'
              onClick={() => void presentationsQuery.refetch()}
              variant='secondary'
            />
          }
          description='담당 분반과 로그인 권한을 확인한 뒤 다시 시도해 주세요.'
          title='발표 자료를 불러오지 못했습니다.'
        />
      </main>
    );
  }

  if (!selectedTeam) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={<BackToPresentationList sectionId={sectionId} />}
          description='발표 순서와 발표 자료 제출 여부를 확인해 주세요.'
          title='표시할 발표 팀이 없습니다.'
        />
      </main>
    );
  }

  const project = selectedTeam.project;
  const teamLabel = selectedTeam.teamName ?? `${selectedTeam.teamId}팀`;
  const screens = getDisplayScreens(selectedTeam);
  const members = getDisplayMembers(selectedTeam);
  const artifacts = getDisplayArtifacts(selectedTeam);
  const pdf = findPdfArtifact(artifacts);
  const isFirst = selectedIndex === 0;
  const isLast = selectedIndex === presentations.length - 1;

  return (
    <main className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <Heading level={1}>발표 자료 보기·평가</Heading>
          <Text color='secondary' type='supporting'>
            발표 순서에 따라 팀의 제안서와 제출 자료를 확인합니다. 자료가
            교체되면 새로 고침으로 최신 자료를 확인하세요.
          </Text>
        </div>
        <BackToPresentationList sectionId={sectionId} />
      </div>

      <div className={styles.progressRow}>
        <HStack align='center' gap={2}>
          <Badge
            label={
              selectedTeam.presentationOrder
                ? `${selectedTeam.presentationOrder}번째 발표`
                : '발표 순서 미지정'
            }
            variant={selectedTeam.presentationOrder ? 'success' : 'neutral'}
          />
          <Text weight='medium'>
            {teamLabel} · {project?.title ?? '제안서 미작성'}
          </Text>
          <Badge
            label={
              professorEvaluationQuery.isPending
                ? '교수자 평가 확인 중'
                : professorEvaluationQuery.isError
                  ? '교수자 평가 확인 불가'
                  : professorEvaluationQuery.data?.submittedAt
                    ? '교수자 평가 저장됨'
                    : '교수자 평가 미저장'
            }
            variant={
              professorEvaluationQuery.data?.submittedAt ? 'success' : 'neutral'
            }
          />
        </HStack>
        <HStack gap={2}>
          <Button
            isDisabled={isFirst || saveProfessorEvaluationMutation.isPending}
            label='이전 팀'
            onClick={() =>
              requestTeamChange(presentations[selectedIndex - 1]!.teamId)
            }
            type='button'
            variant='secondary'
          />
          <Button
            isDisabled={isLast || saveProfessorEvaluationMutation.isPending}
            label='다음 팀'
            onClick={() =>
              requestTeamChange(presentations[selectedIndex + 1]!.teamId)
            }
            type='button'
          />
        </HStack>
      </div>

      {presentationsQuery.isError ? (
        <Text role='alert'>
          최신 발표 자료를 불러오지 못했습니다. 현재 표시 중인 자료를
          유지합니다.
        </Text>
      ) : null}

      <div className={styles.contentGrid}>
        <VStack gap={4}>
          <section className={styles.section}>
            <Heading level={2}>프로젝트 소개</Heading>
            <Card padding={4}>
              {project ? (
                <VStack gap={3}>
                  <div>
                    <Text weight='medium'>
                      {project.title ?? '프로젝트 제목 없음'}
                    </Text>
                    <Text>
                      {project.description ?? '프로젝트 설명이 없습니다.'}
                    </Text>
                  </div>
                  {project.goal && project.goal !== project.description ? (
                    <div>
                      <Text weight='medium'>프로젝트 목표</Text>
                      <Text>{project.goal}</Text>
                    </div>
                  ) : null}
                  {project.projectSchedule ? (
                    <div>
                      <Text weight='medium'>프로젝트 일정</Text>
                      <Text>{project.projectSchedule}</Text>
                    </div>
                  ) : null}
                  {safeSubmissionUrl(project.repositoryUrl) ? (
                    <a
                      className={styles.link}
                      href={safeSubmissionUrl(project.repositoryUrl)}
                      rel='noreferrer'
                      target='_blank'
                    >
                      프로젝트 저장소 열기
                    </a>
                  ) : null}
                </VStack>
              ) : (
                <Text color='secondary' role='status'>
                  제안서를 작성하지 않아 프로젝트 소개를 표시할 수 없습니다.
                </Text>
              )}
            </Card>
          </section>

          <section className={styles.section}>
            <Heading level={2}>화면 구성</Heading>
            {screens.length ? (
              <div className={styles.imageGrid}>
                {screens.map((screen, index) => (
                  <Card
                    key={`${screen.imageFileId ?? index}:${screen.title ?? ''}`}
                    padding={3}
                  >
                    <figure className={styles.screenCard}>
                      <img
                        alt={screen.title || `화면 ${index + 1}`}
                        className={styles.screenImage}
                        src={screen.imageUrl}
                      />
                      <figcaption className={styles.screenCaption}>
                        <Text weight='medium'>
                          {screen.title || `화면 ${index + 1}`}
                        </Text>
                        {screen.description ? (
                          <Text color='secondary' type='supporting'>
                            {screen.description}
                          </Text>
                        ) : null}
                      </figcaption>
                    </figure>
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding={4}>
                <Text color='secondary' role='status'>
                  제안서에 등록된 화면 이미지가 없습니다.
                </Text>
              </Card>
            )}
          </section>
        </VStack>

        <VStack gap={4}>
          <section className={styles.section}>
            <Heading level={2}>팀원 역할</Heading>
            <Card padding={4}>
              {members.length ? (
                <ul className={styles.list}>
                  {members.map(member => (
                    <li className={styles.item} key={member.id}>
                      <Text weight='medium'>
                        {member.name ?? member.studentNumber}
                        {member.isLeader ? ' · 팀장' : ''}
                      </Text>
                      <Text color='secondary' type='supporting'>
                        {member.projectRole ?? '역할 미입력'}
                      </Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text color='secondary' role='status'>
                  팀원 역할 정보가 없습니다.
                </Text>
              )}
            </Card>
          </section>

          <section className={styles.section}>
            <HStack align='center' gap={1}>
              <Heading level={2}>발표 자료</Heading>
              <IconButton
                icon={<RotateCw aria-hidden='true' size={18} />}
                isLoading={presentationsQuery.isFetching}
                label='발표 자료 새로 고침'
                onClick={() => void refreshPresentationMaterials()}
                size='sm'
                tooltip='학생이 교체한 최신 발표 자료를 불러옵니다.'
                variant='ghost'
              />
            </HStack>
            <Card padding={4}>
              {artifacts.length ? (
                <ul className={styles.list}>
                  {artifacts.map((artifact, index) => {
                    const label = artifactLabel(artifact, index);
                    const url = artifactUrl(artifact);
                    const textContent = artifactTextContent(artifact);
                    return (
                      <li
                        className={styles.item}
                        key={`${artifact.requiredArtifactId ?? index}:${label}`}
                      >
                        {url ? (
                          <a
                            className={styles.link}
                            href={url}
                            rel='noreferrer'
                            target='_blank'
                          >
                            {label}
                          </a>
                        ) : (
                          <Text weight='medium'>{label}</Text>
                        )}
                        <Text color='secondary' type='supporting'>
                          {artifactTypeLabel(artifact)}
                        </Text>
                        {textContent ? (
                          <Text className={styles.artifactTextContent}>
                            {textContent}
                          </Text>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Text color='secondary' role='status'>
                  제출된 발표 자료가 없습니다.
                </Text>
              )}
            </Card>
            {pdf ? (
              <PdfPreview
                // Manual refresh should also replace an otherwise identical file's renewed URL.
                fileKey={`${pdf.fileKey}:${materialRefreshVersion}`}
                onReload={() => void refreshPresentationMaterials()}
                title={pdf.title}
                url={pdf.url}
              />
            ) : null}
          </section>

          <ProfessorEvaluationCard
            error={professorEvaluationError}
            isLoading={professorEvaluationQuery.isPending}
            isPending={saveProfessorEvaluationMutation.isPending}
            isRetrying={professorEvaluationQuery.isFetching}
            onMemoChange={nextMemo => {
              setProfessorEvaluationSavedAt(null);
              setProfessorMemo(nextMemo);
            }}
            onRetry={() => void professorEvaluationQuery.refetch()}
            onSave={() => {
              if (!sectionId || !milestoneId || selectedTeamId === null) return;
              const evaluation = professorEvaluationQuery.data;
              if (!evaluation?.editable) return;
              if (professorMemo.length > 5000) {
                setProfessorEvaluationError(
                  '교수자 메모는 5,000자 이하로 입력해 주세요.',
                );
                return;
              }
              const scores = evaluation.scores.map(score => ({
                criterionId: score.criterionId,
                score: professorScores[score.criterionId] ?? Number.NaN,
              }));
              if (
                scores.some(
                  (score, index) =>
                    !Number.isInteger(score.score) ||
                    score.score < 0 ||
                    score.score > evaluation.scores[index]!.maxScore,
                )
              ) {
                setProfessorEvaluationError(
                  '모든 평가 항목의 점수를 범위 안에서 입력해 주세요.',
                );
                return;
              }
              setProfessorEvaluationError(null);
              setProfessorEvaluationSavedAt(null);
              saveProfessorEvaluationMutation.mutate(
                {
                  memo: professorMemo.trim() || null,
                  milestoneId,
                  scores,
                  sectionId,
                  teamId: String(selectedTeamId),
                },
                {
                  onSuccess: evaluation => {
                    setProfessorEvaluationSavedAt(evaluation.submittedAt);
                  },
                  onError: requestError => {
                    const error = toAdminMilestoneRequestError(requestError);
                    setProfessorEvaluationError(
                      error.code === 'TEAM_EVALUATION_CLOSED'
                        ? '평가 기간이 종료되어 교수자 평가를 수정할 수 없습니다.'
                        : '교수자 평가를 저장하지 못했습니다. 담당 분반과 입력값을 확인해 주세요.',
                    );
                  },
                },
              );
            }}
            onScoreChange={(criterionId, score) => {
              setProfessorEvaluationSavedAt(null);
              setProfessorScores(current => ({
                ...current,
                [criterionId]: score,
              }));
            }}
            memo={professorMemo}
            savedAt={professorEvaluationSavedAt}
            scores={professorScores}
            value={professorEvaluationQuery.data}
          />
        </VStack>
      </div>
      <AlertDialog
        actionLabel='저장하지 않고 이동'
        actionVariant='destructive'
        cancelLabel='계속 작성'
        description='입력한 교수자 점수와 메모는 저장되지 않습니다. 저장한 뒤 이동하거나, 저장하지 않고 다음 팀으로 이동할 수 있습니다.'
        isOpen={pendingTeamId !== null}
        onAction={confirmTeamChange}
        onOpenChange={nextIsOpen => {
          if (!nextIsOpen) setPendingTeamId(null);
        }}
        title='저장하지 않은 교수자 평가가 있습니다'
      />
    </main>
  );
}

function ProfessorEvaluationCard({
  error,
  isLoading,
  isPending,
  isRetrying,
  memo,
  onMemoChange,
  onRetry,
  onSave,
  onScoreChange,
  savedAt,
  scores,
  value,
}: {
  error: string | null;
  isLoading: boolean;
  isPending: boolean;
  isRetrying: boolean;
  memo: string;
  onMemoChange: (value: string) => void;
  onRetry: () => void;
  onSave: () => void;
  onScoreChange: (criterionId: number, value: number | null) => void;
  savedAt: string | null;
  scores: Record<number, number | null>;
  value:
    | {
        editable: boolean;
        memo: string | null;
        scores: Array<{
          criterionId: number;
          maxScore: number;
          score: number | null;
          title: string;
        }>;
        submittedAt: string | null;
      }
    | undefined;
}) {
  return (
    <section className={styles.section}>
      <Heading level={2}>교수자 평가</Heading>
      <Card padding={4}>
        <VStack gap={3}>
          <Text color='secondary' type='supporting'>
            교수자 점수는 학생 평균에 포함되지 않으며, 메모는 학생에게 공개되지
            않습니다.
          </Text>
          {isLoading ? (
            <Text aria-live='polite' role='status'>
              교수자 평가를 불러오는 중입니다.
            </Text>
          ) : !value ? (
            <VStack gap={2}>
              <Text role='alert'>교수자 평가를 불러오지 못했습니다.</Text>
              <div>
                <Button
                  isLoading={isRetrying}
                  label='다시 시도'
                  onClick={onRetry}
                  size='sm'
                  type='button'
                  variant='secondary'
                />
              </div>
            </VStack>
          ) : (
            <>
              {value.submittedAt ? (
                <Text color='secondary' type='supporting'>
                  마지막 저장: {formatCourseScheduleDateTime(value.submittedAt)}
                </Text>
              ) : (
                <Text color='secondary' type='supporting'>
                  아직 저장된 교수자 평가가 없습니다.
                </Text>
              )}
              {!value.editable ? (
                <Text color='secondary' role='status' type='supporting'>
                  평가 기간이 종료되어 저장된 교수자 평가를 읽기 전용으로
                  표시합니다.
                </Text>
              ) : null}
              {value.scores.map(score => (
                <HStack
                  align='center'
                  className={styles.scoreRow}
                  gap={2}
                  key={score.criterionId}
                  justify='between'
                >
                  <Text>
                    {score.title} · {score.maxScore}점
                  </Text>
                  <NumberInput
                    aria-label={`${score.title} 점수`}
                    isDisabled={!value.editable || isPending}
                    isIntegerOnly
                    isLabelHidden
                    label={`${score.title} 점수`}
                    max={score.maxScore}
                    min={0}
                    onChange={next => onScoreChange(score.criterionId, next)}
                    value={scores[score.criterionId] ?? null}
                    width={112}
                  />
                </HStack>
              ))}
              <TextArea
                isDisabled={!value.editable || isPending}
                label='교수자 메모'
                onChange={onMemoChange}
                placeholder='학생에게 공개되지 않는 발표 메모를 남길 수 있습니다.'
                value={memo}
                width='100%'
              />
              {error ? <Text role='alert'>{error}</Text> : null}
              {savedAt ? (
                <Text aria-live='polite' role='status' weight='medium'>
                  교수자 평가를 저장했습니다. 저장 시각:{' '}
                  {formatCourseScheduleDateTime(savedAt)}
                </Text>
              ) : null}
              {value.editable ? (
                <HStack justify='end'>
                  <Button
                    isLoading={isPending}
                    label='교수자 평가 저장'
                    onClick={onSave}
                    type='button'
                  />
                </HStack>
              ) : null}
            </>
          )}
        </VStack>
      </Card>
    </section>
  );
}

function BackToPresentationList({ sectionId }: { sectionId?: string }) {
  return (
    <Link
      className={styles.backLink}
      search={{
        milestoneId: 'presentation-evaluate',
        sectionId,
      }}
      to={ROUTES.ADMIN_SUBMISSIONS}
    >
      ← 발표 평가 목록으로
    </Link>
  );
}
