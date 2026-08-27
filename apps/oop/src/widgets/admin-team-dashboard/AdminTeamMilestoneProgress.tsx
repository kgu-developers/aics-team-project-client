import { EmptyState, Heading, Text } from '@aics/design-system';

import {
  AdminFinalReportDownloadSummary,
  AdminSubmissionExternalLink,
  AdminSubmissionFileDownloadLink,
} from '~/features/admin-milestone-review/components/AdminFinalReportDownloadSummary';
import { AdminMilestoneSubmissionCard } from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionCard';
import {
  AdminMilestoneSubmissionBulkDownloadAction,
  AdminMilestoneSubmissionDetailAction,
} from '~/features/admin-milestone-review/components/AdminMilestoneSubmissionDetailAction';
import type { TeamMilestoneProgress } from '~/features/admin-team-dashboard/model';

import * as styles from './AdminTeamMilestoneProgress.css';

type AdminTeamMilestoneProgressProps = {
  milestones: TeamMilestoneProgress[];
  projectTopic: string | null;
  sectionId: string;
  teamMemberCount: number;
  teamLeaderName: string | null;
};

function getFinalReportDownloadFiles(milestone: TeamMilestoneProgress) {
  const files = milestone.downloadFiles ?? [
    {
      downloadUrl: null,
      fileName: null,
      label: '보고서(pdf)',
    },
    {
      downloadUrl: null,
      fileName: null,
      label: '전체 파일(zip)',
    },
  ];

  return files;
}

function getMilestoneSummary(
  milestone: TeamMilestoneProgress,
  projectTopic: string | null,
  teamMemberCount: number,
  teamLeaderName: string | null,
) {
  switch (milestone.id) {
    case 'proposal':
      return (
        <>
          <Text>주제: {projectTopic ?? '미정'}</Text>
          <Text>팀장: {teamLeaderName ?? '미정'}</Text>
        </>
      );
    case 'midterm':
      return (
        <>
          <Text>첨부 파일 수: {milestone.summary?.attachmentCount ?? '-'}</Text>
          <Text>피드백: -</Text>
        </>
      );
    case 'presentation-submit':
      return (
        <>
          <Text>
            PPT 파일:{' '}
            {milestone.summary?.presentationFileDownloadUrl &&
            milestone.summary.presentationFileName ? (
              <AdminSubmissionFileDownloadLink
                downloadUrl={milestone.summary.presentationFileDownloadUrl}
                fileName={milestone.summary.presentationFileName}
              />
            ) : (
              '-'
            )}
          </Text>
          <Text>
            시연 파일(zip):{' '}
            {milestone.summary?.sourceArchiveDownloadUrl &&
            milestone.summary.sourceArchiveFileName ? (
              <AdminSubmissionFileDownloadLink
                downloadUrl={milestone.summary.sourceArchiveDownloadUrl}
                fileName={milestone.summary.sourceArchiveFileName}
              />
            ) : (
              '-'
            )}
          </Text>
          <Text>
            링크:{' '}
            {milestone.summary?.videoUrl ? (
              <AdminSubmissionExternalLink url={milestone.summary.videoUrl} />
            ) : (
              '-'
            )}
          </Text>
        </>
      );
    case 'final-report':
      return (
        <AdminFinalReportDownloadSummary
          files={getFinalReportDownloadFiles(milestone)}
        />
      );
    case 'peer-review':
      return (
        <Text>
          제출자 수: {milestone.submittedMemberCount ?? 0} /{' '}
          {milestone.memberCount ?? teamMemberCount}
        </Text>
      );
    default:
      return <Text>제출 상태를 확인할 수 없습니다.</Text>;
  }
}

export default function AdminTeamMilestoneProgress({
  milestones,
  projectTopic,
  sectionId,
  teamMemberCount,
  teamLeaderName,
}: AdminTeamMilestoneProgressProps) {
  const displayMilestones = milestones.filter(
    milestone => milestone.id !== 'presentation-evaluate',
  );

  return (
    <section className={styles.section}>
      <Heading level={2}>진행 현황</Heading>

      {displayMilestones.length === 0 ? (
        <EmptyState
          description='분반에 마일스톤이 등록되면 팀 진행 현황을 확인할 수 있습니다.'
          headingLevel={3}
          title='등록된 마일스톤이 없습니다.'
        />
      ) : (
        <div className={styles.list}>
          {displayMilestones.map(milestone => {
            const detailSubmissionId = milestone.submissionId;
            return (
              <AdminMilestoneSubmissionCard
                action={
                  milestone.id === 'final-report' ? (
                    <AdminMilestoneSubmissionBulkDownloadAction />
                  ) : (
                    <AdminMilestoneSubmissionDetailAction
                      milestoneId={milestone.id}
                      sectionId={sectionId}
                      submissionId={detailSubmissionId}
                    />
                  )
                }
                key={milestone.id}
                label={milestone.title}
                meetingCountLabel='회의록: -'
                messageCountLabel='쪽지: -'
                secondaryLabel={`마감 ${milestone.deadlineLabel}`}
                summary={getMilestoneSummary(
                  milestone,
                  projectTopic,
                  teamMemberCount,
                  teamLeaderName,
                )}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
