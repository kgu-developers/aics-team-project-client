import type { RequiredArtifactType } from '@aics/api-client';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FileInput,
  Heading,
  Selector,
  SelectorOption,
  Text,
  TextArea,
  TextInput,
} from '@aics/design-system';
import { useState } from 'react';

import { cx } from '~/shared/lib/cx';

import type { MilestoneTemplateId } from '../model';
import * as styles from './AdminStudentMilestonePreview.css';

type ArtifactPreview = {
  allowedExtensions?: string[];
  label?: string;
  maxFileSizeMb?: number | null;
  required?: boolean;
  type?: RequiredArtifactType;
};

type PreviewField = { label: string; multiline?: boolean };
type DocumentPreviewBlock = {
  fields: readonly PreviewField[];
  key: string;
  kind?: 'team-info';
  title: string;
};

const documentBlocks: Partial<
  Record<MilestoneTemplateId, readonly DocumentPreviewBlock[]>
> = {
  midterm: [
    {
      fields: [
        { label: '프로젝트 제목' },
        { label: '주제 설명', multiline: true },
      ],
      key: 'topic',
      title: '1. 주제',
    },
    {
      fields: [{ label: '화면 GUI 목록', multiline: true }],
      key: 'gui-design',
      title: '2. 화면 GUI 설계',
    },
    {
      fields: [
        { label: '구현된 기능 목록', multiline: true },
        { label: '클래스 구조와 주요 기능 설명', multiline: true },
        { label: '입력·출력 테스트 케이스', multiline: true },
      ],
      key: 'engine-design',
      title: '3. 엔진부 설계',
    },
    {
      fields: [
        { label: '완료된 내용', multiline: true },
        { label: '진행 중인 내용', multiline: true },
        { label: '미구현 내용', multiline: true },
        { label: '문제점 또는 지원 필요', multiline: true },
      ],
      key: 'project-plan',
      title: '4. 팀프로젝트 진행 계획',
    },
  ],
  proposal: [
    {
      fields: [],
      key: 'team-info',
      kind: 'team-info',
      title: '1. 팀 정보',
    },
    {
      fields: [
        { label: '프로젝트 제목' },
        { label: '프로젝트 설명', multiline: true },
        { label: '프로젝트 목표', multiline: true },
      ],
      key: 'topic',
      title: '2. 주제',
    },
    {
      fields: [
        { label: '데이터 이름' },
        { label: '데이터 설명', multiline: true },
        { label: '예상 개수' },
      ],
      key: 'data-composition',
      title: '3. 데이터 구성',
    },
    {
      fields: [
        { label: '화면 이름' },
        { label: '화면 설명', multiline: true },
        { label: '화면 이미지' },
      ],
      key: 'screen-composition',
      title: '4. 화면 구성',
    },
    {
      fields: [
        { label: '팀 규칙', multiline: true },
        { label: '회의 시간·빈도·방식', multiline: true },
        { label: '진행 일정', multiline: true },
        { label: '역할 분담', multiline: true },
      ],
      key: 'team-operations',
      title: '5. 팀 운영 방식',
    },
  ],
};

function fileAccept(artifact: ArtifactPreview) {
  return artifact.allowedExtensions?.length
    ? artifact.allowedExtensions
        .map(extension => `.${extension.replace(/^\./, '')}`)
        .join(',')
    : undefined;
}

function artifactConstraint(artifact: ArtifactPreview) {
  if (artifact.type !== 'FILE') return null;

  const extensions = artifact.allowedExtensions?.length
    ? artifact.allowedExtensions
        .map(extension => extension.replace(/^\./, '').toUpperCase())
        .join('/')
    : '형식 제한 없음';
  const size = artifact.maxFileSizeMb
    ? `최대 ${artifact.maxFileSizeMb}MB`
    : '용량 제한 없음';

  return `${extensions} · ${size}`;
}

