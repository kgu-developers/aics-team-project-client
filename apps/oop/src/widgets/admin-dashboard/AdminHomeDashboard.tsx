import type { AdminSectionMilestoneDto } from '@aics/api-client';
import {
  Badge,
  Button,
  Card,
  Heading,
  Tab,
  TabList,
  Text,
} from '@aics/design-system';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';
import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';
import { getSectionDisplayLabel } from '~/shared/lib/getSectionDisplayLabel';
import { AdminUnreadDot } from '~/shared/ui/AdminUnreadDot';

import { useActiveAdminSections } from '~/features/admin-course/queries';
import { getRichTextPlainText } from '~/features/admin-meeting/model';
import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import { useAdminMeetingReadState } from '~/features/admin-meeting-read/useAdminMeetingReadState';
import {
  useAdminMessagesQuery,
  useUpdateAdminMessageReadMutation,
} from '~/features/admin-message/queries';
import {
  isPresentationEvaluationMilestone,
  isPresentationSubmissionMilestone,
} from '~/features/admin-milestone-review/model';
import { useAdminAccessibleSectionMilestonesQuery } from '~/features/admin-milestone-review/queries';
import { noticeId } from '~/features/admin-notices/noticeScope';
import { useAdminAccessibleNoticesQuery } from '~/features/admin-notices/queries';
import { useAuthStore } from '~/features/auth/authStore';
import { parseMeetingContent } from '~/features/meeting/model/studentMeeting';

import * as styles from './AdminHomeDashboard.css';
import {
  formatAdminHomeScheduleDate,
  getAdminHomeDeadlineLabel,
  getAdminHomeMilestones,
  getAdminHomePresentationEvaluationState,
  getAdminHomeScheduleRefreshAt,
} from './adminHomeSchedule';

type DashboardListItem = {
  date: string;
  id?: string;
  meetingId?: string;
  read?: boolean;
  teamId?: string;
  team?: string;
  section: string;
  sectionId?: string;
  title: string;
};

type ScheduleColumnId =
  | 'proposal'
  | 'midterm'
  | 'presentation-submit'
  | 'presentation-evaluate'
  | 'final-report'
  | 'peer-review';

type ScheduleItem = {
  dateLabel?: string;
  deadlineLabel: string;
  isStudentVisible: boolean;
  submissionTabId?: ScheduleColumnId;
};

const SCHEDULE_COLUMNS: ReadonlyArray<{
  id: ScheduleColumnId;
  label: string;
}> = [
  { id: 'proposal', label: '제안서' },
  { id: 'midterm', label: '중간 점검' },
  { id: 'presentation-submit', label: '발표 자료 제출' },
  { id: 'presentation-evaluate', label: '발표 평가' },
  { id: 'final-report', label: '최종 보고서' },
  { id: 'peer-review', label: '상호평가' },
];

function formatDashboardDateTime(value: string) {
  return formatSeoulDateTime(value).replace(
    /^\d{4}-(\d{2})-(\d{2})\/(\d{2}:\d{2})$/,
    '$1.$2 $3',
  );
}

function getMeetingContentPreview(content: string) {
  const normalized = getRichTextPlainText(parseMeetingContent(content))
    .replace(/\s+/g, ' ')
    .trim();

  return normalized.length > 45
    ? `${normalized.slice(0, 45)}…`
    : normalized || '작성된 회의 내용이 없습니다.';
}

function getSubmissionTabId(
  milestone: AdminSectionMilestoneDto,
): ScheduleColumnId | undefined {
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
      if (isPresentationSubmissionMilestone(milestone)) {
        return 'presentation-submit';
      }
      return undefined;
    case 'GENERAL':
      return undefined;
  }
}

