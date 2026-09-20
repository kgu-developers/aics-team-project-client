import type {
  PartnerCandidate,
  PreferredPeerRequestStatus,
  TeamAssignmentProjection,
} from '@aics/core';
import { Button, Text, TextInput, useToast } from '@aics/design-system';
import { useState } from 'react';

import {
  useDecidePreferredPeerRequestMutation,
  usePreSurveyClassmates,
} from '../queries';
import * as styles from '../TeamAssignmentFlow.css';
import { PartnerRequestDialogs } from './PartnerRequestDialogs';

type LivePartnerRequestPanelProps = {
  canRequestPartner: boolean;
  draftPreferredPeer: PartnerCandidate | null | undefined;
  onPreferredPeerChange: (candidate: PartnerCandidate | null) => void;
  preSurveySectionId: number;
  preferredPeerStatus?: PreferredPeerRequestStatus | null;
  projection: TeamAssignmentProjection;
};

export function LivePartnerRequestPanel({
  canRequestPartner,
  draftPreferredPeer,
  onPreferredPeerChange,
  preSurveySectionId,
  preferredPeerStatus,
  projection,
}: LivePartnerRequestPanelProps) {
  const toast = useToast();
  const [partnerQuery, setPartnerQuery] = useState('');
  const [cancelRequestOpen, setCancelRequestOpen] = useState(false);
  const [approveRequestOpen, setApproveRequestOpen] = useState(false);
  const classmates = usePreSurveyClassmates(preSurveySectionId, partnerQuery);
  const decideRequest =
    useDecidePreferredPeerRequestMutation(preSurveySectionId);

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

  function updatePartner(candidate: PartnerCandidate | null) {
    onPreferredPeerChange(candidate);
    setCancelRequestOpen(false);
    setPartnerQuery('');
  }

  const outgoingPartner =
    draftPreferredPeer === undefined
      ? projection.outgoingPartnerRequest?.recipient
      : (draftPreferredPeer ?? undefined);
  const hasDraftPartnerChange = draftPreferredPeer !== undefined;

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
      ) : outgoingPartner ? (
        <section
          aria-label={
            hasDraftPartnerChange ? '선택한 파트너' : '보낸 파트너 신청'
          }
          className={styles.partnerRequest}
        >
          <Text as='p' color='secondary' type='supporting'>
            <strong>{outgoingPartner.name}</strong>{' '}
            {hasDraftPartnerChange
              ? '님을 선택했습니다. 설문을 제출하면 신청이 전송됩니다.'
              : '님의 응답을 기다리고 있습니다.'}
          </Text>
          <Text as='p' color='secondary' type='supporting'>
            {outgoingPartner.studentNumber}
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
      ) : preferredPeerStatus === 'REJECTED' && !hasDraftPartnerChange ? (
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
              label='다른 파트너 찾기'
              onClick={() => updatePartner(null)}
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
              역할을 하나 이상 선택하면 파트너를 선택할 수 있어요.
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
              disabled={!canRequestPartner}
              key={candidate.userId}
              onClick={() =>
                updatePartner({
                  id: candidate.userId,
                  name: candidate.name,
                  studentNumber: candidate.userId,
                })
              }
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
        isCancelling={false}
        onApprove={() => void respond('approve')}
        onApproveOpenChange={setApproveRequestOpen}
        onCancel={() => updatePartner(null)}
        onCancelOpenChange={setCancelRequestOpen}
      />
    </>
  );
}
