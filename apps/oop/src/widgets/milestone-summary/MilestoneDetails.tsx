import type {
  MidReportFeedback,
  ProposalFeedbackResponse,
  StudentHomeFeedbackMessage,
  StudentHomeFile,
  StudentHomeMilestoneBody,
  StudentHomeSectionStatus,
  StudentHomeTeamStatus,
} from '@aics/core';
import {
  Button,
  HStack,
  StatusDot,
  TextArea,
  useToast,
  type StatusDotVariant,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { type FormEvent, useState } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import ProjectTopicBoard from '~/features/project-topic/ProjectTopicBoard';
import {
  useSubmitMidReportFeedbackMutation,
  useSubmitProposalFeedbackResponseMutation,
} from '~/features/student-feedback/queries';

import * as styles from './MilestoneDetails.css';
import SubmissionMaterials from './SubmissionMaterials';

type MilestoneDetailsProps = {
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

function formatSubmittedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
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
  reviewId,
  placeholder,
}: {
  canSubmit: boolean;
  blockedReason?: string;
  reviewId: string;
  placeholder: string;
}) {
  const toast = useToast();
  const sectionId = useAuthStore(
    state => state.currentUser?.sections[0]?.id ?? '',
  );
  const mutation = useSubmitProposalFeedbackResponseMutation(sectionId);
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
      { reviewId, content: trimmedContent },
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
  const isDisabled = !sectionId || !canSubmit || mutation.isPending;

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

function MidReportFeedbackForm({
  canSubmit,
  blockedReason,
  submissionId,
}: {
  canSubmit: boolean;
  blockedReason?: string;
  submissionId: string;
}) {
  const toast = useToast();
  const sectionId = useAuthStore(
    state => state.currentUser?.sections[0]?.id ?? '',
  );
  const mutation = useSubmitMidReportFeedbackMutation(sectionId);
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
        submissionId,
        content: trimmedContent,
      },
      {
        onSuccess: () => {
          setContent('');
          toast({ body: '대면 피드백 반영 기록을 제출했어요.' });
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
  const isDisabled = !sectionId || !canSubmit || mutation.isPending;

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
          label={
            mutation.isPending ? '반영 기록 남기는 중...' : '반영 기록 남기기'
          }
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

function TeamList({ teams }: { teams: StudentHomeTeamStatus[] }) {
  return (
    <ul className={styles.sectionList}>
      {teams.map(team => (
        <li className={styles.sectionRow} key={team.id}>
          <span className={styles.sectionLabelWrap}>
            <span className={styles.sectionLabel}>{team.label}</span>
            {team.isMine ? (
              <span className={styles.teamMine}>내 팀</span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
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
  body,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'proposal-feedback' }>;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='교수 피드백' />
      <FeedbackList feedback={body.feedback} />
      <SectionBanner title='피드백 반영 답변' />
      {body.studentResponse ? (
        <SubmittedProposalResponse response={body.studentResponse} />
      ) : (
        <ProposalFeedbackResponseForm
          blockedReason={body.responseBlockedReason}
          canSubmit={body.canSubmitResponse}
          placeholder={body.replyPlaceholder}
          reviewId={body.reviewId}
        />
      )}
      <SectionBanner title='작성 영역별 상태' />
      <SectionStatusList sections={body.sections} />
      <p className={styles.guide}>{body.guide}</p>
    </div>
  );
}

function MidReportFeedbackBody({
  body,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'mid-review-feedback' }>;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='대면 피드백 반영 기록' />
      {body.studentFeedback ? (
        <SubmittedMidReportFeedback feedback={body.studentFeedback} />
      ) : (
        <MidReportFeedbackForm
          blockedReason={body.responseBlockedReason}
          canSubmit={body.canSubmitResponse}
          submissionId={body.submissionId}
        />
      )}
      {body.feedback.length > 0 ? (
        <>
          <SectionBanner title='교수 추가 답변' />
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
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'presentation-material' }>;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='최종 선정 주제' />
      <ProjectSummary
        description={body.project.description}
        title={body.project.title}
      />
      <SectionBanner title='제출 자료' />
      <SubmissionMaterials
        materials={body.materials}
        metadata={body.submission}
        showMetadataTitle={false}
      />
    </div>
  );
}

function PresentationEvaluationBody({
  body,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'presentation-evaluation' }>;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='내 팀 발표 자료' />
      <ProjectSummary
        description={body.project.description}
        title={body.project.title}
      />
      <p className={styles.guide}>{body.orderGuide}</p>
      <SectionBanner title='팀별 상태' />
      <TeamList teams={body.teams} />
      <p className={styles.guide}>{body.timeGuide}</p>
    </div>
  );
}

function FinalReportBody({
  body,
}: {
  body: Extract<StudentHomeMilestoneBody, { kind: 'final-report' }>;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='최종보고서 작성 공지사항' />
      <ProjectSummary description={body.notice.description} />
      {body.notice.file ? <FileRow file={body.notice.file} /> : null}
      <SubmissionMaterials
        materials={body.materials}
        metadata={body.submission}
      />
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

export default function MilestoneDetails({ body }: MilestoneDetailsProps) {
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
      return <PresentationMaterialBody body={body} />;
    case 'presentation-evaluation':
      return <PresentationEvaluationBody body={body} />;
    case 'final-report':
      return <FinalReportBody body={body} />;
    case 'peer-evaluation':
      return <PeerEvaluationBody body={body} />;
  }
}
