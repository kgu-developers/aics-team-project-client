import { Card, EmptyState, Heading, Text } from '@aics/design-system';
import { Link, useParams } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { useAdminMeetingRecordDetailQuery } from '~/features/admin-meeting/queries';
import AdminStudentDetailDialog from '~/features/admin-student-team/components/AdminStudentDetailDialog';
import { useAdminSectionEnrollmentsQuery } from '~/features/admin-student-team/queries';

import * as styles from './AdminMeetingDetailPage.css';

export default function AdminMeetingDetailPage() {
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const { meetingId } = useParams({ from: '/admin/meetings/$meetingId' });
  const query = useAdminMeetingRecordDetailQuery(meetingId);
  const enrollmentsQuery = useAdminSectionEnrollmentsQuery(
    query.data ? String(query.data.sectionId) : undefined,
  );

  if (query.isPending) {
    return (
      <div className={styles.page}>
        <Text aria-live='polite' role='status'>
          회의록을 불러오는 중입니다.
        </Text>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='삭제되었거나 존재하지 않거나, 담당 분반의 회의록이 아닙니다.'
          title='회의록을 찾을 수 없습니다.'
        />
      </div>
    );
  }

  const record = query.data;
  const participants = record.participantIds.map(participantId => {
    const student = enrollmentsQuery.data?.contents.find(
      candidate => candidate.studentNumber === participantId,
    );

    return {
      id: participantId,
      major: student?.major ?? null,
      name: student?.name ?? participantId,
    };
  });
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>회의록 &gt; {record.title}</Heading>
        <Link className={styles.backLink} to={ROUTES.ADMIN_MEETINGS}>
          ← 회의록 목록으로
        </Link>
      </div>
      <Card className={styles.document}>
        <div>
          <Heading level={2}>{record.title}</Heading>
          <div className={styles.metadata}>
            <Text>{record.sectionName}</Text>
            <Link
              className={styles.teamLink}
              params={{ teamId: String(record.teamId) }}
              search={{ sectionId: String(record.sectionId) }}
              to={ROUTES.ADMIN_TEAM_DETAIL}
            >
              {record.teamName}
            </Link>
            <Text>{record.meetingAt}</Text>
            {record.location ? <Text>{record.location}</Text> : null}
          </div>
        </div>
        <section>
          <Heading level={2}>참석자</Heading>
          <div className={styles.participantList}>
            {participants.map(participant => (
              <button
                className={styles.participant}
                key={participant.id}
                onClick={() => setSelectedParticipantId(participant.id)}
                type='button'
              >
                {participant.name}
              </button>
            ))}
          </div>
        </section>
        <section>
          <Heading level={2}>회의 내용</Heading>
          <Text className={styles.content}>
            {record.content || '작성된 회의 내용이 없습니다.'}
          </Text>
        </section>
        <Text color='secondary' type='supporting'>
          최초 작성 {record.authorId} · 최종 수정 {record.updatedAt}
        </Text>
      </Card>
      <AdminStudentDetailDialog
        major={
          participants.find(item => item.id === selectedParticipantId)?.major
        }
        studentNumber={selectedParticipantId}
        onClose={() => setSelectedParticipantId(null)}
      />
    </div>
  );
}
