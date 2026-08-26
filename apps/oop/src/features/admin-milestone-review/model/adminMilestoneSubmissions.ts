import type {
  AdminSectionMilestoneSubmissionItemDto,
  AdminSectionMilestoneSubmissionsResponse,
} from '@aics/api-client';

export type AdminMilestoneSubmissionSummaryView = {
  attachmentCountLabel: string | null;
  feedbackCountLabel: string | null;
  leaderName: string | null;
  linkLabel: string | null;
  presentationFileName: string | null;
  projectTopic: string | null;
  reportFileName: string | null;
  reportDownloadUrl: string | null;
  sourceArchiveFileName: string | null;
  sourceArchiveDownloadUrl: string | null;
  submittedMemberCountLabel: string | null;
};

export type AdminMilestoneSubmissionView = {
  id: string;
  meetingCountLabel: string;
  messageCountLabel: string;
  submissionId: string | null;
  submittedAt: string | null;
  submittedAtLabel: string;
  summary: AdminMilestoneSubmissionSummaryView;
  teamId: string;
  teamName: string;
};

export type AdminMilestoneSubmissionsView = {
  milestoneId: string;
  milestoneTitle: string;
  sectionId: string;
  sectionLabel: string;
  submissions: AdminMilestoneSubmissionView[];
};

function toCountLabel(label: string, count: number | null): string {
  return `${label}: ${count ?? '-'}`;
}

function toSubmissionView(
  submission: AdminSectionMilestoneSubmissionItemDto,
): AdminMilestoneSubmissionView {
  return {
    id: submission.id,
    meetingCountLabel: toCountLabel('회의록', submission.meetingRecordCount),
    messageCountLabel: toCountLabel('쪽지', submission.messageCount),
    submissionId: submission.submissionId,
    submittedAt: submission.submittedAt,
    submittedAtLabel: submission.submittedAt ?? '-',
    summary: {
      attachmentCountLabel:
        submission.summary.attachmentCount === null
          ? null
          : toCountLabel('첨부 파일 수', submission.summary.attachmentCount),
      feedbackCountLabel:
        submission.summary.feedbackCount === null
          ? null
          : toCountLabel('피드백', submission.summary.feedbackCount),
      leaderName: submission.summary.leaderName,
      linkLabel: submission.summary.linkLabel,
      presentationFileName: submission.summary.presentationFileName,
      projectTopic: submission.summary.projectTopic,
      reportFileName: submission.summary.reportFileName,
      reportDownloadUrl: submission.summary.reportDownloadUrl,
      sourceArchiveFileName: submission.summary.sourceArchiveFileName,
      sourceArchiveDownloadUrl: submission.summary.sourceArchiveDownloadUrl,
      submittedMemberCountLabel:
        submission.summary.submittedMemberCount === null
          ? null
          : toCountLabel('제출자 수', submission.summary.submittedMemberCount),
    },
    teamId: submission.teamId,
    teamName: submission.teamName,
  };
}

export function toAdminMilestoneSubmissionsView(
  response: AdminSectionMilestoneSubmissionsResponse,
): AdminMilestoneSubmissionsView {
  return {
    milestoneId: response.milestone.id,
    milestoneTitle: response.milestone.title,
    sectionId: response.section.id,
    sectionLabel: response.section.label,
    submissions: response.submissions.map(toSubmissionView),
  };
}
