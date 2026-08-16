import { Heading } from '@aics/design-system';
import { useMemo, useState } from 'react';

import { useAdminStudentsQuery } from '../../features/admin-student-team/queries/useAdminStudentsQuery';
import { useTeamsQuery } from '../../features/teams/queries/useTeamsQuery';
import { adminSectionsFixture } from '../../mocks/data/adminStudentTeams';
import * as styles from './AdminStudentTeamManagement.css';

export default function AdminStudentTeamManagement() {
  const [selectedSectionId, setSelectedSectionId] = useState(
    adminSectionsFixture[0]?.id ?? '',
  );
  const studentsQuery = useAdminStudentsQuery(selectedSectionId);
  const teamsQuery = useTeamsQuery(selectedSectionId);

  const students = studentsQuery.data ?? [];
  const teams = teamsQuery.data ?? [];
  const studentsById = useMemo(
    () => new Map(students.map(student => [student.id, student])),
    [students],
  );

  const isPending = studentsQuery.isPending || teamsQuery.isPending;
  const error = studentsQuery.error ?? teamsQuery.error;

  return (
    <main className={styles.page}>
      <div className={styles.heading}>
        <Heading level={1}>수강생/팀 관리</Heading>
        <p>분반별 수강생과 팀 구성을 확인할 수 있습니다.</p>
      </div>

      <div aria-label='분반 선택' className={styles.sectionTabs} role='tablist'>
        {adminSectionsFixture.map(section => {
          const isSelected = section.id === selectedSectionId;

          return (
            <button
              aria-selected={isSelected}
              className={isSelected ? styles.activeTab : styles.tab}
              key={section.id}
              onClick={() => setSelectedSectionId(section.id)}
              role='tab'
              type='button'
            >
              {section.displayName}
            </button>
          );
        })}
      </div>

      {isPending ? (
        <section className={styles.statePanel}>
          <p>수강생과 팀 목록을 불러오는 중입니다.</p>
        </section>
      ) : error ? (
        <section className={styles.statePanel}>
          <p>목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
        </section>
      ) : students.length === 0 ? (
        <section className={styles.statePanel}>
          <p>이 분반에 등록된 수강생이 없습니다.</p>
        </section>
      ) : (
        <>
          <section className={styles.section}>
            <Heading level={2}>수강생 목록</Heading>
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
          </section>

          <section className={styles.section}>
            <Heading level={2}>팀 구성</Heading>
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
                            <span>{member.name}</span>
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
    </main>
  );
}
