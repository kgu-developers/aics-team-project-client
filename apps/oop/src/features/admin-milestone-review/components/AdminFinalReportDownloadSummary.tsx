import { Text } from '@aics/design-system';

import * as styles from './AdminFinalReportDownloadSummary.css';

export type AdminFinalReportDownloadFile = {
  downloadUrl: string | null;
  fileName: string | null;
  label: string;
  onClick?: () => void;
};

type AdminFinalReportDownloadSummaryProps = {
  files: AdminFinalReportDownloadFile[];
};

type AdminSubmissionFileDownloadLinkProps = {
  downloadUrl: string;
  fileName: string;
  onClick?: () => void;
};

export function AdminSubmissionFileDownloadLink({
  downloadUrl,
  fileName,
  onClick,
}: AdminSubmissionFileDownloadLinkProps) {
  return (
    <a
      className={styles.link}
      download={fileName}
      href={downloadUrl}
      onClick={onClick}
    >
      {fileName}
    </a>
  );
}

type AdminSubmissionExternalLinkProps = {
  url: string;
  onClick?: () => void;
};

export function AdminSubmissionExternalLink({
  url,
  onClick,
}: AdminSubmissionExternalLinkProps) {
  return (
    <a
      className={styles.link}
      href={url}
      onClick={onClick}
      rel='noreferrer'
      target='_blank'
    >
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
            onClick={file.onClick}
          />
        ) : (
          '-'
        )}
      </Text>
    </div>
  ));
}
