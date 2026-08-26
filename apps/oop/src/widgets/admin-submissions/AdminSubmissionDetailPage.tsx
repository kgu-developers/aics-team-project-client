import {
  Button,
  Card,
  Dialog,
  EmptyState,
  Heading,
  proportional,
  Table,
  Text,
} from '@aics/design-system';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { useAdminMilestoneSubmissionDetailQuery } from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminSubmissionDetailPage.css';

const milestoneLabels = {
  'final-report': '최종 보고서',
  midterm: '중간 점검',
  'peer-review': '상호 평가',
  'presentation-evaluate': '발표 평가',
  'presentation-submit': '발표 자료 제출',
  proposal: '제안서',
} as const;

function getMilestoneLabel(milestoneId: string | undefined) {
  if (milestoneId && milestoneId in milestoneLabels) {
    return milestoneLabels[milestoneId as keyof typeof milestoneLabels];
  }

  return '제출물';
}

export default function AdminSubmissionDetailPage() {
  const [selectedPeerMember, setSelectedPeerMember] = useState<{
    name: string;
    studentNumber: string;
    major: string;
    evaluation: {
      roleSummary: string;
      teamEvaluation: string;
      reflection: string;
    };
  } | null>(null);
  const currentUser = useAuthStore(state => state.currentUser);
  const { submissionId } = useParams({
    from: '/admin/submissions/$submissionId',
  });
  const search = useSearch({ from: '/admin/submissions/$submissionId' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const milestoneLabel = getMilestoneLabel(search.milestoneId);
  const submissionQuery = useAdminMilestoneSubmissionDetailQuery(submissionId);
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const detail = submissionQuery.data;
  const isAccessibleSection = Boolean(
    detail && accessibleSectionIds.includes(detail.sectionId),
  );

  function renderProposal() {
    if (!detail?.proposal) {
      return (
        <EmptyState
          description='이 제출물 형식의 상세보기는 후속 작업에서 연결합니다.'
          title='표시할 상세 내용이 없습니다.'
        />
      );
    }

    const proposal = detail.proposal;

    return (
      <Card className={styles.document}>
        <div className={styles.documentHeader}>
          <Text className={styles.documentLabel}>DOC / PROPOSAL / FORM V1</Text>
          <Heading level={2}>{detail.teamName} 제안서</Heading>
          <Text className={styles.metadata}>
            {detail.sectionLabel} · 제출일 {detail.submittedAt} · 조회 전용
          </Text>
        </div>

        <section className={styles.section}>
          <Heading level={3}>1. 팀 정보</Heading>
          <Text className={styles.sectionDescription}>
            팀 구성과 역할을 한눈에 볼 수 있게 정리합니다.
          </Text>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>팀명</Text>
              <Text className={styles.fieldValue}>{proposal.teamName}</Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>팀장</Text>
              <Text className={styles.fieldValue}>
                {proposal.teamLeaderName}
              </Text>
            </div>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>팀원</Text>
              <Text className={styles.fieldValue}>
                {proposal.members.join('\n')}
              </Text>
            </div>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>팀 소개</Text>
              <Text className={styles.fieldValue}>{proposal.introduction}</Text>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <Heading level={3}>2. 주제</Heading>
          <Text className={styles.sectionDescription}>
            제안 주제와 기대 효과를 구체적으로 작성합니다.
          </Text>
          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>프로젝트 제목</Text>
              <Text className={styles.fieldValue}>{proposal.projectTitle}</Text>
            </div>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>주제 설명</Text>
              <Text className={styles.fieldValue}>
                {proposal.projectDescription}
              </Text>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <Heading level={3}>3. 데이터 구성</Heading>
          <Text className={styles.sectionDescription}>
            데이터 단위별 예상 건수와 설명을 표로 정리합니다.
          </Text>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={`${styles.tableCell} ${styles.tableHeader}`}>
                  데이터 이름
                </th>
                <th className={`${styles.tableCell} ${styles.tableHeader}`}>
                  데이터 설명
                </th>
                <th className={`${styles.tableCell} ${styles.tableHeader}`}>
                  예상 개수
                </th>
              </tr>
            </thead>
            <tbody>
              {proposal.dataRows.map((row, index) => (
                <tr
                  className={
                    index === proposal.dataRows.length - 1
                      ? styles.lastTableRow
                      : ''
                  }
                  key={row.name}
                >
                  <td className={styles.tableCell}>{row.name}</td>
                  <td className={styles.tableCell}>{row.description}</td>
                  <td className={styles.tableCell}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={styles.section}>
          <Heading level={3}>4. 화면 구성</Heading>
          <Text className={styles.sectionDescription}>
            핵심 화면과 사용자 행동을 화면별로 정리합니다.
          </Text>
          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>와이어프레임 파일</Text>
              <Text className={styles.fieldValue}>
                {proposal.wireframeFileNames.join(', ')}
              </Text>
            </div>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>화면 구성 설명</Text>
              <Text className={styles.fieldValue}>
                {proposal.screenDescription}
              </Text>
            </div>
          </div>
          <div className={styles.screenList}>
            {proposal.screens.map(screen => (
              <div className={styles.field} key={screen.name}>
                <Text className={styles.fieldLabel}>{screen.name}</Text>
                <Text className={styles.fieldValue}>{screen.description}</Text>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <Heading level={3}>5. 팀 운영 방식</Heading>
          <Text className={styles.sectionDescription}>
            역할 분담과 협업 규칙, 진행 일정을 정리합니다.
          </Text>
          <div className={styles.fieldGrid}>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>역할 분담</Text>
              <Text className={styles.fieldValue}>{proposal.roles}</Text>
            </div>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>협업 방식</Text>
              <Text className={styles.fieldValue}>
                {proposal.collaboration}
              </Text>
            </div>
            <div className={`${styles.field} ${styles.fullWidthField}`}>
              <Text className={styles.fieldLabel}>진행 일정</Text>
              <Text className={styles.fieldValue}>{proposal.schedule}</Text>
            </div>
          </div>
        </section>
      </Card>
    );
  }

  function renderMidterm() {
    if (!detail?.midterm) {
      return (
        <EmptyState
          description='이 중간 점검 제출물의 상세 내용을 찾을 수 없습니다.'
          title='표시할 상세 내용이 없습니다.'
        />
      );
    }

    const midterm = detail.midterm;

    return (
      <Card className={styles.document}>
        <div className={styles.documentHeader}>
          <Text className={styles.documentLabel}>DOC / MIDTERM / FORM V1</Text>
          <Heading level={2}>{detail.teamName} 중간 점검</Heading>
          <Text className={styles.metadata}>
            {detail.sectionLabel} · 제출일 {detail.submittedAt} · 조회 전용
          </Text>
        </div>

        {midterm.blocks.map(block => (
          <section className={styles.section} key={block.title}>
            <Heading level={3}>{block.title}</Heading>
            <Text className={styles.sectionDescription}>
              {block.description}
            </Text>
            <div className={styles.fieldGrid}>
              {block.fields.map(field => (
                <div
                  className={`${styles.field} ${styles.fullWidthField}`}
                  key={field.label}
                >
                  <Text className={styles.fieldLabel}>{field.label}</Text>
                  <Text className={styles.fieldValue}>{field.value}</Text>
                </div>
              ))}
            </div>
          </section>
        ))}
      </Card>
    );
  }

  function renderPresentation() {
    if (!detail?.presentation) {
      return (
        <EmptyState
          description='발표 자료 상세 내용이 없습니다.'
          title='표시할 상세 내용이 없습니다.'
        />
      );
    }
    const presentation = detail.presentation;
    return (
      <Card className={styles.document}>
        <div className={styles.documentHeader}>
          <Text className={styles.documentLabel}>
            DOC / PRESENTATION / FORM V1
          </Text>
          <Heading level={2}>{detail.teamName} 발표 자료 제출</Heading>
          <Text className={styles.metadata}>
            {detail.sectionLabel} · 제출일 {detail.submittedAt} · 조회 전용
          </Text>
        </div>
        {presentation.blocks.map(block => (
          <section className={styles.section} key={block.title}>
            <Heading level={3}>{block.title}</Heading>
            <Text className={styles.sectionDescription}>
              {block.description}
            </Text>
            {block.title === '4. 시연 영상' && (
              <div className={`${styles.field} ${styles.fullWidthField}`}>
                <Text className={styles.fieldLabel}>시연 링크</Text>
                {presentation.videoUrl ? (
                  <a
                    className={styles.fieldValue}
                    href={presentation.videoUrl}
                    rel='noreferrer'
                    target='_blank'
                  >
                    {presentation.videoUrl}
                  </a>
                ) : (
                  <Text className={styles.fieldValue}>-</Text>
                )}
              </div>
            )}
            <div className={styles.fieldGrid}>
              {block.fields.map(field => (
                <div
                  className={`${styles.field} ${styles.fullWidthField}`}
                  key={field.label}
                >
                  <Text className={styles.fieldLabel}>{field.label}</Text>
                  <Text className={styles.fieldValue}>{field.value}</Text>
                </div>
              ))}
            </div>
          </section>
        ))}
        <section className={styles.section}>
          <Heading level={3}>제출 파일</Heading>
          <div className={styles.fieldGrid}>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>발표 자료 PDF</Text>
              <Text className={styles.fieldValue}>
                {presentation.presentationFileName ?? '-'}
              </Text>
            </div>
            <div className={styles.field}>
              <Text className={styles.fieldLabel}>시연 파일 ZIP</Text>
              <Text className={styles.fieldValue}>
                {presentation.sourceArchiveFileName ?? '-'}
              </Text>
            </div>
          </div>
        </section>
      </Card>
    );
  }

  function renderPeerEvaluation() {
    const peer = detail?.peerEvaluation;
    if (!peer)
      return (
        <EmptyState
          description='상호 평가 데이터가 없습니다.'
          title='표시할 평가가 없습니다.'
        />
      );
    const scoreFor = (memberNumber: string, targetNumber: string) =>
      peer.responses.find(
        response => response.evaluatorStudentNumber === memberNumber,
      )?.scores[targetNumber];
    return (
      <Card className={styles.document}>
        <div className={styles.documentHeader}>
          <Text className={styles.documentLabel}>
            PEER EVALUATION / READ ONLY
          </Text>
          <Heading level={2}>{detail.teamName} 상호 평가</Heading>
        </div>
        <Table
          columns={[
            {
              align: 'start',
              header: '이름',
              key: 'name',
              renderCell: member => (
                <button
                  className={styles.peerMemberButton}
                  type='button'
                  onClick={() =>
                    setSelectedPeerMember({
                      ...member,
                      evaluation: peer.responses.find(
                        response =>
                          response.evaluatorStudentNumber ===
                          member.studentNumber,
                      )?.projectEvaluation ?? {
                        reflection: '-',
                        roleSummary: '-',
                        teamEvaluation: '-',
                      },
                    })
                  }
                >
                  {member.name}
                </button>
              ),
              width: proportional(1, { minWidth: 120 }),
            },
            ...peer.members.map(target => ({
              align: 'center' as const,
              header: target.name,
              key: target.studentNumber,
              renderCell: (member: (typeof peer.members)[number]) =>
                target.studentNumber === member.studentNumber
                  ? '-'
                  : (scoreFor(target.studentNumber, member.studentNumber) ??
                    '-'),
              width: proportional(1, { minWidth: 112 }),
            })),
            {
              align: 'center',
              header: '평균',
              key: 'average',
              renderCell: member => {
                const values = peer.members
                  .filter(
                    target => target.studentNumber !== member.studentNumber,
                  )
                  .map(target =>
                    scoreFor(target.studentNumber, member.studentNumber),
                  )
                  .filter((value): value is number => value !== undefined);
                return values.length
                  ? (
                      values.reduce((sum, value) => sum + value, 0) /
                      values.length
                    ).toFixed(1)
                  : '-';
              },
              width: proportional(0.8, { minWidth: 96 }),
            },
          ]}
          data={peer.members}
          dividers='rows'
          textOverflow='wrap'
          verticalAlign='middle'
        />
        <Dialog
          aria-label='프로젝트 평가'
          isOpen={selectedPeerMember !== null}
          onOpenChange={open => {
            if (!open) setSelectedPeerMember(null);
          }}
          purpose='info'
          width={480}
        >
          {selectedPeerMember ? (
            <>
              <div className={styles.evaluationHeader}>
                <Heading level={2}>{selectedPeerMember.name} 평가</Heading>
                <Text>학번: {selectedPeerMember.studentNumber}</Text>
                <Text>전공: {selectedPeerMember.major}</Text>
              </div>
              <div className={styles.evaluationList}>
                <div className={styles.evaluationItem}>
                  <Text className={styles.fieldLabel}>자신의 역할 요약</Text>
                  <Text>{selectedPeerMember.evaluation.roleSummary}</Text>
                </div>
                <div className={styles.evaluationItem}>
                  <Text className={styles.fieldLabel}>팀 프로젝트 평가</Text>
                  <Text>{selectedPeerMember.evaluation.teamEvaluation}</Text>
                </div>
                <div className={styles.evaluationItem}>
                  <Text className={styles.fieldLabel}>소감 또는 팀원 칭찬</Text>
                  <Text>{selectedPeerMember.evaluation.reflection}</Text>
                </div>
              </div>
              <Button
                className={styles.evaluationClose}
                data-autofocus=''
                label='닫기'
                onClick={() => setSelectedPeerMember(null)}
                variant='secondary'
              />
            </>
          ) : null}
        </Dialog>
      </Card>
    );
  }

  function renderPresentationEvaluation() {
    const evaluation = detail?.presentationEvaluation;
    if (!evaluation) {
      return (
        <EmptyState
          description='발표 평가 데이터가 없습니다.'
          title='표시할 평가가 없습니다.'
        />
      );
    }

    return (
      <Card className={styles.document}>
        <div className={styles.documentHeader}>
          <Text className={styles.documentLabel}>
            PRESENTATION EVALUATION / READ ONLY
          </Text>
          <Heading level={2}>{detail.teamName} 발표 평가</Heading>
          <Text className={styles.metadata}>
            {detail.sectionLabel} · 평가 마감일 {detail.submittedAt} · 조회 전용
          </Text>
        </div>
        <Table
          columns={[
            {
              align: 'start',
              header: '평가자',
              key: 'evaluatorName',
              width: proportional(1, { minWidth: 120 }),
            },
            ...evaluation.criteria.map(criterion => ({
              align: 'center' as const,
              header: criterion.label,
              key: criterion.id,
              renderCell: (
                evaluator: (typeof evaluation.evaluations)[number],
              ) =>
                evaluator.isTargetTeamMember
                  ? '-'
                  : (evaluator.scores[criterion.id] ?? '미평가'),
              width: proportional(1, { minWidth: 144 }),
            })),
            {
              align: 'center',
              header: '합계',
              key: 'total',
              renderCell: evaluator =>
                evaluator.isTargetTeamMember
                  ? '-'
                  : (evaluator.total ?? '미평가'),
              width: proportional(0.7, { minWidth: 96 }),
            },
          ]}
          data={evaluation.evaluations}
          dividers='rows'
          textOverflow='wrap'
          verticalAlign='middle'
        />
      </Card>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Heading level={1}>{milestoneLabel} 상세보기</Heading>
        <Link
          className={styles.backLink}
          search={search}
          to={ROUTES.ADMIN_SUBMISSIONS}
        >
          ← {milestoneLabel} 목록으로
        </Link>
      </div>
      {submissionQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          제출물 상세를 불러오는 중입니다.
        </Text>
      ) : submissionQuery.isError ? (
        <EmptyState
          description='제출물이 존재하는지 확인한 뒤 다시 시도해 주세요.'
          title='제출물 상세를 불러오지 못했습니다.'
        />
      ) : !detail || !isAccessibleSection ? (
        <EmptyState
          description='담당 분반의 제출물만 조회할 수 있습니다.'
          title='접근할 수 없는 제출물입니다.'
        />
      ) : detail.milestoneId === 'proposal' ? (
        renderProposal()
      ) : detail.milestoneId === 'midterm' ? (
        renderMidterm()
      ) : detail.milestoneId === 'presentation-submit' ? (
        renderPresentation()
      ) : detail.milestoneId === 'presentation-evaluate' ? (
        renderPresentationEvaluation()
      ) : detail.milestoneId === 'peer-review' ? (
        renderPeerEvaluation()
      ) : (
        <EmptyState
          description='이 마일스톤의 상세보기는 후속 작업에서 연결합니다.'
          title='표시할 상세 내용이 없습니다.'
        />
      )}
    </div>
  );
}
