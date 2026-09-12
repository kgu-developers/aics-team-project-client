import type {
  ProjectProposalResponse,
  UpdateProjectProposalInput,
} from '@aics/core';
import {
  AlertDialog,
  Button,
  EmptyState,
  Text,
  useToast,
} from '@aics/design-system';
import { Navigate, useBlocker } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useRef, useState } from 'react';

import { EDITOR_DOCS, editorSectionTo } from '~/app/constants/editorSections';

import {
  useAuthStore,
  selectHasAuthenticatedSession,
} from '~/features/auth/authStore';
import DocumentAccessNotice from '~/features/editor/DocumentAccessNotice';
import DocumentActionBar from '~/features/editor/DocumentActionBar';
import DocumentEditorLayout from '~/features/editor/DocumentEditorLayout';
import { documentRequestErrorMessage } from '~/features/editor/documentRequestErrorMessage';
import { useDocumentSectionLock } from '~/features/editor/queries';

import {
  proposalDraft,
  proposalSectionBySlug,
  sameProposalSection,
} from './projectProposal';
import * as styles from './ProjectProposalEditorPage.css';
import ProjectProposalFields from './ProjectProposalFields';
import {
  useProjectProposalQuery,
  useProposalSectionsQuery,
  useProjectProposalActions,
} from './queries';
import {
  projectProposalKeys,
  validProposalTeamId,
} from './queries/projectProposalKeys';

export default function ProjectProposalEditorPage({
  section,
}: {
  section: string;
}) {
  const session = useAuthStore();
  const query = useProjectProposalQuery();
  if (!selectHasAuthenticatedSession(session) || !session.currentUser)
    return (
      <EmptyState
        title='로그인이 필요해요.'
        description='로그인 후 제안서를 열 수 있어요.'
      />
    );
  if (!validProposalTeamId(session.currentUser.teamId))
    return (
      <EmptyState
        title='팀 정보가 필요해요.'
        description='팀 배정과 현재 분반의 팀 정보를 확인해 주세요.'
      />
    );
  if (query.isPending)
    return <EmptyState title='제안서를 불러오는 중이에요.' />;
  if (query.isError && !query.data)
    return (
      <EmptyState
        title='제안서를 불러오지 못했어요.'
        actions={
          <Button label='다시 시도' onClick={() => void query.refetch()} />
        }
      />
    );
  if (!query.data)
    return (
      <EmptyState
        title='확정된 프로젝트가 없어요.'
        description='팀의 주제를 확정한 뒤 제안서를 작성할 수 있어요.'
      />
    );
  if (!EDITOR_DOCS.proposal.sections.some(s => s.slug === section))
    return <Navigate replace to={editorSectionTo('proposal', 'team-info')} />;
  return (
    <ProjectProposalDocument
      key={JSON.stringify([
        ...projectProposalKeys.scope(session, session.currentUser.teamId),
        query.data.id,
        section,
      ])}
      project={query.data}
      section={section}
    />
  );
}

