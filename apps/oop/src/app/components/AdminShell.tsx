import { Divider } from '@aics/design-system';
import { Link, Outlet, useRouterState } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminShell.css';

const menuItems = [
  { label: '홈', to: ROUTES.ADMIN },
  { label: '공지사항', to: ROUTES.ADMIN_NOTICES },
  { label: '수강생/팀 관리', to: ROUTES.ADMIN_STUDENT_TEAM },
  { label: '분반별 제출물', to: ROUTES.ADMIN_SUBMISSIONS },
  { label: '회의록', to: ROUTES.ADMIN_MEETINGS },
] as const;

function isMenuItemActive(pathname: string, itemPath: string) {
  if (itemPath === ROUTES.ADMIN) return pathname === itemPath;

  if (itemPath === ROUTES.ADMIN_STUDENT_TEAM) {
    return pathname === itemPath || pathname.startsWith('/admin/teams/');
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export default function AdminShell() {
  const pathname = useRouterState({ select: state => state.location.pathname });

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
          <button className={styles.navItem} disabled type='button'>
            쪽지함 <span className={styles.count}>12</span>
          </button>
        </nav>
        <Link className={styles.account} to={ROUTES.ADMIN_PROFILE}>
          <div>
            <strong>어드민 계정</strong>
            <span>로그아웃 / 권한 변경</span>
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
            <img
              alt='경기대학교'
              className={styles.universityLogo}
              src='/brand/kyonggi-university.png'
            />
          </div>
        </footer>
      </main>
    </div>
  );
}
