import { Button, Heading } from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminHomeDashboard.css';
import {
  dashboardInbox,
  dashboardMinutes,
  dashboardNotices,
  dashboardSchedules,
  type DashboardListItem,
} from '../../mocks/data/adminDashboard';

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
              <Link to={ROUTES.ADMIN_NOTICE_NEW}>
                <Button label='작성하기' variant='primary' />
              </Link>
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
  return (
    <div className={styles.content}>
      <Heading level={1}>홈</Heading>
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <Heading level={2}>분반별 진행 일정</Heading>
          <Button label='일정 작성' variant='primary' />
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {[
                  '분반',
                  '인원/팀 수',
                  '제안서',
                  '중간 점검',
                  '발표 제출',
                  '발표 평가',
                  '최종 보고서',
                  '상호 평가',
                  '쪽지',
                ].map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dashboardSchedules.map(row => (
                <tr key={row[0]}>
                  {row.map(cell => (
                    <td key={cell}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
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
