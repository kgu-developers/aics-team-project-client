import { Button, Card, EmptyState, Heading, Text } from '@aics/design-system';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import { useAdminProjectProposalQuery } from '~/features/admin-milestone-review/queries';
import { safeDisplayUrl } from '~/features/submission/submissionUploadInput';

import * as styles from './AdminProposalDocument.css';

export default function AdminProposalDocument({
  sectionId,
  teamId,
}: {
  sectionId: string;
  teamId: string;
}) {
  const query = useAdminProjectProposalQuery(sectionId, teamId);
  if (query.isPending) {
    if (query.fetchStatus === 'fetching')
      return <Text role='status'>제안서를 불러오는 중입니다.</Text>;
    return (
      <EmptyState
        title='제안서를 불러올 수 없습니다.'
        description={
          query.fetchStatus === 'paused'
            ? '네트워크 연결 후 다시 확인해 주세요.'
            : '담당 분반과 팀을 확인해 주세요.'
        }
      />
    );
  }
  if (query.isError)
    return (
      <EmptyState
        title='제안서를 불러오지 못했습니다.'
        description='담당 분반과 팀을 확인한 뒤 다시 시도해 주세요.'
        actions={
          <Button label='다시 시도' onClick={() => void query.refetch()} />
        }
      />
    );
  const project = query.data;
  if (!project) return <EmptyState title='아직 작성한 제안서가 없습니다.' />;
  return (
    <Card className={styles.document}>
      <Heading level={2}>{project.title}</Heading>
      <Text>
        {project.proposalCompletedAt
          ? `제출 완료 · ${formatSeoulDateTime(project.proposalCompletedAt)}`
          : '작성 중'}
      </Text>
      <section className={styles.section}>
        <Heading level={3}>1. 주제</Heading>
        <Text className={styles.content}>{project.description}</Text>
        <Heading level={4}>프로젝트 목표</Heading>
        <Text className={styles.content}>{project.goal}</Text>
      </section>
      <section className={styles.section}>
        <Heading level={3}>2. 데이터 구성</Heading>
        {project.dataConfiguration.map((item, index) => (
          <div className={styles.section} key={index}>
            <Text>{item.name || '데이터'}</Text>
            <Text className={styles.content}>{item.description}</Text>
            <Text>{item.expectedCount}</Text>
          </div>
        ))}
      </section>
      <section className={styles.section}>
        <Heading level={3}>3. 화면 구성</Heading>
        {project.screenConfiguration.map((screen, index) => {
          const imageUrl = safeDisplayUrl(screen.imageUrl);
          return (
            <figure className={styles.section} key={index}>
              <figcaption>{screen.title || '화면'}</figcaption>
              {imageUrl ? (
                <img
                  className={styles.image}
                  src={imageUrl}
                  alt={screen.title || '제안서 화면'}
                />
              ) : null}
              <Text className={styles.content}>{screen.description}</Text>
            </figure>
          );
        })}
      </section>
      <section className={styles.section}>
        <Heading level={3}>4. 팀 운영 방식</Heading>
        <Text>{project.teamOperation.name}</Text>
        {project.teamOperation.members.map(member => (
          <Text key={member.studentNumber}>
            {member.name ?? member.studentNumber}
            {member.isLeader ? ' (팀장)' : ''} ·{' '}
            {member.projectRole || '역할 미정'}
          </Text>
        ))}
        <Heading level={4}>팀 규칙</Heading>
        <Text className={styles.content}>
          {project.teamOperation.kickoffRule || '-'}
        </Text>
        <Heading level={4}>회의 일정</Heading>
        <Text className={styles.content}>
          {project.teamOperation.meetingSchedule || '-'}
        </Text>
        <Heading level={4}>프로젝트 일정</Heading>
        <Text className={styles.content}>{project.projectSchedule || '-'}</Text>
        <Heading level={4}>저장소</Heading>
        <Text className={styles.content}>{project.repositoryUrl || '-'}</Text>
      </section>
    </Card>
  );
}
