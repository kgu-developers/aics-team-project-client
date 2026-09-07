import { Card, EmptyState, Heading, Text } from '@aics/design-system';

import { ROUTES } from '~/app/constants/routes';

import { useLiveStudentHomeQuery } from '~/features/student-home/queries';

import * as styles from './LiveStudentHomePage.css';
import StudentHomeHero from './StudentHomeHero';
import StudentHomeShortcutState from './StudentHomeShortcutState';

export default function LiveStudentHomePage() {
  const home = useLiveStudentHomeQuery();

  if (home.missingSection) {
    return (
      <EmptyState
        title='소속 분반을 확인해 주세요.'
        description={home.missingSection}
        headingLevel={2}
      />
    );
  }

  return (
    <div className={styles.root}>
      <StudentHomeHero
        hero={{
          date: new Intl.DateTimeFormat('ko-KR', { dateStyle: 'long' }).format(
            new Date(),
          ),
          heading: home.teamName ? `${home.teamName}의 학생 홈` : '학생 홈',
          description:
            '공지사항과 최근 회의록, 내가 맡은 액션 플랜을 확인해 보세요.',
          ctaLabel: '우리 팀 보기',
          actionTo: ROUTES.STUDENT.TEAM,
        }}
        sectionId={home.sectionId}
        announcements={home.notices.items}
        recentMeetingRecords={home.meetings.items}
        assignedActions={home.actions.items}
        noticeState={home.notices.state}
        recordState={home.meetings.state}
        actionState={home.actions.state}
        meetingMetadataState={home.meetings.metadataState}
        canCreateMeeting={Boolean(home.teamId)}
      />
      <Card className={styles.card}>
        <section
          aria-labelledby='student-home-project-heading'
          className={styles.section}
        >
          <Heading id='student-home-project-heading' level={2}>
            우리 팀 프로젝트
          </Heading>
          {home.project.state.status !== 'ready' ? (
            <StudentHomeShortcutState
              state={home.project.state}
              label='프로젝트'
            />
          ) : home.project.data ? (
            <>
              <Heading level={3}>
                {home.project.data.title?.trim() ||
                  '프로젝트 제목이 아직 없어요.'}
              </Heading>
              <Text>
                {home.project.data.description?.trim() ||
                  '프로젝트 설명이 아직 없어요.'}
              </Text>
            </>
          ) : (
            <Text>등록된 프로젝트가 없어요.</Text>
          )}
        </section>
      </Card>
      {/* KD3-190 composes its topic board here with the same section/team context. */}
      <Card className={styles.card}>
        <section
          aria-labelledby='student-home-milestone-heading'
          className={styles.section}
        >
          <Heading id='student-home-milestone-heading' level={2}>
            마일스톤 일정
          </Heading>
          <Text>
            현재 학생 홈에서는 마일스톤 일정과 진행 상태를 확인할 수 없어요.
            공지사항에서 안내된 일정을 확인해 주세요.
          </Text>
        </section>
      </Card>
    </div>
  );
}
