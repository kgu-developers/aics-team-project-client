import { Divider, Text } from '@aics/design-system';
import { Link, Navigate, Outlet, useRouterState } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';
import { getStudentRouteDestination } from '~/app/studentRouteDestination';

import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

import {
  selectHasAuthenticatedSession,
  useAuthStore,
} from '~/features/auth/authStore';
import { safeRedirectPath } from '~/features/auth/safeRedirectPath';
import { useStudentContext } from '~/features/section/useStudentContext';
import { resolveContactVisibility } from '~/features/team-assignment/liveTeamAssignment';
import { useTeamKickoffQuery } from '~/features/team-assignment/queries';

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
  const currentPathname = useRouterState({
    select: state => state.location.pathname,
  });
  const shouldVerifyOnboarding =
    !isDemo &&
    context.status === 'ready' &&
    resolveContactVisibility(context.section ?? {}) !== 'upcoming';
  const kickoff = useTeamKickoffQuery(
    shouldVerifyOnboarding ? context.teamId : undefined,
  );

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

  const guardedDestination = getStudentRouteDestination(
    context.status,
    isDemo,
    currentPathname,
    context.section,
  );
  if (guardedDestination) {
    return <Navigate replace to={guardedDestination} />;
  }

  if (shouldVerifyOnboarding && kickoff.isPending) {
    return (
      <Text aria-live='polite' role='status'>
        팀 온보딩 완료 여부를 확인하는 중입니다.
      </Text>
    );
  }
  if (
    shouldVerifyOnboarding &&
    (kickoff.isError ||
      !kickoff.data ||
      String(kickoff.data.id) !== context.teamId ||
      !kickoff.data.members.some(member => member.isLeader))
  ) {
    return <Navigate replace to={ROUTES.ONBOARDING.TEAM} />;
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
            {sectionCode ? (
              <Text
                aria-hidden='true'
                className={styles.shellSection}
                color='secondary'
                type='body'
                weight='medium'
              >
                {sectionCode}
              </Text>
            ) : null}
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
