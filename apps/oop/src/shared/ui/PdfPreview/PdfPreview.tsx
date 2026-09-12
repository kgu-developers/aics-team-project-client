import { Button } from '@aics/design-system';
import { useRef, useState } from 'react';

import * as styles from './PdfPreview.css';

export function PdfPreview({
  fileKey,
  onReload,
  title,
  url,
}: {
  fileKey: string;
  onReload?: () => void;
  title: string;
  url: string;
}) {
  // 주기적인 목록 재조회로 presigned 서명만 바뀐다. 그때마다 다시 embed하면
  // 읽던 쪽이 처음으로 돌아가므로, 파일이 바뀌거나 사용자가 요청할 때만 교체한다.
  const [activeUrl, setActiveUrl] = useState(url);
  const lastFileKey = useRef(fileKey);
  const hasRequestedReload = useRef(false);

  if (lastFileKey.current !== fileKey) {
    lastFileKey.current = fileKey;
    hasRequestedReload.current = false;
    setActiveUrl(url);
  } else if (hasRequestedReload.current && url !== activeUrl) {
    hasRequestedReload.current = false;
    setActiveUrl(url);
  }

  return (
    <section aria-label={`${title} 미리보기`} className={styles.root}>
      <object
        className={styles.embed}
        data={activeUrl}
        key={activeUrl}
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
            onClick={() => {
              hasRequestedReload.current = true;
              onReload();
            }}
            size='sm'
            variant='secondary'
          />
        </div>
      ) : null}
    </section>
  );
}
