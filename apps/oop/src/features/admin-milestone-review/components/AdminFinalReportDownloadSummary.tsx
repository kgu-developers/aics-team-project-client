import { Text } from '@aics/design-system';

import * as styles from './AdminFinalReportDownloadSummary.css';

export type AdminFinalReportDownloadFile = {
  downloadUrl: string | null;
  fileName: string | null;
  label: string;
};

type AdminFinalReportDownloadSummaryProps = {
  files: AdminFinalReportDownloadFile[];
};

type AdminSubmissionFileDownloadLinkProps = {
  downloadUrl: string;
  fileName: string;
};

export function AdminSubmissionFileDownloadLink({
  downloadUrl,
  fileName,
}: AdminSubmissionFileDownloadLinkProps) {
  return (
    <a className={styles.link} download={fileName} href={downloadUrl}>
      {fileName}
    </a>
  );
}

type AdminSubmissionExternalLinkProps = {
  url: string;
};

export function AdminSubmissionExternalLink({
  url,
}: AdminSubmissionExternalLinkProps) {
  return (
    <a className={styles.link} href={url} rel='noreferrer' target='_blank'>
      {url}
    </a>
  );
}

export function AdminFinalReportDownloadSummary({
  files,
}: AdminFinalReportDownloadSummaryProps) {
  return files.map(file => (
    <div className={styles.row} key={file.label}>
      <Text>
        {file.label}:{' '}
        {file.downloadUrl && file.fileName ? (
          <AdminSubmissionFileDownloadLink
            downloadUrl={file.downloadUrl}
            fileName={file.fileName}
          />
        ) : (
          '-'
        )}
      </Text>
    </div>
  ));
}
