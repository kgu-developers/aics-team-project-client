import type { TeamAssignmentProjection } from '@aics/core';
import {
  Button,
  Dialog,
  Heading,
  HStack,
  Text,
  VStack,
} from '@aics/design-system';
import { useNavigate } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import type { ContactVisibility } from '../liveTeamAssignment';
import {
  isValidPositiveTeamId,
  useClaimTeamLeaderMutation,
  useTeamMemberContactsQuery,
} from '../queries';
import * as styles from '../TeamAssignmentFlow.css';
import { TeamMemberTable } from './TeamMemberTable';

type FirstMeetingProps = {
  projection: TeamAssignmentProjection;
  contactVisibility?: ContactVisibility;
};

const contactMessages: Record<Exclude<ContactVisibility, 'open'>, string> = {
  unscheduled: '팀원 연락처 공개 일정은 담당 조교의 안내를 확인해 주세요.',
  upcoming: '아직 팀원 연락처 공개 전입니다. 공개 기간에 다시 확인해 주세요.',
  closed: '팀원 연락처 공개 기간이 종료됐어요.',
};

export default function LiveFirstMeeting({
  projection,
  contactVisibility = 'open',
}: FirstMeetingProps) {
  const confirmTeamLeader = useClaimTeamLeaderMutation();
  const navigate = useNavigate();
  const team = projection.assignedTeam;
  const contactsVisible = contactVisibility === 'open';
  const teamContacts = useTeamMemberContactsQuery(team?.id, contactsVisible);
  const [confirming, setConfirming] = useState(false);
  const [requestError, setRequestError] = useState<string>();
  const leaderActionAvailable =
    projection.leaderConfirmation?.isActionAvailable ?? false;
  const leaderUnavailableReason =
    projection.leaderConfirmation?.unavailableReason ??
    '팀장 선정 상태를 확인해 주세요.';

  if (!team) return <p role='alert'>팀 정보를 찾을 수 없습니다.</p>;
  if (!isValidPositiveTeamId(team.id)) {
    return (
      <p role='alert'>팀 연락처를 불러오기 위한 팀 ID를 확인할 수 없습니다.</p>
    );
  }
  const assignedTeam = team;
  const contactsByStudentNumber = new Map(
    (contactsVisible && !teamContacts.isError
      ? (teamContacts.data ?? [])
      : []
    ).map(contact => [contact.studentNumber, contact]),
  );
  const membersForDisplay = assignedTeam.members.map(member => {
    const contact = contactsByStudentNumber.get(member.studentNumber);

    return {
      ...member,
      name: contact?.name ?? member.name,
      // Never fall back to a phone number that may have come from a legacy
      // projection. Contact visibility is owned by this response.
      phoneNumber: contact?.phone ?? undefined,
    };
  });

  async function confirmLeader() {
    if (confirmTeamLeader.isPending) return;
    setRequestError(undefined);
    try {
      await confirmTeamLeader.mutateAsync({
        input: { teamId: assignedTeam.id },
      });
      setConfirming(false);
      await navigate({ to: ROUTES.STUDENT.HOME, replace: true });
    } catch (error) {
      const status = isAxiosError(error) ? error.response?.status : undefined;
      setRequestError(
        status === 409
          ? '다른 팀원이 이미 팀장을 확정했어요. 최신 팀 정보를 확인해 주세요.'
          : status === 401
            ? '로그인 세션이 만료됐어요. 다시 로그인해 주세요.'
            : status === 403
              ? '팀장을 확정할 권한이 없어요. 담당 조교에게 문의해 주세요.'
              : '팀장 확정에 실패했어요. 다시 시도해 주세요.',
      );
      setConfirming(false);
    }
  }

  return (
    <section className={styles.page} aria-labelledby='first-meeting-heading'>
      <div className={styles.resultContent}>
        <h1 id='first-meeting-heading'>
          {contactsVisible
            ? '서로 연락처를 저장하고, 팀장을 선정해주세요!'
            : '팀원을 확인하고, 팀장을 선정해주세요!'}
        </h1>
        <p>
          {contactsVisible
            ? '공개 기간 동안 팀원 연락처를 확인할 수 있어요.'
            : contactMessages[contactVisibility]}
        </p>
        {contactsVisible && teamContacts.isPending ? (
          <p role='status'>팀원 연락처를 불러오는 중입니다.</p>
        ) : null}
        {contactsVisible && teamContacts.isError ? (
          <div>
            <p role='alert'>팀원 연락처를 불러오지 못했습니다.</p>
            <Button
              label='다시 확인'
              onClick={() => void teamContacts.refetch()}
              variant='secondary'
            />
          </div>
        ) : null}
        <TeamMemberTable
          members={membersForDisplay}
          variant={
            contactsVisible && teamContacts.isSuccess
              ? 'firstMeeting'
              : 'assignment'
          }
        />
        {leaderActionAvailable ? (
          <div className={`${styles.actions} ${styles.centeredActions}`}>
            <Button
              label='팀원이에요'
              onClick={() => void navigate({ to: ROUTES.STUDENT.HOME })}
              variant='secondary'
            />
            <Button
              label='내가 팀장입니다'
              onClick={() => setConfirming(true)}
              variant='primary'
            />
          </div>
        ) : (
          <div className={styles.unavailableAction}>
            <p>{leaderUnavailableReason}</p>
            <Button
              label='학생 홈으로 이동'
              onClick={() => void navigate({ to: ROUTES.STUDENT.HOME })}
              variant='secondary'
            />
          </div>
        )}
      </div>
      {requestError ? <p role='alert'>{requestError}</p> : null}
      <Dialog
        aria-label='팀장 확정 확인'
        isOpen={confirming}
        onOpenChange={open => {
          if (!confirmTeamLeader.isPending) setConfirming(open);
        }}
        purpose='form'
      >
        <VStack gap={4}>
          <VStack gap={2}>
            <Heading level={2}>팀장이신가요?</Heading>
            <Text color='secondary'>
              팀 중 한 명만 해당 단계를 진행할 수 있으며, 확정 뒤에는 수정하기
              어렵습니다.
            </Text>
          </VStack>
          <HStack gap={2} justify='end'>
            <Button
              label='취소'
              isDisabled={confirmTeamLeader.isPending}
              onClick={() => setConfirming(false)}
              variant='secondary'
            />
            <Button
              isLoading={confirmTeamLeader.isPending}
              label='확정'
              onClick={() => void confirmLeader()}
              variant='primary'
            />
          </HStack>
        </VStack>
      </Dialog>
    </section>
  );
}
