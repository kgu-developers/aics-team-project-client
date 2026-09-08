import { Button, Card, Heading, Text } from '@aics/design-system';

import {
  submissionConsentErrorMessage,
  type SubmissionConsentScope,
} from './consentScope';
import { useLiveSubmissionConsent } from './queries';

export type LiveSubmissionConsentPanelProps = SubmissionConsentScope & {
  allowContractActions?: boolean;
};

/** Contract review surface; completion policy and version-bound writes remain gated. */
export default function LiveSubmissionConsentPanel({
  allowContractActions = false,
  ...scope
}: LiveSubmissionConsentPanelProps) {
  const consent = useLiveSubmissionConsent(scope, allowContractActions);
  const summary = consent.snapshot?.consent;
  const message =
    consent.state === 'unauthenticated'
      ? '현재 학생 로그인 정보와 제출 대상을 확인해 주세요.'
      : consent.state === 'missing-context'
        ? '분반, 팀, 마일스톤과 제출 버전이 확인되면 팀원 확인 현황을 볼 수 있어요.'
        : consent.state === 'unsupported'
          ? '최종보고서의 팀원 확인만 지원해요.'
          : consent.state === 'loading'
            ? '최신 제출 버전과 팀원 확인 현황을 확인하고 있어요.'
            : consent.state === 'not-submitted'
              ? '아직 최종보고서가 제출되지 않았어요.'
              : consent.error
                ? submissionConsentErrorMessage(consent.error)
                : undefined;
  return (
    <Card>
      <section aria-label='최종보고서 팀원 확인'>
        <Heading level={2}>최종보고서 팀원 확인</Heading>
        {message ? (
          <p role={consent.error ? 'alert' : 'status'}>{message}</p>
        ) : null}
        {summary ? (
          <>
            <Text>
              v{consent.snapshot!.submission.currentVersion} 확인 현황:{' '}
              {summary.confirmedCount}/{summary.totalCount}명
            </Text>
            <Text>
              {summary.isConfirmedByMe
                ? '현재 버전을 확인했어요.'
                : '현재 버전의 확인이 필요해요.'}
            </Text>
          </>
        ) : null}
        {consent.state === 'completed' ? (
          <Text>서버에서 최종 완료된 제출이에요.</Text>
        ) : (
          <Text>팀원 확인과 최종 완료는 별도 상태예요.</Text>
        )}
        <Button
          label='확인 현황 새로고침'
          onClick={() => void consent.refresh()}
          isDisabled={!consent.canRefresh}
          variant='secondary'
        />
        {allowContractActions ? (
          <>
            <Button
              label='현재 버전 확인'
              onClick={() => void consent.confirm()}
              isDisabled={
                !consent.canChange || Boolean(summary?.isConfirmedByMe)
              }
            />
            <Button
              label='내 확인 취소'
              onClick={() => void consent.cancel()}
              isDisabled={!consent.canChange || !summary?.isConfirmedByMe}
              variant='secondary'
            />
          </>
        ) : null}
        <Button label='최종 완료' isDisabled />
        <Text color='secondary'>최종 완료 기능은 준비 중이에요.</Text>
      </section>
    </Card>
  );
}
