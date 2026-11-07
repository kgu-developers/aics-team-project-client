import { Badge, Divider, Icon, IconButton, Text } from '@aics/design-system';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Flag,
  House,
  Inbox,
  Megaphone,
  MessagesSquare,
} from 'lucide-react';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';

import { useAdminMessagesQuery } from '~/features/admin-message/queries';
import { useAuthStore } from '~/features/auth/authStore';

import StudentContactLink from '~/widgets/student-contact-link/StudentContactLink';

import AdminProfilePopover from './AdminProfilePopover';
import * as styles from './AdminShell.css';

const menuItems = [
  { icon: House, label: '홈', to: ROUTES.ADMIN },
  { icon: BookOpen, label: '강좌·분반 관리', to: ROUTES.ADMIN_SECTIONS },
  { icon: Flag, label: '마일스톤 관리', to: ROUTES.ADMIN_MILESTONES },
  {
    icon: ClipboardCheck,
    label: '제출·평가 현황',
    to: ROUTES.ADMIN_SUBMISSIONS,
  },
  { icon: Megaphone, label: '공지사항', to: ROUTES.ADMIN_NOTICES },
  {
    icon: MessagesSquare,
    label: '회의록·액션플랜',
    to: ROUTES.ADMIN_MEETINGS,
  },
  { icon: Inbox, label: '쪽지함', to: ROUTES.ADMIN_MESSAGES },
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const pathname = useRouterState({ select: state => state.location.pathname });
  const currentUser = useAuthStore(state => state.currentUser);
  const messagesQuery = useAdminMessagesQuery();
  const unreadMessageCount = messagesQuery.data?.unreadCount ?? 0;

  return (
    <div
      className={cx(styles.shell, isSidebarCollapsed && styles.shellCollapsed)}
    >
      <aside
        className={cx(
          styles.sidebar,
          isSidebarCollapsed && styles.sidebarCollapsed,
        )}
      >
        <div
          aria-hidden={isSidebarCollapsed || undefined}
          className={cx(
            styles.sidebarContent,
            isSidebarCollapsed && styles.sidebarContentCollapsed,
          )}
        >
          <div className={styles.brand}>
            <strong>OOTeamProject</strong>
            <small>2026-2 · 객체지향프로그래밍</small>
          </div>
          <nav aria-label='관리자 메뉴' className={styles.nav}>
            {menuItems.map(item => {
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
                  className={isActive ? styles.activeNav : styles.navItem}
                  key={item.to}
                  to={item.to}
                >
                  <span className={styles.navLabel}>
                    <Icon color='inherit' icon={item.icon} size='sm' />
                    <span>{item.label}</span>
                  </span>
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
          </nav>
          {currentUser ? (
            <AdminProfilePopover currentUser={currentUser} />
          ) : null}
        </div>
        <IconButton
          className={cx(
            styles.sidebarBoundaryToggle,
            isSidebarCollapsed && styles.sidebarBoundaryToggleCollapsed,
          )}
          icon={
            isSidebarCollapsed ? (
              <ChevronRight aria-hidden='true' size={16} />
            ) : (
              <ChevronLeft aria-hidden='true' size={16} />
            )
          }
          label={isSidebarCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          onClick={() => setIsSidebarCollapsed(current => !current)}
          size='sm'
          variant='ghost'
        />
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
