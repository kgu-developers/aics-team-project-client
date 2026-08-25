import { EmptyState, Heading, Text } from '@aics/design-system';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { type KeyboardEvent, useRef } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';

import { AdminMilestoneSubmissionCard } from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionCard';
import * as cardStyles from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionCard.css';

import * as styles from './AdminSubmissionsPage.css';

const previewSubmissions = [
  {
    id: 'proposal-oop-01-a',
    leaderName: '김ㅇㅇ',
    submittedAt: '2026/09/05',
    teamName: 'OOP-01 - 1팀',
    topic: '구독 관리 가계부 프로젝트',
  },
  {
    id: 'proposal-oop-01-b',
    leaderName: '김ㅇㅇ',
    submittedAt: '2026/09/06',
    teamName: 'OOP-01 - 2팀',
    topic: '구독 관리 가계부 프로젝트',
  },
] as const;

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
    isListAvailable: false,
    label: '발표 평가',
  },
  { id: 'final-report', isListAvailable: true, label: '최종 보고서' },
  { id: 'peer-review', isListAvailable: true, label: '상호 평가' },
] as const;

type MilestoneTabId = (typeof MILESTONE_TABS)[number]['id'];

function isMilestoneTabId(value: string | undefined): value is MilestoneTabId {
  return MILESTONE_TABS.some(tab => tab.id === value);
}

function getSubmissionSummary(
  milestoneId: MilestoneTabId,
  submission: (typeof previewSubmissions)[number],
) {
  switch (milestoneId) {
    case 'midterm':
      return (
        <>
          <Text>첨부 파일 수: -</Text>
          <Text>피드백: -</Text>
        </>
      );
    case 'presentation-submit':
      return (
        <>
          <Text>PPT 파일: -</Text>
          <Text>시연 파일(zip): -</Text>
          <Text>링크: -</Text>
        </>
      );
    case 'final-report':
      return (
        <>
          <Text>보고서(pdf): -</Text>
          <Text>전체 파일(zip): -</Text>
        </>
      );
    case 'peer-review':
      return <Text>제출자 수: -</Text>;
    default:
      return (
        <>
          <Text className={styles.topic}>주제: {submission.topic}</Text>
          <Text>팀장: {submission.leaderName}</Text>
        </>
      );
  }
}

export default function AdminSubmissionsPage() {
  const navigate = useNavigate();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const search = useSearch({ from: '/admin/submissions' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const { milestoneId, sectionId } = search;
  const activeMilestoneId = isMilestoneTabId(milestoneId)
    ? milestoneId
    : 'proposal';
  const activeTab = MILESTONE_TABS.find(tab => tab.id === activeMilestoneId);

  if (!activeTab) return null;

  function selectTab(index: number) {
    const tab = MILESTONE_TABS[index];
    if (!tab) return;

    navigate({
      search: { milestoneId: tab.id, sectionId },
      to: ROUTES.ADMIN_SUBMISSIONS,
    });
    tabRefs.current[index]?.focus();
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
          <Text className={styles.description}>
            {sectionId ?? '담당 분반'} · {activeTab.label}
          </Text>
        </div>
        <Text className={styles.readOnly}>조회 전용</Text>
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
          {activeTab.isListAvailable ? (
            <>
              <Heading level={2}>{activeTab.label} 목록</Heading>
              <div className={styles.list}>
                {previewSubmissions.map(submission => (
                  <AdminMilestoneSubmissionCard
                    detailAction={
                      <Link
                        className={cardStyles.detailLink}
                        params={{ submissionId: submission.id }}
                        search={{ milestoneId: activeTab.id, sectionId }}
                        to={ROUTES.ADMIN_SUBMISSION_DETAIL}
                      >
                        상세보기
                      </Link>
                    }
                    key={submission.id}
                    label={submission.teamName}
                    meetingCountLabel='회의록: -'
                    messageCountLabel='쪽지: -'
                    secondaryLabel={submission.submittedAt}
                    summary={getSubmissionSummary(activeTab.id, submission)}
                  />
                ))}
              </div>
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
