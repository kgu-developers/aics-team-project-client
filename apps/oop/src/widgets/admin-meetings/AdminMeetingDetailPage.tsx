import {
  Button,
  Card,
  EmptyState,
  Heading,
  Pagination,
  Text,
} from '@aics/design-system';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import RichTextViewer from '~/shared/ui/RichTextViewer';

import {
  AdminMeetingActionTable,
  AdminMeetingEditLogTable,
} from '~/features/admin-meeting/components';
import {
  formatAdminMeetingDateTime,
  formatAdminMeetingPhase,
  getRichTextPlainText,
} from '~/features/admin-meeting/model';
import {
  useAdminMeetingRecordDetailQuery,
  useAdminSectionMeetingActionsQuery,
  useAdminSectionMeetingRecordLogsQuery,
} from '~/features/admin-meeting/queries';
import { useAdminMeetingReadState } from '~/features/admin-meeting-read/useAdminMeetingReadState';
import AdminStudentDetailDialog from '~/features/admin-student-team/components/AdminStudentDetailDialog';
import { useAdminSectionEnrollmentsQuery } from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';
import { parseMeetingContent } from '~/features/meeting/model/studentMeeting';

import * as styles from './AdminMeetingDetailPage.css';

export default function AdminMeetingDetailPage() {
  const [selectedParticipantId, setSelectedParticipantId] = useState<
    string | null
  >(null);
  const [actionPage, setActionPage] = useState(0);
  const [editLogPage, setEditLogPage] = useState(0);
  const { meetingId } = useParams({ from: '/admin/meetings/$meetingId' });
  const currentUser = useAuthStore(state => state.currentUser);
  const { markAsRead } = useAdminMeetingReadState(currentUser?.id);
  const query = useAdminMeetingRecordDetailQuery(meetingId);
  const actionsQuery = useAdminSectionMeetingActionsQuery(
    currentUser?.sections.map(section => section.id) ?? [],
    query.data ? String(query.data.sectionId) : undefined,
    query.data
      ? { meetingRecordId: query.data.id, page: actionPage, size: 20 }
      : undefined,
  );
  const editLogsQuery = useAdminSectionMeetingRecordLogsQuery(
    currentUser?.sections.map(section => section.id) ?? [],
    query.data ? String(query.data.sectionId) : undefined,
    query.data
      ? { meetingRecordId: query.data.id, page: editLogPage, size: 20 }
      : undefined,
  );
  const enrollmentsQuery = useAdminSectionEnrollmentsQuery(
    query.data ? String(query.data.sectionId) : undefined,
  );

  useEffect(() => {
    if (query.isSuccess && query.data) {
      markAsRead(query.data.id);
    }
  }, [markAsRead, query.data, query.isSuccess]);
  useEffect(() => {
    setActionPage(0);
    setEditLogPage(0);
  }, [query.data?.id]);

  const editLogPagination = editLogsQuery.data?.pageable;
  const actionPagination = actionsQuery.data?.pageable;
  const boundedActionPage = actionPagination
    ? Math.max(
        0,
        Math.min(actionPagination.page, actionPagination.totalPages - 1),
      )
    : actionPage;
  const boundedEditLogPage = editLogPagination
    ? Math.max(
        0,
        Math.min(editLogPagination.page, editLogPagination.totalPages - 1),
      )
    : editLogPage;

  useEffect(() => {
    if (!actionsQuery.isSuccess || actionPage === boundedActionPage) return;

    setActionPage(boundedActionPage);
  }, [actionPage, actionsQuery.isSuccess, boundedActionPage]);

  useEffect(() => {
    if (!editLogsQuery.isSuccess || editLogPage === boundedEditLogPage) return;

    setEditLogPage(boundedEditLogPage);
  }, [boundedEditLogPage, editLogPage, editLogsQuery.isSuccess]);

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
  const actions = actionsQuery.data?.contents ?? [];
  const editLogs = editLogsQuery.data?.contents ?? [];
  const content = parseMeetingContent(record.content);
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
            <Text>{formatAdminMeetingDateTime(record.meetingAt)}</Text>
            <Text>회의 단계: {formatAdminMeetingPhase(record.phase)}</Text>
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
          {getRichTextPlainText(content).trim() ? (
            <RichTextViewer content={content} />
          ) : (
            <Text>작성된 회의 내용이 없습니다.</Text>
          )}
        </section>
        <Text color='secondary' type='supporting'>
          최초 작성 {record.authorId} · 최종 수정{' '}
          {record.updatedAt
            ? formatAdminMeetingDateTime(record.updatedAt)
            : '-'}
        </Text>
      </Card>
      <section className={styles.actionsSection}>
        <div className={styles.actionsTitleRow}>
          <div>
            <Heading level={2}>액션플랜</Heading>
            <Text color='secondary'>
              이 회의록에서 등록한 액션플랜만 표시합니다.
            </Text>
          </div>
          <Link
            className={styles.backLink}
            search={{
              sectionId: Number(record.sectionId),
              teamId: Number(record.teamId),
            }}
            to={ROUTES.ADMIN_MEETING_ACTIONS}
          >
            전체 액션플랜 보기
          </Link>
        </div>
        {actionsQuery.isPending || actionPage !== boundedActionPage ? (
          <Text aria-live='polite' role='status'>
            액션플랜을 불러오는 중입니다.
          </Text>
        ) : actionsQuery.isError ? (
          <Card className={styles.actionsError}>
            <Text>액션플랜을 불러오지 못했습니다.</Text>
            <Button
              label='다시 시도'
              onClick={() => void actionsQuery.refetch()}
              variant='secondary'
            />
          </Card>
        ) : (
          <Card className={styles.actionsCard}>
            <AdminMeetingActionTable
              actions={actions}
              emptyMessage='이 회의록에 등록된 액션플랜이 없습니다.'
              showMeeting={false}
              showTeam={false}
            />
          </Card>
        )}
        {actionPagination && actionPagination.totalPages > 1 ? (
          <Pagination
            className={styles.actionsPagination}
            isDisabled={actionsQuery.isFetching}
            onChange={page => setActionPage(page - 1)}
            page={boundedActionPage + 1}
            pageSize={actionPagination.size}
            totalPages={actionPagination.totalPages}
            variant='compact'
          />
        ) : null}
      </section>
      <section className={styles.editLogsSection}>
        <div className={styles.actionsTitleRow}>
          <div>
            <Heading level={2}>수정 이력</Heading>
            <Text color='secondary'>
              이 회의록에 남긴 수정 사유를 최신순으로 확인합니다.
            </Text>
          </div>
        </div>
        {editLogsQuery.isPending || editLogPage !== boundedEditLogPage ? (
          <Text aria-live='polite' role='status'>
            수정 이력을 불러오는 중입니다.
          </Text>
        ) : editLogsQuery.isError ? (
          <Card className={styles.actionsError}>
            <Text>수정 이력을 불러오지 못했습니다.</Text>
            <Button
              label='다시 시도'
              onClick={() => void editLogsQuery.refetch()}
              variant='secondary'
            />
          </Card>
        ) : (
          <Card className={styles.actionsCard}>
            <AdminMeetingEditLogTable
              emptyMessage='이 회의록의 수정 이력이 없습니다.'
              logs={editLogs}
              showMeeting={false}
              showTeam={false}
            />
          </Card>
        )}
        {editLogPagination && editLogPagination.totalPages > 1 ? (
          <Pagination
            className={styles.actionsPagination}
            isDisabled={editLogsQuery.isFetching}
            onChange={page => setEditLogPage(page - 1)}
            page={boundedEditLogPage + 1}
            pageSize={editLogPagination.size}
            totalPages={editLogPagination.totalPages}
            variant='compact'
          />
        ) : null}
      </section>
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
