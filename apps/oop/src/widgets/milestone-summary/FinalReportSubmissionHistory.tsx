import type { StudentSubmissionVersionResponse } from '@aics/core';
import { Button, Text, VStack } from '@aics/design-system';

import { safeSubmissionUrl } from '~/features/submission/submissionUploadInput';

import * as styles from './FinalReportSubmissionHistory.css';

export default function FinalReportSubmissionHistory({
  versions,
  onRefresh,
}: {
  versions: StudentSubmissionVersionResponse[];
  onRefresh: () => Promise<void>;
}) {
  return (
    <details className={styles.root}>
      <summary className={styles.summary}>
        제출 이력 ({versions.length})
      </summary>
      <VStack gap={3} className={styles.content}>
        {[...versions]
          .sort((a, b) => b.version - a.version)
          .map(version => (
            <VStack gap={1} key={version.id}>
              <Text weight='medium'>
                v{version.version} · {version.submittedBy.name} ·{' '}
                {version.submittedAt}
              </Text>
              {version.description ? <Text>{version.description}</Text> : null}
              {version.changeNote ? (
                <Text color='secondary'>{version.changeNote}</Text>
              ) : null}
              {version.artifacts.map((artifact, index) => {
                const url = safeSubmissionUrl(
                  artifact.type === 'FILE'
                    ? artifact.downloadUrl
                    : artifact.url,
                );
                const label =
                  artifact.fileName ?? artifact.content ?? artifact.type;
                return url ? (
                  <a
                    key={index}
                    href={url}
                    target='_blank'
                    rel='noopener noreferrer'
                    referrerPolicy='no-referrer'
                  >
                    {label}
                  </a>
                ) : (
                  <Text key={index}>{label}</Text>
                );
              })}
            </VStack>
          ))}
        <Button
          label='이력 새로고침'
          variant='secondary'
          size='sm'
          clickAction={onRefresh}
        />
      </VStack>
    </details>
  );
}
