import { Button, EmptyState } from '@aics/design-system';
import { isAxiosError } from 'axios';
import { lazy, Suspense } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import TopicCandidateDialog from '~/features/project-topic/TopicCandidateDialog';
import { TopicCandidateDialogProvider } from '~/features/project-topic/TopicCandidateDialogContext';
import { useStudentHomeDashboardQuery } from '~/features/student-home/queries';

import MilestoneList from '~/widgets/milestone-summary/MilestoneList';

import StudentHomeHero from './StudentHomeHero';
import { getStudentHomeHeroCopy } from './studentHomeHeroCopy';
import * as styles from './StudentHomePage.css';

const DevelopmentMilestonePreview = import.meta.env.DEV
  ? lazy(() => import('~/features/student-home/dev/MilestonePreview'))
  : null;

type DashboardErrorContent = {
  title: string;
  description: string;
};

export function getDashboardErrorContent(
  error: unknown,
): DashboardErrorContent {
  if (!isAxiosError(error)) {
    return {
      title: '대시보드를 불러오지 못했어요.',
      description: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
    };
  }

  switch (error.response?.status) {
    case 401:
      return {
        title: '로그인이 필요해요.',
        description: '세션을 확인한 뒤 다시 로그인해 주세요.',
      };
    case 403:
      return {
        title: '이 분반에 접근할 수 없어요.',
        description: '소속 분반과 학생 권한을 확인해 주세요.',
      };
    case 404:
      return {
        title: '분반 대시보드를 찾지 못했어요.',
        description: '분반이 개설되었는지 담당자에게 확인해 주세요.',
      };
    default:
      return {
        title: '대시보드를 불러오지 못했어요.',
        description: '잠시 후 다시 시도해 주세요.',
      };
  }
}

export default function StudentHomePage() {
  const currentUser = useAuthStore(state => state.currentUser);
  const sectionId = currentUser?.sections[0]?.id ?? '';

  const { data, error, isFetching, isPending, refetch } =
    useStudentHomeDashboardQuery(sectionId);

  if (!sectionId) {
    return (
      <EmptyState
        description='수강 분반 배정이 완료되면 학생 홈을 이용할 수 있어요.'
        headingLevel={2}
        title='소속 분반이 없어요.'
      />
    );
  }

  if (isPending) {
    return (
      <p aria-live='polite' className={styles.status} role='status'>
        대시보드를 불러오는 중...
      </p>
    );
  }

  if (error || !data) {
    const errorContent = getDashboardErrorContent(error);

    return (
      <EmptyState
        actions={
          <Button
            clickAction={async () => {
              await refetch();
            }}
            isLoading={isFetching}
            label='다시 시도'
            variant='primary'
          />
        }
        description={errorContent.description}
        headingLevel={2}
        title={errorContent.title}
      />
    );
  }

  const hero = getStudentHomeHeroCopy(data.hero, data.milestones);

  return (
    <div className={styles.root}>
      <StudentHomeHero announcements={data.announcements} hero={hero} />
      {DevelopmentMilestonePreview ? (
        <Suspense fallback={null}>
          <DevelopmentMilestonePreview
            onPreviewChange={() => {
              void refetch();
            }}
          />
        </Suspense>
      ) : null}
      <TopicCandidateDialogProvider>
        <TopicCandidateDialog />
        <MilestoneList milestones={data.milestones} />
      </TopicCandidateDialogProvider>
    </div>
  );
}
