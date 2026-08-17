import {
  Button,
  Card,
  Heading,
  Text,
  TextArea,
  TextInput,
} from '@aics/design-system';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { type RefObject, useEffect, useRef, useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminNoticePages.css';
import {
  adminNoticeDetails,
  adminNotices,
  type AdminNotice,
  noticeListPageSize,
  type NoticeSectionFilter,
  noticeSectionFilters,
} from '../../mocks/data/adminNotices';

function BackToList() {
  return (
    <Link className={styles.backLink} to={ROUTES.ADMIN_NOTICES}>
      ← 공지사항 목록으로
    </Link>
  );
}

function DeleteNoticeDialog({
  isOpen,
  notice,
  onClose,
  triggerRef,
}: {
  isOpen: boolean;
  notice: AdminNotice;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const detail = adminNoticeDetails[notice.id];

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!isOpen || !dialog) return;

    dialog.showModal();
    cancelButtonRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleClose() {
    onClose();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <dialog
      aria-labelledby='delete-notice-title'
      aria-modal='true'
      className={styles.dialog}
      onCancel={event => {
        event.preventDefault();
        handleClose();
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;

        event.preventDefault();
        handleClose();
      }}
      ref={dialogRef}
    >
      <Heading
        className={styles.deleteTitle}
        id='delete-notice-title'
        level={2}
      >
        이 공지사항을 삭제할까요?
      </Heading>
      <Text color='secondary'>삭제한 공지사항은 복구할 수 없습니다.</Text>
      <Card className={styles.deletePreview}>
        <Heading level={3}>{notice.title}</Heading>
        <Text className={styles.meta} color='secondary'>
          작성일 : {detail.createdAt}
        </Text>
        <Text>공개 범위 : {notice.section}</Text>
        <div className={styles.divider} />
        {detail.content.map(content => (
          <Text key={content}>{content}</Text>
        ))}
      </Card>
      <div className={styles.modalActions}>
        <Button
          label='취소'
          onClick={handleClose}
          ref={cancelButtonRef}
          variant='secondary'
        />
        <Button
          className={styles.deleteButton}
          label='삭제'
          onClick={handleClose}
          variant='secondary'
        />
      </div>
    </dialog>
  );
}

function SectionSelect({
  onChange,
  value,
}: {
  onChange: (sections: NoticeSectionFilter[]) => void;
  value: NoticeSectionFilter[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (section: NoticeSectionFilter) => {
    if (section === '전체') {
      onChange(['전체']);
      return;
    }

    const selectedSections = value.filter(
      valueSection => valueSection !== '전체',
    );

    const nextSections = selectedSections.includes(section)
      ? selectedSections.filter(valueSection => valueSection !== section)
      : [...selectedSections, section];

    onChange(nextSections.length > 0 ? nextSections : ['전체']);
  };

  return (
    <div className={styles.selectWrapper}>
      <button
        aria-label='분반'
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        className={styles.selectButton}
        onClick={() => setIsOpen(open => !open)}
        type='button'
      >
        {value.join(', ')} <span aria-hidden='true'>▾</span>
      </button>

      {isOpen ? (
        <ul
          aria-label='분반'
          aria-multiselectable='true'
          className={styles.selectMenu}
          role='listbox'
        >
          {noticeSectionFilters.map(section => {
            const isSelected = value.includes(section);

            return (
              <li key={section}>
                <button
                  aria-selected={isSelected}
                  className={
                    isSelected ? styles.selectOptionActive : styles.selectOption
                  }
                  onClick={() => handleSelect(section)}
                  role='option'
                  type='button'
                >
                  {section}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function AdminNoticeListPage() {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSection, setSelectedSection] =
    useState<NoticeSectionFilter>('전체');
  const filteredNotices =
    selectedSection === '전체'
      ? adminNotices
      : adminNotices.filter(notice => notice.section === selectedSection);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotices.length / noticeListPageSize),
  );
  const displayedNotices = filteredNotices.slice(
    (currentPage - 1) * noticeListPageSize,
    currentPage * noticeListPageSize,
  );

  function selectSection(section: NoticeSectionFilter) {
    setSelectedSection(section);
    setCurrentPage(1);
  }

  return (
    <div className={styles.page}>
      <Heading level={1}>공지사항</Heading>
      <div className={styles.filters} role='group' aria-label='분반 필터'>
        {noticeSectionFilters.map(label => (
          <button
            aria-pressed={selectedSection === label}
            className={
              selectedSection === label ? styles.filterActive : styles.filter
            }
            key={label}
            onClick={() => selectSection(label)}
            type='button'
          >
            {label}
          </button>
        ))}
      </div>
      <Card className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>날짜 ↕</th>
              <th>분반</th>
              <th>제목</th>
              <th>작성자</th>
            </tr>
          </thead>
          <tbody>
            {displayedNotices.length > 0 ? (
              displayedNotices.map(notice => (
                <tr key={notice.id}>
                  <td>{notice.date}</td>
                  <td>{notice.section}</td>
                  <td>
                    <Link
                      className={styles.titleLink}
                      params={{ noticeId: notice.id }}
                      to='/admin/notices/$noticeId'
                    >
                      {notice.title}
                    </Link>
                  </td>
                  <td>{notice.writer}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={styles.emptyCell} colSpan={4}>
                  {selectedSection}에 등록된 공지사항이 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <div className={styles.listFooter}>
        <div className={styles.pagination} aria-label='공지사항 페이지'>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            page => (
              <button
                aria-current={currentPage === page ? 'page' : undefined}
                className={currentPage === page ? styles.pageActive : undefined}
                key={page}
                onClick={() => setCurrentPage(page)}
                type='button'
              >
                {page}
              </button>
            ),
          )}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(page => page + 1)}
            type='button'
          >
            다음
          </button>
        </div>
        <Button
          label='작성하기'
          onClick={() => navigate({ to: ROUTES.ADMIN_NOTICE_NEW })}
          variant='primary'
        />
      </div>
    </div>
  );
}

export function AdminNoticeDetailPage() {
  const { noticeId } = useParams({ from: '/admin/notices/$noticeId/' });
  const navigate = useNavigate();
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const notice = adminNotices.find(candidate => candidate.id === noticeId);

  if (!notice) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항을 찾을 수 없어요.</Heading>
        <BackToList />
      </div>
    );
  }

  const detail = adminNoticeDetails[notice.id];

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>공지사항 &gt; {notice.title}</Heading>
        <BackToList />
      </div>
      <Card className={styles.detailCard}>
        <Heading level={2}>{notice.title}</Heading>
        <Text className={styles.meta} color='secondary'>
          작성일 : {detail.createdAt}
        </Text>
        <Text>공개 범위 : {notice.section}</Text>
        <div className={styles.divider} />
        {detail.content.map(content => (
          <Text key={content}>{content}</Text>
        ))}
        <div className={styles.attachment}>
          <span>제출 파일</span>
          <a href='#attachment'>📎 {detail.attachment}</a>
        </div>
        <div className={styles.actions}>
          <Button
            label='삭제'
            onClick={() => setIsDeleteDialogOpen(true)}
            ref={deleteButtonRef}
            variant='secondary'
          />
          <Button
            label='수정'
            onClick={() =>
              navigate({
                to: ROUTES.ADMIN_NOTICE_EDIT,
                params: { noticeId: notice.id },
              })
            }
            variant='primary'
          />
        </div>
      </Card>
      <DeleteNoticeDialog
        isOpen={isDeleteDialogOpen}
        notice={notice}
        onClose={() => setIsDeleteDialogOpen(false)}
        triggerRef={deleteButtonRef}
      />
    </div>
  );
}

export function AdminNoticeEditPage() {
  const navigate = useNavigate();
  const { noticeId } = useParams({
    from: '/admin/notices/$noticeId/edit',
  });
  const notice = adminNotices.find(candidate => candidate.id === noticeId);
  const detail = notice ? adminNoticeDetails[notice.id] : null;
  const [content, setContent] = useState(detail?.content.join('\n\n') ?? '');
  const [sections, setSections] = useState<NoticeSectionFilter[]>(
    notice ? [notice.section] : ['전체'],
  );
  const [title, setTitle] = useState(notice?.title ?? '');

  useEffect(() => {
    if (!notice || !detail) return;

    setContent(detail.content.join('\n\n'));
    setSections([notice.section]);
    setTitle(notice.title);
  }, [noticeId, notice, detail]);

  if (!notice || !detail) {
    return (
      <div className={styles.page}>
        <Heading level={1}>공지사항을 찾을 수 없어요.</Heading>
        <BackToList />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>{notice.title} 공지 수정</Heading>
        <BackToList />
      </div>
      <Card className={styles.formCard}>
        <Heading level={2}>공지사항 수정</Heading>
        <Text className={styles.meta} color='secondary'>
          작성일 : {detail.createdAt}
        </Text>
        <div className={styles.fields}>
          <TextInput
            label='제목'
            onChange={setTitle}
            value={title}
            width='100%'
          />
          <div className={styles.fieldGroup}>
            <Text>분반</Text>
            <SectionSelect onChange={setSections} value={sections} />
          </div>
          <TextArea
            label='내용'
            onChange={setContent}
            rows={9}
            value={content}
            width='100%'
          />
          <div className={styles.fieldGroup}>
            <Text>첨부 파일</Text>
            <a className={styles.attachmentLink} href='#attachment'>
              📎 {detail.attachment}
            </a>
            <Button label='파일 변경' variant='secondary' />
          </div>
        </div>
        <div className={styles.actions}>
          <Button
            label='취소'
            onClick={() =>
              navigate({
                to: '/admin/notices/$noticeId',
                params: { noticeId: notice.id },
              })
            }
            variant='secondary'
          />
          <Button label='저장' variant='primary' />
        </div>
      </Card>
    </div>
  );
}

export function AdminNoticeNewPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [sections, setSections] = useState<NoticeSectionFilter[]>(['전체']);
  const [title, setTitle] = useState('');

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <Heading level={1}>공지사항 작성</Heading>
        <BackToList />
      </div>
      <Card className={styles.formCard}>
        <Heading level={2}>공지사항 작성</Heading>
        <Text className={styles.meta} color='secondary'>
          작성일 : 2026-07-07 14:30
        </Text>
        <div className={styles.fields}>
          <TextInput
            label='제목'
            onChange={setTitle}
            placeholder='제목을 입력해 주세요.'
            value={title}
            width='100%'
          />
          <div className={styles.fieldGroup}>
            <Text>분반</Text>
            <SectionSelect onChange={setSections} value={sections} />
          </div>
          <TextArea
            label='내용'
            onChange={setContent}
            placeholder='공지 내용을 입력해 주세요.'
            rows={9}
            value={content}
            width='100%'
          />
          <div className={styles.fieldGroup}>
            <Text>첨부 파일</Text>
            <Button label='파일 선택' variant='secondary' />
          </div>
        </div>
        <div className={styles.actions}>
          <Button
            label='취소'
            onClick={() => navigate({ to: ROUTES.ADMIN_NOTICES })}
            variant='secondary'
          />
          <Button label='저장' variant='primary' />
        </div>
      </Card>
    </div>
  );
}
