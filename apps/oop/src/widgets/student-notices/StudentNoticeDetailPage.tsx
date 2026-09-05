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
import { useMySectionsQuery } from '~/features/section/queries';
import SectionSelection from '~/features/section/SectionSelection';
import { useSelectedSection } from '~/features/section/useSelectedSection';
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
  const {
    data: sections,
    isPending: isSectionsPending,
    error: sectionsError,
  } = useMySectionsQuery({ status: 'ACTIVE' });
  const { section, selectSection } = useSelectedSection(sections);
  const {
    data: announcements,
    isPending: isAnnouncementsPending,
    error: announcementsError,
  } = useSectionAnnouncementsQuery(section?.id);
  const announcement = announcements?.find(
    item => String(item.id) === noticeId,
  );
  const { markAsRead } = useStudentNoticeReadState(
    userId,
    section ? String(section.id) : '',
  );

  useEffect(() => {
    if (announcement) markAsRead(String(announcement.id));
  }, [announcement, markAsRead]);

  if (isSectionsPending || (section && isAnnouncementsPending)) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <SectionSelection
          sections={sections}
          selectedId={section?.id}
          onSelect={selectSection}
        />
        <Text color='secondary'>공지사항을 불러오는 중...</Text>
      </div>
    );
  }

  if (sectionsError || announcementsError) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항</Heading>
        <SectionSelection
          sections={sections}
          selectedId={section?.id}
          onSelect={selectSection}
        />
        <Text role='alert'>공지사항을 불러오지 못했어요.</Text>
        <Link className={styles.backLink} to='/student/notices'>
          ← 공지사항 목록으로
        </Link>
      </div>
    );
  }

  if (!section || !announcement) {
    return (
      <div className={styles.page}>
        <Heading level={1}>
          {!section && sections?.length
            ? '수강 분반을 선택해 주세요.'
            : '공지사항을 찾을 수 없어요.'}
        </Heading>
        <SectionSelection
          sections={sections}
          selectedId={section?.id}
          onSelect={selectSection}
        />
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
          게시일 : {announcement.publishedAt}
        </Text>
        <Text>분반 : {section.name}</Text>
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
