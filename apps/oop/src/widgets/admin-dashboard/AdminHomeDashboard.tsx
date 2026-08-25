import { Button, Heading } from '@aics/design-system';
import { Link, useNavigate } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import type {
  AdminMilestoneScheduleMilestoneView,
  AdminMilestoneScheduleSectionView,
} from '~/features/admin-milestone-review/model';
import { useAdminMilestoneScheduleQuery } from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminHomeDashboard.css';
import {
  dashboardInbox,
  dashboardMinutes,
  dashboardNotices,
  type DashboardListItem,
} from '../../mocks/data/adminDashboard';

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
  isNoticeList = false,
  items,
}: {
  isNoticeList?: boolean;
  items: readonly DashboardListItem[];
}) {
  return (
    <ul className={styles.list}>
      {items.map(item => (
        <li className={styles.item} key={[item.section, item.title].join('-')}>
          <span className={styles.label}>{item.section}</span>
          {isNoticeList && item.id ? (
            <Link
              className={styles.itemTitle}
              params={{ noticeId: item.id }}
              to='/admin/notices/$noticeId'
            >
              {item.title}
            </Link>
          ) : (
            <span className={styles.itemTitle}>{item.title}</span>
          )}
          <time>{item.date}</time>
        </li>
      ))}
    </ul>
  );
}

function Panel({
  title,
  items,
  action,
  isNoticePanel = false,
}: {
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
        ) : (
          <button className={styles.more} type='button'>
            전체보기 ›
          </button>
        )}
      </div>
      <div className={styles.panel}>
        <List isNoticeList={isNoticePanel} items={items} />
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
  const currentUser = useAuthStore(state => state.currentUser);
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const milestoneScheduleQuery =
    useAdminMilestoneScheduleQuery(accessibleSectionIds);
  const scheduleSections = milestoneScheduleQuery.data?.sections ?? [];
  const milestoneColumns = getMilestoneColumns(scheduleSections);

  return (
    <div className={styles.content}>
      <Heading level={1}>홈</Heading>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Heading level={2}>분반별 진행 일정</Heading>
          <Button label='일정 작성' variant='primary' />
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

                      return <td key={milestone.id}>{summary ?? '-'}</td>;
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
        <Panel action isNoticePanel items={dashboardNotices} title='공지사항' />
        <Panel items={dashboardMinutes} title='회의록' />
      </div>
      <Panel items={dashboardInbox} title='쪽지함' />
    </div>
  );
}