function SubmissionFormPreview({
  artifacts,
  artifactState,
  onRetryArtifacts,
  templateId,
}: {
  artifacts: readonly ArtifactPreview[];
  artifactState?: 'error' | 'loading';
  onRetryArtifacts?: () => void;
  templateId: 'presentation-submit' | 'final-report';
}) {
  const submissionTitle =
    templateId === 'presentation-submit' ? '발표 자료 제출' : '최종 파일 제출';

  return (
    <section
      aria-labelledby='student-submission-preview'
      className={styles.root}
    >
      <div className={styles.heading}>
        <div>
          <Heading id='student-submission-preview' level={2}>
            학생 화면 미리보기
          </Heading>
          <Text
            className={styles.description}
            color='secondary'
            type='supporting'
          >
            현재 마일스톤 설정을 기준으로 한 학생 제출 모달의 읽기 전용
            예시입니다.
          </Text>
        </div>
        <Badge label='읽기 전용' variant='neutral' />
      </div>
      <section
        aria-label={`${submissionTitle} 학생 제출 모달 미리보기`}
        className={styles.submissionModalPreview}
      >
        <Card className={styles.artifactPreview} padding={3}>
          <div className={styles.artifactHeader}>
            <div>
              <Heading level={3}>{submissionTitle}</Heading>
              <Text color='secondary' type='supporting'>
                실제 학생 제출 데이터는 표시하지 않습니다.
              </Text>
            </div>
          </div>
          {artifactState === 'loading' ? (
            <Text aria-live='polite' role='status'>
              학생 제출 화면 설정을 불러오는 중입니다.
            </Text>
          ) : artifactState === 'error' ? (
            <EmptyState
              actions={
                onRetryArtifacts ? (
                  <Button label='다시 시도' onClick={onRetryArtifacts} />
                ) : undefined
              }
              description='산출물 설정을 다시 확인해 주세요.'
              title='학생 제출 화면 설정을 불러오지 못했습니다.'
            />
          ) : artifacts.length === 0 ? (
            <Text role='status'>
              등록된 제출 항목이 없어요. 담당 교수자에게 확인해 주세요.
            </Text>
          ) : (
            <div className={styles.submissionPreviewForm}>
              <TextInput
                isDisabled
                isRequired
                label='제출 설명'
                onChange={() => undefined}
                value=''
                width='100%'
              />
              <Text color='secondary' type='supporting'>
                기본 필수 항목 · 산출물 목록과 별도로 항상 제출합니다.
              </Text>
              {artifacts.map((artifact, index) => {
                const label = artifact.label ?? '이름 없는 산출물';
                const key = `${label}-${index}`;

                if (artifact.type === 'FILE') {
                  return (
                    <div className={styles.previewArtifactField} key={key}>
                      <FileInput
                        accept={fileAccept(artifact)}
                        isDisabled
                        isRequired={artifact.required}
                        label={label}
                        maxSize={
                          artifact.maxFileSizeMb == null
                            ? undefined
                            : artifact.maxFileSizeMb * 1024 * 1024
                        }
                        mode='input'
                        onChange={() => undefined}
                        value={null}
                        width='100%'
                      />
                      <Text color='secondary' type='supporting'>
                        {artifactConstraint(artifact)}
                      </Text>
                    </div>
                  );
                }

                return (
                  <TextInput
                    isDisabled
                    isRequired={artifact.required}
                    key={key}
                    label={label}
                    onChange={() => undefined}
                    placeholder={
                      artifact.type === 'TEXT'
                        ? '텍스트 내용 입력'
                        : 'https://example.com'
                    }
                    value=''
                    width='100%'
                  />
                );
              })}
              <Button
                isDisabled
                label='파일 제출'
                type='button'
                variant='primary'
              />
            </div>
          )}
        </Card>
      </section>
    </section>
  );
}

