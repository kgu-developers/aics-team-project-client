import { Button } from '@aics/design-system';

import * as styles from './PdfPreview.css';

export function PdfPreview({
  onReload,
  title,
  url,
}: {
  onReload?: () => void;
  title: string;
  url: string;
}) {
  return (
    <section aria-label={`${title} 미리보기`} className={styles.root}>
      {/* presigned 주소는 15분 뒤 만료되고 브라우저 내장 뷰어는 실패를 알려주지 않는다. */}
      <object
        className={styles.embed}
        data={url}
        key={url}
        title={`${title} 미리보기`}
        type='application/pdf'
      >
        <p className={styles.message}>
          미리보기를 표시할 수 없어요. 파일을 내려받아 확인해 주세요.
        </p>
      </object>
      {onReload ? (
        <div className={styles.controls}>
          <Button
            label='미리보기 새로 고침'
            onClick={onReload}
            size='sm'
            variant='secondary'
          />
        </div>
      ) : null}
    </section>
  );
}
