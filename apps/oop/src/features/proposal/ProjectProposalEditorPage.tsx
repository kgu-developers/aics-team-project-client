import type {
  LiveEditLockTarget,
  ProjectProposalResponse,
  UpdateProjectProposalInput,
} from '@aics/core';
import {
  AlertDialog,
  Button,
  EmptyState,
  Heading,
  Selector,
  SelectorOption,
  StatusDot,
  Text,
  useToast,
} from '@aics/design-system';
import {
  Link,
  Navigate,
  useBlocker,
  useNavigate,
} from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useEffect, useRef, useState } from 'react';

import { EDITOR_DOCS, editorSectionTo } from '~/app/constants/editorSections';

import {
  useAuthStore,
  selectHasAuthenticatedSession,
} from '~/features/auth/authStore';
import DocumentAccessNotice from '~/features/editor/DocumentAccessNotice';
import DocumentActionBar from '~/features/editor/DocumentActionBar';
import { documentRequestErrorMessage } from '~/features/editor/documentRequestErrorMessage';
import {
  useAcquireLiveEditLockMutation,
  useLiveEditLockQuery,
  useReleaseLiveEditLockMutation,
} from '~/features/editor/queries';

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

const pendingLockReleases = new Map<string, Promise<void>>();

function lockTargetKey(target: LiveEditLockTarget) {
  return JSON.stringify(target);
}

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
  const navigate = useNavigate();
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
  const lock = useLiveEditLockQuery(target);
  const acquire = useAcquireLiveEditLockMutation();
  const release = useReleaseLiveEditLockMutation();
  const [baseline, setBaseline] = useState(project);
  const [draft, setDraft] = useState<UpdateProjectProposalInput>(() =>
    proposalDraft(project),
  );
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const busyRef = useRef(false);
  const dirty = Boolean(
    sectionType &&
    !sameProposalSection(proposalDraft(baseline), draft, sectionType),
  );
  const pending = working || actions.isPending || acquire.isPending;
  const owned =
    !lock.isError &&
    lock.data?.locked &&
    lock.data.lockedBy === user.studentNumber;
  const editable = editing && owned && !pending && !submitted;
  const current = states.data?.contents.find(s => s.section === sectionType);
  const lockOwnerName =
    lock.data?.lockedByName ??
    project.teamOperation.members.find(
      member => member.studentNumber === lock.data?.lockedBy,
    )?.name ??
    null;
  // The account that saves the section owns it; there is no separate picker.
  const assigneeChanged = Boolean(
    current && current.assigneeUserId !== user.studentNumber,
  );
  const blocker = useBlocker({
    shouldBlockFn: () => dirty || busyRef.current,
    withResolver: true,
    enableBeforeUnload: dirty || pending,
  });
  const acquiredTargetRef = useRef<typeof target>(null);
  const resetBlocker = () => blocker.reset?.();
  const proceedBlocker = () => blocker.proceed?.();
  const autoStartRef = useRef(false);
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
  async function startEditing() {
    if (!target) return;
    const key = lockTargetKey(target);
    await pendingLockReleases.get(key);
    const status = await acquire.mutateAsync(target);
    if (!status.locked || status.lockedBy !== user.studentNumber)
      throw new Error('편집 권한을 확인하지 못했습니다.');
    acquiredTargetRef.current = target;
    setEditing(true);
  }
  useEffect(() => {
    if (
      autoStartRef.current ||
      !target ||
      (!lock.data && !lock.isError) ||
      (lock.data?.locked && lock.data.lockedBy !== user.studentNumber) ||
      submitted ||
      user.globalRole !== 'STUDENT'
    )
      return;
    autoStartRef.current = true;
    void run(startEditing);
  }, [
    lock.data?.locked,
    lock.isError,
    submitted,
    target?.targetId,
    target?.sectionKey,
    user.globalRole,
  ]);
  useEffect(() => {
    // Ownership can expire while the editor stays mounted. Once the section is
    // free again, allow one more acquisition instead of leaving the draft
    // permanently read-only.
    if (editing && !owned && !lock.data?.locked) autoStartRef.current = false;
  }, [editing, owned, lock.data?.locked]);
  useEffect(() => {
    if (!editing || !target) return;
    const id = window.setInterval(() => void lock.refetch(), 15000);
    return () => window.clearInterval(id);
  }, [editing, target?.targetId, target?.sectionKey, lock.refetch]);
  useEffect(
    () => () => {
      const acquiredTarget = acquiredTargetRef.current;
      if (acquiredTarget) {
        const key = lockTargetKey(acquiredTarget);
        const releasePromise = release
          .mutateAsync(acquiredTarget)
          .catch(() => undefined);
        pendingLockReleases.set(key, releasePromise);
        void releasePromise.finally(() => {
          if (pendingLockReleases.get(key) === releasePromise)
            pendingLockReleases.delete(key);
        });
      }
    },
    [release.mutateAsync],
  );
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
    <div className={styles.layout}>
      <nav className={styles.navigation} aria-label='제안서 작성 영역'>
        <Heading level={2}>제안서</Heading>
        <div className={styles.mobileSections}>
          <Selector
            label='제안서 작성 영역 선택'
            value={section}
            options={EDITOR_DOCS.proposal.sections.map(s => ({
              value: s.slug,
              label: s.label,
            }))}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            onChange={value =>
              void navigate({ to: editorSectionTo('proposal', value) })
            }
            width='100%'
          />
        </div>
        <div className={styles.desktopSections}>
          {EDITOR_DOCS.proposal.sections.map(s => {
            const type = proposalSectionBySlug[s.slug];
            const state = states.data?.contents.find(
              item => item.section === type,
            );
            return (
              <Link
                className={styles.link}
                aria-current={s.slug === section ? 'page' : undefined}
                key={s.slug}
                to={editorSectionTo('proposal', s.slug)}
              >
                {s.label}
                {type && (
                  <StatusDot
                    label={
                      state
                        ? state.completed
                          ? '작성 완료'
                          : '작성 중'
                        : '확인 중'
                    }
                    variant={state?.completed ? 'success' : 'accent'}
                  />
                )}
              </Link>
            );
          })}
        </div>
        <Link
          className={styles.link}
          to='/student'
          activeOptions={{ exact: true }}
        >
          학생 홈으로
        </Link>
      </nav>
      <section className={styles.document}>
        <Heading level={2}>
          {EDITOR_DOCS.proposal.sections.find(s => s.slug === section)!.label}
        </Heading>
        <Text>
          {project.teamOperation.name} · {project.title}
        </Text>
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
                  !owned && !lock.data?.locked ? (
                    <Button
                      isDisabled={pending}
                      label='편집 권한 다시 확인'
                      onClick={() => void run(startEditing)}
                      size='sm'
                      variant='secondary'
                    />
                  ) : undefined
                }
                canEdit={Boolean(owned)}
                isEditing={editing}
                isLockUnavailable={lock.isError}
                isSubmitted={false}
                lockedByOther={Boolean(lock.data?.locked && !owned)}
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
      </section>
    </div>
  );
}
