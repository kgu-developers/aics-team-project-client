import {
  Button,
  Dialog,
  Heading,
  HStack,
  Popover,
  RadioList,
  RadioListItem,
  Text,
  TextInput,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { isAxiosError } from 'axios';
import { useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { cx } from '~/shared/lib/cx';

import AdminSectionTeamFilter from '~/features/admin-section/components/AdminSectionTeamFilter';
import {
  useAdminSectionEnrollmentsQuery,
  useAdminSectionTeamsQuery,
  useAdminTeamDetailsQueries,
  useFinalizeAdminSectionTeamsMutation,
  useMoveAdminTeamMemberMutation,
  useUpdateAdminTeamLeaderMutation,
  useUpdateAdminTeamMemberRoleMutation,
  useWithdrawAdminSectionEnrollmentMutation,
} from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminStudentTeamManagement.css';
import AdminStudentDetailDialog from '../../features/admin-student-team/components/AdminStudentDetailDialog';

function getTeamMoveErrorMessage(error: unknown) {
  if (!isAxiosError<{ code?: string; message?: string }>(error)) {
    return '팀원을 이동하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const serverMessage = error.response?.data?.message;
  if (serverMessage) return serverMessage;

  const serverCode = error.response?.data?.code;
  const errorCodeSuffix = serverCode ? ` (${serverCode})` : '';

  switch (error.response?.status) {
    case 400:
      return `같은 분반의 유효한 팀으로만 이동할 수 있습니다.${errorCodeSuffix}`;
    case 403:
      return `이 분반의 팀원을 이동할 권한이 없습니다.${errorCodeSuffix}`;
    case 409:
      return `확정된 팀이거나 대상 팀에 이미 속한 학생은 이동할 수 없습니다.${errorCodeSuffix}`;
    default:
      return serverCode
        ? `팀원을 이동하지 못했습니다. (${serverCode})`
        : '팀원을 이동하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
}

function getTeamMemberRoleErrorMessage(error: unknown) {
  if (!isAxiosError<{ code?: string; message?: string }>(error)) {
    return '역할을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const serverMessage = error.response?.data?.message;
  if (serverMessage) return serverMessage;

  switch (error.response?.status) {
    case 400:
      return '프로젝트 역할은 50자 이하여야 합니다.';
    case 403:
      return '이 분반 팀원의 역할을 변경할 권한이 없습니다.';
    case 409:
      return '팀 배정이 확정되어 역할을 변경할 수 없습니다.';
    default:
      return '역할을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.';
  }
}

export default function AdminStudentTeamManagement() {
  const currentUser = useAuthStore(state => state.currentUser);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<
    string | null
  >(null);
  const [actionMenuStudentNumber, setActionMenuStudentNumber] = useState<
    string | null
  >(null);
  const sections = currentUser?.sections ?? [];
  const selectedSection =
    sections.find(section => section.id === selectedSectionId) ??
    sections[0] ??
    null;
  const sectionId = selectedSection?.id ?? '';
  const enrollmentsQuery = useAdminSectionEnrollmentsQuery(sectionId);
  const teamsQuery = useAdminSectionTeamsQuery(sectionId);
  const teamDetailsQueries = useAdminTeamDetailsQueries(
    teamsQuery.data?.contents.map(team => team.id) ?? [],
  );
  const withdrawMutation = useWithdrawAdminSectionEnrollmentMutation();
  const finalizeMutation = useFinalizeAdminSectionTeamsMutation();
  const moveTeamMemberMutation = useMoveAdminTeamMemberMutation();
  const updateTeamLeaderMutation = useUpdateAdminTeamLeaderMutation();
  const updateTeamMemberRoleMutation = useUpdateAdminTeamMemberRoleMutation();

  const students = (enrollmentsQuery.data?.contents ?? []).filter(
    student => student.status === 'ACTIVE',
  );
  const teams = teamDetailsQueries.flatMap(query =>
    query.data ? [query.data] : [],
  );
  const hasTeams = (teamsQuery.data?.contents.length ?? 0) > 0;
  const isTeamAssignmentFinalized =
    hasTeams &&
    teamsQuery.data!.contents.every(team => team.status === 'CONFIRMED');
  const teamByStudentNumber = useMemo(
    () =>
      new Map(
        teams.flatMap(team =>
          team.members.map(member => [member.studentNumber, team]),
        ),
      ),
    [teams],
  );
  const [studentToWithdraw, setStudentToWithdraw] = useState<
    (typeof students)[number] | null
  >(null);
  const [teamToUpdateLeader, setTeamToUpdateLeader] = useState<
    (typeof teams)[number] | null
  >(null);
  const [nextLeaderStudentNumber, setNextLeaderStudentNumber] = useState('');
  const [teamMemberToUpdateRole, setTeamMemberToUpdateRole] = useState<{
    member: (typeof teams)[number]['members'][number];
    team: (typeof teams)[number];
  } | null>(null);
  const [nextProjectRole, setNextProjectRole] = useState('');
  const [teamMemberToMove, setTeamMemberToMove] = useState<{
    member: (typeof teams)[number]['members'][number];
    sourceTeam: (typeof teams)[number];
  } | null>(null);
  const [targetTeamId, setTargetTeamId] = useState('');
  const [draggedTeamMember, setDraggedTeamMember] = useState<{
    member: (typeof teams)[number]['members'][number];
    sourceTeam: (typeof teams)[number];
  } | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<number | null>(null);

  const targetTeams = teamMemberToMove
    ? teams.filter(
        team =>
          team.id !== teamMemberToMove.sourceTeam.id &&
          team.sectionId === teamMemberToMove.sourceTeam.sectionId &&
          team.status !== 'CONFIRMED',
      )
    : [];

  function closeTeamLeaderDialog() {
    if (updateTeamLeaderMutation.isPending) return;
    setTeamToUpdateLeader(null);
    setNextLeaderStudentNumber('');
    updateTeamLeaderMutation.reset();
  }

  function closeTeamMoveDialog() {
    if (moveTeamMemberMutation.isPending) return;
    setTeamMemberToMove(null);
    setTargetTeamId('');
    moveTeamMemberMutation.reset();
  }

  function closeTeamMemberRoleDialog() {
    if (updateTeamMemberRoleMutation.isPending) return;
    setTeamMemberToUpdateRole(null);
    setNextProjectRole('');
    updateTeamMemberRoleMutation.reset();
  }

  function openTeamMemberRoleDialog(
    member: (typeof teams)[number]['members'][number],
    team: (typeof teams)[number],
  ) {
    setTeamMemberToUpdateRole({ member, team });
    setNextProjectRole(member.projectRole ?? '');
    updateTeamMemberRoleMutation.reset();
  }

  function openTeamMoveDialog(
    member: (typeof teams)[number]['members'][number],
    sourceTeam: (typeof teams)[number],
    preferredTargetTeamId?: number,
  ) {
    const targetTeam = teams.find(
      candidate =>
        candidate.id !== sourceTeam.id &&
        candidate.sectionId === sourceTeam.sectionId &&
        candidate.status !== 'CONFIRMED' &&
        (preferredTargetTeamId === undefined ||
          candidate.id === preferredTargetTeamId),
    );
    if (!targetTeam) return;

    setTeamMemberToMove({ member, sourceTeam });
    setTargetTeamId(String(targetTeam.id));
    moveTeamMemberMutation.reset();
  }

  function canMoveFromTeam(team: (typeof teams)[number]) {
    return (
      team.status !== 'CONFIRMED' &&
      teams.some(
        candidate =>
          candidate.id !== team.id &&
          candidate.sectionId === team.sectionId &&
          candidate.status !== 'CONFIRMED',
      )
    );
  }
  const isPending =
    enrollmentsQuery.isPending ||
    teamsQuery.isPending ||
    teamDetailsQueries.some(query => query.isPending);
  const error =
    enrollmentsQuery.error ??
    teamsQuery.error ??
    teamDetailsQueries.find(query => query.error)?.error;

  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <Heading level={1}>수강생·팀 관리</Heading>
      </div>

      <AdminSectionTeamFilter
        allowAllSections={false}
        label='분반 선택'
        onSectionChange={setSelectedSectionId}
        sectionId={sectionId}
      />

      {!sectionId ? (
        <section className={styles.statePanel}>
          <p>분반 정보를 불러오지 못했습니다.</p>
        </section>
      ) : isPending ? (
        <section className={styles.statePanel}>
          <p>수강생과 팀 목록을 불러오는 중입니다.</p>
        </section>
      ) : error ? (
        <section className={styles.statePanel}>
          <p>목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        </section>
      ) : (
        <>
          <section className={styles.section}>
            <Heading level={2}>수강생 목록</Heading>
            {students.length === 0 ? (
              <div className={styles.statePanel}>
                <p>이 분반에 등록된 수강생이 없습니다.</p>
              </div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th scope='col'>이름</th>
                      <th scope='col'>학번</th>
                      <th scope='col'>전공</th>
                      <th scope='col'>팀</th>
                      <th scope='col'>역할</th>
                      <th scope='col'>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => {
                      const sourceTeam = teamByStudentNumber.get(
                        student.studentNumber,
                      );
                      const canMove = sourceTeam
                        ? canMoveFromTeam(sourceTeam)
                        : false;
                      const member = sourceTeam?.members.find(
                        candidate =>
                          candidate.studentNumber === student.studentNumber,
                      );
                      const canUpdateRole =
                        sourceTeam?.status !== 'CONFIRMED' &&
                        member !== undefined;

                      return (
                        <tr key={student.id}>
                          <td>
                            <button
                              className={styles.memberButton}
                              onClick={() =>
                                setSelectedStudentNumber(student.studentNumber)
                              }
                              type='button'
                            >
                              {student.name}
                            </button>
                          </td>
                          <td>{student.studentNumber}</td>
                          <td>{student.major ?? '전공 정보 없음'}</td>
                          <td>{sourceTeam?.name ?? '미배정'}</td>
                          <td className={styles.projectRoleCell}>
                            {member?.projectRole || '미지정'}
                          </td>
                          <td>
                            <Popover
                              alignment='end'
                              content={
                                <div className={styles.actionMenu}>
                                  {canUpdateRole && sourceTeam && member ? (
                                    <Button
                                      label='역할 변경'
                                      onClick={() => {
                                        setActionMenuStudentNumber(null);
                                        openTeamMemberRoleDialog(
                                          member,
                                          sourceTeam,
                                        );
                                      }}
                                      size='sm'
                                      variant='secondary'
                                    />
                                  ) : null}
                                  {canMove && sourceTeam && member ? (
                                    <Button
                                      label='팀 이동'
                                      onClick={() => {
                                        setActionMenuStudentNumber(null);
                                        openTeamMoveDialog(member, sourceTeam);
                                      }}
                                      size='sm'
                                      variant='secondary'
                                    />
                                  ) : null}
                                  <Button
                                    label='제외'
                                    onClick={() => {
                                      setActionMenuStudentNumber(null);
                                      setStudentToWithdraw(student);
                                    }}
                                    size='sm'
                                    variant='destructive'
                                  />
                                </div>
                              }
                              isOpen={
                                actionMenuStudentNumber ===
                                student.studentNumber
                              }
                              key={student.studentNumber}
                              label={`${student.name} 관리`}
                              onOpenChange={open =>
                                setActionMenuStudentNumber(
                                  open ? student.studentNumber : null,
                                )
                              }
                              placement='below'
                              width={132}
                            >
                              {triggerProps => (
                                <Button
                                  {...triggerProps}
                                  aria-label={`${student.name} 관리`}
                                  label='관리'
                                  size='sm'
                                  variant='secondary'
                                />
                              )}
                            </Popover>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <HStack justify='between'>
              <div>
                <Heading level={2}>
                  {selectedSection?.code ?? '분반'} 팀 구성
                </Heading>
                <Text color='secondary' type='supporting'>
                  팀원을 다른 미확정 팀으로 끌어 놓으면 이동 확인 창이 열립니다.
                </Text>
              </div>
              <Button
                isDisabled={
                  !sectionId ||
                  !hasTeams ||
                  isTeamAssignmentFinalized ||
                  finalizeMutation.isPending
                }
                label={
                  isTeamAssignmentFinalized ? '팀 배정 확정됨' : '팀 배정 확정'
                }
                onClick={() => setIsFinalizeDialogOpen(true)}
              />
            </HStack>
            {teams.length === 0 ? (
              <div className={styles.emptyTeamPanel}>
                <p>등록된 팀이 없습니다.</p>
              </div>
            ) : (
              <div className={styles.teamGrid}>
                {teams.map(team => (
                  <article
                    className={cx(
                      styles.teamCard,
                      dragOverTeamId === team.id && styles.dragOverTeamCard,
                    )}
                    key={team.id}
                    onDragLeave={event => {
                      const relatedTarget = event.relatedTarget;
                      if (
                        !(relatedTarget instanceof Node) ||
                        !event.currentTarget.contains(relatedTarget)
                      ) {
                        setDragOverTeamId(null);
                      }
                    }}
                    onDragOver={event => {
                      if (
                        draggedTeamMember &&
                        team.id !== draggedTeamMember.sourceTeam.id &&
                        team.sectionId ===
                          draggedTeamMember.sourceTeam.sectionId &&
                        team.status !== 'CONFIRMED'
                      ) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setDragOverTeamId(team.id);
                      }
                    }}
                    onDrop={event => {
                      event.preventDefault();
                      setDragOverTeamId(null);
                      const draggedMember = draggedTeamMember;
                      setDraggedTeamMember(null);
                      if (
                        !draggedMember ||
                        team.id === draggedMember.sourceTeam.id ||
                        team.sectionId !== draggedMember.sourceTeam.sectionId ||
                        team.status === 'CONFIRMED'
                      ) {
                        return;
                      }

                      openTeamMoveDialog(
                        draggedMember.member,
                        draggedMember.sourceTeam,
                        team.id,
                      );
                    }}
                  >
                    <h3 className={styles.teamName}>
                      <Link
                        className={styles.teamDashboardLink}
                        params={{ teamId: String(team.id) }}
                        search={{ sectionId }}
                        to={ROUTES.ADMIN_TEAM_DETAIL}
                      >
                        {team.name}
                      </Link>
                    </h3>
                    <div className={styles.teamContent}>
                      <HStack className={styles.teamLeader} gap={1}>
                        <Text color='secondary' type='supporting'>
                          팀장:{' '}
                          {team.members.find(member => member.isLeader)?.name ??
                            '미지정'}
                        </Text>
                        <Button
                          label='팀장 변경'
                          onClick={() => {
                            setTeamToUpdateLeader(team);
                            setNextLeaderStudentNumber(
                              team.members.find(member => member.isLeader)
                                ?.studentNumber ?? '',
                            );
                          }}
                          size='sm'
                          variant='secondary'
                        />
                      </HStack>
                      <ul className={styles.memberList}>
                        {team.members.map(member => (
                          <li
                            className={cx(
                              styles.member,
                              canMoveFromTeam(team) && styles.draggableMember,
                              draggedTeamMember?.member.id === member.id &&
                                styles.draggingMember,
                            )}
                            draggable={canMoveFromTeam(team)}
                            key={member.id}
                            onDragEnd={() => {
                              setDraggedTeamMember(null);
                              setDragOverTeamId(null);
                            }}
                            onDragStart={event => {
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData(
                                'text/plain',
                                member.studentNumber,
                              );
                              setDraggedTeamMember({
                                member,
                                sourceTeam: team,
                              });
                            }}
                          >
                            <button
                              className={styles.memberButton}
                              onClick={() =>
                                setSelectedStudentNumber(member.studentNumber)
                              }
                              type='button'
                            >
                              {member.name}
                            </button>
                            <span>{member.studentNumber}</span>
                            <span className={styles.memberRole}>
                              역할: {member.projectRole || '미지정'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      <Dialog
        aria-label='수강생 제외 확인'
        isOpen={studentToWithdraw !== null}
        onOpenChange={open => {
          if (!open) setStudentToWithdraw(null);
        }}
        purpose='info'
        role='alertdialog'
        width={440}
      >
        {studentToWithdraw ? (
          <div className={styles.withdrawDialogContent}>
            <Heading level={2}>수강생을 분반에서 제외할까요?</Heading>
            <Text>
              {studentToWithdraw.name} 학생을 이 분반에서 제외하면 팀 소속도
              함께 해제되어, 이 분반의 팀 화면에 접근할 수 없게 됩니다.
            </Text>
            {withdrawMutation.isError ? (
              <Text role='alert'>
                수강생을 제외하지 못했습니다. 잠시 후 다시 시도해 주세요.
              </Text>
            ) : null}
            <HStack gap={2} justify='end'>
              <Button
                label='취소'
                onClick={() => setStudentToWithdraw(null)}
                variant='secondary'
              />
              <Button
                isDisabled={withdrawMutation.isPending}
                label={withdrawMutation.isPending ? '제외 중' : '제외 확인'}
                onClick={() => {
                  if (!studentToWithdraw) return;

                  withdrawMutation.mutate(
                    {
                      sectionId,
                      studentNumber: studentToWithdraw.studentNumber,
                    },
                    { onSuccess: () => setStudentToWithdraw(null) },
                  );
                }}
              />
            </HStack>
          </div>
        ) : null}
      </Dialog>
      <AdminStudentDetailDialog
        allowPasswordReset
        onClose={() => setSelectedStudentNumber(null)}
        major={
          students.find(
            student => student.studentNumber === selectedStudentNumber,
          )?.major
        }
        studentNumber={selectedStudentNumber}
      />
      <Dialog
        aria-label='프로젝트 역할 변경'
        isOpen={teamMemberToUpdateRole !== null}
        onOpenChange={open => {
          if (!open) closeTeamMemberRoleDialog();
        }}
        purpose='form'
        width={440}
      >
        {teamMemberToUpdateRole ? (
          <div className={styles.withdrawDialogContent}>
            <Heading level={2}>
              {teamMemberToUpdateRole.member.name} 역할 변경
            </Heading>
            <Text color='secondary'>
              비워 저장하면 프로젝트 역할을 미지정으로 변경합니다.
            </Text>
            <TextInput
              isDisabled={updateTeamMemberRoleMutation.isPending}
              label='프로젝트 역할'
              onChange={value => {
                if (updateTeamMemberRoleMutation.isError) {
                  updateTeamMemberRoleMutation.reset();
                }
                setNextProjectRole(value.slice(0, 50));
              }}
              placeholder='예) 백엔드'
              value={nextProjectRole}
              width='100%'
            />
            <Text color='secondary' type='supporting'>
              {nextProjectRole.length}/50자
            </Text>
            {updateTeamMemberRoleMutation.isError ? (
              <Text role='alert'>
                {getTeamMemberRoleErrorMessage(
                  updateTeamMemberRoleMutation.error,
                )}
              </Text>
            ) : null}
            <HStack gap={2} justify='end'>
              <Button
                isDisabled={updateTeamMemberRoleMutation.isPending}
                label='취소'
                onClick={closeTeamMemberRoleDialog}
                variant='secondary'
              />
              <Button
                isDisabled={
                  updateTeamMemberRoleMutation.isPending ||
                  nextProjectRole ===
                    (teamMemberToUpdateRole.member.projectRole ?? '')
                }
                isLoading={updateTeamMemberRoleMutation.isPending}
                label='저장'
                onClick={() => {
                  updateTeamMemberRoleMutation.mutate(
                    {
                      projectRole: nextProjectRole,
                      studentNumber:
                        teamMemberToUpdateRole.member.studentNumber,
                      teamId: teamMemberToUpdateRole.team.id,
                    },
                    { onSuccess: closeTeamMemberRoleDialog },
                  );
                }}
              />
            </HStack>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        aria-label='팀장 변경'
        isOpen={teamToUpdateLeader !== null}
        onOpenChange={open => {
          if (!open) closeTeamLeaderDialog();
        }}
        purpose='form'
        width={440}
      >
        {teamToUpdateLeader ? (
          <div className={styles.withdrawDialogContent}>
            <Heading level={2}>{teamToUpdateLeader.name} 팀장 변경</Heading>
            <Text color='secondary'>
              새 팀장을 선택하면 기존 팀장은 자동으로 해제됩니다. 팀장이 수강을
              포기하기 전에 새 팀장을 먼저 지정해 주세요.
            </Text>
            <RadioList
              isDisabled={updateTeamLeaderMutation.isPending}
              label='새 팀장'
              onChange={setNextLeaderStudentNumber}
              value={nextLeaderStudentNumber}
            >
              {teamToUpdateLeader.members.map(member => (
                <RadioListItem
                  description={`${member.studentNumber}${member.isLeader ? ' · 현재 팀장' : ''}`}
                  key={member.id}
                  label={member.name}
                  value={member.studentNumber}
                />
              ))}
            </RadioList>
            {updateTeamLeaderMutation.isError ? (
              <Text role='alert'>
                팀장을 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.
              </Text>
            ) : null}
            <HStack gap={2} justify='end'>
              <Button
                isDisabled={updateTeamLeaderMutation.isPending}
                label='취소'
                onClick={closeTeamLeaderDialog}
                variant='secondary'
              />
              <Button
                isDisabled={
                  updateTeamLeaderMutation.isPending ||
                  !nextLeaderStudentNumber ||
                  teamToUpdateLeader.members.find(member => member.isLeader)
                    ?.studentNumber === nextLeaderStudentNumber
                }
                isLoading={updateTeamLeaderMutation.isPending}
                label='팀장 변경'
                onClick={() => {
                  updateTeamLeaderMutation.mutate(
                    {
                      studentNumber: nextLeaderStudentNumber,
                      teamId: teamToUpdateLeader.id,
                    },
                    {
                      onSuccess: () => {
                        closeTeamLeaderDialog();
                      },
                    },
                  );
                }}
              />
            </HStack>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        aria-label='팀원 이동'
        isOpen={teamMemberToMove !== null}
        onOpenChange={open => {
          if (!open) closeTeamMoveDialog();
        }}
        purpose='form'
        width={440}
      >
        {teamMemberToMove ? (
          <div className={styles.withdrawDialogContent}>
            <Heading level={2}>{teamMemberToMove.member.name} 팀 이동</Heading>
            <Text color='secondary'>
              {teamMemberToMove.sourceTeam.name}에서 같은 분반의 미확정 팀으로
              이동합니다.
            </Text>
            <Text color='secondary'>
              현재 팀에서 팀장으로 설정되어 있다면 팀장 역할을 해제하고
              이동합니다.
            </Text>
            <RadioList
              isDisabled={moveTeamMemberMutation.isPending}
              label='이동할 팀'
              onChange={setTargetTeamId}
              value={targetTeamId}
            >
              {targetTeams.map(team => (
                <RadioListItem
                  description={`${team.members.length}명 · 팀장 ${team.members.find(member => member.isLeader)?.name ?? '미지정'}`}
                  key={team.id}
                  label={team.name}
                  value={String(team.id)}
                />
              ))}
            </RadioList>
            {moveTeamMemberMutation.isError ? (
              <Text role='alert'>
                {getTeamMoveErrorMessage(moveTeamMemberMutation.error)}
              </Text>
            ) : null}
            <HStack gap={2} justify='end'>
              <Button
                isDisabled={moveTeamMemberMutation.isPending}
                label='취소'
                onClick={closeTeamMoveDialog}
                variant='secondary'
              />
              <Button
                isDisabled={
                  moveTeamMemberMutation.isPending ||
                  !targetTeams.some(team => team.id === Number(targetTeamId))
                }
                isLoading={moveTeamMemberMutation.isPending}
                label='이동하기'
                onClick={() => {
                  if (!teamMemberToMove || !targetTeamId) return;

                  moveTeamMemberMutation.mutate(
                    {
                      isLeader: false,
                      studentNumber: teamMemberToMove.member.studentNumber,
                      targetTeamId: Number(targetTeamId),
                      teamId: teamMemberToMove.sourceTeam.id,
                    },
                    { onSuccess: closeTeamMoveDialog },
                  );
                }}
              />
            </HStack>
          </div>
        ) : null}
      </Dialog>
      <Dialog
        aria-label='팀 배정 확정 확인'
        isOpen={isFinalizeDialogOpen}
        onOpenChange={open => {
          if (!open) setIsFinalizeDialogOpen(false);
        }}
        purpose='required'
        width={440}
      >
        <div className={styles.withdrawDialogContent}>
          <Heading level={2}>팀 배정을 확정할까요?</Heading>
          <Text>
            확정된 팀의 팀원은 이후 이동하거나 팀 구성을 변경할 수 없습니다.
          </Text>
          {finalizeMutation.isError ? (
            <Text role='alert'>
              팀 배정을 확정하지 못했습니다. 다시 시도해 주세요.
            </Text>
          ) : null}
          <HStack gap={2} justify='end'>
            <Button
              label='취소'
              onClick={() => setIsFinalizeDialogOpen(false)}
              variant='secondary'
            />
            <Button
              isDisabled={finalizeMutation.isPending}
              label={finalizeMutation.isPending ? '확정 중' : '확정하기'}
              onClick={() => {
                finalizeMutation.mutate(sectionId, {
                  onSuccess: () => setIsFinalizeDialogOpen(false),
                });
              }}
            />
          </HStack>
        </div>
      </Dialog>
    </div>
  );
}
