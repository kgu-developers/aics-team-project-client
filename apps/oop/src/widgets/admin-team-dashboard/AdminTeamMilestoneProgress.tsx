import { EmptyState, Heading, Text } from '@aics/design-system';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import {
  AdminSubmissionExternalLink,
  AdminSubmissionFileDownloadLink,
} from '~/features/admin-milestone-review/components/AdminFinalReportDownloadSummary';
import { AdminMilestoneSubmissionCard } from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionCard';
import {
  AdminMilestoneSubmissionBulkDownloadAction,
  AdminMilestoneSubmissionDetailAction,
} from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionDetailAction';
import {
  type AdminMilestoneSubmissionView,
  type AdminSubmissionVersionDetailView,
} from '~/features/admin-milestone-review/model';
import { useDownloadAdminSubmissionArtifactsMutation } from '~/features/admin-milestone-review/queries';
import { useAdminReadState } from '~/features/admin-read-state/useAdminReadState';
import type { TeamMilestoneProgress } from '~/features/admin-team-dashboard/model';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminTeamMilestoneProgress.css';

type AdminTeamMilestoneProgressProps = {
  milestones: TeamMilestoneProgress[];
  milestoneListState: 'error' | 'pending' | 'ready';
  sectionId: string;
};

function getSubmissionMetadata(
  submission: AdminMilestoneSubmissionView,
  version: AdminSubmissionVersionDetailView | null,
) {
  if (!submission.submissionId || !version) return null;

  return (
    <>
      <Text>{formatSeoulDateTime(version.submittedAt)}</Text>
      <Text>제출자: {version.submittedBy}</Text>
    </>
  );
}

function getReviewSummary(submission: AdminMilestoneSubmissionView) {
  return <>{submission.hasPendingReview ? <Text>검토 대기 중</Text> : null}</>;
}

function getProposalSummary(submission: AdminMilestoneSubmissionView) {
  return (
    <>
      <Text>프로젝트 주제: {submission.projectTitle ?? '-'}</Text>
      {getReviewSummary(submission)}
    </>
  );
}

function getDownloadSummary(milestone: TeamMilestoneProgress) {
  const submission = milestone.submission;

  if (!submission) return null;

  const artifacts = milestone.version?.artifacts.filter(
    artifact => artifact.type === 'FILE' || artifact.type === 'LINK',
  );

  return (
    <>
      <Text>
        현재 버전:{' '}
        {submission.currentVersion > 0 ? `${submission.currentVersion}차` : '-'}
      </Text>
      {submission.presentationOrder !== null ? (
        <Text>발표 순서: {submission.presentationOrder}번</Text>
      ) : null}
      {!submission.submissionId ? null : milestone.versionState ===
        'pending' ? (
        <Text>제출 파일을 불러오는 중입니다.</Text>
      ) : milestone.versionState === 'error' ? (
        <Text>제출 파일 정보를 불러오지 못했습니다.</Text>
      ) : milestone.version ? (
        artifacts && artifacts.length > 0 ? (
          artifacts.map((artifact, index) => {
            const label = artifact.label;

            if (artifact.downloadUrl && artifact.fileName) {
              return (
                <Text key={`${artifact.type}-${index}`}>
                  {label}:{' '}
                  <AdminSubmissionFileDownloadLink
                    downloadUrl={artifact.downloadUrl}
                    fileName={artifact.fileName}
                  />
                </Text>
              );
            }

            return artifact.url ? (
              <Text key={`${artifact.type}-${index}`}>
                {label}: <AdminSubmissionExternalLink url={artifact.url} />
              </Text>
            ) : null;
          })
        ) : (
          <Text>제출된 파일이 없습니다.</Text>
        )
      ) : null}
    </>
  );
}

