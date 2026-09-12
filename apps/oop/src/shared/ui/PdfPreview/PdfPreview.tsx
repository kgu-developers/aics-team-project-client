import { Button } from '@aics/design-system';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import * as styles from './PdfPreview.css';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const zoomSteps = [1, 1.25, 1.5, 2];

export function PdfPreview({ title, url }: { title: string; url: string }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(0);
  // presigned S3 주소는 버킷 CORS가 없으면 pdf.js fetch가 막힌다.
  // 그때는 fetch를 쓰지 않는 브라우저 내장 뷰어로 내려간다.
  const [isEmbedFallback, setIsEmbedFallback] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const update = () => setViewportWidth(viewport.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  // 파일이 바뀌면 렌더 중에 초기화한다. effect로 미루면 자식의 onLoadSuccess를 덮어쓴다.
  const lastUrl = useRef(url);
  if (lastUrl.current !== url) {
    lastUrl.current = url;
    setPageNumber(1);
    setTotalPages(0);
    setZoomIndex(0);
    setIsEmbedFallback(false);
  }

  const zoom = zoomSteps[zoomIndex] ?? 1;

  if (isEmbedFallback)
    return (
      <section aria-label={`${title} 미리보기`} className={styles.root}>
        <object
          className={styles.embed}
          data={url}
          title={`${title} 미리보기`}
          type='application/pdf'
        >
          <p className={styles.message}>
            미리보기를 불러오지 못했어요. 파일을 내려받아 확인해 주세요.
          </p>
        </object>
      </section>
    );

  return (
    <section aria-label={`${title} 미리보기`} className={styles.root}>
      <div className={styles.viewport} ref={viewportRef}>
        <Document
          error={
            <p className={styles.message}>
              미리보기를 불러오지 못했어요. 파일을 내려받아 확인해 주세요.
            </p>
          }
          file={url}
          loading={
            <p className={styles.message}>미리보기를 불러오는 중이에요.</p>
          }
          onLoadError={() => setIsEmbedFallback(true)}
          onLoadSuccess={({ numPages }) => setTotalPages(numPages)}
          onSourceError={() => setIsEmbedFallback(true)}
        >
          <Page
            className={styles.page}
            pageNumber={pageNumber}
            renderAnnotationLayer={false}
            renderTextLayer={false}
            width={viewportWidth ? viewportWidth * zoom : undefined}
          />
        </Document>
      </div>
      {totalPages > 0 ? (
        <div className={styles.controls}>
          <Button
            isDisabled={pageNumber <= 1}
            label='이전 쪽'
            size='sm'
            onClick={() => setPageNumber(current => Math.max(1, current - 1))}
            variant='secondary'
          />
          <p className={styles.status} role='status'>
            {`${pageNumber} / ${totalPages}`}
          </p>
          <Button
            isDisabled={pageNumber >= totalPages}
            label='다음 쪽'
            size='sm'
            onClick={() =>
              setPageNumber(current => Math.min(totalPages, current + 1))
            }
            variant='secondary'
          />
          <div className={styles.zoom}>
            <Button
              isDisabled={zoomIndex <= 0}
              label='축소'
              size='sm'
              onClick={() => setZoomIndex(current => Math.max(0, current - 1))}
              variant='ghost'
            />
            <Button
              isDisabled={zoomIndex >= zoomSteps.length - 1}
              label='확대'
              size='sm'
              onClick={() =>
                setZoomIndex(current =>
                  Math.min(zoomSteps.length - 1, current + 1),
                )
              }
              variant='ghost'
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
