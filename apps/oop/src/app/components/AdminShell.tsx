import { Link, Outlet, useRouterState } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminShell.css';

const menuItems = [
  { label: '홈', to: ROUTES.ADMIN },
  { label: '공지사항', to: ROUTES.ADMIN_NOTICES },
] as const;

export default function AdminShell() {
  const pathname = useRouterState({ select: state => state.location.pathname });

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <strong>AICS Team</strong>
          <span>팀 프로젝트 운영 플랫폼</span>
          <small>2026-2 · 객체지향프로그래밍</small>
        </div>
        <nav aria-label='관리자 메뉴' className={styles.nav}>
          {menuItems.map(item => (
            <Link
              className={
                pathname === item.to ? styles.activeNav : styles.navItem
              }
              key={item.label}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
          {['수강생/팀 관리', '분반별 제출물', '회의록'].map(item => (
            <button className={styles.navItem} key={item} type='button'>
              {item}
            </button>
          ))}
          <button className={styles.navItem} type='button'>
            쪽지함 <span className={styles.count}>12</span>
          </button>
        </nav>
        <div className={styles.account}>
          <span aria-hidden='true' className={styles.avatar} />
          <div>
            <strong>어드민 계정</strong>
            <span>로그아웃 / 권한 변경</span>
          </div>
        </div>
      </aside>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
