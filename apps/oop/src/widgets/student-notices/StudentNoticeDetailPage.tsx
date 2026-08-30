import type { SectionAnnouncementAttachment } from '@aics/core';
import {
  BreadcrumbItem,
  Breadcrumbs,
  Card,
  Heading,
  Text,
} from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { forwardRef, useEffect, type ComponentPropsWithoutRef } from 'react';

import { useAuthStore } from '~/features/auth/authStore';
import { useSectionAnnouncementsQuery } from '~/features/student-notices/queries';
import { useStudentNoticeReadState } from '~/features/student-notices/useStudentNoticeReadState';

import * as styles from './StudentNoticePages.css';

type NoticeBreadcrumbLinkProps = ComponentPropsWithoutRef<'a'> & {
  href: string;
};

/**
 * BreadcrumbItem follows the design-system link contract (`href`), while
 * TanStack Router follows its own `to` contract. Keep the breadcrumb in the
 * SPA navigation path by translating that one boundary prop here.
 */
const NoticeBreadcrumbLink = forwardRef<
  HTMLAnchorElement,
  NoticeBreadcrumbLinkProps
>(function NoticeBreadcrumbLink({ href, ...props }, ref) {
  return (
    <Link
      ref={ref}
      activeOptions={{ exact: true }}
      to={href as '/student/notices'}
      {...props}
    />
  );
});

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) return `${sizeBytes} B`;
  if (sizeBytes < 1024 * 1024) return `${Math.round(sizeBytes / 1024)} KB`;
  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageAttachment(attachment: SectionAnnouncementAttachment) {
  return attachment.contentType.startsWith('image/');
}

export default function StudentNoticeDetailPage({
  noticeId,
}: {
  noticeId: string;
}) {
  const currentUser = useAuthStore(state => state.currentUser);
  const userId = currentUser?.id ?? '';
  const sectionId = currentUser?.sections[0]?.id ?? '';
  const sectionName = currentUser?.sections[0]?.name ?? '';
  const {
    data: announcements,
    isPending,
    error,
  } = useSectionAnnouncementsQuery(sectionId);
  const announcement = announcements?.find(item => item.id === noticeId);
  const { markAsRead } = useStudentNoticeReadState(userId, sectionId);

  useEffect(() => {
    if (announcement) markAsRead(announcement.id);
  }, [announcement, markAsRead]);

  if (!sectionId) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항을 찾을 수 없어요.</Heading>
        <Link className={styles.backLink} to='/student/notices'>
          ← 공지사항 목록으로
        </Link>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <Text color='secondary'>공지사항을 불러오는 중...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <Text role='alert'>공지사항을 불러오지 못했어요.</Text>
        <Link className={styles.backLink} to='/student/notices'>
          ← 공지사항 목록으로
        </Link>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항을 찾을 수 없어요.</Heading>
        <Link className={styles.backLink} to='/student/notices'>
          ← 공지사항 목록으로
        </Link>
      </div>
    );
  }

  const imageAttachments =
    announcement.attachments?.filter(isImageAttachment) ?? [];

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div className={styles.breadcrumb}>
          <Breadcrumbs label='공지사항 경로'>
            <BreadcrumbItem as={NoticeBreadcrumbLink} href='/student/notices'>
              공지사항
            </BreadcrumbItem>
            <BreadcrumbItem isCurrent>{announcement.title}</BreadcrumbItem>
          </Breadcrumbs>
        </div>
        <Link
          aria-label='공지사항 목록으로 돌아가기'
          className={styles.backLink}
          to='/student/notices'
        >
          목록으로
        </Link>
      </div>
      <Card className={styles.detailCard}>
        <Heading level={1}>{announcement.title}</Heading>
        <Text className={styles.meta} color='secondary'>
          작성일 : {announcement.createdAt}
        </Text>
        <Text>분반 : {sectionName}</Text>
        <div className={styles.divider} />
        {announcement.content.split('\n').map((line, i) => (
          <Text key={`${announcement.id}-line-${i}`}>{line}</Text>
        ))}
        {imageAttachments.length ? (
          <section
            aria-label='첨부 이미지 미리보기'
            className={styles.imagePreviewList}
          >
            {imageAttachments.map(attachment => (
              <figure className={styles.imagePreview} key={attachment.id}>
                <img
                  alt={`${attachment.fileName} 미리보기`}
                  className={styles.previewImage}
                  loading='lazy'
                  src={attachment.url}
                />
                <figcaption className={styles.imageCaption}>
                  {attachment.fileName}
                </figcaption>
              </figure>
            ))}
          </section>
        ) : null}
        {announcement.attachments?.length ? (
          <section
            aria-labelledby='student-notice-attachments'
            className={styles.attachments}
          >
            <Heading level={3} id='student-notice-attachments'>
              첨부파일
            </Heading>
            <ul className={styles.attachmentList}>
              {announcement.attachments.map(attachment => (
                <li className={styles.attachmentItem} key={attachment.id}>
                  <div className={styles.attachmentInfo}>
                    <Text weight='medium'>{attachment.fileName}</Text>
                    <Text color='secondary' type='supporting'>
                      {formatFileSize(attachment.sizeBytes)}
                    </Text>
                  </div>
                  <div className={styles.attachmentActions}>
                    <a
                      className={styles.downloadLink}
                      download={attachment.fileName}
                      href={attachment.url}
                    >
                      다운로드
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </Card>
    </div>
  );
}
