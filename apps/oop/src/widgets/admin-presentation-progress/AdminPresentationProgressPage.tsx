import type {
  MilestonePresentation,
  ProposalScreenItem,
  StudentSubmissionArtifact,
} from '@aics/core';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Heading,
  HStack,
  Text,
  VStack,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { PdfPreview } from '~/shared/ui/PdfPreview';

import { useAdminMilestonePresentationsQuery } from '~/features/admin-milestone-review/queries';
import { useAuthStore } from '~/features/auth/authStore';
import {
  safeDisplayUrl,
  safeSubmissionUrl,
} from '~/features/submission/submissionUploadInput';

import * as styles from './AdminPresentationProgressPage.css';

type AdminPresentationProgressPageProps = {
  milestoneId?: string;
  sectionId?: string;
};

type DisplayScreen = ProposalScreenItem & { imageUrl: string };

function comparePresentations(
  left: MilestonePresentation,
  right: MilestonePresentation,
) {
  const leftOrder = left.presentationOrder ?? Number.POSITIVE_INFINITY;
  const rightOrder = right.presentationOrder ?? Number.POSITIVE_INFINITY;
  if (leftOrder !== rightOrder) return leftOrder - rightOrder;
  return (left.teamName ?? '').localeCompare(right.teamName ?? '', 'ko');
}

function getDisplayScreens(team: MilestonePresentation): DisplayScreen[] {
  const configuredScreens = team.project?.screenConfiguration;
  if (!Array.isArray(configuredScreens)) return [];

  return configuredScreens.flatMap(screen => {
    const imageUrl = safeDisplayUrl(screen.imageUrl);
    return imageUrl ? [{ ...screen, imageUrl }] : [];
  });
}

function findPdfArtifact(team: MilestonePresentation) {
  for (const artifact of team.artifacts) {
    if (artifact.type !== 'FILE') continue;
    const fileName = artifact.fileName ?? '';
    if (artifact.mimeType !== 'application/pdf' && !/\.pdf$/i.test(fileName))
      continue;
    const url = safeSubmissionUrl(artifact.downloadUrl);
    if (url)
      return {
        fileKey: String(
          artifact.fileId ?? artifact.requiredArtifactId ?? fileName,
        ),
        title: fileName || '발표 자료',
        url,
      };
  }
  return null;
}

function artifactLabel(artifact: StudentSubmissionArtifact, index: number) {
  return artifact.fileName ?? artifact.url ?? `제출 자료 ${index + 1}`;
}

function artifactUrl(artifact: StudentSubmissionArtifact) {
  return safeSubmissionUrl(
    artifact.type === 'FILE' ? artifact.downloadUrl : artifact.url,
  );
}

function artifactTypeLabel(artifact: StudentSubmissionArtifact) {
  switch (artifact.type) {
    case 'FILE':
      return '파일';
    case 'LINK':
      return '링크';
    case 'TEXT':
      return '텍스트';
    case 'CHEERPJ_RUN':
      return '실행 자료';
  }
}

