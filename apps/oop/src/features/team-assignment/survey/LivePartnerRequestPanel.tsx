import type {
  PreferredPeerRequestStatus,
  TeamAssignmentProjection,
  TeamAssignmentSurvey,
} from '@aics/core';
import { Button, Text, TextInput, useToast } from '@aics/design-system';
import { useState } from 'react';

import {
  useDecidePreferredPeerRequestMutation,
  usePreSurveyClassmates,
  useUpdatePreferredPeerMutation,
} from '../queries';
import * as styles from '../TeamAssignmentFlow.css';
import { PartnerRequestDialogs } from './PartnerRequestDialogs';

type LivePartnerRequestPanelProps = {
  preSurveySectionId: number;
  preferredPeerStatus?: PreferredPeerRequestStatus | null;
  projection: TeamAssignmentProjection;
  survey: TeamAssignmentSurvey;
};

export function LivePartnerRequestPanel({
  preSurveySectionId,
  preferredPeerStatus,
  projection,
  survey,
}: LivePartnerRequestPanelProps) {
  const toast = useToast();
  const [partnerQuery, setPartnerQuery] = useState('');
  const [cancelRequestOpen, setCancelRequestOpen] = useState(false);
  const [approveRequestOpen, setApproveRequestOpen] = useState(false);
  const classmates = usePreSurveyClassmates(preSurveySectionId, partnerQuery);
  const updatePreferredPeer =
    useUpdatePreferredPeerMutation(preSurveySectionId);
  const decideRequest =
    useDecidePreferredPeerRequestMutation(preSurveySectionId);
  const canRequestPartner = survey.rolePreferences.length > 0;

  async function respond(decision: 'approve' | 'reject') {
    const request = projection.incomingPartnerRequest;
    if (!request) return;
    try {
      await decideRequest.mutateAsync({
        decision,
        requesterUserId: request.requester.id,
      });
      setApproveRequestOpen(false);
      toast({
        body:
          decision === 'approve'
            ? '파트너가 확정되었습니다.'
            : '파트너 신청을 거절했습니다.',
      });
    } catch {
      toast({
        body: '요청 처리에 실패했습니다. 다시 시도해 주세요.',
        type: 'error',
      });
    }
  }

  async function updatePartner(preferredPeerUserId: string | null) {
    try {
      await updatePreferredPeer.mutateAsync({ preferredPeerUserId, survey });
      setCancelRequestOpen(false);
      setPartnerQuery('');
      toast({
        body: preferredPeerUserId
          ? '파트너 신청을 보냈습니다.'
          : '파트너 신청을 취소했습니다.',
      });
    } catch {
      toast({
        body: preferredPeerUserId
          ? '파트너 신청을 만들지 못했습니다. 다시 시도해 주세요.'
          : '파트너 신청을 취소하지 못했습니다. 다시 시도해 주세요.',
        type: 'error',
      });
    }
  }

  return (
    <>
      {projection.incomingPartnerRequest ? (
        <section
          aria-label='받은 파트너 신청'
          className={styles.partnerRequest}
          role='region'
        >
          <Text as='p' color='secondary' type='supporting'>
            <strong>{projection.incomingPartnerRequest.requester.name}</strong>{' '}
            님이 파트너 신청을 보냈습니다.
          </Text>
          <Text as='p' color='secondary' type='supporting'>
            {projection.incomingPartnerRequest.requester.studentNumber}
          </Text>
          <Text as='p' color='secondary' type='supporting'>
            설문을 제출하기 전에 승인 또는 거절을 선택해 주세요.
          </Text>
          <div className={styles.requestActions}>
            <Button
              label='승인'
              onClick={() => setApproveRequestOpen(true)}
              variant='primary'
            />
            <Button
              isLoading={decideRequest.isPending}
              label='거절'
              onClick={() => void respond('reject')}
              variant='secondary'
            />
          </div>
        </section>
      ) : projection.outgoingPartnerRequest ? (
        <section
          aria-label='보낸 파트너 신청'
          className={styles.partnerRequest}
        >
          <Text as='p' color='secondary' type='supporting'>
            <strong>{projection.outgoingPartnerRequest.recipient.name}</strong>{' '}
            님의 응답을 기다리고 있습니다.
          </Text>
          <Text as='p' color='secondary' type='supporting'>
            {projection.outgoingPartnerRequest.recipient.studentNumber}
          </Text>
          <div className={styles.requestActions}>
            <Button
              label='신청 취소'
              onClick={() => setCancelRequestOpen(true)}
              variant='secondary'
            />
          </div>
        </section>
      ) : projection.confirmedPartner ? (
        <section aria-label='확정된 파트너' className={styles.partnerRequest}>
          <Text as='p' color='secondary' type='supporting'>
            <strong>{projection.confirmedPartner.name}</strong> 님이 파트너로
            확정되었습니다.
          </Text>
          <Text as='p' color='secondary' type='supporting'>
            {projection.confirmedPartner.studentNumber}
          </Text>
        </section>
      ) : preferredPeerStatus === 'REJECTED' ? (
        <section
          aria-label='거절된 파트너 신청'
          className={styles.partnerRequest}
        >
          <Text as='p' color='secondary' type='supporting'>
            이전 파트너 신청이 거절되었습니다. 기존 지목을 정리한 뒤 다른
            학생에게 다시 신청할 수 있어요.
          </Text>
          <div className={styles.requestActions}>
            <Button
              isLoading={updatePreferredPeer.isPending}
              label='다른 파트너 찾기'
              onClick={() => void updatePartner(null)}
              variant='secondary'
            />
          </div>
        </section>
      ) : (
        <div className={styles.partnerSearch}>
          <TextInput
            label='같이 팀을 할 파트너가 있으면 찾아보세요.'
            onChange={setPartnerQuery}
            placeholder='이름 또는 학번 검색'
            value={partnerQuery}
          />
          {!canRequestPartner ? (
            <Text as='p' color='secondary' type='supporting'>
              역할을 하나 이상 선택하면 파트너 신청을 보낼 수 있어요.
            </Text>
          ) : null}
          {classmates.isFetching ? (
            <Text as='p' color='secondary' type='supporting'>
              후보를 찾는 중입니다.
            </Text>
          ) : null}
          {classmates.isError ? (
            <div className={styles.requestActions}>
              <Text as='p' color='secondary' role='alert' type='supporting'>
                후보를 찾지 못했습니다. 다시 검색해 주세요.
              </Text>
              <Button
                isLoading={classmates.isFetching}
                label='다시 검색'
                onClick={() => void classmates.refetch()}
                variant='secondary'
              />
            </div>
          ) : null}
          {classmates.data?.map(candidate => (
            <button
              className={styles.partnerCandidate}
              disabled={!canRequestPartner || updatePreferredPeer.isPending}
              key={candidate.userId}
              onClick={() => void updatePartner(candidate.userId)}
              type='button'
            >
              <span>{candidate.name}</span>
              <span>{candidate.userId}</span>
            </button>
          ))}
          {partnerQuery.trim() &&
          !classmates.isFetching &&
          !classmates.isError &&
          classmates.data?.length === 0 ? (
            <Text as='p' color='secondary' type='supporting'>
              일치하는 학생이 없습니다.
            </Text>
          ) : null}
        </div>
      )}
      <PartnerRequestDialogs
        approveRequestOpen={approveRequestOpen}
        cancelRequestOpen={cancelRequestOpen}
        isApproving={decideRequest.isPending}
        isCancelling={updatePreferredPeer.isPending}
        onApprove={() => void respond('approve')}
        onApproveOpenChange={setApproveRequestOpen}
        onCancel={() => void updatePartner(null)}
        onCancelOpenChange={setCancelRequestOpen}
      />
    </>
  );
}
