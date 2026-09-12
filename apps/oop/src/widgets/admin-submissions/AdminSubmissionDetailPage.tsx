import {
  Button,
  Card,
  EmptyState,
  Heading,
  HStack,
  Text,
} from '@aics/design-system';
import { Link, useParams, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { AdminLinkedMeetingsTable } from '~/features/admin-meeting/components';
import { useAdminMeetingRecordListQuery } from '~/features/admin-meeting/queries';
import type { AdminSubmissionArtifactView } from '~/features/admin-milestone-review/model';
import {
  useAdminMilestoneSubmissionDetailQuery,
  useAdminSubmissionVersionQuery,
  useAdminSubmissionVersionsQuery,
} from '~/features/admin-milestone-review/queries';
import { useAdminReadState } from '~/features/admin-read-state/useAdminReadState';
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

const versionDetailMilestoneIds = new Set([
  'midterm',
  'presentation-submit',
  'proposal',
]);

function getMilestoneLabel(milestoneId: string | undefined) {
  if (milestoneId && Object.hasOwn(milestoneLabels, milestoneId)) {
    return milestoneLabels[milestoneId as keyof typeof milestoneLabels];
  }

  return '제출물';
}

function ArtifactValue({
  artifact,
}: {
  artifact: AdminSubmissionArtifactView;
}) {
  if (artifact.type === 'FILE') {
    return artifact.downloadUrl && artifact.fileName ? (
      <a
        className={styles.downloadLink}
        download={artifact.fileName}
        href={artifact.downloadUrl}
      >
        {artifact.fileName}
      </a>
    ) : (
      <Text className={styles.fieldValue}>다운로드 정보가 없습니다.</Text>
    );
  }

  if (artifact.type === 'TEXT') {
    return <Text className={styles.fieldValue}>{artifact.content ?? '-'}</Text>;
  }

  return artifact.url ? (
    <a
      className={styles.downloadLink}
      href={artifact.url}
      rel='noreferrer'
      target='_blank'
    >
      {artifact.url}
    </a>
  ) : (
    <Text className={styles.fieldValue}>링크 정보가 없습니다.</Text>
  );
}

export default function AdminSubmissionDetailPage() {
  const [selectedVersion, setSelectedVersion] = useState<number>();
  const [relatedMeetingsPage, setRelatedMeetingsPage] = useState(0);
  const currentUser = useAuthStore(state => state.currentUser);
  const { submissionId } = useParams({
    from: '/admin/submissions/$submissionId',
  });
  const search = useSearch({ from: '/admin/submissions/$submissionId' }) as {
    milestoneId?: string;
    sectionId?: string;
  };
  const accessibleSectionIds =
    currentUser?.sections.map(section => section.id) ?? [];
  const isRequestedSectionAccessible = Boolean(
    search.sectionId && accessibleSectionIds.includes(search.sectionId),
  );
  const isVersionDetailAvailable = Boolean(
    search.milestoneId && versionDetailMilestoneIds.has(search.milestoneId),
  );
  const submissionQuery = useAdminMilestoneSubmissionDetailQuery(
    submissionId,
    isRequestedSectionAccessible && isVersionDetailAvailable,
  );
  const versionsQuery = useAdminSubmissionVersionsQuery(
    submissionId,
    isRequestedSectionAccessible &&
      isVersionDetailAvailable &&
      submissionQuery.isSuccess,
  );
  const versions = versionsQuery.data ?? [];
  const detail = submissionQuery.data;
  const relatedMeetingsQuery = useAdminMeetingRecordListQuery(
    accessibleSectionIds,
    {
      milestoneId: detail?.milestoneId,
      page: relatedMeetingsPage,
      sectionId: search.sectionId,
      size: 100,
      teamId: detail?.teamId,
    },
    Boolean(detail && isRequestedSectionAccessible && isVersionDetailAvailable),
  );
  const relatedMeetings = relatedMeetingsQuery.data?.contents ?? [];
  const relatedMeetingsPageable = relatedMeetingsQuery.data?.pageable;

  useEffect(() => {
    setRelatedMeetingsPage(0);
  }, [
    detail?.milestoneId,
    detail?.submissionId,
    detail?.teamId,
    search.sectionId,
  ]);

  useEffect(() => {
    const isSelectedVersionAvailable = versions.some(
      version => version.version === selectedVersion,
    );
    if (!isSelectedVersionAvailable) {
      const currentVersion = detail?.currentVersion;
      const hasCurrentVersion = versions.some(
        version => version.version === currentVersion,
      );

      setSelectedVersion(
        hasCurrentVersion ? currentVersion : versions[0]?.version,
      );
    }
  }, [detail?.currentVersion, selectedVersion, versions]);

  const versionQuery = useAdminSubmissionVersionQuery(
    submissionId,
    selectedVersion,
    isRequestedSectionAccessible &&
      isVersionDetailAvailable &&
      versionsQuery.isSuccess,
  );
  const { markAsRead } = useAdminReadState('submissions', {
    adminId: currentUser?.id,
  });

  useEffect(() => {
    if (
      detail?.submissionId &&
      search.sectionId &&
      isRequestedSectionAccessible
    ) {
      markAsRead(search.sectionId, detail.submissionId);
    }
  }, [
    detail?.submissionId,
    isRequestedSectionAccessible,
    markAsRead,
    search.sectionId,
  ]);

  const milestoneLabel = getMilestoneLabel(search.milestoneId);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <Heading level={1}>제출물 &gt; {milestoneLabel}</Heading>
        <Link
          className={styles.backLink}
          search={search}
          to={ROUTES.ADMIN_SUBMISSIONS}
        >
          ← {milestoneLabel} 목록으로
        </Link>
      </div>

      {!isRequestedSectionAccessible ? (
        <EmptyState
          description='담당 분반의 제출물만 조회할 수 있습니다.'
          title='접근할 수 없는 제출물입니다.'
        />
      ) : !isVersionDetailAvailable ? (
        <EmptyState
          description='이 마일스톤은 전용 화면의 조회 API가 확인된 뒤 연결합니다.'
          title='버전 상세를 제공하지 않는 마일스톤입니다.'
        />
      ) : submissionQuery.isPending ? (
        <Text aria-live='polite' role='status'>
          제출물 상세를 불러오는 중입니다.
        </Text>
      ) : submissionQuery.isError || !detail ? (
        <EmptyState
          description='제출물이 존재하는지 확인한 뒤 다시 시도해 주세요.'
          title='제출물 상세를 불러오지 못했습니다.'
        />
      ) : (
        <>
          <Card className={styles.document}>
            <div className={styles.documentHeader}>
              <Text className={styles.documentLabel}>
                SUBMISSION / READ ONLY
              </Text>
              <Heading level={2}>{detail.teamName} 제출물</Heading>
              <Text className={styles.metadata}>
                상태: {detail.statusLabel} · 현재 버전: {detail.currentVersion}
                차
              </Text>
            </div>

            <section className={styles.section}>
              <Heading level={3}>제출 현황</Heading>
              <div className={styles.fieldGrid}>
                <div className={styles.field}>
                  <Text className={styles.fieldLabel}>팀</Text>
                  <Text className={styles.fieldValue}>{detail.teamName}</Text>
                </div>
                <div className={styles.field}>
                  <Text className={styles.fieldLabel}>제출 상태</Text>
                  <Text className={styles.fieldValue}>
                    {detail.statusLabel}
                  </Text>
                </div>
                {detail.presentationOrder !== null ? (
                  <div className={styles.field}>
                    <Text className={styles.fieldLabel}>발표 순서</Text>
                    <Text className={styles.fieldValue}>
                      {detail.presentationOrder}번
                    </Text>
                  </div>
                ) : null}
                <div className={styles.field}>
                  <Text className={styles.fieldLabel}>검토 상태</Text>
                  <Text className={styles.fieldValue}>
                    {detail.hasPendingReview
                      ? '검토 대기 중'
                      : '검토 대기 없음'}
                  </Text>
                </div>
                {detail.completedAt ? (
                  <div className={styles.field}>
                    <Text className={styles.fieldLabel}>완료 일시</Text>
                    <Text className={styles.fieldValue}>
                      {detail.completedAt}
                    </Text>
                  </div>
                ) : null}
                {detail.completedBy ? (
                  <div className={styles.field}>
                    <Text className={styles.fieldLabel}>완료 처리자</Text>
                    <Text className={styles.fieldValue}>
                      {detail.completedBy}
                    </Text>
                  </div>
                ) : null}
              </div>
            </section>

            <section className={styles.section}>
              <Heading level={3}>제출 버전</Heading>
              {versionsQuery.isPending ? (
                <Text aria-live='polite' role='status'>
                  제출 버전 목록을 불러오는 중입니다.
                </Text>
              ) : versionsQuery.isError ? (
                <EmptyState
                  description='잠시 후 다시 시도해 주세요.'
                  title='제출 버전 목록을 불러오지 못했습니다.'
                />
              ) : versions.length === 0 ? (
                <EmptyState
                  description='서버에서 반환한 제출 버전이 없습니다.'
                  title='표시할 제출 버전이 없습니다.'
                />
              ) : (
                <div className={styles.fieldGrid}>
                  {versions.map(version => (
                    <button
                      aria-pressed={selectedVersion === version.version}
                      className={styles.evaluatorButton}
                      key={version.version}
                      onClick={() => setSelectedVersion(version.version)}
                      type='button'
                    >
                      {version.version}차 · {version.submittedBy} ·{' '}
                      {version.submittedAt}
                      {version.isLate ? ' · 지각 제출' : ''}
                    </button>
                  ))}
                </div>
              )}
            </section>

            {selectedVersion === undefined ? null : versionQuery.isPending ? (
              <Text aria-live='polite' role='status'>
                선택한 버전을 불러오는 중입니다.
              </Text>
            ) : versionQuery.isError || !versionQuery.data ? (
              <EmptyState
                description='잠시 후 다시 시도해 주세요.'
                title='선택한 제출 버전을 불러오지 못했습니다.'
              />
            ) : (
              <section className={styles.section}>
                <Heading level={3}>
                  {versionQuery.data.version}차 제출 내용
                </Heading>
                <div className={styles.fieldGrid}>
                  <div className={`${styles.field} ${styles.fullWidthField}`}>
                    <Text className={styles.fieldLabel}>설명</Text>
                    <Text className={styles.fieldValue}>
                      {versionQuery.data.description ?? '-'}
                    </Text>
                  </div>
                  <div className={`${styles.field} ${styles.fullWidthField}`}>
                    <Text className={styles.fieldLabel}>변경 메모</Text>
                    <Text className={styles.fieldValue}>
                      {versionQuery.data.changeNote ?? '-'}
                    </Text>
                  </div>
                  <div className={styles.field}>
                    <Text className={styles.fieldLabel}>제출자</Text>
                    <Text className={styles.fieldValue}>
                      {versionQuery.data.submittedBy}
                    </Text>
                  </div>
                  <div className={styles.field}>
                    <Text className={styles.fieldLabel}>제출 일시</Text>
                    <Text className={styles.fieldValue}>
                      {versionQuery.data.submittedAt}
                    </Text>
                  </div>
                </div>

                <div className={styles.field}>
                  <Text className={styles.fieldLabel}>아티팩트</Text>
                  {versionQuery.data.artifacts.length === 0 ? (
                    <Text className={styles.fieldValue}>
                      등록된 아티팩트가 없습니다.
                    </Text>
                  ) : (
                    versionQuery.data.artifacts.map((artifact, index) => (
                      <div
                        className={styles.attachment}
                        key={`${artifact.type}-${index}`}
                      >
                        <Text className={styles.fieldLabel}>
                          {artifact.label}
                        </Text>
                        <ArtifactValue artifact={artifact} />
                      </div>
                    ))
                  )}
                </div>
              </section>
            )}
          </Card>
          <section className={styles.relatedMeetings}>
            <section className={styles.section}>
              <Heading level={3}>
                연결된 회의록
                {relatedMeetingsQuery.data
                  ? ` (${relatedMeetingsQuery.data.pageable.totalElements}건)`
                  : ''}
              </Heading>
              {relatedMeetingsQuery.isPending ? (
                <Text aria-live='polite' role='status'>
                  연결된 회의록을 불러오는 중입니다.
                </Text>
              ) : relatedMeetingsQuery.isError ? (
                <EmptyState
                  description='잠시 후 다시 시도해 주세요.'
                  title='연결된 회의록을 불러오지 못했습니다.'
                />
              ) : relatedMeetings.length === 0 ? (
                <Text className={styles.sectionDescription}>
                  이 마일스톤에 연결된 회의록이 없습니다.
                </Text>
              ) : (
                <AdminLinkedMeetingsTable
                  records={relatedMeetings.map(meeting => ({
                    authorName: meeting.authorId,
                    id: meeting.id,
                    meetingAt: meeting.meetingAt,
                    participantCount: meeting.participantCount,
                    title: meeting.title,
                  }))}
                />
              )}
              {relatedMeetingsPageable &&
              relatedMeetingsPageable.totalPages > 1 ? (
                <HStack gap={2} justify='end'>
                  <Button
                    isDisabled={relatedMeetingsPageable.page === 0}
                    label='이전 페이지'
                    onClick={() =>
                      setRelatedMeetingsPage(page => Math.max(page - 1, 0))
                    }
                    type='button'
                    variant='secondary'
                  />
                  <Text aria-live='polite'>
                    {relatedMeetingsPageable.page + 1} /{' '}
                    {relatedMeetingsPageable.totalPages}
                  </Text>
                  <Button
                    isDisabled={relatedMeetingsPageable.isEnd}
                    label='다음 페이지'
                    onClick={() => setRelatedMeetingsPage(page => page + 1)}
                    type='button'
                    variant='secondary'
                  />
                </HStack>
              ) : null}
            </section>
          </section>
        </>
      )}
    </div>
  );
}
