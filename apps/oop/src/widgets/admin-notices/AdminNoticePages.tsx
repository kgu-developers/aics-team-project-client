import type { RichTextJson, SectionAnnouncementResponse } from '@aics/core';
import {
  Button,
  Card,
  EmptyState,
  Heading,
  MultiSelector,
  Selector,
  SelectorOption,
  Text,
  TextInput,
} from '@aics/design-system';
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
} from '@tanstack/react-router';
import { type KeyboardEvent, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import { formatSeoulDateTime } from '~/shared/lib/formatSeoulDateTime';
import { paginate } from '~/shared/lib/pagination';
import {
  emptyRichText,
  isRichTextEmpty,
  parseRichTextContent,
  serializeRichTextContent,
} from '~/shared/lib/richTextContent';
import ListPagination from '~/shared/ui/ListPagination/ListPagination';
import RichTextEditor from '~/shared/ui/RichTextEditor';
import RichTextViewer from '~/shared/ui/RichTextViewer';

import {
  canPublishNotice,
  noticeId,
  noticeSection,
} from '~/features/admin-notices/noticeScope';
import {
  useAdminNoticeQuery,
  useAdminAllNoticesQuery,
  useAdminNoticesQuery,
  useSubmitSectionAnnouncementsMutation,
  useUpdateSectionAnnouncementMutation,
} from '~/features/admin-notices/queries';
import { useAuthStore } from '~/features/auth/authStore';

import * as styles from './AdminNoticePages.css';

function useNoticeScope() {
  const { sectionId } = useSearch({ from: '/admin/notices' });
  const user = useAuthStore(state => state.currentUser);
  return { sectionId, user, section: noticeSection(user, sectionId) };
}

function handleRowNavigation(
  event: KeyboardEvent<HTMLTableRowElement>,
  open: () => void,
) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  open();
}

function BackToList() {
  const { sectionId } = useNoticeScope();
  return (
    <Link
      className={styles.backLink}
      to={ROUTES.ADMIN_NOTICES}
      search={{ sectionId }}
    >
      ← 공지사항 목록으로
    </Link>
  );
}

function SectionSelect({
  includeAll = false,
  value,
  onChange,
  isDisabled = false,
}: {
  includeAll?: boolean;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  isDisabled?: boolean;
}) {
  const user = useAuthStore(state => state.currentUser);
  return (
    <Selector
      label='분반'
      placeholder='분반을 선택해 주세요.'
      options={[
        ...(includeAll ? [{ label: '전체 분반', value: 'all' }] : []),
        ...(user?.sections ?? [])
          .filter(section => noticeId(section.id) !== undefined)
          .map(section => ({ label: section.code, value: section.id })),
      ]}
      renderOption={option => (
        <SelectorOption label={option.label ?? option.value} />
      )}
      value={value === undefined ? (includeAll ? 'all' : '') : String(value)}
      onChange={value => onChange(noticeId(value))}
      isDisabled={isDisabled}
      width={320}
    />
  );
}

