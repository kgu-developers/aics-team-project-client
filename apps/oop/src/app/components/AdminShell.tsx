import { Badge, Collapsible, Divider, Text } from '@aics/design-system';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAdminMessagesQuery } from '~/features/admin-message/queries';
import { useAuthStore } from '~/features/auth/authStore';

import StudentContactLink from '~/widgets/student-contact-link/StudentContactLink';

import AdminProfilePopover from './AdminProfilePopover';
import * as styles from './AdminShell.css';

const menuGroups = [
  {
    items: [
      { label: '마일스톤 관리', to: ROUTES.ADMIN_MILESTONES },
      { label: '제출·평가 현황', to: ROUTES.ADMIN_SUBMISSIONS },
    ],
    label: '프로젝트 관리',
  },
  {
    items: [
      { label: '공지사항', to: ROUTES.ADMIN_NOTICES },
      { label: '회의록·액션플랜', to: ROUTES.ADMIN_MEETINGS },
      { label: '쪽지함', to: ROUTES.ADMIN_MESSAGES },
    ],
    label: '소통',
  },
] as const;

function isMenuItemActive(pathname: string, itemPath: string) {
  if (itemPath === ROUTES.ADMIN) return pathname === itemPath;

  if (itemPath === ROUTES.ADMIN_STUDENT_TEAM) {
    return pathname === itemPath || pathname.startsWith('/admin/teams/');
  }

  if (itemPath === ROUTES.ADMIN_MESSAGES) {
    return pathname === itemPath || pathname.startsWith('/admin/messages/');
  }

  if (itemPath === ROUTES.ADMIN_MEETINGS) {
    return (
      pathname === itemPath ||
      pathname.startsWith(`${itemPath}/`) ||
      pathname === ROUTES.ADMIN_MEETING_ACTIONS
    );
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function AdminShell() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const currentUser = useAuthStore(state => state.currentUser);
  const messagesQuery = useAdminMessagesQuery();
  const unreadMessageCount = messagesQuery.data?.unreadCount ?? 0;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <strong>OOPTeamPlay</strong>
          <small>2026-2 · 객체지향프로그래밍</small>
        </div>
        <nav aria-label='관리자 메뉴' className={styles.nav}>
          <Link
            className={
              isMenuItemActive(pathname, ROUTES.ADMIN)
                ? styles.activeNav
                : styles.navItem
            }
            to={ROUTES.ADMIN}
          >
            홈
          </Link>
          <Link
            className={
              isMenuItemActive(pathname, ROUTES.ADMIN_SECTIONS)
                ? styles.activeNav
                : styles.navItem
            }
            to={ROUTES.ADMIN_SECTIONS}
          >
            강좌·분반 관리
          </Link>
          {menuGroups.map(group => (
            <Collapsible
              className={styles.navGroup}
              defaultIsOpen
              key={group.label}
              trigger={group.label}
            >
              <div className={styles.navGroupItems}>
                {group.items.map(item => {
                  const isActive = isMenuItemActive(pathname, item.to);
                  const showsUnreadMessageCount =
                    item.to === ROUTES.ADMIN_MESSAGES && unreadMessageCount > 0;

                  return (
                    <Link
                      aria-label={
                        showsUnreadMessageCount
                          ? `${item.label}, 미확인 쪽지 ${unreadMessageCount}건`
                          : undefined
                      }
                      className={
                        isActive ? styles.activeGroupNav : styles.groupNavItem
                      }
                      key={item.label}
                      to={item.to}
                    >
                      {item.label}
                      {showsUnreadMessageCount ? (
                        <Badge
                          aria-hidden
                          label={unreadMessageCount}
                          variant='info'
                        />
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </Collapsible>
          ))}
        </nav>
        {currentUser ? <AdminProfilePopover currentUser={currentUser} /> : null}
      </aside>
      <main className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
        <footer className={styles.footer}>
          <Divider />
          <div className={styles.footerBrand}>
            <div className={styles.universityLogoContainer}>
              <img
                alt='경기대학교'
                className={styles.universityLogo}
                src='/brand/kyonggi-university.png'
              />
              <span
                aria-hidden
                className={styles.universityLogoLeftTextOverlay}
              />
              <span
                aria-hidden
                className={styles.universityLogoRightTextOverlay}
              />
            </div>
          </div>
          <div className={styles.footerMeta}>
            <StudentContactLink />
            <Text color='secondary' type='supporting'>
              © 2026 KGU Developers CSHOME. All rights reserved.
            </Text>
          </div>
        </footer>
      </main>
    </div>
  );
}
