import { Text } from '@aics/design-system';

import * as styles from './AdminFinalReportDownloadSummary.css';

export type AdminFinalReportDownloadFile = {
  downloadUrl: string | null;
  downloadLabel?: string;
  fileName: string | null;
  label: string;
};

type AdminFinalReportDownloadSummaryProps = {
  files: AdminFinalReportDownloadFile[];
};

export function AdminFinalReportDownloadSummary({
  files,
}: AdminFinalReportDownloadSummaryProps) {
  return files.map(file => (
    <div className={styles.row} key={file.label}>
      <Text>
        {file.label}: {file.fileName ?? '-'}
      </Text>
      {file.downloadUrl && file.fileName ? (
        <a
          className={styles.link}
          download={file.fileName}
          href={file.downloadUrl}
        >
          {file.downloadLabel ?? '다운로드'}
        </a>
      ) : null}
    </div>
  ));
}
