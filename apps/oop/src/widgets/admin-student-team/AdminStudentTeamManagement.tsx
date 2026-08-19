import { Button, Heading } from '@aics/design-system';
import { type RefObject, useEffect, useMemo, useRef, useState } from 'react';

import * as styles from './AdminStudentTeamManagement.css';
import type { AdminStudent } from '../../features/admin-student-team/api/fetchAdminStudents';
import { useAdminStudentsQuery } from '../../features/admin-student-team/queries/useAdminStudentsQuery';
import { useAuthStore } from '../../features/auth/authStore';
import { useTeamsQuery } from '../../features/teams/queries/useTeamsQuery';

function StudentDetailDialog({
  isOpen,
  onClose,
  student,
  triggerRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  student: AdminStudent | null;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!isOpen || !dialog) return;

    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

  if (!isOpen || !student) return null;

  function handleClose() {
    onClose();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <dialog
      aria-labelledby='student-detail-title'
      aria-modal='true'
      className={styles.dialog}
      onCancel={event => {
        event.preventDefault();
        handleClose();
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;

        event.preventDefault();
        handleClose();
      }}
      ref={dialogRef}
    >
      <Heading id='student-detail-title' level={2}>
        {student.name} 수강생 정보
      </Heading>
      <dl className={styles.detailList}>
        <div className={styles.detailRow}>
          <dt>이름</dt>
          <dd>{student.name}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>학번</dt>
          <dd>{student.studentNumber}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>전공</dt>
          <dd>{student.major}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>팀</dt>
          <dd>{student.team?.name ?? '미배정'}</dd>
        </div>
      </dl>
      <div className={styles.modalActions}>
        <Button
          label='닫기'
          onClick={handleClose}
          ref={closeButtonRef}
          variant='secondary'
        />
      </div>
    </dialog>
  );
}

export default function AdminStudentTeamManagement() {
  const currentUser = useAuthStore(state => state.currentUser);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null,
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const studentTriggerRef = useRef<HTMLButtonElement>(null);
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

  const isPending = studentsQuery.isPending || teamsQuery.isPending;
  const error = studentsQuery.error ?? teamsQuery.error;

  function openStudentDetail(studentId: string, trigger: HTMLButtonElement) {
    studentTriggerRef.current = trigger;
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
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td>{student.name}</td>
                        <td>{student.studentNumber}</td>
                        <td>{student.major}</td>
                        <td>{student.team?.name ?? '미배정'}</td>
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
                    <h3 className={styles.teamName}>{team.name}</h3>
                    <ul className={styles.memberList}>
                      {team.members.map(member => {
                        const student = studentsById.get(member.id);

                        return (
                          <li className={styles.member} key={member.id}>
                            <button
                              className={styles.memberButton}
                              onClick={event =>
                                openStudentDetail(
                                  member.id,
                                  event.currentTarget,
                                )
                              }
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
        triggerRef={studentTriggerRef}
      />
    </div>
  );
}
