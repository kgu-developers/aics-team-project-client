import type {
  AdminMilestoneType,
  AdminSectionMilestoneDto,
} from '@aics/api-client';
import { Button, Heading } from '@aics/design-system';
import { Link, useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';
import { getSectionDisplayLabel } from '~/shared/lib/getSectionDisplayLabel';
import { AdminUnreadDot } from '~/shared/ui/AdminUnreadDot';

import { getRichTextPlainText } from '~/features/admin-meeting/model/getRichTextPlainText';
import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import { useAdminMeetingReadState } from '~/features/admin-meeting-read/useAdminMeetingReadState';
import {
  useAdminMessagesQuery,
  useUpdateAdminMessageReadMutation,
} from '~/features/admin-message/queries';
import {
  formatAdminMilestoneDate,
  isPresentationEvaluationMilestone,
  isPresentationSubmissionMilestone,
} from '~/features/admin-milestone-review/model';
import { useAdminAccessibleSectionMilestonesQuery } from '~/features/admin-milestone-review/queries';
import { noticeId } from '~/features/admin-notices/noticeScope';
import { useAdminAccessibleNoticesQuery } from '~/features/admin-notices/queries';
import { useAuthStore } from '~/features/auth/authStore';
import { parseMeetingContent } from '~/features/meeting/model/studentMeeting';

import * as styles from './AdminHomeDashboard.css';

type DashboardListItem = {
  date: string;
  id?: string;
  meetingId?: string;
  read?: boolean;
  teamId?: string;
  section: string;
  sectionId?: string;
  title: string;
};

function getMeetingContentPreview(content: string) {
  const normalized = getRichTextPlainText(parseMeetingContent(content))
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.length > 45
    ? `${normalized.slice(0, 45)}…`
    : normalized || '작성된 회의 내용이 없습니다.';
}

type MilestoneColumn = {
  dueAt: string;
  key: string;
  title: string;
};

function getMilestoneColumnKey(type: AdminMilestoneType, title: string) {
  return `${type}:${title}`;
}

function getSubmissionTabId(milestone: AdminSectionMilestoneDto) {
  switch (milestone.type) {
    case 'PROPOSAL':
      return 'proposal';
    case 'MID_REPORT':
      return 'midterm';
    case 'FINAL_REPORT':
      return 'final-report';
    case 'PEER_EVALUATION':
      return 'peer-review';
    case 'PRESENTATION':
      if (isPresentationEvaluationMilestone(milestone)) {
        return 'presentation-evaluate';
      }
      if (isPresentationSubmissionMilestone(milestone)) {
        return 'presentation-submit';
      }
      return undefined;
    case 'GENERAL':
      return undefined;
  }
}

function List({
  isMeetingList = false,
  isMessageList = false,
  isNoticeList = false,
  isMeetingRead,
  onOpenMessage,
  items,
}: {
  isMeetingList?: boolean;
  isMessageList?: boolean;
  isNoticeList?: boolean;
  isMeetingRead?: (meetingId: string) => boolean;
  onOpenMessage?: (messageId: number) => void;
  items: readonly DashboardListItem[];
}) {
  return (
    <ul className={styles.list}>
      {items.map(item => (
        <li
          className={styles.item}
          key={
            item.id ?? item.meetingId ?? [item.section, item.title].join('-')
          }
        >
          <span className={styles.itemMeta}>
            {isMeetingList &&
            item.meetingId &&
            !isMeetingRead?.(item.meetingId) ? (
              <AdminUnreadDot />
            ) : null}
            {isMessageList && item.read === false ? <AdminUnreadDot /> : null}
            <span className={styles.label}>{item.section}</span>
          </span>
          {isNoticeList && item.id ? (
            <Link
              className={styles.itemTitle}
              params={{ noticeId: item.id }}
              search={{
                sectionId: item.sectionId ? Number(item.sectionId) : undefined,
              }}
              to='/admin/notices/$noticeId'
            >
              {item.title}
            </Link>
          ) : isMeetingList && item.meetingId && item.sectionId ? (
            <Link
              className={styles.itemTitle}
              params={{ meetingId: item.meetingId }}
              to={ROUTES.ADMIN_MEETING_DETAIL}
            >
              {item.title}
            </Link>
          ) : isMessageList && item.teamId ? (
            <Link
              className={styles.itemTitle}
              onClick={() => {
                if (item.id && item.read === false) {
                  onOpenMessage?.(Number(item.id));
                }
              }}
              params={{ teamId: item.teamId }}
              to={ROUTES.ADMIN_MESSAGE_TEAM}
            >
              {item.title}
            </Link>
          ) : (
            <span className={styles.itemTitle}>{item.title}</span>
          )}
          <time className={styles.date}>{item.date}</time>
        </li>
      ))}
    </ul>
  );
}

function Panel({
  emptyMessage,
  partialErrorMessage,
  isMeetingPanel = false,
  isMessagePanel = false,
  isMeetingRead,
  onOpenMessage,
  title,
  items,
  action,
  isNoticePanel = false,
}: {
  emptyMessage?: string;
  partialErrorMessage?: string;
  isMeetingPanel?: boolean;
  isMessagePanel?: boolean;
  isMeetingRead?: (meetingId: string) => boolean;
  onOpenMessage?: (messageId: number) => void;
  title: string;
  items: readonly DashboardListItem[];
  action?: boolean;
  isNoticePanel?: boolean;
}) {
  const navigate = useNavigate();

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <Heading level={2}>{title}</Heading>
        {isNoticePanel ? (
          <Link className={styles.more} to={ROUTES.ADMIN_NOTICES}>
            전체보기 ›
          </Link>
        ) : isMeetingPanel ? (
          <Link className={styles.more} to={ROUTES.ADMIN_MEETINGS}>
            전체보기 ›
          </Link>
        ) : isMessagePanel ? (
          <Link className={styles.more} to={ROUTES.ADMIN_MESSAGES}>
            전체보기 ›
          </Link>
        ) : (
          <button className={styles.more} type='button'>
            전체보기 ›
          </button>
        )}
      </div>
      <div className={styles.panel}>
        {items.length > 0 && partialErrorMessage ? (
          <p className={styles.panelState} role='alert'>
            {partialErrorMessage}
          </p>
        ) : null}
        {items.length > 0 ? (
          <List
            isMeetingList={isMeetingPanel}
            isMessageList={isMessagePanel}
            isMeetingRead={isMeetingRead}
            isNoticeList={isNoticePanel}
            onOpenMessage={onOpenMessage}
            items={items}
          />
        ) : emptyMessage ? (
          <p className={styles.panelState}>{emptyMessage}</p>
        ) : null}
        {action ? (
          <div className={styles.action}>
            {isNoticePanel ? (
              <Button
                label='작성하기'
                onClick={() => navigate({ to: ROUTES.ADMIN_NOTICE_NEW })}
                variant='primary'
              />
            ) : (
              <Button label='작성하기' variant='primary' />
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default function AdminHomeDashboard() {
  const navigate = useNavigate();
  const currentUser = useAuthStore(state => state.currentUser);
  const meetingReadState = useAdminMeetingReadState(currentUser?.id);
  const accessibleSections = currentUser?.sections ?? [];
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const activeScheduleSections = accessibleSections.filter(
    section => section.status === 'ACTIVE',
  );
  const activeScheduleSectionIds = activeScheduleSections.map(
    section => section.id,
  );
  const milestoneQueries = useAdminAccessibleSectionMilestonesQuery(
    activeScheduleSectionIds,
  );
  const meetingRecordsQuery =
    useAdminMeetingRecordListQuery(accessibleSectionIds);
  const messagesQuery = useAdminMessagesQuery();
  const messageReadMutation = useUpdateAdminMessageReadMutation();
  const noticesQuery = useAdminAccessibleNoticesQuery();
  const scheduleSections = activeScheduleSections.map((section, index) => ({
    courseId: section.courseId,
    milestones: milestoneQueries[index]?.data?.content ?? [],
    sectionId: section.id,
    sectionLabel: section.code,
  }));
  const milestoneColumns: MilestoneColumn[] = [
    ...new Map(
      scheduleSections.flatMap(section =>
        section.milestones.map(milestone => {
          const key = getMilestoneColumnKey(milestone.type, milestone.title);
          return [
            key,
            {
              dueAt: milestone.schedule.dueAt ?? '9999-12-31T23:59:59',
              key,
              title: milestone.title,
            },
          ] as const;
        }),
      ),
    ).values(),
  ].sort((left, right) => left.dueAt.localeCompare(right.dueAt));
  const isMilestoneSchedulePending = milestoneQueries.some(
    query => query.isPending,
  );
  const hasMilestoneScheduleError = milestoneQueries.some(
    query => query.isError,
  );
  const meetingItems: DashboardListItem[] = (
    meetingRecordsQuery.data?.contents ?? []
  )
    .slice(0, 3)
    .map(record => ({
      date: formatSeoulDateTime(record.meetingAt),
      meetingId: String(record.id),
      section: `${getSectionDisplayLabel(
        accessibleSections,
        record.sectionId,
        record.sectionName,
      )} · ${record.teamName}`,
      sectionId: String(record.sectionId),
      title: getMeetingContentPreview(record.content),
    }));
  const meetingEmptyMessage =
    accessibleSectionIds.length === 0
      ? '담당 분반이 없어 회의록을 표시할 수 없습니다.'
      : meetingRecordsQuery.isPending
        ? '회의록을 불러오는 중입니다.'
        : meetingRecordsQuery.isError
          ? '회의록을 불러오지 못했습니다.'
          : '등록된 회의록이 없습니다.';
  const noticeItems: DashboardListItem[] = (noticesQuery.data ?? [])
    .slice(0, 3)
    .map(notice => ({
      date: formatSeoulDateTime(notice.publishedAt),
      id: String(notice.id),
      section:
        accessibleSections.find(
          section => noticeId(section.id) === notice.sectionId,
        )?.code ?? '알 수 없는 분반',
      sectionId: String(notice.sectionId),
      title: notice.title,
    }));
  const noticeScopeMessage =
    noticesQuery.scopeStatus === 'unknown-status'
      ? '일부 담당 분반의 운영 상태를 확인할 수 없어 해당 분반의 공지사항을 표시할 수 없습니다.'
      : noticesQuery.scopeStatus === 'no-active-sections'
        ? '공지사항을 표시할 활성 담당 분반이 없습니다.'
        : undefined;
  const noticeWarningMessage = [
    noticeScopeMessage,
    noticesQuery.isError
      ? noticeItems.length > 0
        ? '일부 분반의 공지사항을 불러오지 못했습니다.'
        : '공지사항을 불러오지 못했습니다.'
      : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const noticeEmptyMessage = noticesQuery.isPending
    ? '공지사항을 불러오는 중입니다.'
    : noticeWarningMessage || '등록된 공지사항이 없습니다.';
  const messageItems: DashboardListItem[] = (messagesQuery.data?.contents ?? [])
    .slice(0, 3)
    .map(message => ({
      id: String(message.id),
      date: formatSeoulDateTime(message.createdAt),
      section: `${getSectionDisplayLabel(
        accessibleSections,
        message.sectionId,
        message.sectionName,
      )} · ${message.teamName}`,
      read: message.read,
      teamId: String(message.teamId),
      title: message.message,
    }));
  const messageEmptyMessage = messagesQuery.isPending
    ? '쪽지함을 불러오는 중입니다.'
    : messagesQuery.isError
      ? '쪽지함을 불러오지 못했습니다.'
      : '도착한 메시지가 없습니다.';

  return (
    <div className={styles.content}>
      <Heading level={1}>홈</Heading>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Heading level={2}>분반별 진행 일정 · 제출 마감일</Heading>
          <Button
            label='마일스톤 관리'
            onClick={() => navigate({ to: ROUTES.ADMIN_MILESTONES })}
            variant='primary'
          />
        </div>
        <div className={styles.tableWrap}>
          {activeScheduleSectionIds.length === 0 ? (
            <p className={styles.scheduleState}>
              운영 중인 담당 분반이 없어 진행 일정을 표시할 수 없습니다.
            </p>
          ) : isMilestoneSchedulePending ? (
            <p
              aria-live='polite'
              className={styles.scheduleState}
              role='status'
            >
              분반별 진행 일정을 불러오는 중입니다.
            </p>
          ) : hasMilestoneScheduleError ? (
            <p className={styles.scheduleState}>
              분반별 진행 일정을 불러오지 못했습니다. 잠시 후 다시 시도해
              주세요.
            </p>
          ) : scheduleSections.length === 0 ? (
            <p className={styles.scheduleState}>
              표시할 분반별 진행 일정이 없습니다.
            </p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope='col'>분반</th>
                  {milestoneColumns.map(milestone => (
                    <th key={milestone.key} scope='col'>
                      <span className={styles.milestoneColumnTitle}>
                        {milestone.title}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleSections.map(section => (
                  <tr key={section.sectionId}>
                    <td>
                      {section.courseId === undefined ? (
                        <span className={styles.sectionLabel}>
                          {section.sectionLabel}
                        </span>
                      ) : (
                        <Link
                          className={styles.sectionLink}
                          params={{ courseId: String(section.courseId) }}
                          to={ROUTES.ADMIN_COURSE_DETAIL}
                        >
                          {section.sectionLabel}
                        </Link>
                      )}
                    </td>
                    {milestoneColumns.map(milestone => {
                      const sectionMilestone = section.milestones.find(
                        item =>
                          getMilestoneColumnKey(item.type, item.title) ===
                          milestone.key,
                      );
                      const submissionTabId = sectionMilestone
                        ? getSubmissionTabId(sectionMilestone)
                        : undefined;

                      return (
                        <td key={milestone.key}>
                          {sectionMilestone && submissionTabId ? (
                            <Link
                              className={styles.milestoneLink}
                              search={{
                                milestoneId: submissionTabId,
                                sectionId: section.sectionId,
                              }}
                              to={ROUTES.ADMIN_SUBMISSIONS}
                            >
                              {formatAdminMilestoneDate(
                                sectionMilestone.schedule.dueAt,
                              )}
                            </Link>
                          ) : sectionMilestone ? (
                            formatAdminMilestoneDate(
                              sectionMilestone.schedule.dueAt,
                            )
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
      <div className={styles.grid}>
        <Panel
          action
          emptyMessage={noticeEmptyMessage}
          partialErrorMessage={noticeWarningMessage}
          isNoticePanel
          items={noticeItems}
          title='공지사항'
        />
        <Panel
          emptyMessage={meetingEmptyMessage}
          isMeetingPanel
          isMeetingRead={meetingReadState.isRead}
          items={meetingItems}
          title='회의록'
        />
      </div>
      <Panel
        emptyMessage={messageEmptyMessage}
        isMessagePanel
        items={messageItems}
        onOpenMessage={messageId => messageReadMutation.mutate(messageId)}
        title={
          messagesQuery.data
            ? `쪽지함 · 미확인 ${messagesQuery.data.unreadCount}건`
            : '쪽지함'
        }
      />
    </div>
  );
}
