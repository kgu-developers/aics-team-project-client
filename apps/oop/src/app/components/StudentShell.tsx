import { Avatar, Divider, HStack, IconButton, Text } from '@aics/design-system';
import { Link, Navigate, Outlet } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import { useAuthStore } from '~/features/auth/authStore';

import { oopCourseConfig } from '~/course/config';

import * as styles from './StudentShell.css';

export default function StudentShell() {
  const accessToken = useAuthStore(state => state.accessToken);
  const currentUser = useAuthStore(state => state.currentUser);

  if (!accessToken || !currentUser) {
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
          <Link className={styles.shellBrand} to={ROUTES.STUDENT.HOME}>
            <Text type='body' weight='medium'>
              {oopCourseConfig.title}
            </Text>
            <Text
              className={styles.shellIdentity}
              color='secondary'
              type='body'
              weight='medium'
            >
              ({currentUser.name}/{currentUser.studentNumber}
              {sectionCode})
            </Text>
          </Link>

          <HStack align='center' className={styles.shellActions} gap={3}>
            <IconButton
              icon={<img alt='' src='/icons/notifications.svg' />}
              label='공지사항 열기'
              size='sm'
              variant='ghost'
            />
            <IconButton
              icon={<img alt='' src='/icons/meeting-notes.svg' />}
              label='회의록 열기'
              size='sm'
              variant='ghost'
            />
            {/* TODO(KD3-75 follow-up): 알림/회의록 티켓에서 헤더 액션을 연결한다. */}
            <Avatar
              alt={currentUser.name}
              size={24}
              tooltip={currentUser.name}
            />
          </HStack>
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