type CommunicationTab = 'message' | 'notice';

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
          className={cx(styles.item, isNoticeList && styles.noticeItem)}
          key={
            item.id ?? item.meetingId ?? [item.section, item.title].join('-')
          }
        >
          {!isNoticeList ? (
            <span className={styles.itemLeading}>
              {item.team ? (
                <span className={styles.label} title={item.team}>
                  {item.team}
                </span>
              ) : null}
            </span>
          ) : null}
          <div className={styles.itemContent}>
            <span className={styles.itemTitleRow}>
              {isMeetingList &&
              item.meetingId &&
              !isMeetingRead?.(item.meetingId) ? (
                <AdminUnreadDot />
              ) : null}
              {isMessageList && item.read === false ? <AdminUnreadDot /> : null}
              {isNoticeList && item.id ? (
                <Link
                  className={styles.itemTitle}
                  params={{ noticeId: item.id }}
                  search={{
                    sectionId: item.sectionId
                      ? Number(item.sectionId)
                      : undefined,
                  }}
                  to='/admin/notices/$noticeId'
                  title={item.title}
                >
                  {item.title}
                </Link>
              ) : isMeetingList && item.meetingId && item.sectionId ? (
                <Link
                  className={styles.itemTitle}
                  params={{ meetingId: item.meetingId }}
                  to={ROUTES.ADMIN_MEETING_DETAIL}
                  title={item.title}
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
                  title={item.title}
                >
                  {item.title}
                </Link>
              ) : (
                <span className={styles.itemTitle} title={item.title}>
                  {item.title}
                </span>
              )}
            </span>
            <span className={styles.itemSubtitle} title={item.section}>
              {item.section}
            </span>
          </div>
          <time className={styles.date}>{item.date}</time>
        </li>
      ))}
    </ul>
  );
}

function MeetingPanel({
  emptyMessage,
  isMeetingRead,
  items,
}: {
  emptyMessage?: string;
  isMeetingRead?: (meetingId: string) => boolean;
  items: readonly DashboardListItem[];
}) {
  return (
    <section className={styles.dashboardPanel}>
      <div className={styles.dashboardPanelHeader}>
        <Heading level={2}>회의록</Heading>
        <Link className={styles.more} to={ROUTES.ADMIN_MEETINGS}>
          전체보기 ›
        </Link>
      </div>
      <div className={styles.dashboardPanelBody}>
        {items.length > 0 ? (
          <List isMeetingList isMeetingRead={isMeetingRead} items={items} />
        ) : emptyMessage ? (
          <p className={styles.panelState}>{emptyMessage}</p>
        ) : null}
      </div>
    </section>
  );
}

