import { Divider, Text } from '@aics/design-system';
import { Link, Navigate, Outlet } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';

import { oopCourseConfig } from '~/course/config';

import * as styles from './StudentShell.css';
import { StudentHeaderActions } from './StudentShellPopovers';

export default function StudentShell() {
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const currentUser = useAuthStore(state => state.currentUser);

  if (!hasSession || !currentUser) {
    return <Navigate to={ROUTES.LOGIN} />;
  }

  if (currentUser.globalRole !== 'STUDENT') {
    return <Navigate to={ROUTES.ADMIN} />;
  }

  const section = currentUser.sections[0];
  const sectionCode = section ? `/${section.code}` : '';

  return (
    <div className={styles.shell}>
      <div className={styles.shellPage}>
        <header className={styles.shellHeader}>
          <Link
            aria-label={`${oopCourseConfig.title} 홈`}
            className={styles.shellBrand}
            to={ROUTES.STUDENT.HOME}
          >
            <Text
              aria-hidden='true'
              className={styles.shellCompactBrand}
              type='large'
              weight='bold'
            >
              OOP
            </Text>
            <Text
              aria-hidden='true'
              className={styles.shellCourse}
              type='body'
              weight='medium'
            >
              {oopCourseConfig.title}
            </Text>
            <Text
              aria-hidden='true'
              className={styles.shellIdentity}
              color='secondary'
              type='body'
              weight='medium'
            >
              ({currentUser.name}/{currentUser.studentNumber}
              {sectionCode})
            </Text>
          </Link>

          <StudentHeaderActions currentUser={currentUser} />
        </header>

        <main className={styles.shellContent}>
          <Outlet />
        </main>

        <footer className={styles.shellFooter}>
          <Divider />
          <div className={styles.shellFooterBrand}>
            <img
              alt='경기대학교'
              className={styles.shellUniversityLogo}
              src='/brand/kyonggi-university.png'
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