function ProjectProposalDocument({
  project,
  section,
}: {
  project: ProjectProposalResponse;
  section: string;
}) {
  const session = useAuthStore();
  const user = session.currentUser!;
  const toast = useToast();
  const states = useProposalSectionsQuery(project.id);
  const actions = useProjectProposalActions();
  const sectionType = proposalSectionBySlug[section];
  const submitted = Boolean(project.proposalCompletedAt);
  const target =
    sectionType && !submitted
      ? {
          targetType: 'PROJECT' as const,
          targetId: project.id,
          sectionKey: sectionType,
        }
      : null;
  const lock = useDocumentSectionLock({ target, isWritable: !submitted });
  const [baseline, setBaseline] = useState(project);
  const [draft, setDraft] = useState<UpdateProjectProposalInput>(() =>
    proposalDraft(project),
  );
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const busyRef = useRef(false);
  const dirty = Boolean(
    sectionType &&
    !sameProposalSection(proposalDraft(baseline), draft, sectionType),
  );
  const pending = working || actions.isPending || lock.pending;
  const editable = lock.canEdit && !pending;
  const current = states.data?.contents.find(s => s.section === sectionType);
  const lockOwnerName = lock.ownerName;
  // The account that saves the section owns it; there is no separate picker.
  const assigneeChanged = Boolean(
    current && current.assigneeUserId !== user.studentNumber,
  );
  const blocker = useBlocker({
    shouldBlockFn: () => dirty || busyRef.current,
    withResolver: true,
    enableBeforeUnload: dirty || pending,
  });
  const resetBlocker = () => blocker.reset?.();
  const proceedBlocker = () => blocker.proceed?.();
  async function run(work: () => Promise<void>) {
    if (busyRef.current) return;
    busyRef.current = true;
    setWorking(true);
    setError(null);
    try {
      await work();
    } catch (e) {
      // Only the lock conflict is silent; the lock query already shows its owner.
      // Save and completion also answer 409, and those must reach the user.
      if (
        isAxiosError<{ code?: string }>(e) &&
        e.response?.status === 409 &&
        e.response.data?.code === 'EDIT_LOCK_CONFLICT'
      )
        return;
      setError(documentRequestErrorMessage(e));
    } finally {
      busyRef.current = false;
      setWorking(false);
    }
  }
  const displayed = draft;
  async function save() {
    if (!sectionType) return;
    const saved = await actions.mutateAsync({
      kind: 'save',
      baseline,
      draft,
      section: sectionType,
      ...(assigneeChanged ? { assigneeUserId: user.studentNumber } : {}),
    });
    setBaseline(saved);
    setDraft(proposalDraft(saved));
    toast({ body: '제안서를 저장했어요.' });
  }
  return (
    <DocumentEditorLayout
      activeSlug={section}
      docId='proposal'
      heading={
        EDITOR_DOCS.proposal.sections.find(item => item.slug === section)!.label
      }
      meta={
        <Text>
          {project.teamOperation.name} · {project.title}
        </Text>
      }
      sections={EDITOR_DOCS.proposal.sections.map(item => {
        const type = proposalSectionBySlug[item.slug];
        const state = states.data?.contents.find(
          entry => entry.section === type,
        );
        return {
          ...item,
          status: type
            ? {
                label: state
                  ? state.completed
                    ? '작성 완료'
                    : '작성 중'
                  : '확인 중',
                variant: state?.completed
                  ? ('success' as const)
                  : ('accent' as const),
              }
            : null,
        };
      })}
      title={EDITOR_DOCS.proposal.title}
    >
      {submitted && <DocumentAccessNotice isSubmitted />}
      {states.isError && (
        <p role='alert' className={styles.error}>
          작성 상태를 불러오지 못했습니다.{' '}
          <Button
            label='작성 상태 다시 조회'
            onClick={() => void states.refetch()}
          />
        </p>
      )}
      {sectionType ? (
        <>
          {!submitted && (
            <DocumentAccessNotice
              action={
                !lock.canEdit && !lock.lockedByOther ? (
                  <Button
                    isDisabled={pending}
                    label='편집 권한 다시 확인'
                    onClick={() =>
                      void run(async () => {
                        await lock.retry();
                      })
                    }
                    size='sm'
                    variant='secondary'
                  />
                ) : undefined
              }
              canEdit={lock.canEdit}
              isLockUnavailable={lock.isUnavailable}
              isSubmitted={false}
              lockedByOther={lock.lockedByOther}
              ownerName={lockOwnerName}
            />
          )}
          <ProjectProposalFields
            project={project}
            section={sectionType}
            draft={displayed}
            disabled={!editable}
            onChange={setDraft}
          />
          {!submitted && (
            <DocumentActionBar error={error}>
              <Button
                label='저장'
                isDisabled={!editable || !dirty}
                onClick={() => void run(save)}
              />
              <Button
                label='작성 완료'
                variant='secondary'
                isDisabled={
                  !editable ||
                  dirty ||
                  !current ||
                  states.isError ||
                  current.completed
                }
                onClick={() =>
                  void run(async () => {
                    await actions.mutateAsync({
                      kind: 'complete',
                      baseline,
                      projectId: project.id,
                      section: sectionType,
                    });
                    toast({ body: '영역을 작성 완료했어요.' });
                  })
                }
              />
            </DocumentActionBar>
          )}
        </>
      ) : (
        <>
          {project.teamOperation.members.map(m => (
            <Text key={m.studentNumber}>
              {m.name ?? m.studentNumber} · {m.studentNumber}
              {m.isLeader ? ' · 팀장' : ''}
            </Text>
          ))}
        </>
      )}
      {error && (!sectionType || submitted) && (
        <p className={styles.error} role='alert'>
          {error}
        </p>
      )}
      <AlertDialog
        isOpen={blocker.status === 'blocked'}
        onOpenChange={open => open || resetBlocker()}
        title='저장하지 않은 내용이 있어요.'
        description='이동하면 변경 내용이 사라집니다.'
        cancelLabel='계속 작성'
        actionLabel='변경 버리고 이동'
        isActionLoading={pending}
        onAction={proceedBlocker}
      />
    </DocumentEditorLayout>
  );
}
