import { Heading, Text } from '@aics/design-system';
import { Link, useSearch } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminSubmissionsPage.css';

const previewSubmissions = [
  {
    id: 'proposal-oop-01-a',
    leaderName: '김ㅇㅇ',
    meetingCount: 2,
    messageCount: 1,
    submittedAt: '2026/09/05',
    teamName: 'OOP-01 - A팀',
    topic: '구독 관리 가계부 프로젝트',
  },
  {
    id: 'proposal-oop-01-b',
    leaderName: '김ㅇㅇ',
    meetingCount: 2,
    messageCount: 1,
    submittedAt: '2026/09/06',
    teamName: 'OOP-01 - B팀',
    topic: '구독 관리 가계부 프로젝트',
  },
  {
    id: 'proposal-oop-01-c',
    leaderName: '김ㅇㅇ',
    meetingCount: 2,
    messageCount: 1,
    submittedAt: '2026/09/07',
    teamName: 'OOP-01 - C팀',
    topic: '구독 관리 가계부 프로젝트',
  },
] as const;

export default function AdminSubmissionsPage() {
  const search = useSearch({ from: '/admin/submissions' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const { milestoneId, sectionId } = search;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Heading level={1}>분반별 제출물</Heading>
          <Text className={styles.description}>
            {sectionId ?? '담당 분반'} · {milestoneId ?? '첫 번째 마일스톤'}
          </Text>
        </div>
        <Text className={styles.readOnly}>조회 전용</Text>
      </div>

      <section className={styles.listSection}>
        <Heading level={2}>제안서 목록</Heading>
        <div className={styles.list}>
          {previewSubmissions.map(submission => (
            <article className={styles.submission} key={submission.id}>
              <div className={styles.submissionMeta}>
                <Text className={styles.teamName}>{submission.teamName}</Text>
                <Text className={styles.date}>{submission.submittedAt}</Text>
              </div>
              <div className={styles.submissionContent}>
                <div className={styles.submissionSummary}>
                  <Text className={styles.topic}>주제: {submission.topic}</Text>
                  <Text>팀장: {submission.leaderName}</Text>
                </div>
                <div className={styles.submissionFooter}>
                  <div className={styles.footerMetric}>
                    <Text>회의록: {submission.meetingCount}개</Text>
                  </div>
                  <div className={styles.footerMetric}>
                    <Text>쪽지: {submission.messageCount}개</Text>
                  </div>
                  <Link
                    className={styles.detailLink}
                    params={{ submissionId: submission.id }}
                    search={{ milestoneId, sectionId }}
                    to={ROUTES.ADMIN_SUBMISSION_DETAIL}
                  >
                    상세보기
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
