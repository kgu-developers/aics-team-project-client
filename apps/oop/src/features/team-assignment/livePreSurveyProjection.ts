import {
  fetchReceivedPreferredPeerRequests,
  searchPreSurveyClassmates,
} from '@aics/api-client';
import type {
  PartnerCandidate,
  PreSurveyResponseDetailResponse,
  ReceivedPreferredPeerRequest,
  TeamAssignmentProjection,
  TeamAssignmentSurvey,
  TeamRolePreference,
} from '@aics/core';

function toCandidate(userId: string, name: string): PartnerCandidate {
  return { id: userId, name, studentNumber: userId };
}

function toSurvey(
  response: PreSurveyResponseDetailResponse | undefined,
): TeamAssignmentSurvey | undefined {
  if (!response || !Array.isArray(response.preferredRoles)) return undefined;
  return {
    rolePreferences: response.preferredRoles as TeamRolePreference[],
    topicIdea: response.topicOpinion ?? '',
    note: response.etcOpinion ?? '',
  };
}

function incomingRequest(requests: ReceivedPreferredPeerRequest[]) {
  const request = requests.find(item => item.status === 'PENDING');
  if (!request) return undefined;
  return {
    id: request.requesterUserId,
    requester: toCandidate(request.requesterUserId, request.requesterName),
    status: 'pending' as const,
  };
}

async function selectedPeer(
  sectionId: number,
  response: PreSurveyResponseDetailResponse | undefined,
) {
  if (!response?.preferredPeerUserId) return undefined;
  const classmates = await searchPreSurveyClassmates(
    sectionId,
    response.preferredPeerUserId,
  );
  const classmate = classmates.find(
    candidate => candidate.userId === response.preferredPeerUserId,
  );
  return toCandidate(
    response.preferredPeerUserId,
    classmate?.name ?? response.preferredPeerUserId,
  );
}

export async function fetchLivePreSurveyProjection(
  sectionId: number,
  response: PreSurveyResponseDetailResponse | undefined,
): Promise<TeamAssignmentProjection> {
  const [receivedRequests, preferredPeer] = await Promise.all([
    fetchReceivedPreferredPeerRequests(sectionId),
    selectedPeer(sectionId, response),
  ]);
  const acceptedIncoming = receivedRequests.find(
    request => request.status === 'ACCEPTED',
  );
  const acceptedOutgoing =
    preferredPeer && response?.preferredPeerStatus === 'ACCEPTED'
      ? preferredPeer
      : undefined;
  const confirmedPartner = acceptedOutgoing
    ? acceptedOutgoing
    : acceptedIncoming
      ? toCandidate(
          acceptedIncoming.requesterUserId,
          acceptedIncoming.requesterName,
        )
      : undefined;

  return {
    sectionId: String(sectionId),
    phase: 'survey',
    window: {},
    survey: toSurvey(response),
    incomingPartnerRequest: confirmedPartner
      ? undefined
      : incomingRequest(receivedRequests),
    outgoingPartnerRequest:
      preferredPeer && response?.preferredPeerStatus === 'PENDING'
        ? { id: preferredPeer.id, recipient: preferredPeer, status: 'pending' }
        : undefined,
    confirmedPartner,
  };
}
