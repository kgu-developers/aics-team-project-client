import { Button } from '@aics/design-system';
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';

import * as styles from './PdfPreview.css';

function PdfCanvas({
  title,
  url,
  originalUrl,
}: {
  title: string;
  url: string;
  originalUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [pageNumber, setPageNumber] = useState(1);
  const [status, setStatus] = useState<'pending' | 'ready' | 'error'>(
    'pending',
  );

  useEffect(() => {
    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    void (async () => {
      try {
        const [{ GlobalWorkerOptions, getDocument }, worker] =
          await Promise.all([
            import('pdfjs-dist'),
            import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
          ]);
        if (disposed) return;
        GlobalWorkerOptions.workerSrc = worker.default;
        loadingTask = getDocument({ url, withCredentials: false });
        const document = await loadingTask.promise;
        if (!disposed) setPdf(document);
      } catch {
        if (!disposed) setStatus('error');
      }
    })();
    return () => {
      disposed = true;
      void loadingTask?.destroy().catch(() => {});
    };
  }, [url]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!pdf || !canvas || !container) return;
    let disposed = false;
    let renderTask: RenderTask | undefined;
    void (async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        if (disposed) return;
        const size = page.getViewport({ scale: 1 });
        const width = Math.max(1, container.clientWidth);
        // Cap the backing store for high-DPI phones and unusually large pages.
        const scale = Math.min(
          (width / size.width) * Math.min(window.devicePixelRatio || 1, 2),
          2048 / Math.max(size.width, size.height),
        );
        const viewport = page.getViewport({ scale });
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        renderTask = page.render({ canvas, viewport });
        await renderTask.promise;
        if (!disposed) setStatus('ready');
      } catch {
        if (!disposed) setStatus('error');
      }
    })();
    return () => {
      disposed = true;
      renderTask?.cancel();
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [pageNumber, pdf]);

  const moveBy = (delta: number) => {
    setStatus('pending');
    setPageNumber(page => page + delta);
  };

  return (
    <div className={styles.mobileCanvas} ref={containerRef}>
      {status === 'pending' ? (
        <p className={styles.message} role='status'>
          PDF를 불러오는 중...
        </p>
      ) : null}
      {status === 'error' ? (
        <div className={styles.message}>
          <div role='alert'>PDF 미리보기를 열지 못했어요.</div>
          <a href={originalUrl} rel='noreferrer' target='_blank'>
            PDF 원본 열기
          </a>
        </div>
      ) : null}
      <canvas
        aria-label={`${title} ${pageNumber}쪽`}
        className={styles.canvas}
        hidden={status !== 'ready'}
        ref={canvasRef}
        role='img'
      />
      {pdf ? (
        <>
          <p aria-live='polite' className={styles.pageStatus}>
            {pageNumber} / {pdf.numPages}쪽
          </p>
          <div className={styles.pagination}>
            <Button
              isDisabled={pageNumber <= 1}
              label='이전 쪽'
              onClick={() => moveBy(-1)}
              size='sm'
              variant='secondary'
            />
            <Button
              isDisabled={pageNumber >= pdf.numPages}
              label='다음 쪽'
              onClick={() => moveBy(1)}
              size='sm'
              variant='secondary'
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

export function PdfPreview({
  fileKey,
  mobileCanvas = false,
  onReload,
  title,
  url,
}: {
  fileKey: string;
  mobileCanvas?: boolean;
  onReload?: () => void;
  title: string;
  url: string;
}) {
  // 주기적인 목록 재조회에서 서명만 바뀌면 읽던 페이지를 유지한다.
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
      {mobileCanvas ? (
        <PdfCanvas
          key={`${fileKey}:${activeUrl}`}
          originalUrl={url}
          title={title}
          url={activeUrl}
        />
      ) : (
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
      )}
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
