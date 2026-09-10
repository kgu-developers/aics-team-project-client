import type { ReactNode } from 'react';

import { useTeamKickoffQuery } from '~/features/team-assignment/queries';

import type { FinalReportSubmissionTarget } from '../FinalReportSubmissionPanel';
import {
  useStudentSubmissionQuery,
  useStudentSubmissionVersionsQuery,
} from '../queries';
import { submissionConsentErrorMessage } from './consentScope';
import { useLiveSubmissionConsent } from './queries';

type ActionState = {
  value: string;
  actionLabel: string;
  disabled: boolean;
  busy: boolean;
  notice?: string;
  onAction: () => void | Promise<void>;
};

/** Supplies the existing milestone row with status and a single contextual CTA. */
export default function FinalReportSubmissionAction({
  target,
  onSubmit,
  children,
}: {
  target: FinalReportSubmissionTarget;
  onSubmit: () => void;
  children: (state: ActionState) => ReactNode;
}) {
  const detail = useStudentSubmissionQuery(target, target.submissionId);
  const versions = useStudentSubmissionVersionsQuery(
    target,
    target.submissionId,
  );
  const team = useTeamKickoffQuery(target.teamId);
  const leader =
    !team.isError &&
    String(team.data?.id) === target.teamId &&
    team.data?.members.some(
      member =>
        member.studentNumber === target.studentNumber && member.isLeader,
    ) === true;
  const latestVersion = versions.data?.reduce(
    (latest, item) => Math.max(latest, item.version),
    0,
  );
  const consent = useLiveSubmissionConsent(
    {
      ...target,
      currentVersion:
        detail.isSuccess && versions.isSuccess ? latestVersion : undefined,
      milestoneType: 'FINAL_REPORT',
    },
    true,
    leader,
  );
  const busy =
    detail.isFetching ||
    versions.isFetching ||
    team.isFetching ||
    consent.pending;
  const readError = detail.isError || versions.isError || team.isError;
  const missing =
    detail.isSuccess &&
    versions.isSuccess &&
    detail.data.currentVersion > 0 &&
    latestVersion === 0;
  async function refresh() {
    await Promise.all([
      detail.refetch(),
      versions.refetch(),
      team.refetch(),
      consent.refresh(),
    ]);
  }
  if (readError || consent.error || missing) {
    const message = consent.error
      ? submissionConsentErrorMessage(consent.error)
      : '승인 현황을 불러오지 못했어요.';
    return children({
      value: message,
      actionLabel: '다시 조회',
      disabled: busy,
      busy,
      notice: message,
      onAction: refresh,
    });
  }
  const snapshot = consent.snapshot;
  const summary = snapshot?.consent;
  const submitted = (snapshot?.submission.currentVersion ?? 0) > 0;
  const completed = snapshot?.submission.status === 'COMPLETED';
  const ready = Boolean(snapshot) && team.isSuccess && !busy;
  const value = completed
    ? `승인 ${summary?.confirmedCount}/${summary?.totalCount}명 · 완료`
    : summary
      ? `승인 ${summary.confirmedCount}/${summary.totalCount}명`
      : consent.state === 'not-submitted'
        ? '미제출'
        : '승인 현황 확인 중...';
  const actionLabel = completed
    ? '완료'
    : !submitted
      ? leader
        ? '파일 제출'
        : '제출 대기'
      : leader
        ? consent.canComplete
          ? '최종 완료'
          : '파일 교체'
        : summary?.isConfirmedByMe
          ? '승인 취소'
          : '승인하기';
  const upload = leader && !completed && !consent.canComplete;
  const disabled =
    !ready ||
    completed ||
    (upload
      ? !detail.data?.canSubmitNow
      : leader
        ? !consent.canComplete
        : !consent.canChange);
  return children({
    value,
    actionLabel,
    disabled,
    busy,
    onAction: upload
      ? onSubmit
      : leader
        ? consent.complete
        : summary?.isConfirmedByMe
          ? consent.cancel
          : consent.confirm,
  });
}
