import type {
  StudentHomeSubmissionMaterial,
  StudentHomeSubmissionMetadata,
} from '@aics/core';
import {
  Button,
  MetadataList,
  MetadataListItem,
  Text,
} from '@aics/design-system';

import * as styles from './SubmissionMaterials.css';

type SubmissionMaterialsProps = {
  materials: StudentHomeSubmissionMaterial[];
  metadata?: StudentHomeSubmissionMetadata;
  showMetadataTitle?: boolean;
};

function formatSubmittedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function SubmissionMaterials({
  materials,
  metadata,
  showMetadataTitle = true,
}: SubmissionMaterialsProps) {
  return (
    <div className={styles.root}>
      <ul aria-label='제출 자료 목록' className={styles.list}>
        {materials.map(material => {
          const actionLabel = material.kind === 'FILE' ? '다운로드' : '열기';
          const emptyMessage =
            material.kind === 'LINK'
              ? 'URL을 입력해 주세요.'
              : `${material.extension} 파일을 제출해 주세요.`;

          return (
            <li className={styles.item} key={material.id}>
              <span aria-hidden='true' className={styles.extension}>
                {material.extension}
              </span>
              <span className={styles.content}>
                <span className={styles.label}>{material.label}</span>
                {material.value ? (
                  <span className={styles.value} title={material.value}>
                    {material.value}
                  </span>
                ) : (
                  <span className={styles.emptyValue}>{emptyMessage}</span>
                )}
              </span>
              {material.value ? (
                <Button
                  as={material.href ? 'a' : undefined}
                  className={styles.action}
                  href={material.href}
                  isDisabled={!material.href}
                  label={actionLabel}
                  rel={material.href ? 'noreferrer' : undefined}
                  size='sm'
                  target={material.href ? '_blank' : undefined}
                  tooltip={
                    material.href
                      ? undefined
                      : '파일 저장소 연동 후 다운로드할 수 있어요.'
                  }
                  variant='secondary'
                />
              ) : null}
            </li>
          );
        })}
      </ul>
      {metadata ? (
        <MetadataList
          className={styles.metadata}
          columns='single'
          title={
            showMetadataTitle ? (
              <Text weight='semibold'>제출 정보</Text>
            ) : undefined
          }
        >
          <MetadataListItem label='제출자'>
            {metadata.submittedBy}
          </MetadataListItem>
          <MetadataListItem label='제출 일시'>
            {formatSubmittedAt(metadata.submittedAt)}
          </MetadataListItem>
          <MetadataListItem label='변경 일시'>
            {formatSubmittedAt(metadata.updatedAt)}
          </MetadataListItem>
        </MetadataList>
      ) : null}
    </div>
  );
}