export function AdminNoticeListPage() {
  const navigate = useNavigate();
  const { sectionId, section, user } = useNoticeScope();
  const selectedSectionId = section ? sectionId : undefined;
  const sectionQuery = useAdminNoticesQuery(selectedSectionId);
  const allSectionsQuery = useAdminAllNoticesQuery(
    selectedSectionId === undefined
      ? (user?.sections.map(section => section.id) ?? [])
      : [],
  );
  const query =
    selectedSectionId === undefined ? allSectionsQuery : sectionQuery;
  const [page, setPage] = useState(0);
  const paged = paginate(query.data ?? [], page);
  const notices = paged.items;
  const hasSections = user?.sections.some(
    section => noticeId(section.id) !== undefined,
  );
  return (
    <div className={styles.page}>
      <Heading level={1}>공지사항</Heading>
      <div className={styles.listControls}>
        <SectionSelect
          includeAll
          value={selectedSectionId}
          onChange={sectionId => {
            setPage(0);
            void navigate({ to: ROUTES.ADMIN_NOTICES, search: { sectionId } });
          }}
        />
        <Button
          label='작성하기'
          variant='primary'
          onClick={() =>
            void navigate({
              to: ROUTES.ADMIN_NOTICE_NEW,
              search: { sectionId: selectedSectionId },
            })
          }
        />
      </div>
      {!hasSections ? (
        <Text role='alert'>
          접근 가능한 분반이 없어 공지사항을 관리할 수 없습니다.
        </Text>
      ) : null}
      {query.isPending ? (
        <Text role='status'>공지사항을 불러오는 중입니다.</Text>
      ) : null}
      {query.isError ? (
        <Text role='alert'>
          {notices.length
            ? '일부 분반의 공지사항을 불러오지 못했습니다.'
            : '공지사항을 불러오지 못했습니다.'}
        </Text>
      ) : null}
      <Card className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope='col'>게시일</th>
              <th scope='col'>분반</th>
              <th scope='col'>제목</th>
            </tr>
          </thead>
          <tbody>
            {notices.length ? (
              notices.map(notice => (
                <tr
                  aria-label={`${notice.title} 공지사항 보기`}
                  className={styles.clickableRow}
                  key={notice.id}
                  onClick={() =>
                    void navigate({
                      params: { noticeId: String(notice.id) },
                      search: { sectionId: notice.sectionId },
                      to: '/admin/notices/$noticeId',
                    })
                  }
                  onKeyDown={event =>
                    handleRowNavigation(
                      event,
                      () =>
                        void navigate({
                          params: { noticeId: String(notice.id) },
                          search: { sectionId: notice.sectionId },
                          to: '/admin/notices/$noticeId',
                        }),
                    )
                  }
                  tabIndex={0}
                >
                  <td>
                    {formatSeoulDateTime(notice.publishedAt).slice(0, 10)}
                  </td>
                  <td>
                    {user?.sections.find(
                      section => noticeId(section.id) === notice.sectionId,
                    )?.code ?? '알 수 없는 분반'}
                  </td>
                  <td>{notice.title}</td>
                </tr>
              ))
            ) : !query.isPending && !query.isError && hasSections ? (
              <tr>
                <td className={styles.emptyCell} colSpan={3}>
                  {selectedSectionId === undefined
                    ? '등록된 공지사항이 없어요.'
                    : '선택한 분반에 등록된 공지사항이 없어요.'}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </Card>
      <ListPagination
        label='공지사항 페이지 이동'
        onPageChange={setPage}
        page={paged.page}
        pageCount={paged.pageCount}
      />
    </div>
  );
}

function NoticeReadState({
  query,
}: {
  query: ReturnType<typeof useAdminNoticeQuery>;
}) {
  const { section } = useNoticeScope();
  return (
    <div className={styles.page}>
      {!section ? (
        <Heading level={1}>담당 분반을 선택해 주세요.</Heading>
      ) : !query.hasValidId ? (
        <Heading level={1}>공지사항을 찾을 수 없어요.</Heading>
      ) : query.isLoading ? (
        <Text role='status'>공지사항을 불러오는 중입니다.</Text>
      ) : query.isError ? (
        <EmptyState
          title='공지사항을 불러오지 못했습니다.'
          description='접근 권한을 확인하거나 잠시 후 다시 시도해 주세요.'
        />
      ) : (
        <Heading level={1}>공지사항을 찾을 수 없어요.</Heading>
      )}
      <BackToList />
    </div>
  );
}

export function AdminNoticeDetailPage() {
  const navigate = useNavigate();
  const { noticeId: routeId } = useParams({
    from: '/admin/notices/$noticeId/',
  });
  const { sectionId, section, user } = useNoticeScope();
  const query = useAdminNoticeQuery(sectionId, routeId);
  const notice = query.data;
  if (!section || !notice || query.isError)
    return <NoticeReadState query={query} />;
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
        <Text>공개 범위 : {section.code}</Text>
        <div className={styles.divider} />
        <section aria-label='공지 내용'>
          <RichTextViewer content={parseRichTextContent(notice.content)} />
        </section>
        <div className={styles.actions}>
          <Button
            label='수정'
            isDisabled={!canPublishNotice(user, section)}
            onClick={() =>
              void navigate({
                to: ROUTES.ADMIN_NOTICE_EDIT,
                params: { noticeId: String(notice.id) },
                search: { sectionId },
              })
            }
          />
        </div>
      </Card>
    </div>
  );
}

function NoticeFields({
  title,
  content,
  setTitle,
  setContent,
  pending,
}: {
  title: string;
  content: RichTextJson;
  setTitle: (value: string) => void;
  setContent: (value: RichTextJson) => void;
  pending: boolean;
}) {
  return (
    <>
      <TextInput
        label='제목'
        value={title}
        onChange={setTitle}
        description='최대 192자'
        placeholder='제목을 입력해 주세요.'
        isDisabled={pending}
        width='100%'
      />
      <RichTextEditor
        content={content}
        isDisabled={pending}
        label='내용'
        onChange={setContent}
      />
    </>
  );
}

function validText(title: string, content: RichTextJson) {
  return (
    title.trim().length > 0 &&
    title.trim().length <= 192 &&
    !isRichTextEmpty(content)
  );
}

function EditNoticeForm({ notice }: { notice: SectionAnnouncementResponse }) {
  const navigate = useNavigate();
  const { user, section, sectionId } = useNoticeScope();
  const [title, setTitle] = useState(notice.title);
  const [content, setContent] = useState(() =>
    parseRichTextContent(notice.content),
  );
  const mutation = useUpdateSectionAnnouncementMutation();
  const serializedContent = serializeRichTextContent(content);
  const input = {
    ...(title.trim() !== notice.title ? { title: title.trim() } : {}),
    ...(serializedContent !== serializeRichTextContent(parseRichTextContent(notice.content))
      ? { content: serializedContent }
      : {}),
  };
  const canSave =
    canPublishNotice(user, section) &&
    validText(title, content) &&
    Object.keys(input).length > 0;
  const back = () =>
    void navigate({
      to: '/admin/notices/$noticeId',
      params: { noticeId: String(notice.id) },
      search: { sectionId },
    });
  return (
    <Card className={styles.formCard}>
      <Heading level={2}>공지사항 수정</Heading>
      <Text className={styles.meta} color='secondary'>
        게시일시 : {formatSeoulDateTime(notice.publishedAt)}
      </Text>
      <Text>공개 범위 : {section?.code}</Text>
      <div className={styles.fields}>
        <NoticeFields
          title={title}
          content={content}
          setTitle={setTitle}
          setContent={setContent}
          pending={mutation.isPending}
        />
      </div>
      {mutation.isError ? (
        <Text role='alert'>
          저장하지 못했습니다. 입력 내용을 유지했으니 권한과 저장 상태를 확인해
          주세요.
        </Text>
      ) : null}
      <div className={styles.actions}>
        <Button
          label='취소'
          variant='secondary'
          isDisabled={mutation.isPending}
          onClick={back}
        />
        <Button
          label='저장'
          isDisabled={!canSave || mutation.isPending}
          isLoading={mutation.isPending}
          onClick={() =>
            mutation.mutate(
              {
                ...input,
                sectionId: notice.sectionId,
                announcementId: notice.id,
              },
              { onSuccess: back },
            )
          }
        />
      </div>
    </Card>
  );
}

export function AdminNoticeEditPage() {
  const { noticeId: routeId } = useParams({
    from: '/admin/notices/$noticeId/edit',
  });
  const { sectionId, section } = useNoticeScope();
  const query = useAdminNoticeQuery(sectionId, routeId);
  if (!section || !query.data || query.isError)
    return <NoticeReadState query={query} />;
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>{query.data.title} 공지 수정</Heading>
        <BackToList />
      </div>
      <EditNoticeForm
        key={`${sectionId}:${query.data.id}`}
        notice={query.data}
      />
    </div>
  );
}

