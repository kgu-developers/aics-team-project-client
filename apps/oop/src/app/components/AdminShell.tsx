import { Divider, Text } from '@aics/design-system';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAuthStore } from '~/features/auth/authStore';

import StudentContactLink from '~/widgets/student-contact-link/StudentContactLink';

import * as styles from './AdminShell.css';

const menuItems = [
  { label: '홈', to: ROUTES.ADMIN },
  { label: '강좌·분반 관리', to: ROUTES.ADMIN_SECTIONS },
  { label: '수강생·팀 관리', to: ROUTES.ADMIN_STUDENT_TEAM },
  { label: '마일스톤 관리', to: ROUTES.ADMIN_MILESTONES },
  { label: '공지사항', to: ROUTES.ADMIN_NOTICES },
  { label: '분반별 제출물', to: ROUTES.ADMIN_SUBMISSIONS },
  { label: '회의록', to: ROUTES.ADMIN_MEETINGS },
  { label: '쪽지함', to: ROUTES.ADMIN_MESSAGES },
] as const;

function isMenuItemActive(pathname: string, itemPath: string) {
  if (itemPath === ROUTES.ADMIN) return pathname === itemPath;

  if (itemPath === ROUTES.ADMIN_STUDENT_TEAM) {
    return pathname === itemPath || pathname.startsWith('/admin/teams/');
  }

  if (itemPath === ROUTES.ADMIN_MESSAGES) {
    return pathname === itemPath || pathname.startsWith('/admin/messages/');
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function AdminShell() {
  const pathname = useRouterState({ select: state => state.location.pathname });
  const currentUser = useAuthStore(state => state.currentUser);

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <strong>객체지향 프로그래밍</strong>
          <small>2026-2 · 팀 프로젝트</small>
        </div>
        <nav aria-label='관리자 메뉴' className={styles.nav}>
          {menuItems.map(item => {
            const isActive = isMenuItemActive(pathname, item.to);

            return (
              <Link
                className={isActive ? styles.activeNav : styles.navItem}
                key={item.label}
                to={item.to}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link className={styles.account} to={ROUTES.ADMIN_PROFILE}>
          <div>
            <strong>{currentUser?.name ?? '어드민 계정'}</strong>
            <span>{currentUser?.studentNumber ?? '로그인 정보'} · 프로필</span>
          </div>
        </Link>
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
