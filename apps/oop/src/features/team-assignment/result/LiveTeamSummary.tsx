import type { TeamAssignmentProjection } from '@aics/core';

import { useTeamMemberContactsQuery } from '../queries';
import { TeamSummary } from './TeamSummary';

export default function LiveTeamSummary({
  projection,
  contactsVisible,
}: {
  projection: TeamAssignmentProjection;
  contactsVisible: boolean;
}) {
  const contacts = useTeamMemberContactsQuery(
    projection.assignedTeam?.id,
    contactsVisible,
  );
  const visible = contactsVisible && contacts.isSuccess && !contacts.isError;
  let contactStatus: 'loading' | 'error' | undefined;
  if (contactsVisible && contacts.isPending) {
    contactStatus = 'loading';
  } else if (contactsVisible && contacts.isError) {
    contactStatus = 'error';
  }
  const byStudentNumber = new Map(
    (visible ? contacts.data : []).map(contact => [
      contact.studentNumber,
      contact.phone,
    ]),
  );
  const safeProjection = {
    ...projection,
    assignedTeam: projection.assignedTeam
      ? {
          ...projection.assignedTeam,
          members: projection.assignedTeam.members.map(member => ({
            ...member,
            phoneNumber: byStudentNumber.get(member.studentNumber) ?? undefined,
          })),
        }
      : undefined,
  };
  return (
    <TeamSummary
      projection={safeProjection}
      showBackNavigation
      showContacts={visible}
      contactStatus={contactStatus}
      onRetryContacts={() => void contacts.refetch()}
    />
  );
}