export function AdminNoticeNewPage() {
  const navigate = useNavigate();
  const { sectionId, user } = useNoticeScope();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<RichTextJson>(emptyRichText);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>(
    sectionId === undefined ? [] : [String(sectionId)],
  );
  const mutation = useSubmitSectionAnnouncementsMutation();
  const publishableSections = (user?.sections ?? []).filter(section =>
    canPublishNotice(user, section),
  );
  const selectedSections = publishableSections.filter(section =>
    selectedSectionIds.includes(String(section.id)),
  );
  const canSave = selectedSections.length > 0 && validText(title, content);
  const selectedSectionId = noticeId(selectedSectionIds[0]);
  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>공지사항 작성</Heading>
        <BackToList />
      </div>
      <Card className={styles.formCard}>
        <Heading level={2}>공지사항 작성</Heading>
        <MultiSelector
          hasClear
          hasSelectAll
          isDisabled={mutation.isPending || publishableSections.length === 0}
          label='분반'
          onChange={setSelectedSectionIds}
          options={publishableSections.map(section => ({
            label: `${section.code} · ${section.name}`,
            value: String(section.id),
          }))}
          placeholder='게시할 분반을 선택해 주세요.'
          selectAllLabel='전체 선택'
          triggerDisplay='labels'
          value={selectedSectionIds}
          width='100%'
        />
        <Text color='secondary'>선택한 모든 분반에 바로 게시됩니다.</Text>
        {publishableSections.length === 0 ? (
          <Text role='status'>담당 교수의 활성 분반을 선택해 주세요.</Text>
        ) : null}
        <div className={styles.fields}>
          <NoticeFields
            title={title}
            content={content}
            setTitle={setTitle}
            setContent={setContent}
            pending={mutation.isPending}
          />
        </div>
        {mutation.isError ? (
          <Text role='alert'>
            게시하지 못했습니다. 입력 내용을 유지했으니 권한과 게시 상태를
            확인해 주세요.
          </Text>
        ) : null}
        {mutation.data?.failedSectionIds.length ? (
          <Text role='alert'>
            {mutation.data.succeededSectionIds.length}개 분반에는 게시했지만{' '}
            {mutation.data.failedSectionIds.length}개 분반에는 게시하지
            못했습니다. 입력 내용을 유지했으니 실패한 분반을 다시 선택해 시도해
            주세요.
          </Text>
        ) : null}
        <div className={styles.actions}>
          <Button
            label='취소'
            variant='secondary'
            isDisabled={mutation.isPending}
            onClick={() =>
              void navigate({
                to: ROUTES.ADMIN_NOTICES,
                search: { sectionId: selectedSectionId },
              })
            }
          />
          <Button
            label='등록'
            isDisabled={!canSave || mutation.isPending}
            isLoading={mutation.isPending}
            onClick={() => {
              const sectionIds: number[] = [];
              for (const section of selectedSections) {
                const id = noticeId(section.id);
                if (id === undefined) return;
                sectionIds.push(id);
              }
              mutation.mutate(
                {
                  sectionIds,
                  title: title.trim(),
                  content: serializeRichTextContent(content),
                },
                {
                  onSuccess: result => {
                    if (result.failedSectionIds.length > 0) {
                      setSelectedSectionIds(
                        result.failedSectionIds.map(String),
                      );
                      return;
                    }
                    void navigate({
                      to: ROUTES.ADMIN_NOTICES,
                      search: { sectionId: selectedSectionId },
                    });
                  },
                },
              );
            }}
          />
        </div>
      </Card>
    </div>
  );
}