export default function AdminHomeDashboard() {
  const navigate = useNavigate();
  const [communicationTab, setCommunicationTab] =
    useState<CommunicationTab>('notice');
  const [scheduleClock, setScheduleClock] = useState(() => Date.now());
  const currentUser = useAuthStore(state => state.currentUser);
  const meetingReadState = useAdminMeetingReadState(currentUser?.id);
  const accessibleSections = currentUser?.sections ?? [];
  const accessibleSectionIds = accessibleSections.map(section => section.id);
  const activeSectionsQuery = useActiveAdminSections();
  const activeScheduleSections = activeSectionsQuery.data;
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
    classTime: section.classTime,
    courseId: section.courseId,
    milestones: milestoneQueries[index]?.data?.content ?? [],
    sectionId: section.id,
    sectionLabel: section.code,
  }));
  const scheduleDeadlineKey = scheduleSections
    .flatMap(section =>
      getAdminHomeMilestones(section.milestones).flatMap(milestone => [
        milestone.schedule.dueAt ?? '',
        milestone.schedule.evaluationOpensAt ?? '',
        milestone.schedule.evaluationClosesAt ?? '',
      ]),
    )
    .join('|');

  useEffect(() => {
    const deadlineValues = scheduleDeadlineKey
      ? scheduleDeadlineKey.split('|')
      : [];
    const refreshAt = getAdminHomeScheduleRefreshAt(
      deadlineValues,
      scheduleClock,
    );
    const delay = Math.max(1_000, refreshAt - Date.now() + 100);
    const timeoutId = window.setTimeout(
      () => setScheduleClock(Date.now()),
      delay,
    );

    return () => window.clearTimeout(timeoutId);
  }, [scheduleClock, scheduleDeadlineKey]);

  const scheduleRows = scheduleSections.map(section => {
    const presentationEvaluationMilestone = section.milestones.find(
      isPresentationEvaluationMilestone,
    );

    const scheduleItems = getAdminHomeMilestones(section.milestones).flatMap(
      milestone => {
        const submissionTabId = getSubmissionTabId(milestone);
        if (!submissionTabId) return [];

        const submissionItem: ScheduleItem & { columnId: ScheduleColumnId } = {
          columnId: submissionTabId,
          dateLabel: formatAdminHomeScheduleDate(milestone.schedule.dueAt),
          deadlineLabel: getAdminHomeDeadlineLabel(
            milestone.schedule.dueAt,
            scheduleClock,
          ),
          isStudentVisible: milestone.status === 'PUBLISHED',
          submissionTabId,
        };

        if (milestone.type !== 'PRESENTATION') return [submissionItem];

        const evaluationStartsAt =
          presentationEvaluationMilestone?.schedule.evaluationOpensAt ??
          milestone.schedule.evaluationOpensAt;
        const evaluationEndsAt =
          presentationEvaluationMilestone?.schedule.evaluationClosesAt ??
          milestone.schedule.evaluationClosesAt;
        const evaluationStateLabel = getAdminHomePresentationEvaluationState({
          endsAt: evaluationEndsAt,
          milestoneStatus:
            presentationEvaluationMilestone?.status ?? milestone.status,
          now: scheduleClock,
          startsAt: evaluationStartsAt,
        });

        return [
          submissionItem,
          {
            columnId: 'presentation-evaluate' as const,
            deadlineLabel: evaluationStateLabel,
            isStudentVisible:
              (presentationEvaluationMilestone?.status ?? milestone.status) ===
              'PUBLISHED',
            submissionTabId: 'presentation-evaluate' as const,
          },
        ];
      },
    );
    const milestoneCells: Partial<Record<ScheduleColumnId, ScheduleItem>> = {};
    scheduleItems.forEach(item => {
      // The fixed workflow table can show one milestone per phase. When legacy
      // data contains duplicates, keep the earliest week/id from the sorted list.
      milestoneCells[item.columnId] ??= item;
    });

    return {
      classTime: section.classTime?.trim() ?? '',
      courseId: section.courseId,
      milestones: milestoneCells,
      sectionId: section.sectionId,
      sectionLabel: section.sectionLabel,
    };
  });
  const isMilestoneSchedulePending =
    activeSectionsQuery.isPending ||
    milestoneQueries.some(query => query.isPending);
  const hasMilestoneScheduleError =
    activeSectionsQuery.isError ||
    milestoneQueries.some(query => query.isError);
  const meetingItems: DashboardListItem[] = (
    meetingRecordsQuery.data?.contents ?? []
  )
    .slice(0, 3)
    .map(record => ({
      date: formatDashboardDateTime(record.meetingAt),
      meetingId: String(record.id),
      section: getSectionDisplayLabel(
        accessibleSections,
        record.sectionId,
        record.sectionName,
      ),
      sectionId: String(record.sectionId),
      team: record.teamName,
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
      date: formatDashboardDateTime(notice.publishedAt),
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
      date: formatDashboardDateTime(message.createdAt),
      section: getSectionDisplayLabel(
        accessibleSections,
        message.sectionId,
        message.sectionName,
      ),
      read: message.read,
      teamId: String(message.teamId),
      team: message.teamName,
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
          <Heading level={2}>분반별 제출·평가 일정</Heading>
          <div className={styles.scheduleHeaderActions}>
            <Text type='supporting'>회색 배지: 학생 미공개 또는 마감</Text>
            <Button
              label='마일스톤 관리'
              onClick={() => navigate({ to: ROUTES.ADMIN_MILESTONES })}
              variant='primary'
            />
          </div>
        </div>
        <div>
          {isMilestoneSchedulePending ? (
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
          ) : activeScheduleSectionIds.length === 0 ? (
            <p className={styles.scheduleState}>
              운영 중인 담당 분반이 없어 진행 일정을 표시할 수 없습니다.
            </p>
          ) : scheduleSections.length === 0 ? (
            <p className={styles.scheduleState}>
              표시할 분반별 진행 일정이 없습니다.
            </p>
          ) : (
            <Card className={styles.scheduleTableCard} padding={0}>
              <div className={styles.scheduleTableScroll}>
                <table
                  aria-label='분반별 제출·평가 일정'
                  className={styles.scheduleTable}
                >
                  <thead>
                    <tr>
                      <th scope='col'>분반</th>
                      {SCHEDULE_COLUMNS.map(column => (
                        <th key={column.id} scope='col'>
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scheduleRows.map(row => (
                      <tr key={row.sectionId}>
                        <td>
                          <Link
                            aria-label={`${row.sectionLabel} 분반 관리 화면 열기`}
                            className={styles.scheduleSection}
                            params={{ courseId: String(row.courseId) }}
                            search={{ sectionId: Number(row.sectionId) }}
                            to={ROUTES.ADMIN_COURSE_DETAIL}
                          >
                            <span className={styles.scheduleSectionLabel}>
                              <strong title={row.sectionLabel}>
                                {row.sectionLabel}
                              </strong>
                              {row.classTime ? (
                                <span
                                  className={styles.scheduleSectionTime}
                                  title={row.classTime}
                                >
                                  {row.classTime}
                                </span>
                              ) : null}
                            </span>
                            <span
                              aria-hidden='true'
                              className={styles.scheduleSectionChevron}
                            >
                              ›
                            </span>
                          </Link>
                        </td>
                        {SCHEDULE_COLUMNS.map(column => {
                          const item = row.milestones[column.id];
                          const content = item ? (
                            <>
                              <Badge
                                label={item.deadlineLabel}
                                variant={
                                  item.deadlineLabel === '진행 중'
                                    ? 'success'
                                    : item.isStudentVisible &&
                                        (item.deadlineLabel === '오늘 마감' ||
                                          item.deadlineLabel.startsWith('D-'))
                                      ? 'info'
                                      : 'neutral'
                                }
                              />
                              {item.dateLabel ? (
                                <span className={styles.scheduleMilestoneDate}>
                                  {item.dateLabel}
                                </span>
                              ) : null}
                            </>
                          ) : null;

                          return (
                            <td key={column.id}>
                              {item?.submissionTabId ? (
                                <Link
                                  aria-label={`${row.sectionLabel} ${column.label} 제출·평가 현황 보기`}
                                  className={styles.scheduleMilestoneItem}
                                  search={{
                                    milestoneId: item.submissionTabId,
                                    sectionId: Number(row.sectionId),
                                  }}
                                  to={ROUTES.ADMIN_SUBMISSIONS}
                                >
                                  {content}
                                </Link>
                              ) : (
                                <div
                                  aria-label={item ? undefined : '일정 없음'}
                                  className={styles.scheduleMilestoneItem}
                                >
                                  {content}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </section>
      <div className={styles.grid}>
        <section
          aria-label='공지사항과 쪽지함'
          className={styles.dashboardPanel}
        >
          <div className={styles.dashboardPanelHeader}>
            <div className={styles.communicationTabs}>
              <TabList
                aria-label='소식 목록'
                onChange={value => {
                  if (value === 'notice' || value === 'message') {
                    setCommunicationTab(value);
                  }
                }}
                size='sm'
                value={communicationTab}
              >
                <Tab label='공지사항' value='notice' />
                <Tab label='쪽지함' value='message' />
              </TabList>
              {messagesQuery.data?.unreadCount ? (
                <Badge
                  aria-label={`미확인 쪽지 ${messagesQuery.data.unreadCount}건`}
                  label={messagesQuery.data.unreadCount}
                  variant='info'
                />
              ) : null}
            </div>
            <div className={styles.sectionActions}>
              <Link
                className={styles.more}
                to={
                  communicationTab === 'notice'
                    ? ROUTES.ADMIN_NOTICES
                    : ROUTES.ADMIN_MESSAGES
                }
              >
                전체보기 ›
              </Link>
            </div>
          </div>
          <div className={styles.dashboardPanelBody}>
            {communicationTab === 'notice' ? (
              noticeItems.length > 0 ? (
                <>
                  {noticeWarningMessage ? (
                    <p className={styles.panelState} role='alert'>
                      {noticeWarningMessage}
                    </p>
                  ) : null}
                  <List isNoticeList items={noticeItems} />
                </>
              ) : (
                <p className={styles.panelState}>{noticeEmptyMessage}</p>
              )
            ) : messageItems.length > 0 ? (
              <List
                isMessageList
                items={messageItems}
                onOpenMessage={messageId =>
                  messageReadMutation.mutate(messageId)
                }
              />
            ) : (
              <p className={styles.panelState}>{messageEmptyMessage}</p>
            )}
          </div>
        </section>
        <MeetingPanel
          emptyMessage={meetingEmptyMessage}
          isMeetingRead={meetingReadState.isRead}
          items={meetingItems}
        />
      </div>
    </div>
  );
}
