import { Heading, Text, useToast, VStack } from '@aics/design-system';

import AdminCourseManagement from '~/features/admin-course/components/AdminCourseManagement';
import { useAuthStore } from '~/features/auth/authStore';
import { fetchSessionUser } from '~/features/auth/fetchSessionUser';

import AdminCourseOperations from './AdminCourseOperations';
import * as styles from './AdminCourseSectionManagementPage.css';

export default function AdminCourseSectionManagementPage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const sessionRole = useAuthStore(state => state.sessionRole);
  const setCurrentUser = useAuthStore(state => state.setCurrentUser);
  const toast = useToast();

  async function refreshCurrentUserSections() {
    if (!sessionRole) return false;
    try {
      setCurrentUser(await fetchSessionUser(sessionRole));
      return true;
    } catch {
      toast({ body: '분반 목록을 새로고침하지 못했습니다.' });
      return false;
    }
  }

  return (
    <div className={styles.page}>
      <VStack gap={4}>
        <header>
          <Heading level={1}>강좌·분반 관리</Heading>
          <Text color='secondary'>
            강좌와 연결된 분반, 연락처 공개 기간을 관리합니다.
          </Text>
        </header>
        <AdminCourseManagement
          onSectionCreated={refreshCurrentUserSections}
          professorId={currentUser?.studentNumber}
        />
        <AdminCourseOperations />
      </VStack>
    </div>
  );
}
