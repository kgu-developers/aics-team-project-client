import { Button, Dialog, Heading, HStack, Text } from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminStudentTeamManagement.css';
import StudentDetailDialog from '../../features/admin-student-team/components/StudentDetailDialog';
import { useAdminStudentsQuery } from '../../features/admin-student-team/queries/useAdminStudentsQuery';
import { useAuthStore } from '../../features/auth/authStore';
import { useTeamsQuery } from '../../features/teams/queries/useTeamsQuery';

export default function AdminStudentTeamManagement() {
  const currentUser = useAuthStore(state => state.currentUser);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [studentToWithdraw, setStudentToWithdraw] = useState<
    (typeof students)[number] | null
  >(null);
  const sections = currentUser?.sections ?? [];
  const selectedSection =
    sections.find(section => section.id === selectedSectionId) ??
    sections[0] ??
    null;
  const sectionId = selectedSection?.id ?? '';
  const studentsQuery = useAdminStudentsQuery(sectionId);
  const teamsQuery = useTeamsQuery(sectionId);

  const students = studentsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const studentsById = useMemo(
    () => new Map(students.map(student => [student.id, student])),
    [students],
  );
  const selectedStudent = selectedStudentId
    ? (studentsById.get(selectedStudentId) ?? null)
    : null;
  const withdrawingStudentIsLeader = studentToWithdraw
    ? teams.some(team =>
        team.members.some(
          member =>
            member.id === studentToWithdraw.id && member.isLeader === true,
        ),
      )
    : false;

  const isPending = studentsQuery.isPending || teamsQuery.isPending;
  const error = studentsQuery.error ?? teamsQuery.error;

  function openStudentDetail(studentId: string) {
    setSelectedStudentId(studentId);
  }

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
                      <th scope='col'>전공</th>
                      <th scope='col'>팀</th>
                      <th scope='col'>관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.studentNumber}</td>
                        <td>{student.major}</td>
                        <td>{student.team?.name ?? '미배정'}</td>
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
            <Heading level={2}>
              {selectedSection?.code ?? '분반'} 팀 구성
            </Heading>
            {teams.length === 0 ? (
              <div className={styles.emptyTeamPanel}>
                <p>등록된 팀이 없습니다.</p>
              </div>
            ) : (
              <div className={styles.teamGrid}>
                {teams.map(team => (
                  <article className={styles.teamCard} key={team.id}>
                    <h3 className={styles.teamName}>
                      <Link
                        params={{ teamId: team.id }}
                        to={ROUTES.ADMIN_TEAM_DETAIL}
                      >
                        {team.name}
                      </Link>
                    </h3>
                    <ul className={styles.memberList}>
                      {team.members.map(member => {
                        const student = studentsById.get(member.id);

                        return (
                          <li className={styles.member} key={member.id}>
                            <button
                              className={styles.memberButton}
                              onClick={() => openStudentDetail(member.id)}
                              type='button'
                            >
                              {member.name}
                            </button>
                            <span>{student?.studentNumber ?? '-'}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
      <StudentDetailDialog
        isOpen={selectedStudent !== null}
        onClose={() => setSelectedStudentId(null)}
        student={selectedStudent}
      />
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
              {withdrawingStudentIsLeader
                ? `${studentToWithdraw.name} 학생은 현재 팀장입니다. 제외하면 팀장 권한이 해제되고 팀 상태가 모집 중으로 변경됩니다.`
                : `${studentToWithdraw.name} 학생을 제외하면 수강 상태가 변경되고 팀 구성에서도 제외됩니다.`}
            </Text>
            {withdrawingStudentIsLeader ? (
              <Text>
                이후 팀원들이 기존 팀장 선출 흐름에서 새 팀장을 자진해서 정하게
                됩니다.
              </Text>
            ) : null}
            <Text>제외 처리는 백엔드 API 연동 후 사용할 수 있습니다.</Text>
            <HStack gap={2} justify='end'>
              <Button
                label='취소'
                onClick={() => setStudentToWithdraw(null)}
                variant='secondary'
              />
              <Button
                isDisabled
                label='제외 확인'
                tooltip='백엔드 수강 상태 변경 API 연동 후 제공 예정입니다.'
              />
            </HStack>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
