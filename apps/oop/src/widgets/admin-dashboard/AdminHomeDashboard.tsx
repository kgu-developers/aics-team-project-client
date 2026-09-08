import { Button, Heading } from '@aics/design-system';
import { Link, useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import type {
  AdminMilestoneScheduleMilestoneView,
  AdminMilestoneScheduleSectionView,
} from '~/features/admin-milestone-review/model';
import { useAdminMilestoneScheduleQuery } from '~/features/admin-milestone-review/queries';
import { useAdminNoticesQuery } from '~/features/admin-notices/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminHomeDashboard.css';
import { dashboardInbox } from '../../mocks/data/adminDashboard';

type DashboardListItem = {
  date: string;
  id?: string;
  meetingId?: string;
  section: string;
  sectionId?: string;
  title: string;
};

function formatMeetingCreatedAt(value: string) {
  return value.replace('T', ' ').slice(0, 10);
}

function getMeetingContentPreview(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim();

  return normalized.length > 45
    ? `${normalized.slice(0, 45)}…`
    : normalized || '작성된 회의 내용이 없습니다.';
}

function getMilestoneColumns(
  sections: readonly AdminMilestoneScheduleSectionView[],
) {
  const milestonesById = new Map<string, AdminMilestoneScheduleMilestoneView>();

  sections.forEach(section => {
    section.milestones.forEach(milestone => {
      if (!milestonesById.has(milestone.id)) {
        milestonesById.set(milestone.id, milestone);
      }
    });
  });

  return [...milestonesById.values()];
}

function List({
  isMeetingList = false,
  isNoticeList = false,
  items,
}: {
  isMeetingList?: boolean;
  isNoticeList?: boolean;
  items: readonly DashboardListItem[];
}) {
  return (
    <ul className={styles.list}>
      {items.map(item => (
        <li
          className={styles.item}
          key={
            isMeetingList && item.meetingId
              ? item.meetingId
              : [item.section, item.title].join('-')
          }
        >
          <span className={styles.itemMeta}>
            <span className={styles.label}>{item.section}</span>
          </span>
          {isNoticeList && item.id ? (
            <Link
              className={styles.itemTitle}
              params={{ noticeId: item.id }}
              to='/admin/notices/$noticeId'
            >
              {item.title}
            </Link>
          ) : isMeetingList && item.meetingId && item.sectionId ? (
            <Link className={styles.itemTitle} to={ROUTES.ADMIN_MEETINGS}>
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
  isMeetingPanel = false,
  title,
  items,
  action,
  isNoticePanel = false,
}: {
  emptyMessage?: string;
  isMeetingPanel?: boolean;
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
        ) : (
          <button className={styles.more} type='button'>
            전체보기 ›
          </button>
        )}
      </div>
      <div className={styles.panel}>
        {items.length > 0 ? (
          <List
            isMeetingList={isMeetingPanel}
            isNoticeList={isNoticePanel}
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
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const milestoneScheduleQuery =
    useAdminMilestoneScheduleQuery(accessibleSectionIds);
  const meetingRecordsQuery =
    useAdminMeetingRecordListQuery(accessibleSectionIds);
  const noticesQuery = useAdminNoticesQuery();
  const scheduleSections = milestoneScheduleQuery.data?.sections ?? [];
  const milestoneColumns = getMilestoneColumns(scheduleSections);
  const meetingItems: DashboardListItem[] = (
    meetingRecordsQuery.data?.contents ?? []
  )
    .slice(0, 4)
    .map(record => ({
      date: formatMeetingCreatedAt(record.meetingAt),
      meetingId: String(record.id),
      section: `${record.sectionName} · ${record.teamName}`,
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
  const noticeItems: DashboardListItem[] = (noticesQuery.data?.notices ?? [])
    .slice(0, 3)
    .map(notice => ({
      date: notice.date,
      id: notice.id,
      section: notice.section,
      title: notice.title,
    }));
  const noticeEmptyMessage = noticesQuery.isPending
    ? '공지사항을 불러오는 중입니다.'
    : noticesQuery.isError
      ? '공지사항을 불러오지 못했습니다.'
      : '등록된 공지사항이 없습니다.';

  return (
    <div className={styles.content}>
      <Heading level={1}>홈</Heading>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Heading level={2}>분반별 진행 일정</Heading>
          <Button
            label='마일스톤 설정'
            onClick={() => navigate({ to: ROUTES.ADMIN_MILESTONES })}
            variant='primary'
          />
        </div>
        <div className={styles.tableWrap}>
          {accessibleSectionIds.length === 0 ? (
            <p className={styles.scheduleState}>
              담당 분반이 없어 진행 일정을 표시할 수 없습니다.
            </p>
          ) : milestoneScheduleQuery.isPending ? (
            <p
              aria-live='polite'
              className={styles.scheduleState}
              role='status'
            >
              분반별 진행 일정을 불러오는 중입니다.
            </p>
          ) : milestoneScheduleQuery.isError ? (
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
                  <th scope='col'>인원/팀 수</th>
                  {milestoneColumns.map(milestone => (
                    <th key={milestone.id} scope='col'>
                      {milestone.title}
                    </th>
                  ))}
                  <th scope='col'>쪽지</th>
                </tr>
              </thead>
              <tbody>
                {scheduleSections.map(section => (
                  <tr key={section.sectionId}>
                    <td>{section.sectionLabel}</td>
                    <td>{section.memberCountLabel}</td>
                    {milestoneColumns.map(milestone => {
                      const summary = section.milestones.find(
                        sectionMilestone =>
                          sectionMilestone.id === milestone.id,
                      )?.summary;

                      return (
                        <td key={milestone.id}>
                          {summary ? (
                            <Link
                              className={styles.milestoneLink}
                              search={{
                                milestoneId: milestone.id,
                                sectionId: section.sectionId,
                              }}
                              to={ROUTES.ADMIN_SUBMISSIONS}
                            >
                              {summary}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </td>
                      );
                    })}
                    <td>{section.unreadMessageCountLabel}</td>
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
          isNoticePanel
          items={noticeItems}
          title='공지사항'
        />
        <Panel
          emptyMessage={meetingEmptyMessage}
          isMeetingPanel
          items={meetingItems}
          title='회의록'
        />
      </div>
      <Panel items={dashboardInbox} title='쪽지함' />
    </div>
  );
}
