import type { TeamAssignmentProjection } from '@aics/core';
import { Button, TextInput, useToast } from '@aics/design-system';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  teamAssignmentQueryKey,
  useCancelPartnerRequest,
  usePartnerCandidates,
  useRequestPartner,
  useRespondToPartnerRequest,
} from '../queries';
import * as styles from '../TeamAssignmentFlow.css';
import { PartnerRequestDialogs } from './PartnerRequestDialogs';

type PartnerRequestPanelProps = { projection: TeamAssignmentProjection };

export function PartnerRequestPanel({ projection }: PartnerRequestPanelProps) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [partnerQuery, setPartnerQuery] = useState('');
  const [cancelRequestOpen, setCancelRequestOpen] = useState(false);
  const [approveRequestOpen, setApproveRequestOpen] = useState(false);
  const partnerCandidates = usePartnerCandidates(
    projection.sectionId,
    partnerQuery,
  );
  const requestPartner = useRequestPartner(projection.sectionId);
  const cancelPartnerRequest = useCancelPartnerRequest(projection.sectionId);
  const respondToPartnerRequest = useRespondToPartnerRequest(
    projection.sectionId,
  );

  async function refreshProjection() {
    await queryClient.invalidateQueries({
      queryKey: teamAssignmentQueryKey(projection.sectionId),
    });
  }

  async function approvePartnerRequest() {
    if (!projection.incomingPartnerRequest) return;
    try {
      await respondToPartnerRequest.mutateAsync({
        decision: 'approve',
        requestId: projection.incomingPartnerRequest.id,
      });
      await refreshProjection();
      setApproveRequestOpen(false);
      toast({ body: '파트너가 확정되었습니다.' });
    } catch {
      toast({
        body: '파트너 신청을 승인하지 못했습니다. 다시 시도해 주세요.',
        type: 'error',
      });
    }
  }

  async function rejectPartnerRequest() {
    if (!projection.incomingPartnerRequest) return;
    try {
      await respondToPartnerRequest.mutateAsync({
        decision: 'reject',
        requestId: projection.incomingPartnerRequest.id,
      });
      await refreshProjection();
      toast({ body: '파트너 신청을 거절했습니다.' });
    } catch {
      toast({
        body: '요청 처리에 실패했습니다. 다시 시도해 주세요.',
        type: 'error',
      });
    }
  }

  async function cancelOutgoingPartnerRequest() {
    if (!projection.outgoingPartnerRequest) return;
    try {
      await cancelPartnerRequest.mutateAsync(
        projection.outgoingPartnerRequest.id,
      );
      await refreshProjection();
      setCancelRequestOpen(false);
      toast({ body: '파트너 신청을 취소했습니다.' });
    } catch {
      toast({
        body: '파트너 신청을 취소하지 못했습니다. 다시 시도해 주세요.',
        type: 'error',
      });
    }
  }

  async function createPartnerRequest(candidateId: string) {
    try {
      await requestPartner.mutateAsync(candidateId);
      await refreshProjection();
      toast({ body: '파트너 신청을 보냈습니다.' });
    } catch {
      toast({
        body: '파트너 신청을 만들지 못했습니다. 다시 시도해 주세요.',
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
          <p>
            <strong>{projection.incomingPartnerRequest.requester.name}</strong>{' '}
            님이 파트너 신청을 보냈습니다.
          </p>
          <p>{projection.incomingPartnerRequest.requester.studentNumber}</p>
          <p>설문을 제출하기 전에 승인 또는 거절을 선택해 주세요.</p>
          <div className={styles.requestActions}>
            <Button
              label='승인'
              onClick={() => setApproveRequestOpen(true)}
              variant='primary'
            />
            <Button
              label='거절'
              onClick={() => void rejectPartnerRequest()}
              variant='secondary'
            />
          </div>
        </section>
      ) : projection.outgoingPartnerRequest ? (
        <section
          aria-label='보낸 파트너 신청'
          className={styles.partnerRequest}
        >
          <p>
            <strong>{projection.outgoingPartnerRequest.recipient.name}</strong>{' '}
            님의 응답을 기다리고 있습니다.
          </p>
          <p>{projection.outgoingPartnerRequest.recipient.studentNumber}</p>
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
          <p>
            <strong>{projection.confirmedPartner.name}</strong> 님이 파트너로
            확정되었습니다.
          </p>
          <p>{projection.confirmedPartner.studentNumber}</p>
          <p>파트너가 확정된 뒤에는 변경할 수 없어요.</p>
        </section>
      ) : (
        <div className={styles.partnerSearch}>
          <TextInput
            label='같이 팀을 할 파트너가 있으면 찾아보세요.'
            onChange={setPartnerQuery}
            placeholder='이름 또는 학번 검색'
            value={partnerQuery}
          />
          {partnerCandidates.isFetching ? <p>후보를 찾는 중입니다.</p> : null}
          {partnerCandidates.data?.map(candidate => (
            <button
              className={styles.partnerCandidate}
              key={candidate.id}
              onClick={() => void createPartnerRequest(candidate.id)}
              type='button'
            >
              <span>{candidate.name}</span>
              <span>{candidate.studentNumber}</span>
            </button>
          ))}
          {partnerQuery.trim() &&
          !partnerCandidates.isFetching &&
          partnerCandidates.data?.length === 0 ? (
            <p>일치하는 학생이 없습니다.</p>
          ) : null}
        </div>
      )}
      <PartnerRequestDialogs
        approveRequestOpen={approveRequestOpen}
        cancelRequestOpen={cancelRequestOpen}
        isApproving={respondToPartnerRequest.isPending}
        isCancelling={cancelPartnerRequest.isPending}
        onApprove={() => void approvePartnerRequest()}
        onApproveOpenChange={setApproveRequestOpen}
        onCancel={() => void cancelOutgoingPartnerRequest()}
        onCancelOpenChange={setCancelRequestOpen}
      />
    </>
  );
}
