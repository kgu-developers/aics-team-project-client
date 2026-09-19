import type {
  MidReportFeedback,
  MilestonePresentation,
  ProposalFeedbackResponse,
  StudentHomeFeedbackMessage,
  StudentHomeFile,
  StudentHomeMilestoneBody,
  StudentHomeSectionStatus,
} from '@aics/core';
import {
  Button,
  Dialog,
  Heading,
  HStack,
  StatusDot,
  Text,
  TextArea,
  useToast,
  type StatusDotVariant,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { type FormEvent, type ReactNode, useState } from 'react';

import { seoulInstant } from '~/shared/lib/seoulInstant';

import { useMilestonePresentationsQuery } from '~/features/evaluation/queries';
import ProjectTopicBoard from '~/features/project-topic/ProjectTopicBoard';
import {
  useProposalFeedbackQuery,
  useMidReportFeedbackQuery,
  useSubmitMidReportFeedbackMutation,
  useSubmitProposalFeedbackResponseMutation,
} from '~/features/student-feedback/queries';
import { documentFeedbackStageCopy } from '~/features/student-home/model/documentFeedbackStage';
import { safeSubmissionUrl } from '~/features/submission/submissionUploadInput';

import * as styles from './MilestoneDetails.css';
import StudentSubmissionMaterials from './StudentSubmissionMaterials';
import SubmissionMaterials from './SubmissionMaterials';

type MilestoneDetailsProps = {
  milestoneId?: string;
  body: StudentHomeMilestoneBody;
};

const SECTION_STATUS_VARIANT: Record<
  StudentHomeSectionStatus['status'],
  StatusDotVariant
> = {
  completed: 'success',
  'in-progress': 'accent',
  'not-started': 'neutral',
};

function SectionBanner({ title }: { title: string }) {
  return <p className={styles.sectionBanner}>{title}</p>;
}

function ProjectSummary({
  title,
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <div className={styles.projectSummary}>
      {title ? <p className={styles.projectTitle}>{title}</p> : null}
      <p className={styles.projectDescription}>{description}</p>
    </div>
  );
}

function FeedbackList({
  feedback,
}: {
  feedback: StudentHomeFeedbackMessage[];
}) {
  return (
    <div className={styles.feedbackList}>
      {feedback.map(message => (
        <div className={styles.feedbackItem} key={message.id}>
          <p className={styles.feedbackTitle}>{message.title}</p>
          <p className={styles.feedbackContent}>{message.content}</p>
        </div>
      ))}
    </div>
  );
}

const submittedAtFormatter = new Intl.DateTimeFormat('ko-KR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Seoul',
});

function formatSubmittedAt(value: string) {
  const instant = seoulInstant(value);
  return Number.isNaN(instant) ? value : submittedAtFormatter.format(instant);
}

function getFeedbackSubmitErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;

  switch (error.response?.status) {
    case 401:
      return '로그인 상태를 확인한 뒤 다시 시도해 주세요.';
    case 403:
      return '현재 팀의 피드백만 작성할 수 있어요.';
    case 404:
      return '피드백 대상을 찾지 못했어요. 최신 화면에서 다시 확인해 주세요.';
    case 409:
      return '다른 팀원이 먼저 제출했거나 문서 상태가 바뀌었어요. 최신 상태를 확인해 주세요.';
    default:
      return fallback;
  }
}

function SubmittedProposalResponse({
  response,
}: {
  response: ProposalFeedbackResponse;
}) {
  return (
    <article className={styles.feedbackItem}>
      <p className={styles.feedbackTitle}>
        {response.submittedBy} · 반영 답변 (
        {formatSubmittedAt(response.submittedAt)})
      </p>
      <p className={styles.feedbackContent}>{response.content}</p>
    </article>
  );
}

function SubmittedMidReportFeedback({
  feedback,
}: {
  feedback: MidReportFeedback;
}) {
  return (
    <article className={styles.feedbackItem}>
      <p className={styles.feedbackTitle}>
        {feedback.submittedBy} · 반영 기록 (
        {formatSubmittedAt(feedback.submittedAt)})
      </p>
      <p className={styles.feedbackContent}>{feedback.content}</p>
    </article>
  );
}

