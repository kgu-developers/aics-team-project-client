import type { StudentHomeMilestoneBody } from '@aics/core';
import {
  EmptyState,
  StatusDot,
  type StatusDotVariant,
} from '@aics/design-system';

import * as styles from './MilestoneDetails.css';
import TopicCandidateCard from './TopicCandidateCard';

type MilestoneDetailsProps = {
  body: StudentHomeMilestoneBody;
};

const CONTENT_STATUS_VARIANT: Record<
  'completed' | 'in-progress' | 'not-started',
  StatusDotVariant
> = {
  completed: 'success',
  'in-progress': 'accent',
  'not-started': 'neutral',
};

export default function MilestoneDetails({ body }: MilestoneDetailsProps) {
  if (body.kind === 'proposal') {
    return (
      <div className={styles.root}>
        <p className={styles.guidance}>{body.guidance}</p>
        {body.topicCandidates.length > 0 ? (
          <div className={styles.topics}>
            {body.topicCandidates.map(candidate => (
              <TopicCandidateCard candidate={candidate} key={candidate.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            description='팀원이 주제를 등록하면 투표할 수 있어요.'
            headingLevel={4}
            isCompact
            title='등록된 주제 후보가 없어요.'
          />
        )}
        <div className={styles.completion}>
          <p className={styles.completionLabel}>{body.completion.label}</p>
          <p className={styles.completionValue}>{body.completion.value}</p>
        </div>
      </div>
    );
  }

  if (body.kind === 'submission') {
    return (
      <div className={styles.root}>
        <p className={styles.guidance}>{body.guidance}</p>
        <section aria-label='제출 항목' className={styles.panel}>
          <p className={styles.panelTitle}>제출 항목</p>
          {body.artifacts.length > 0 ? (
            <ul className={styles.artifactList}>
              {body.artifacts.map(artifact => (
                <li className={styles.artifact} key={artifact.id}>
                  <div>
                    <p className={styles.artifactLabel}>{artifact.label}</p>
                    <p className={styles.artifactDetail}>{artifact.detail}</p>
                  </div>
                  <span className={styles.statusWithLabel}>
                    <StatusDot
                      label={
                        artifact.status === 'submitted'
                          ? '제출 완료'
                          : '제출 전'
                      }
                      variant={
                        artifact.status === 'submitted' ? 'success' : 'neutral'
                      }
                    />
                    <span className={styles.statusText}>
                      {artifact.status === 'submitted'
                        ? '제출 완료'
                        : '제출 전'}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              description='제출 항목이 정해지면 이곳에 표시돼요.'
              headingLevel={4}
              isCompact
              title='등록된 제출 항목이 없어요.'
            />
          )}
        </section>
        {body.reviewSummary ? (
          <p className={styles.notice}>{body.reviewSummary}</p>
        ) : null}
      </div>
    );
  }

  if (body.kind === 'presentation') {
    return (
      <div className={styles.root}>
        <p className={styles.guidance}>{body.guidance}</p>
        <section aria-label='최종 선정 주제' className={styles.panel}>
          <p className={styles.panelTitle}>최종 선정 주제</p>
          <p className={styles.projectTitle}>{body.project.title}</p>
          <p className={styles.projectDescription}>
            {body.project.description}
          </p>
        </section>
        <section aria-label='발표 자료 작성 현황' className={styles.panel}>
          <p className={styles.panelTitle}>발표 자료 작성 현황</p>
          {body.contentItems.length > 0 ? (
            <ul className={styles.contentList}>
              {body.contentItems.map(item => (
                <li className={styles.contentItem} key={item.id}>
                  <div>
                    <p className={styles.contentLabel}>{item.label}</p>
                    {item.updatedAt ? (
                      <p className={styles.contentUpdatedAt}>
                        {item.updatedAt}
                      </p>
                    ) : null}
                  </div>
                  <span className={styles.statusWithLabel}>
                    <StatusDot
                      label={item.statusLabel}
                      variant={CONTENT_STATUS_VARIANT[item.status]}
                    />
                    <span className={styles.statusText}>
                      {item.statusLabel}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              description='발표 자료 항목이 정해지면 이곳에 표시돼요.'
              headingLevel={4}
              isCompact
              title='등록된 발표 자료 항목이 없어요.'
            />
          )}
        </section>
        {body.evaluationWindow ? (
          <p className={styles.notice}>{body.evaluationWindow}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <p className={styles.guidance}>{body.guidance}</p>
      <p className={styles.notice}>{body.evaluationWindow}</p>
      <div className={styles.completion}>
        <p className={styles.completionLabel}>{body.completion.label}</p>
        <p className={styles.completionValue}>{body.completion.value}</p>
      </div>
    </div>
  );
}