function getSummary(milestone: TeamMilestoneProgress) {
  if (milestone.submissionState === 'pending') {
    return <Text>제출 현황을 불러오는 중입니다.</Text>;
  }

  if (milestone.submissionState === 'error') {
    return <Text>제출 현황을 불러오지 못했습니다.</Text>;
  }

  if (!milestone.submission) {
    return <Text>이 팀의 제출 정보를 찾을 수 없습니다.</Text>;
  }

  if (milestone.milestone.type === 'PROPOSAL') {
    return getProposalSummary(milestone.submission);
  }

  if (
    milestone.milestone.type === 'FINAL_REPORT' ||
    milestone.milestone.type === 'PRESENTATION'
  ) {
    return getDownloadSummary(milestone);
  }

  return getReviewSummary(milestone.submission);
}

export default function AdminTeamMilestoneProgress({
  milestones,
  milestoneListState,
  sectionId,
}: AdminTeamMilestoneProgressProps) {
  const adminId = useAuthStore(state => state.currentUser?.id);
  const submissionReadState = useAdminReadState('submissions', { adminId });
  const downloadArtifactsMutation =
    useDownloadAdminSubmissionArtifactsMutation();

  return (
    <section className={styles.section}>
      <Heading level={2}>마일스톤별 제출 현황</Heading>

      {milestoneListState === 'pending' ? (
        <p aria-live='polite' role='status'>
          마일스톤을 불러오는 중입니다.
        </p>
      ) : milestoneListState === 'error' ? (
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          headingLevel={3}
          title='마일스톤을 불러오지 못했습니다.'
        />
      ) : milestones.length === 0 ? (
        <EmptyState
          description='분반에 마일스톤이 등록되면 팀 제출 현황을 확인할 수 있습니다.'
          headingLevel={3}
          title='등록된 마일스톤이 없습니다.'
        />
      ) : (
        <div className={styles.list}>
          {milestones.map(milestone => {
            const submission = milestone.submission;
            const submissionId = submission?.submissionId ?? null;
            const isDownloadMilestone =
              milestone.milestone.type === 'FINAL_REPORT' ||
              milestone.milestone.type === 'PRESENTATION';
            const isVersionDetailAvailable =
              milestone.milestone.type === 'PROPOSAL' ||
              milestone.milestone.type === 'MID_REPORT';
            const shouldShowSubmissionMetadata =
              milestone.milestone.type !== 'PEER_EVALUATION';
            const unavailableReason = !isVersionDetailAvailable
              ? '이 마일스톤의 전용 상세 조회 API 확인 후 제공 예정입니다.'
              : !submission
                ? '이 팀의 제출 정보를 찾을 수 없습니다.'
                : submission.currentVersion === 0
                  ? '아직 제출하지 않은 마일스톤입니다.'
                  : undefined;

            return (
              <AdminMilestoneSubmissionCard
                action={
                  isDownloadMilestone ? (
                    <AdminMilestoneSubmissionBulkDownloadAction
                      isLoading={
                        downloadArtifactsMutation.isPending &&
                        downloadArtifactsMutation.variables === submissionId
                      }
                      onClick={
                        submissionId
                          ? () => {
                              downloadArtifactsMutation.mutate(submissionId);
                            }
                          : undefined
                      }
                    />
                  ) : (
                    <AdminMilestoneSubmissionDetailAction
                      milestoneId={
                        milestone.milestone.type === 'PROPOSAL'
                          ? 'proposal'
                          : milestone.milestone.type === 'MID_REPORT'
                            ? 'midterm'
                            : 'peer-review'
                      }
                      sectionId={sectionId}
                      submissionId={submissionId}
                      unavailableReason={unavailableReason}
                    />
                  )
                }
                isUnread={Boolean(
                  submissionId &&
                  !submissionReadState.isRead(sectionId, submissionId),
                )}
                key={milestone.milestone.id}
                label={milestone.milestone.title}
                messageCountLabel='쪽지: -'
                secondaryLabel={submission?.statusLabel ?? '제출 정보 없음'}
                submissionMetadata={
                  submission && shouldShowSubmissionMetadata
                    ? getSubmissionMetadata(submission, milestone.version)
                    : null
                }
                summary={getSummary(milestone)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