function ProposalFeedbackResponseForm({
  canSubmit,
  blockedReason,
  teamId,
  placeholder,
}: {
  canSubmit: boolean;
  blockedReason?: string;
  teamId?: string;
  placeholder: string;
}) {
  const toast = useToast();
  const mutation = useSubmitProposalFeedbackResponseMutation(teamId);
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setValidationError('피드백을 어떻게 반영했는지 입력해 주세요.');
      return;
    }

    setValidationError(null);
    mutation.mutate(
      { content: trimmedContent },
      {
        onSuccess: () => {
          setContent('');
          toast({ body: '피드백 반영 답변을 제출했어요.' });
        },
      },
    );
  }

  const errorMessage = validationError
    ? validationError
    : mutation.isError
      ? getFeedbackSubmitErrorMessage(
          mutation.error,
          '답변을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.',
        )
      : null;
  const isDisabled = !teamId || !canSubmit || mutation.isPending;

  return (
    <form className={styles.feedbackForm} onSubmit={handleSubmit}>
      {!canSubmit && blockedReason ? (
        <p className={styles.feedbackBlocked}>{blockedReason}</p>
      ) : null}
      <TextArea
        isDisabled={isDisabled}
        isRequired
        label='피드백 반영 답변'
        onChange={value => {
          setContent(value);
          if (validationError) setValidationError(null);
          if (mutation.isError) mutation.reset();
        }}
        placeholder={placeholder}
        rows={4}
        status={
          errorMessage ? { message: errorMessage, type: 'error' } : undefined
        }
        value={content}
      />
      <HStack justify='end'>
        <Button
          isDisabled={isDisabled}
          label={mutation.isPending ? '답변 보내는 중...' : '답변 보내기'}
          tooltip={!canSubmit ? blockedReason : undefined}
          type='submit'
        />
      </HStack>
    </form>
  );
}

function FeedbackStageCard({
  action,
  message,
}: {
  action?: ReactNode;
  message: string;
}) {
  return (
    <div className={styles.feedbackStageCard} role='status'>
      <p className={styles.feedbackStageText}>{message}</p>
      {action}
    </div>
  );
}

function MidReportFeedbackForm({
  canSubmit,
  blockedReason,
  onSuccess,
  submitLabel = '반영 기록 남기기',
  teamId,
}: {
  canSubmit: boolean;
  blockedReason?: string;
  onSuccess?: () => void;
  submitLabel?: string;
  teamId?: string;
}) {
  const toast = useToast();
  const mutation = useSubmitMidReportFeedbackMutation(teamId);
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      setValidationError('대면 피드백과 반영 내용을 입력해 주세요.');
      return;
    }

    setValidationError(null);
    mutation.mutate(
      {
        content: trimmedContent,
      },
      {
        onSuccess: () => {
          setContent('');
          toast({ body: '대면 피드백 반영 기록을 제출했어요.' });
          onSuccess?.();
        },
      },
    );
  }

  const errorMessage = validationError
    ? validationError
    : mutation.isError
      ? getFeedbackSubmitErrorMessage(
          mutation.error,
          '반영 기록을 남기지 못했습니다. 잠시 후 다시 시도해 주세요.',
        )
      : null;
  const isDisabled = !teamId || !canSubmit || mutation.isPending;

  return (
    <form className={styles.feedbackForm} onSubmit={handleSubmit}>
      {!canSubmit && blockedReason ? (
        <p className={styles.feedbackBlocked}>{blockedReason}</p>
      ) : null}
      <TextArea
        description='대면 피드백에서 들은 내용과 이를 문서와 프로젝트에 어떻게 반영했는지 함께 작성해 주세요.'
        isDisabled={isDisabled}
        isRequired
        label='대면 피드백 반영 내용'
        onChange={value => {
          setContent(value);
          if (validationError) setValidationError(null);
          if (mutation.isError) mutation.reset();
        }}
        placeholder='교수님이 말씀해 주신 내용과 수정·반영한 사항을 함께 적어 주세요.'
        rows={6}
        status={
          errorMessage ? { message: errorMessage, type: 'error' } : undefined
        }
        value={content}
      />
      <HStack justify='end'>
        <Button
          isDisabled={isDisabled}
          label={mutation.isPending ? '보내는 중...' : submitLabel}
          tooltip={!canSubmit ? blockedReason : undefined}
          type='submit'
        />
      </HStack>
    </form>
  );
}