function DocumentPreview({
  blocks,
  templateId,
}: {
  blocks: readonly DocumentPreviewBlock[];
  templateId: 'midterm' | 'proposal';
}) {
  const [selectedBlockKey, setSelectedBlockKey] = useState(blocks[0]!.key);
  const selectedBlock =
    blocks.find(block => block.key === selectedBlockKey) ?? blocks[0]!;
  const title = templateId === 'proposal' ? '제안서' : '중간보고서';

  return (
    <Card className={styles.documentPreview} padding={0}>
      <nav aria-label={`${title} 작성 영역`} className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <Text color='secondary' type='supporting'>
            학생 작성 화면
          </Text>
          <Heading level={3}>{title}</Heading>
        </div>
        <div className={styles.mobileSelector}>
          <Selector
            label={`${title} 작성 영역 선택`}
            onChange={setSelectedBlockKey}
            options={blocks.map(block => ({
              label: block.title,
              value: block.key,
            }))}
            renderOption={option => (
              <SelectorOption label={option.label ?? option.value} />
            )}
            value={selectedBlock.key}
            width='100%'
          />
        </div>
        <div className={styles.desktopSections}>
          {blocks.map(block => (
            <Button
              aria-current={
                selectedBlock.key === block.key ? 'page' : undefined
              }
              className={cx(
                styles.sectionButton,
                selectedBlock.key === block.key
                  ? styles.activeSectionButton
                  : '',
              )}
              key={block.key}
              label={block.title}
              onClick={() => setSelectedBlockKey(block.key)}
              variant='secondary'
            />
          ))}
        </div>
      </nav>

      <section
        aria-labelledby='student-preview-document-title'
        className={styles.document}
      >
        <header className={styles.documentHeader}>
          <div>
            <Heading id='student-preview-document-title' level={2}>
              {selectedBlock.title}
            </Heading>
            <Text color='secondary' type='supporting'>
              학생이 이 영역에서 작성하는 입력 형식입니다.
            </Text>
          </div>
          <Badge label='읽기 전용 예시' variant='neutral' />
        </header>
        <div className={styles.readOnlyNotice}>
          실제 학생 데이터나 저장·작성 완료 상태는 표시하지 않습니다.
        </div>

        {selectedBlock.kind === 'team-info' ? (
          <dl className={styles.teamInfo}>
            <div className={styles.teamInfoRow}>
              <dt className={styles.teamInfoLabel}>팀명</dt>
              <dd className={styles.teamInfoValue}>학생 팀 정보</dd>
            </div>
            <div className={styles.teamInfoRow}>
              <dt className={styles.teamInfoLabel}>팀장</dt>
              <dd className={styles.teamInfoValue}>팀장 이름</dd>
            </div>
            <div className={styles.teamInfoRow}>
              <dt className={styles.teamInfoLabel}>팀원</dt>
              <dd className={styles.teamInfoValue}>팀원 목록과 역할 분담</dd>
            </div>
          </dl>
        ) : (
          <div className={styles.fieldList}>
            {selectedBlock.fields.map(field =>
              field.multiline ? (
                <TextArea
                  isDisabled
                  key={field.label}
                  label={field.label}
                  onChange={() => undefined}
                  placeholder='학생이 입력하는 영역'
                  rows={3}
                  value=''
                />
              ) : (
                <TextInput
                  isDisabled
                  key={field.label}
                  label={field.label}
                  onChange={() => undefined}
                  placeholder='학생이 입력하는 영역'
                  value=''
                />
              ),
            )}
          </div>
        )}
        <div className={styles.documentActions}>
          <Button isDisabled label='저장' />
          <Button isDisabled label='작성 완료' variant='secondary' />
        </div>
      </section>
    </Card>
  );
}

export default function AdminStudentMilestonePreview({
  artifacts,
  artifactState,
  onRetryArtifacts,
  templateId,
}: {
  artifacts: readonly ArtifactPreview[];
  artifactState?: 'error' | 'loading';
  onRetryArtifacts?: () => void;
  templateId: MilestoneTemplateId;
}) {
  const blocks = documentBlocks[templateId];

  if (!blocks) {
    return (
      <SubmissionFormPreview
        artifacts={artifacts}
        artifactState={artifactState}
        onRetryArtifacts={onRetryArtifacts}
        templateId={templateId as 'presentation-submit' | 'final-report'}
      />
    );
  }

  return (
    <section aria-labelledby='student-screen-preview' className={styles.root}>
      <div className={styles.heading}>
        <div>
          <Heading id='student-screen-preview' level={2}>
            학생 화면 미리보기
          </Heading>
          <Text
            className={styles.description}
            color='secondary'
            type='supporting'
          >
            실제 학생 데이터가 아닌, 현재 마일스톤 설정을 기준으로 한 읽기 전용
            예시입니다.
          </Text>
        </div>
        <Badge label='읽기 전용' variant='neutral' />
      </div>

      <DocumentPreview
        blocks={blocks}
        templateId={templateId as 'midterm' | 'proposal'}
      />
    </section>
  );
}
