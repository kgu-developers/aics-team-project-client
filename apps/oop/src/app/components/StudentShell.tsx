import { Divider, Text } from '@aics/design-system';
import { Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';
import { safeRedirectPath } from '~/features/auth/safeRedirectPath';
import { useStudentContext } from '~/features/section/useStudentContext';

import StudentContactLink from '~/widgets/student-contact-link/StudentContactLink';

import { oopCourseConfig } from '~/course/config';

import * as styles from './StudentShell.css';
import { StudentHeaderActions } from './StudentShellPopovers';

export default function StudentShell() {
  const isDemo = isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
  const context = useStudentContext(!isDemo);
  const hasSession = useAuthStore(selectHasAuthenticatedSession);
  const currentUser = useAuthStore(state => state.currentUser);
  // Select a primitive so the subscription never re-renders on identity alone.
  const currentHref = useRouterState({ select: state => state.location.href });

  if (!hasSession || !currentUser) {
    // `safeRedirectPath` drops /login itself, so a router that keeps this
    // shell mounted on /login (tests, misconfigured trees) cannot loop.
    return (
      <Navigate
        search={{ redirect: safeRedirectPath(currentHref) }}
        to={ROUTES.LOGIN}
      />
    );
  }

  if (currentUser.globalRole !== 'STUDENT') {
    return <Navigate to={ROUTES.ADMIN} />;
  }

  const section =
    isDemo && currentUser.sections.length === 1
      ? currentUser.sections[0]
      : context.section;
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
            <div className={styles.shellUniversityLogoContainer}>
              <img
                alt='경기대학교'
                className={styles.shellUniversityLogo}
                src='/brand/kyonggi-university.png'
              />
              <span
                aria-hidden
                className={styles.shellUniversityLogoLeftTextOverlay}
              />
              <span
                aria-hidden
                className={styles.shellUniversityLogoRightTextOverlay}
              />
            </div>
          </div>
          <div className={styles.shellFooterMeta}>
            <StudentContactLink />
            <Text color='secondary' type='supporting'>
              © 2026 KGU Developers CSHOME. All rights reserved.
            </Text>
          </div>
        </footer>
      </div>
    </div>
  );
}