function SectionStatusList({
  sections,
}: {
  sections: StudentHomeSectionStatus[];
}) {
  return (
    <ul className={styles.sectionList}>
      {sections.map(section => {
        const content = (
          <>
            <span className={styles.sectionLabelWrap}>
              <span className={styles.sectionLabel}>{section.label}</span>
              {section.updatedAt ? (
                <span className={styles.sectionUpdatedAt}>
                  ({section.updatedAt})
                </span>
              ) : null}
            </span>
            <span className={styles.statusWithLabel}>
              <StatusDot
                label={section.statusLabel}
                variant={SECTION_STATUS_VARIANT[section.status]}
              />
              <span className={styles.statusText}>{section.statusLabel}</span>
            </span>
          </>
        );

        return (
          <li className={styles.sectionRow} key={section.id}>
            {section.to ? (
              <Link className={styles.sectionLink} to={section.to}>
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ul>
  );
}

function PresentationTeamDetails({
  presentations,
}: {
  presentations: MilestonePresentation[];
}) {
  const teams = [...presentations].sort(
    (left, right) =>
      (left.presentationOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.presentationOrder ?? Number.MAX_SAFE_INTEGER) ||
      left.teamId - right.teamId,
  );

  return (
    <>
      {teams.map(team => {
        const project = team.project;
        const materials = team.artifacts.flatMap((artifact, index) => {
          if (artifact.type !== 'FILE' && artifact.type !== 'LINK') return [];
          const value = artifact.fileName ?? artifact.url ?? undefined;
          return [
            {
              extension:
                artifact.type === 'FILE'
                  ? (artifact.fileName?.split('.').pop()?.toUpperCase() ??
                    'FILE')
                  : 'LINK',
              href: safeSubmissionUrl(
                artifact.type === 'FILE' ? artifact.downloadUrl : artifact.url,
              ),
              id: `${team.submissionId}:${index}`,
              kind: artifact.type,
              label: artifact.type === 'FILE' ? '제출 파일' : '제출 링크',
              value,
            },
          ];
        });
        return (
          <section className={styles.feedbackList} key={team.teamId}>
            <SectionBanner
              title={
                team.presentationOrder == null
                  ? `${team.teamName ?? `${team.teamId}팀`} · 발표 순서 미정`
                  : `${team.presentationOrder}번 발표 · ${team.teamName ?? `${team.teamId}팀`}`
              }
            />
            <ProjectSummary
              description={
                project?.description ??
                project?.goal ??
                '프로젝트 설명이 등록되지 않았어요.'
              }
              title={project?.title ?? '프로젝트 제목이 등록되지 않았어요.'}
            />
            {project?.goal && project.goal !== project.description ? (
              <p className={styles.guide}>목표: {project.goal}</p>
            ) : null}
            {safeSubmissionUrl(project?.repositoryUrl) ? (
              <a
                className={styles.sectionLink}
                href={safeSubmissionUrl(project?.repositoryUrl)}
                rel='noreferrer'
                target='_blank'
              >
                프로젝트 저장소 열기
              </a>
            ) : null}
            <SubmissionMaterials
              materials={materials}
              showMetadataTitle={false}
            />
          </section>
        );
      })}
    </>
  );
}

function FileRow({ file }: { file: StudentHomeFile }) {
  return (
    <div className={styles.fileRow}>
      <span aria-hidden='true' className={styles.fileIcon}>
        {file.extension}
      </span>
      <span className={styles.fileInfo}>
        <span className={styles.fileName}>{file.name}</span>
      </span>
    </div>
  );
}

function TopicBody({
  body,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'topic' }>;
}) {
  return (
    <div className={styles.root}>
      <p className={styles.guidance}>{body.guidance}</p>
      <ProjectTopicBoard embedded />
    </div>
  );
}

function ProposalBody({
  body,
}: {
  body:
    | Extract<StudentHomeMilestoneBody, { kind: 'proposal' }>
    | Extract<StudentHomeMilestoneBody, { kind: 'mid-review' }>;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='최종 선정 주제' />
      <ProjectSummary
        description={body.project.description}
        title={body.project.title}
      />
      <SectionBanner title='작성 영역별 상태' />
      <SectionStatusList sections={body.sections} />
    </div>
  );
}

function ProposalFeedbackBody({
  body: sourceBody,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'proposal-feedback' }>;
}) {
  const body = useProposalFeedbackQuery(sourceBody);
  // Undefined stage keeps the legacy always-visible room (previews, fixtures).
  const stage = body.feedbackStage ?? 'feedback-arrived';
  return (
    <div className={styles.root}>
      {stage === 'not-submitted' ? null : stage === 'feedback-arrived' ? (
        <>
          <SectionBanner title='피드백 대화' />
          <FeedbackList feedback={body.feedback} />
          <SectionBanner title='피드백 반영 답변' />
          {body.studentResponse ? (
            <SubmittedProposalResponse response={body.studentResponse} />
          ) : (
            <ProposalFeedbackResponseForm
              key={body.teamId}
              teamId={body.teamId}
              blockedReason={body.responseBlockedReason}
              canSubmit={body.canSubmitResponse}
              placeholder={body.replyPlaceholder}
            />
          )}
        </>
      ) : (
        <>
          <SectionBanner title='피드백' />
          <FeedbackStageCard
            message={
              stage === 'unknown'
                ? (body.responseBlockedReason ??
                  documentFeedbackStageCopy.proposal.checking)
                : documentFeedbackStageCopy.proposal.awaiting
            }
          />
        </>
      )}
      <SectionBanner title='작성 영역별 상태' />
      <SectionStatusList sections={body.sections} />
      <p className={styles.guide}>{body.guide}</p>
    </div>
  );
}

function MidReportFeedbackBody({
  body: sourceBody,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'mid-review-feedback' }>;
}) {
  const body = useMidReportFeedbackQuery(sourceBody);
  const stage = body.feedbackStage ?? 'feedback-arrived';
  const [isFirstMessageOpen, setIsFirstMessageOpen] = useState(false);
  return (
    <div className={styles.root}>
      {stage === 'not-submitted' ? null : stage === 'feedback-arrived' ? (
        <>
          <SectionBanner title='대면 피드백 반영 기록' />
          {body.studentFeedback ? (
            <SubmittedMidReportFeedback feedback={body.studentFeedback} />
          ) : (
            <MidReportFeedbackForm
              key={body.teamId}
              teamId={body.teamId}
              blockedReason={body.responseBlockedReason}
              canSubmit={body.canSubmitResponse}
            />
          )}
        </>
      ) : (
        <>
          <SectionBanner title='대면 피드백' />
          <FeedbackStageCard
            action={
              stage === 'awaiting-feedback' ? (
                <Button
                  isDisabled={!body.canSubmitResponse}
                  label='반영 방향 보내기'
                  onClick={() => setIsFirstMessageOpen(true)}
                  size='sm'
                  tooltip={
                    !body.canSubmitResponse
                      ? body.responseBlockedReason
                      : undefined
                  }
                />
              ) : undefined
            }
            message={
              stage === 'unknown'
                ? (body.responseBlockedReason ??
                  documentFeedbackStageCopy.midReport.checking)
                : documentFeedbackStageCopy.midReport.awaiting
            }
          />
          {/* The first message is a deliberate act: it starts the feedback
              conversation and must not be sent while the report is still
              being written, so it lives in a dialog instead of an inline box. */}
          <Dialog
            aria-label='대면 피드백 반영 방향 보내기'
            isOpen={isFirstMessageOpen}
            onOpenChange={open => {
              if (!open) setIsFirstMessageOpen(false);
            }}
            purpose='form'
            width={560}
          >
            <div className={styles.feedbackDialogContent}>
              <Heading level={2}>대면 피드백 반영 방향 보내기</Heading>
              <Text color='secondary'>
                중간보고서를 제출하고 대면 피드백을 받은 뒤에 보내 주세요. 보낸
                내용은 담당 교수·조교 쪽지함으로 전달되고, 이후 대화는 이
                화면에서 이어집니다.
              </Text>
              <MidReportFeedbackForm
                key={body.teamId}
                teamId={body.teamId}
                blockedReason={body.responseBlockedReason}
                canSubmit={body.canSubmitResponse}
                onSuccess={() => setIsFirstMessageOpen(false)}
                submitLabel='반영 방향 보내기'
              />
              <HStack justify='end'>
                <Button
                  label='취소'
                  onClick={() => setIsFirstMessageOpen(false)}
                  variant='secondary'
                />
              </HStack>
            </div>
          </Dialog>
        </>
      )}
      {body.feedback.length > 0 ? (
        <>
          <SectionBanner title='피드백 대화' />
          <FeedbackList feedback={body.feedback} />
        </>
      ) : null}
      <SectionBanner title='작성 영역별 상태' />
      <SectionStatusList sections={body.sections} />
      <p className={styles.guide}>{body.guide}</p>
    </div>
  );
}

function PresentationMaterialBody({
  body,
  milestoneId,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'presentation-material' }>;
  milestoneId?: string;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='최종 선정 주제' />
      <ProjectSummary
        description={body.project.description}
        title={body.project.title}
      />
      <SectionBanner title='제출 자료' />
      {milestoneId && /^\d+$/.test(milestoneId) ? (
        <StudentSubmissionMaterials milestoneId={milestoneId} />
      ) : (
        <SubmissionMaterials
          materials={body.materials}
          metadata={body.submission}
          showMetadataTitle={false}
        />
      )}
    </div>
  );
}

function PresentationEvaluationBody({
  body,
  milestoneId,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'presentation-evaluation' }>;
  milestoneId?: string;
}) {
  const presentationsQuery = useMilestonePresentationsQuery(milestoneId ?? '');
  return (
    <div className={styles.root}>
      {presentationsQuery.isPending ? (
        <p className={styles.guide}>발표 팀 정보를 불러오는 중이에요.</p>
      ) : null}
      {presentationsQuery.isSuccess ? (
        presentationsQuery.data.length ? (
          <PresentationTeamDetails presentations={presentationsQuery.data} />
        ) : (
          <p className={styles.guide}>제출된 발표 자료가 아직 없어요.</p>
        )
      ) : null}
      {presentationsQuery.isError ? (
        <p className={styles.guide}>발표 팀 정보를 불러오지 못했어요.</p>
      ) : null}
      <p className={styles.guide}>{body.timeGuide}</p>
    </div>
  );
}

function FinalReportBody({
  body,
  milestoneId,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'final-report' }>;
  milestoneId?: string;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='최종보고서 작성 공지사항' />
      <ProjectSummary description={body.notice.description} />
      {body.notice.file ? <FileRow file={body.notice.file} /> : null}
      {milestoneId && /^\d+$/.test(milestoneId) ? (
        <StudentSubmissionMaterials milestoneId={milestoneId} />
      ) : (
        <SubmissionMaterials
          materials={body.materials}
          metadata={body.submission}
        />
      )}
    </div>
  );
}

function PeerEvaluationBody({
  body,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'peer-evaluation' }>;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='내 상호평가 작성 상태' />
      <SectionStatusList sections={body.sections} />
      <p className={styles.guide}>
        프로젝트 평가와 팀원 기여도 평가를 모두 작성한 뒤 한 번에 제출합니다.
      </p>
    </div>
  );
}

export default function MilestoneDetails({
  body,
  milestoneId,
}: MilestoneDetailsProps) {
  switch (body.kind) {
    case 'topic':
      return <TopicBody body={body} />;
    case 'proposal':
    case 'mid-review':
      return <ProposalBody body={body} />;
    case 'proposal-feedback':
      return <ProposalFeedbackBody body={body} />;
    case 'mid-review-feedback':
      return <MidReportFeedbackBody body={body} />;
    case 'presentation-material':
      return <PresentationMaterialBody body={body} milestoneId={milestoneId} />;
    case 'presentation-evaluation':
      return (
        <PresentationEvaluationBody body={body} milestoneId={milestoneId} />
      );
    case 'final-report':
      return <FinalReportBody body={body} milestoneId={milestoneId} />;
    case 'peer-evaluation':
      return <PeerEvaluationBody body={body} />;
  }
}
