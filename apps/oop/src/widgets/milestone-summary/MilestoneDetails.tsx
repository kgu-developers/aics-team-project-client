import type {
  StudentHomeFeedbackMessage,
  StudentHomeFile,
  StudentHomeMilestoneBody,
  StudentHomeSectionStatus,
  StudentHomeTeamStatus,
} from '@aics/core';
import { FileInput, StatusDot, type StatusDotVariant } from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import * as styles from './MilestoneDetails.css';
import TopicCandidateCard from './TopicCandidateCard';

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

function ReplyComposer({ placeholder }: { placeholder: string }) {
  return (
    <div className={styles.replyComposer}>
      <p className={styles.replyPlaceholder}>{placeholder}</p>
    </div>
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
            {team.isMine ? <span className={styles.teamMine}>내 팀</span> : null}
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
        <span className={styles.fileMeta}>{file.meta}</span>
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
      <div className={styles.topics}>
        {body.topicCandidates.map(candidate => (
          <TopicCandidateCard candidate={candidate} key={candidate.id} />
        ))}
      </div>
      <div className={styles.completion}>
        <p className={styles.completionLabel}>{body.completion.label}</p>
        <p className={styles.completionValue}>{body.completion.value}</p>
      </div>
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
  body:
    | Extract<StudentHomeMilestoneBody, { kind: 'proposal-feedback' }>
    | Extract<StudentHomeMilestoneBody, { kind: 'mid-review-feedback' }>;
}) {
  return (
    <div className={styles.root}>
      <SectionBanner title='교수 피드백' />
      <FeedbackList feedback={body.feedback} />
      {'replyPlaceholder' in body ? (
        <ReplyComposer placeholder={body.replyPlaceholder} />
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
      <SectionBanner title='작성 영역별 상태' />
      <SectionStatusList sections={body.sections} />
      {body.recentFile ? <FileRow file={body.recentFile} /> : null}
    </div>
  );
}

function PresentationEvaluationBody({
  body,
}: {
  body: Extract<
    StudentHomeMilestoneBody,
    { kind: 'presentation-evaluation' }
  >;
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
      <FileInput
        description={body.uploadHint}
        disabledMessage='파일 업로드는 추후 제공 예정이에요.'
        isDisabled
        label='제출 파일'
        mode='dropzone'
        onChange={() => {}}
        placeholder='Drop files or click to upload'
        value={null}
      />
      {body.submittedFile ? <FileRow file={body.submittedFile} /> : null}
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
      <SectionBanner title='작성 영역별 상태' />
      <SectionStatusList sections={body.sections} />
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
    case 'mid-review-feedback':
      return <ProposalFeedbackBody body={body} />;
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
