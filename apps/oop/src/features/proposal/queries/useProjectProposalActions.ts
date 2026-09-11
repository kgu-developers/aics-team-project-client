import {
  fetchLiveEditLock,
  fetchProjectProposal,
  fetchProposalSections,
  updateProjectProposal,
  updateProposalSection,
  submitProjectProposal,
} from '@aics/api-client';
import {
  PROPOSAL_SECTIONS,
  type LiveEditLockTarget,
  type ProjectProposalResponse,
  type ProposalSectionType,
  type UpdateProjectProposalInput,
} from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import {
  mergeProposalSection,
  proposalDraft,
  sameProposalSection,
} from '../projectProposal';
import {
  projectProposalKeys,
  validProposalTeamId,
} from './projectProposalKeys';

type Action =
  | {
      kind: 'save';
      baseline: ProjectProposalResponse;
      draft: UpdateProjectProposalInput;
      section: ProposalSectionType;
    }
  | {
      kind: 'complete' | 'assign';
      baseline: ProjectProposalResponse;
      projectId: number;
      section: ProposalSectionType;
      assigneeUserId: string | null;
    }
  | { kind: 'submit'; projectId: number };

export function useProjectProposalActions() {
  const session = useAuthStore();
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (action: Action) => {
      const user = session.currentUser;
      const teamId = user?.teamId;
      const assertSession = () => {
        if (useAuthStore.getState() !== session)
          throw new Error('로그인 정보가 변경되었습니다. 다시 열어 주세요.');
      };
      assertSession();
      if (
        !user ||
        user.globalRole !== 'STUDENT' ||
        !validProposalTeamId(teamId)
      )
        throw new Error('팀이 배정된 학생만 제안서를 작성할 수 있습니다.');
      const projectId =
        action.kind === 'save' ? action.baseline.id : action.projectId;
      if (action.kind !== 'submit') {
        const target: LiveEditLockTarget = {
          targetType: 'PROJECT',
          targetId: projectId,
          sectionKey: action.section,
        };
        const lock = await fetchLiveEditLock(target);
        assertSession();
        if (!lock.locked || lock.lockedBy !== user.studentNumber)
          throw new Error(
            '편집 잠금이 만료되었거나 다른 팀원이 편집 중입니다. 입력 내용은 유지됩니다. 편집 권한을 다시 확인해 주세요.',
          );
      }
      const latest = await fetchProjectProposal(teamId);
      assertSession();
      if (!latest || latest.id !== projectId || latest.proposalCompletedAt)
        throw new Error(
          '제안서가 변경되었거나 이미 제출되었습니다. 다시 조회해 주세요.',
        );
      if (action.kind === 'save') {
        const body = mergeProposalSection(
          latest,
          action.baseline,
          action.draft,
          action.section,
        );
        await updateProjectProposal(teamId, body);
      } else if (action.kind === 'submit') {
        const states = await fetchProposalSections(projectId);
        assertSession();
        if (
          !latest.teamOperation.members.some(
            m => m.studentNumber === user.studentNumber && m.isLeader,
          )
        )
          throw new Error('팀장만 제안서를 제출할 수 있습니다.');
        if (!states.allCompleted)
          throw new Error('모든 작성 영역을 완료해 주세요.');
        const locks = await Promise.all(
          PROPOSAL_SECTIONS.map(sectionKey =>
            fetchLiveEditLock({
              targetType: 'PROJECT',
              targetId: projectId,
              sectionKey,
            }),
          ),
        );
        assertSession();
        if (
          locks.some(
            lock => lock.locked && lock.lockedBy !== user.studentNumber,
          )
        )
          throw new Error(
            '다른 팀원이 편집 중입니다. 편집이 끝난 뒤 제출해 주세요.',
          );
        await submitProjectProposal(projectId);
      } else {
        if (
          !sameProposalSection(
            proposalDraft(latest),
            proposalDraft(action.baseline),
            action.section,
          )
        )
          throw new Error(
            '작성 내용이 변경되었습니다. 최신 내용을 확인한 뒤 완료해 주세요.',
          );
        const states = await fetchProposalSections(projectId);
        assertSession();
        const current = states.contents.find(
          s => s.section === action.section,
        )!;
        await updateProposalSection(projectId, action.section, {
          assigneeUserId:
            action.kind === 'complete'
              ? current.assigneeUserId
              : action.assigneeUserId,
          completed: action.kind === 'complete' ? true : current.completed,
        });
      }
      assertSession();
      // Read back the persisted result; a successful write alone must not fabricate
      // completed/submitted state. A failed read leaves the local draft untouched.
      const [project, sections] = await Promise.all([
        fetchProjectProposal(teamId),
        fetchProposalSections(projectId),
      ]);
      assertSession();
      if (!project || project.id !== projectId)
        throw new Error(
          '저장 결과를 확인하지 못했습니다. 입력 내용은 유지됩니다.',
        );
      if (action.kind === 'submit' && !project.proposalCompletedAt)
        throw new Error(
          '제출 결과를 아직 확인하지 못했습니다. 다시 조회해 주세요.',
        );
      const scope = projectProposalKeys.scope(session, teamId);
      await client.cancelQueries({ queryKey: scope });
      assertSession();
      client.setQueryData([...scope, 'document'], project);
      client.setQueryData([...scope, 'sections', projectId], sections);
      return project;
    },
    onSettled: () => {
      if (useAuthStore.getState() === session) {
        void client.invalidateQueries({
          queryKey: projectProposalKeys.scope(
            session,
            session.currentUser?.teamId,
          ),
        });
        void client.invalidateQueries({
          queryKey: ['student-project', session.currentUser?.teamId],
        });
      }
    },
  });
}
