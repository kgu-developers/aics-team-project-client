import { Button, Dialog, Heading, HStack, Text } from '@aics/design-system';
import { useMemo, useState } from 'react';

import {
  useAdminSectionEnrollmentsQuery,
  useAdminSectionTeamsQuery,
  useAdminTeamDetailsQueries,
  useFinalizeAdminSectionTeamsMutation,
  useWithdrawAdminSectionEnrollmentMutation,
} from '~/features/admin-student-team/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminStudentTeamManagement.css';
import AdminStudentDetailDialog from '../../features/admin-student-team/components/AdminStudentDetailDialog';

export default function AdminStudentTeamManagement() {
  const currentUser = useAuthStore(state => state.currentUser);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [isFinalizeDialogOpen, setIsFinalizeDialogOpen] = useState(false);
  const [selectedStudentNumber, setSelectedStudentNumber] = useState<
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

  const students = (enrollmentsQuery.data?.contents ?? []).filter(
    student => student.status === 'ACTIVE',
  );
  const teams = teamDetailsQueries.flatMap(query =>
    query.data ? [query.data] : [],
  );
  const teamNameByStudentNumber = useMemo(
    () =>
      new Map(
        teams.flatMap(team =>
          team.members.map(member => [member.studentNumber, team.name]),
        ),
      ),
    [teams],
  );
  const [studentToWithdraw, setStudentToWithdraw] = useState<
    (typeof students)[number] | null
  >(null);
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
        <Heading level={1}>수강생/팀 관리</Heading>
      </div>

      <div aria-label='분반 선택' className={styles.sectionTabs} role='group'>
        {sections.map(section => {
          const isSelected = section.id === sectionId;

          return (
            <button
              aria-pressed={isSelected}
              className={isSelected ? styles.activeTab : styles.tab}
              key={section.id}
              onClick={() => setSelectedSectionId(section.id)}
              type='button'
            >
              {section.code}
            </button>
          );
        })}
      </div>

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
                      <th scope='col'>팀</th>
                      <th scope='col'>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.studentNumber}</td>
                        <td>
                          {teamNameByStudentNumber.get(student.studentNumber) ??
                            '미배정'}
                        </td>
                        <td>
                          <Button
                            label='제외'
                            onClick={() => setStudentToWithdraw(student)}
                            size='sm'
                            variant='ghost'
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={styles.section}>
            <HStack justify='between'>
              <Heading level={2}>
                {selectedSection?.code ?? '분반'} 팀 구성
              </Heading>
              <Button
                isDisabled={!sectionId}
                label='팀 배정 확정'
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
                  <article className={styles.teamCard} key={team.id}>
                    <h3 className={styles.teamName}>{team.name}</h3>
                    <ul className={styles.memberList}>
                      {team.members.map(member => (
                        <li className={styles.member} key={member.id}>
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
                        </li>
                      ))}
                    </ul>
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
        purpose='required'
        width={440}
      >
        {studentToWithdraw ? (
          <div className={styles.withdrawDialogContent}>
            <Heading level={2}>수강생을 분반에서 제외할까요?</Heading>
            <Text>
              {studentToWithdraw.name} 학생을 제외하면 수강 상태가 WITHDRAWN으로
              변경되고 팀 구성 및 팀 접근 권한에서도 제외됩니다.
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
        onClose={() => setSelectedStudentNumber(null)}
        studentNumber={selectedStudentNumber}
      />
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
            확정된 팀의 팀원은 이후 이동하거나 역할을 변경할 수 없습니다.
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
