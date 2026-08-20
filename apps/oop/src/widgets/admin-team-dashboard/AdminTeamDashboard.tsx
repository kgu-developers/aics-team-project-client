import { Heading, Text } from '@aics/design-system';
import { Link, useParams } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import StudentDetailDialog from '~/features/admin-student-team/components/StudentDetailDialog';
import { useAdminTeamDashboardQuery } from '~/features/admin-team-dashboard/queries';

import * as styles from './AdminTeamDashboard.css';

export default function AdminTeamDashboard() {
  const { teamId } = useParams({ from: '/admin/teams/$teamId' });
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const memberTriggerRef = useRef<HTMLButtonElement>(null);
  const teamDashboardQuery = useAdminTeamDashboardQuery(teamId);

  useEffect(() => {
    setSelectedMemberId(null);
  }, [teamId]);

  if (teamDashboardQuery.isPending) {
    return (
      <div className={styles.page}>
        <Text>팀 정보를 불러오는 중입니다.</Text>
      </div>
    );
  }

  if (teamDashboardQuery.isError) {
    return (
      <div className={styles.page}>
        <Text>팀 정보를 불러오지 못했습니다.</Text>
      </div>
    );
  }

  const team = teamDashboardQuery.data;
  const selectedMember = selectedMemberId
    ? (team.members.find(member => member.id === selectedMemberId) ?? null)
    : null;
  const selectedStudent = selectedMember
    ? {
        name: selectedMember.name,
        studentNumber: selectedMember.studentNumber,
        major: selectedMember.major,
        team: { name: team.name },
      }
    : null;

  function openStudentDetail(memberId: string, trigger: HTMLButtonElement) {
    memberTriggerRef.current = trigger;
    setSelectedMemberId(memberId);
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>
          {team.section.code}반 - {team.name} 대시보드
        </Heading>
        <Link className={styles.backLink} to={ROUTES.ADMIN_STUDENT_TEAM}>
          ← 수강생/팀 관리로
        </Link>
      </div>

      <section className={styles.teamInfoCard}>
        <Heading level={2}>{team.name} 상세</Heading>
        <Text>
          프로젝트 주제: <strong>{team.projectTopic ?? '미정'}</strong>
        </Text>

        <ul className={styles.memberList}>
          {team.members.map(member => (
            <li className={styles.memberCard} key={member.id}>
              <button
                className={styles.memberButton}
                onClick={event =>
                  openStudentDetail(member.id, event.currentTarget)
                }
                type='button'
              >
                {member.name}
              </button>
              <span className={styles.studentNumber}>
                {member.studentNumber}
              </span>
              <div className={styles.memberBadges}>
                {member.isLeader ? (
                  <span className={styles.leaderBadge}>팀장</span>
                ) : null}
                <span className={styles.roleBadge}>
                  {member.projectRole ?? '역할 미정'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <StudentDetailDialog
        isOpen={selectedStudent !== null}
        onClose={() => setSelectedMemberId(null)}
        student={selectedStudent}
        triggerRef={memberTriggerRef}
      />
    </div>
  );
}
