import { Card, EmptyState, Heading, Text } from '@aics/design-system';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { getRichTextPlainText } from '~/features/admin-meeting/model';
import { useAdminMeetingRecordQuery } from '~/features/admin-meeting/queries';
import { useAdminReadState } from '~/features/admin-read-state/useAdminReadState';
import StudentDetailDialog from '~/features/admin-student-team/components/StudentDetailDialog';
import { useAdminStudentsQuery } from '~/features/admin-student-team/queries/useAdminStudentsQuery';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminMeetingDetailPage.css';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(
    new Date(value),
  );
}

export default function AdminMeetingDetailPage() {
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const currentUser = useAuthStore(state => state.currentUser);
  const { meetingId } = useParams({ from: '/admin/meetings/$meetingId' });
  const search = useSearch({ from: '/admin/meetings/$meetingId' }) as {
    sectionId?: string;
    teamId?: string;
  };
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const isAccessibleSection = Boolean(
    search.sectionId && accessibleSectionIds.includes(search.sectionId),
  );
  const query = useAdminMeetingRecordQuery(
    meetingId,
    search.sectionId,
    isAccessibleSection,
  );
  const { markAsRead } = useAdminReadState('meetings', {
    adminId: currentUser?.id,
  });
  useEffect(() => {
    if (query.data?.id && search.sectionId && isAccessibleSection) {
      markAsRead(search.sectionId, query.data.id);
    }
  }, [query.data?.id, search.sectionId, isAccessibleSection, markAsRead]);
  const studentsQuery = useAdminStudentsQuery(
    isAccessibleSection ? (search.sectionId ?? '') : '',
  );

  if (!search.sectionId || !isAccessibleSection) {
    return (
      <div className={styles.page}>
        <EmptyState
          description='담당 분반의 회의록만 조회할 수 있습니다.'
          title='접근할 수 없는 분반입니다.'
        />
      </div>
    );
  }

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
          description='삭제되었거나 존재하지 않는 회의록입니다.'
          title='회의록을 찾을 수 없습니다.'
        />
      </div>
    );
  }

  const record = query.data;
  const selectedStudent = selectedParticipantId
    ? (studentsQuery.data?.find(
        student => student.id === selectedParticipantId,
      ) ?? null)
    : null;

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>회의록 &gt; {record.title}</Heading>
        <Link
          className={styles.backLink}
          search={{ sectionId: search.sectionId, teamId: search.teamId }}
          to={ROUTES.ADMIN_MEETINGS}
        >
          ← 회의록 목록으로
        </Link>
      </div>
      <Card className={styles.document}>
        <div>
          <Heading level={2}>{record.title}</Heading>
          <div className={styles.metadata}>
            <Text>{record.sectionLabel}</Text>
            <Link
              className={styles.teamLink}
              params={{ teamId: record.teamId }}
              to={ROUTES.ADMIN_TEAM_DETAIL}
            >
              {record.teamLabel}
            </Link>
            <Text>{formatDate(record.heldAt)}</Text>
            {record.location ? <Text>{record.location}</Text> : null}
          </div>
        </div>
        <section>
          <Heading level={2}>참석자</Heading>
          <div className={styles.participantList}>
            {record.participants.map(participant => (
              <button
                className={styles.participant}
                key={participant.userId}
                onClick={() => setSelectedParticipantId(participant.userId)}
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
            {getRichTextPlainText(record.content) ||
              '작성된 회의 내용이 없습니다.'}
          </Text>
        </section>
        <Text color='secondary' type='supporting'>
          최초 작성 {record.createdBy.name} · 최종 수정{' '}
          {formatDate(record.updatedAt)}
        </Text>
      </Card>
      <StudentDetailDialog
        isOpen={selectedStudent !== null}
        onClose={() => setSelectedParticipantId(null)}
        student={selectedStudent}
      />
    </div>
  );
}