export default function AdminPresentationProgressPage({
  milestoneId,
  sectionId,
}: AdminPresentationProgressPageProps) {
  const currentUser = useAuthStore(state => state.currentUser);
  const isProfessor = currentUser?.globalRole === 'PROFESSOR';
  const presentationsQuery = useAdminMilestonePresentationsQuery(
    milestoneId,
    isProfessor,
  );
  const presentations = useMemo(
    () => [...(presentationsQuery.data ?? [])].sort(comparePresentations),
    [presentationsQuery.data],
  );
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  useEffect(() => {
    if (!presentations.length) {
      setSelectedTeamId(null);
      return;
    }
    if (!presentations.some(team => team.teamId === selectedTeamId)) {
      setSelectedTeamId(presentations[0]!.teamId);
    }
  }, [presentations, selectedTeamId]);

  const selectedIndex = Math.max(
    0,
    presentations.findIndex(team => team.teamId === selectedTeamId),
  );
  const selectedTeam = presentations[selectedIndex];

  if (!milestoneId) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={<BackToPresentationList sectionId={sectionId} />}
          description='발표 평가 목록에서 진행할 발표 마일스톤을 선택해 주세요.'
          title='발표 마일스톤을 확인할 수 없습니다.'
        />
      </main>
    );
  }

  if (!isProfessor) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={<BackToPresentationList sectionId={sectionId} />}
          description='발표 자료와 진행 화면은 해당 분반 담당 교수만 확인할 수 있습니다.'
          title='담당 교수 전용 화면입니다.'
        />
      </main>
    );
  }

  if (presentationsQuery.isPending) {
    return (
      <main className={styles.page}>
        <Text aria-live='polite' role='status'>
          발표 자료를 불러오는 중입니다.
        </Text>
      </main>
    );
  }

  if (presentationsQuery.isError) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={
            <Button
              label='다시 시도'
              onClick={() => void presentationsQuery.refetch()}
              variant='secondary'
            />
          }
          description='담당 분반과 로그인 권한을 확인한 뒤 다시 시도해 주세요.'
          title='발표 자료를 불러오지 못했습니다.'
        />
      </main>
    );
  }

  if (!selectedTeam) {
    return (
      <main className={styles.page}>
        <EmptyState
          actions={<BackToPresentationList sectionId={sectionId} />}
          description='발표 순서와 발표 자료 제출 여부를 확인해 주세요.'
          title='표시할 발표 팀이 없습니다.'
        />
      </main>
    );
  }

  const project = selectedTeam.project;
  const teamLabel = selectedTeam.teamName ?? `${selectedTeam.teamId}팀`;
  const screens = getDisplayScreens(selectedTeam);
  const members = project?.teamOperation?.members ?? [];
  const pdf = findPdfArtifact(selectedTeam);
  const isFirst = selectedIndex === 0;
  const isLast = selectedIndex === presentations.length - 1;

  return (
    <main className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <Heading level={1}>발표 자료 보기·평가</Heading>
          <Text color='secondary' type='supporting'>
            발표 순서에 따라 팀의 제안서와 제출 자료를 확인합니다.
          </Text>
        </div>
        <BackToPresentationList sectionId={sectionId} />
      </div>

      <div className={styles.progressRow}>
        <HStack align='center' gap={2}>
          <Badge
            label={
              selectedTeam.presentationOrder
                ? `${selectedTeam.presentationOrder}번째 발표`
                : '발표 순서 미지정'
            }
            variant={selectedTeam.presentationOrder ? 'success' : 'neutral'}
          />
          <Text weight='medium'>
            {teamLabel} · {project?.title ?? '제안서 미작성'}
          </Text>
        </HStack>
        <HStack gap={2}>
          <Button
            isDisabled={isFirst}
            label='이전 팀'
            onClick={() =>
              setSelectedTeamId(presentations[selectedIndex - 1]!.teamId)
            }
            type='button'
            variant='secondary'
          />
          <Button
            isDisabled={isLast}
            label='다음 팀'
            onClick={() =>
              setSelectedTeamId(presentations[selectedIndex + 1]!.teamId)
            }
            type='button'
          />
        </HStack>
      </div>

      <div className={styles.contentGrid}>
        <VStack gap={4}>
          <section className={styles.section}>
            <Heading level={2}>프로젝트 소개</Heading>
            <Card padding={4}>
              {project ? (
                <VStack gap={3}>
                  <div>
                    <Text weight='medium'>
                      {project.title ?? '프로젝트 제목 없음'}
                    </Text>
                    <Text>
                      {project.description ?? '프로젝트 설명이 없습니다.'}
                    </Text>
                  </div>
                  {project.goal && project.goal !== project.description ? (
                    <div>
                      <Text weight='medium'>프로젝트 목표</Text>
                      <Text>{project.goal}</Text>
                    </div>
                  ) : null}
                  {project.projectSchedule ? (
                    <div>
                      <Text weight='medium'>프로젝트 일정</Text>
                      <Text>{project.projectSchedule}</Text>
                    </div>
                  ) : null}
                  {safeSubmissionUrl(project.repositoryUrl) ? (
                    <a
                      className={styles.link}
                      href={safeSubmissionUrl(project.repositoryUrl)}
                      rel='noreferrer'
                      target='_blank'
                    >
                      프로젝트 저장소 열기
                    </a>
                  ) : null}
                </VStack>
              ) : (
                <Text color='secondary' role='status'>
                  제안서를 작성하지 않아 프로젝트 소개를 표시할 수 없습니다.
                </Text>
              )}
            </Card>
          </section>

          <section className={styles.section}>
            <Heading level={2}>화면 구성</Heading>
            {screens.length ? (
              <div className={styles.imageGrid}>
                {screens.map((screen, index) => (
                  <Card
                    key={`${screen.imageFileId ?? index}:${screen.title ?? ''}`}
                    padding={3}
                  >
                    <figure className={styles.screenCard}>
                      <img
                        alt={screen.title || `화면 ${index + 1}`}
                        className={styles.screenImage}
                        src={screen.imageUrl}
                      />
                      <figcaption className={styles.screenCaption}>
                        <Text weight='medium'>
                          {screen.title || `화면 ${index + 1}`}
                        </Text>
                        {screen.description ? (
                          <Text color='secondary' type='supporting'>
                            {screen.description}
                          </Text>
                        ) : null}
                      </figcaption>
                    </figure>
                  </Card>
                ))}
              </div>
            ) : (
              <Card padding={4}>
                <Text color='secondary' role='status'>
                  제안서에 등록된 화면 이미지가 없습니다.
                </Text>
              </Card>
            )}
          </section>
        </VStack>

        <VStack gap={4}>
          <section className={styles.section}>
            <Heading level={2}>팀원 역할</Heading>
            <Card padding={4}>
              {members.length ? (
                <ul className={styles.list}>
                  {members.map(member => (
                    <li className={styles.item} key={member.id}>
                      <Text weight='medium'>
                        {member.name ?? member.studentNumber}
                        {member.isLeader ? ' · 팀장' : ''}
                      </Text>
                      <Text color='secondary' type='supporting'>
                        {member.projectRole ?? '역할 미입력'}
                      </Text>
                    </li>
                  ))}
                </ul>
              ) : (
                <Text color='secondary' role='status'>
                  팀원 역할 정보가 없습니다.
                </Text>
              )}
            </Card>
          </section>

          <section className={styles.section}>
            <Heading level={2}>발표 자료</Heading>
            <Card padding={4}>
              {selectedTeam.artifacts.length ? (
                <ul className={styles.list}>
                  {selectedTeam.artifacts.map((artifact, index) => {
                    const label = artifactLabel(artifact, index);
                    const url = artifactUrl(artifact);
                    return (
                      <li
                        className={styles.item}
                        key={`${artifact.requiredArtifactId ?? index}:${label}`}
                      >
                        {url ? (
                          <a
                            className={styles.link}
                            href={url}
                            rel='noreferrer'
                            target='_blank'
                          >
                            {label}
                          </a>
                        ) : (
                          <Text weight='medium'>{label}</Text>
                        )}
                        <Text color='secondary' type='supporting'>
                          {artifactTypeLabel(artifact)}
                        </Text>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <Text color='secondary' role='status'>
                  제출된 발표 자료가 없습니다.
                </Text>
              )}
            </Card>
            {pdf ? (
              <PdfPreview
                fileKey={pdf.fileKey}
                onReload={() => void presentationsQuery.refetch()}
                title={pdf.title}
                url={pdf.url}
              />
            ) : null}
          </section>
        </VStack>
      </div>
    </main>
  );
}

function BackToPresentationList({ sectionId }: { sectionId?: string }) {
  return (
    <Link
      className={styles.backLink}
      search={{
        milestoneId: 'presentation-evaluate',
        sectionId,
      }}
      to={ROUTES.ADMIN_SUBMISSIONS}
    >
      ← 발표 평가 목록으로
    </Link>
  );
}
