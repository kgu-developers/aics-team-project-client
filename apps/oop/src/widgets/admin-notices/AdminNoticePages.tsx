import {
  Button,
  Card,
  EmptyState,
  Heading,
  Selector,
  SelectorOption,
  Text,
  TextArea,
  TextInput,
} from '@aics/design-system';
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { useEffect, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';

import {
  useAdminNoticeQuery,
  useAdminAllNoticesQuery,
  useAdminNoticesQuery,
  useSubmitSectionAnnouncementMutation,
  useUpdateSectionAnnouncementMutation,
} from '~/features/admin-notices/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminNoticePages.css';

const formatter = new Intl.DateTimeFormat('sv-SE', {
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: '2-digit',
  timeZone: 'Asia/Seoul',
  year: 'numeric',
});
const requestDate = () => formatter.format(new Date()).replace(' ', 'T');

function formatNoticePublishedDate(value: string) {
  return value.replace('T', ' ').slice(0, 10);
}

function BackToList() {
  return (
    <Link className={styles.backLink} to={ROUTES.ADMIN_NOTICES}>
      ← 공지사항 목록으로
    </Link>
  );
}

const allSectionsValue = 'all';

function SectionSelector({
  includeAll = false,
  selectedId,
  onChange,
}: {
  includeAll?: boolean;
  selectedId: string | undefined;
  onChange: (id: string) => void;
}) {
  const sections = useAuthStore(state => state.currentUser?.sections ?? []);
  if (!sections.length)
    return (
      <Text role='alert'>
        접근 가능한 분반이 없어 공지사항을 관리할 수 없습니다.
      </Text>
    );
  return (
    <Selector
      label='분반'
      onChange={onChange}
      options={[
        ...(includeAll
          ? [{ label: '전체 분반', value: allSectionsValue }]
          : []),
        ...sections.map(section => ({
          label: section.code,
          value: section.id,
        })),
      ]}
      renderOption={option => (
        <SelectorOption label={option.label ?? option.value} />
      )}
      value={selectedId ?? (includeAll ? allSectionsValue : '')}
      width={320}
    />
  );
}

function NoticeForm({
  content,
  onContentChange,
  onSubmit,
  onTitleChange,
  submitError,
  submitLabel,
  submitting,
  title,
}: {
  content: string;
  onContentChange: (value: string) => void;
  onSubmit: () => void;
  onTitleChange: (value: string) => void;
  submitError: boolean;
  submitLabel: string;
  submitting: boolean;
  title: string;
}) {
  return (
    <>
      <div className={styles.fields}>
        <TextInput
          label='제목'
          onChange={onTitleChange}
          placeholder='제목을 입력해 주세요.'
          value={title}
          width='100%'
        />
        <TextArea
          label='내용'
          onChange={onContentChange}
          placeholder='공지 내용을 입력해 주세요.'
          rows={9}
          value={content}
          width='100%'
        />
      </div>
      <div className={styles.actions}>
        <Button
          isDisabled={!title.trim() || !content.trim()}
          isLoading={submitting}
          label={submitLabel}
          onClick={onSubmit}
          variant='primary'
        />
      </div>
      {submitError ? (
        <Text role='alert'>저장에 실패했습니다. 다시 시도해 주세요.</Text>
      ) : null}
    </>
  );
}

export function AdminNoticeListPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/admin/notices/' }) as {
    sectionId?: string;
  };
  const sections = useAuthStore(state => state.currentUser?.sections ?? []);
  const accessibleSectionIds = sections.map(section => section.id);
  const selectedSectionId =
    search.sectionId && accessibleSectionIds.includes(search.sectionId)
      ? search.sectionId
      : allSectionsValue;
  const sectionQuery = useAdminNoticesQuery(
    selectedSectionId === allSectionsValue ? undefined : selectedSectionId,
  );
  const allSectionsQuery = useAdminAllNoticesQuery(
    selectedSectionId === allSectionsValue ? accessibleSectionIds : [],
  );
  const query =
    selectedSectionId === allSectionsValue ? allSectionsQuery : sectionQuery;
  const notices = query.data ?? [];

  function selectSection(sectionId: string) {
    void navigate({
      search: sectionId === allSectionsValue ? {} : { sectionId },
      to: ROUTES.ADMIN_NOTICES,
    });
  }
  return (
    <div className={styles.page}>
      <Heading level={1}>공지사항</Heading>
      <div className={styles.listControls}>
        <SectionSelector
          includeAll
          onChange={selectSection}
          selectedId={selectedSectionId}
        />
        <Button
          label='작성하기'
          onClick={() => navigate({ to: ROUTES.ADMIN_NOTICE_NEW })}
          variant='primary'
        />
      </div>
      {query.isPending ? <Text>공지사항을 불러오는 중입니다.</Text> : null}
      {query.isError ? (
        <Text role='alert'>공지사항을 불러오지 못했습니다.</Text>
      ) : null}
      <Card className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope='col'>작성일</th>
              <th scope='col'>분반</th>
              <th scope='col'>제목</th>
            </tr>
          </thead>
          <tbody>
            {notices.length ? (
              notices.map(notice => (
                <tr key={notice.id}>
                  <td>{formatNoticePublishedDate(notice.publishedAt)}</td>
                  <td>
                    {sections.find(
                      section =>
                        String(section.id) === String(notice.sectionId),
                    )?.code ?? '알 수 없는 분반'}
                  </td>
                  <td>
                    <Link
                      className={styles.titleLink}
                      params={{ noticeId: String(notice.id) }}
                      search={{ sectionId: String(notice.sectionId) }}
                      to='/admin/notices/$noticeId'
                    >
                      {notice.title}
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.emptyCell} colSpan={3}>
                  {selectedSectionId === allSectionsValue
                    ? '등록된 공지사항이 없어요.'
                    : '선택한 분반에 등록된 공지사항이 없어요.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function AdminNoticeDetailPage() {
  const navigate = useNavigate();
  const { noticeId } = useParams({ from: '/admin/notices/$noticeId/' });
  const search = useSearch({ from: '/admin/notices/$noticeId/' }) as {
    sectionId?: string;
  };
  const sections = useAuthStore(state => state.currentUser?.sections ?? []);
  const sectionIds = sections.map(section => section.id);
  const sectionId =
    search.sectionId && sectionIds.includes(search.sectionId)
      ? search.sectionId
      : sectionIds[0];
  const query = useAdminNoticeQuery(sectionId, noticeId);
  const notice = query.data;
  if (query.isPending)
    return <div className={styles.page}>공지사항을 불러오는 중입니다.</div>;
  if (query.isError)
    return (
      <div className={styles.page}>
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='공지사항을 불러오지 못했습니다.'
        />
      </div>
    );
  if (!notice)
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항을 찾을 수 없어요.</Heading>
        <BackToList />
      </div>
    );
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>공지사항 &gt; {notice.title}</Heading>
        <BackToList />
      </div>
      <Card className={styles.detailCard}>
        <Heading level={2}>{notice.title}</Heading>
        <Text className={styles.meta} color='secondary'>
          게시일시 : {formatSeoulDateTime(notice.publishedAt)}
        </Text>
        <div className={styles.divider} />
        <Text>{notice.content}</Text>
        <div className={styles.actions}>
          <Button
            label='수정'
            onClick={() =>
              navigate({
                to: '/admin/notices/$noticeId/edit',
                params: { noticeId: String(notice.id) },
                search: { sectionId: String(notice.sectionId) },
              })
            }
            variant='primary'
          />
        </div>
      </Card>
    </div>
  );
}

export function AdminNoticeEditPage() {
  const navigate = useNavigate();
  const { noticeId } = useParams({ from: '/admin/notices/$noticeId/edit' });
  const search = useSearch({ from: '/admin/notices/$noticeId/edit' }) as {
    sectionId?: string;
  };
  const sections = useAuthStore(state => state.currentUser?.sections ?? []);
  const sectionIds = sections.map(section => section.id);
  const sectionId =
    search.sectionId && sectionIds.includes(search.sectionId)
      ? search.sectionId
      : sectionIds[0];
  const query = useAdminNoticeQuery(sectionId, noticeId);
  const mutation = useUpdateSectionAnnouncementMutation();
  const notice = query.data;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
    }
  }, [notice]);
  if (query.isPending)
    return <div className={styles.page}>공지사항을 불러오는 중입니다.</div>;
  if (query.isError)
    return (
      <div className={styles.page}>
        <EmptyState
          description='잠시 후 다시 시도해 주세요.'
          title='공지사항을 불러오지 못했습니다.'
        />
      </div>
    );
  if (!notice)
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항을 찾을 수 없어요.</Heading>
        <BackToList />
      </div>
    );
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>{notice.title} 공지 수정</Heading>
        <BackToList />
      </div>
      <Card className={styles.formCard}>
        <Heading level={2}>공지사항 수정</Heading>
        <Text className={styles.meta} color='secondary'>
          게시일시 : {formatSeoulDateTime(notice.publishedAt)}
        </Text>
        <NoticeForm
          content={content}
          onContentChange={setContent}
          onSubmit={() =>
            mutation.mutate(
              {
                announcementId: notice.id,
                content: content.trim(),
                title: title.trim(),
              },
              {
                onSuccess: updated =>
                  navigate({
                    to: '/admin/notices/$noticeId',
                    params: { noticeId: String(updated.id) },
                    search: { sectionId: String(notice.sectionId) },
                  }),
              },
            )
          }
          onTitleChange={setTitle}
          submitError={mutation.isError}
          submitLabel='저장'
          submitting={mutation.isPending}
          title={title}
        />
      </Card>
    </div>
  );
}

export function AdminNoticeNewPage() {
  const navigate = useNavigate();
  const sections = useAuthStore(state => state.currentUser?.sections ?? []);
  const [sectionId, setSectionId] = useState<string | undefined>(
    () => sections[0]?.id,
  );
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const mutation = useSubmitSectionAnnouncementMutation();
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>공지사항 작성</Heading>
        <BackToList />
      </div>
      <Card className={styles.formCard}>
        <Heading level={2}>공지사항 작성</Heading>
        <Text className={styles.meta} color='secondary'>
          게시일시 : {formatter.format(new Date())}
        </Text>
        <SectionSelector onChange={setSectionId} selectedId={sectionId} />
        <NoticeForm
          content={content}
          onContentChange={setContent}
          onSubmit={() => {
            if (sectionId)
              mutation.mutate(
                {
                  sectionId,
                  content: content.trim(),
                  publishedAt: requestDate(),
                  title: title.trim(),
                },
                {
                  onSuccess: () => navigate({ to: ROUTES.ADMIN_NOTICES }),
                },
              );
          }}
          onTitleChange={setTitle}
          submitError={mutation.isError}
          submitLabel='등록'
          submitting={mutation.isPending}
          title={title}
        />
      </Card>
    </div>
  );
}
