import { Button, Card, Heading, Text, TextArea, TextInput } from '@aics/design-system';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminNoticePages.css';

const notices = [
  { date: '2025-12-17', id: '1', section: '1151(월6)', title: '전체 접수 공지', writer: '이은정' },
  { date: '2025-12-17', id: '2', section: '1152(월7)', title: '프로젝트 산출물 제출 안내', writer: '이은정' },
  { date: '2025-12-15', id: '3', section: '1153(월8)', title: '10주차 발표 안내', writer: '이은정' },
  { date: '2025-12-17', id: '4', section: '1151(월6)', title: '전체 접수 공지', writer: '이은정' },
  { date: '2025-12-17', id: '5', section: '1152(월7)', title: '프로젝트 산출물 제출 안내', writer: '이은정' },
  { date: '2025-12-15', id: '6', section: '1153(월8)', title: '기말 필기 시험 접수 공지 (수정 12/16)', writer: '이은정' },
  { date: '2025-12-12', id: '7', section: '1151(월6)', title: '프로젝트 중간 점검 일정 안내', writer: '이은정' },
  { date: '2025-12-10', id: '8', section: '1152(월7)', title: '발표 자료 제출 전 확인 사항', writer: '이은정' },
  { date: '2025-12-08', id: '9', section: '1153(월8)', title: '상호 평가 진행 안내', writer: '이은정' },
] as const;

const sectionFilters = ['전체', '1151(월6)', '1152(월7)', '1153(월8)'] as const;
const noticesPerPage = 3;

function BackToList() {
  return <Link className={styles.backLink} to={ROUTES.ADMIN_NOTICES}>← 공지사항 목록으로</Link>;
}

function SectionSelect({ onChange, value }: { onChange: (section: (typeof sectionFilters)[number]) => void; value: (typeof sectionFilters)[number] }) {
  const [isOpen, setIsOpen] = useState(false);

  return <div className={styles.selectWrapper}>
    <button aria-expanded={isOpen} aria-haspopup='listbox' className={styles.selectButton} onClick={() => setIsOpen(open => !open)} type='button'>
      {value} <span aria-hidden='true'>▾</span>
    </button>
    {isOpen ? <ul className={styles.selectMenu} role='listbox'>
      {sectionFilters.map(section => <li key={section}>
        <button aria-selected={value === section} className={value === section ? styles.selectOptionActive : styles.selectOption} onClick={() => { onChange(section); setIsOpen(false); }} role='option' type='button'>{section}</button>
      </li>)}
    </ul> : null}
  </div>;
}

export function AdminNoticeListPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSection, setSelectedSection] = useState<(typeof sectionFilters)[number]>('전체');
  const filteredNotices = selectedSection === '전체' ? notices : notices.filter(notice => notice.section === selectedSection);
  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / noticesPerPage));
  const displayedNotices = filteredNotices.slice(
    (currentPage - 1) * noticesPerPage,
    currentPage * noticesPerPage,
  );

  function selectSection(section: (typeof sectionFilters)[number]) {
    setSelectedSection(section);
    setCurrentPage(1);
  }

  return <div className={styles.page}>
    <Heading level={1}>공지사항</Heading>
    <div className={styles.filters} role='group' aria-label='분반 필터'>
      {sectionFilters.map(label => <button aria-pressed={selectedSection === label} className={selectedSection === label ? styles.filterActive : styles.filter} key={label} onClick={() => selectSection(label)} type='button'>{label}</button>)}
    </div>
    <Card className={styles.tableCard}>
      <table className={styles.table}>
        <thead><tr><th>날짜 ↕</th><th>분반</th><th>제목</th><th>작성자</th></tr></thead>
        <tbody>{displayedNotices.length > 0 ? displayedNotices.map(notice => <tr key={notice.id}><td>{notice.date}</td><td>{notice.section}</td><td><Link className={styles.titleLink} params={{ noticeId: notice.id }} to='/admin/notices/$noticeId'>{notice.title}</Link></td><td>{notice.writer}</td></tr>) : <tr><td className={styles.emptyCell} colSpan={4}>{selectedSection}에 등록된 공지사항이 없어요.</td></tr>}</tbody>
      </table>
    </Card>
    <div className={styles.listFooter}><div className={styles.pagination} aria-label='공지사항 페이지'>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => <button aria-current={currentPage === page ? 'page' : undefined} className={currentPage === page ? styles.pageActive : undefined} key={page} onClick={() => setCurrentPage(page)} type='button'>{page}</button>)}
      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(page => page + 1)} type='button'>다음</button>
    </div><Link to={ROUTES.ADMIN_NOTICE_NEW}><Button label='작성하기' variant='primary' /></Link></div>
  </div>;
}

export function AdminNoticeDetailPage() {
  return <div className={styles.page}>
    <div className={styles.titleRow}><Heading level={1}>공지사항 &gt; 10주차 발표 안내</Heading><BackToList /></div>
    <Card className={styles.detailCard}>
      <Heading level={2}>10주차 발표 안내</Heading>
      <Text className={styles.meta} color='secondary'>작성일 : 2026-07-07 14:30</Text>
      <Text>공개 범위 : 1151(월6), 1152(월7), 1153(월8)</Text>
      <div className={styles.divider} />
      <Text>10주차 중간고사 10번 문제 발표는 코드, 시연(다양한 앱 예제 활용), ppt 발표자료를 준비해 주세요.</Text>
      <Text>발표 점수는 만점 15점이고 발표 수준에 따라 점수를 부여합니다.</Text>
      <Text>추가로 발표 자료에는 코딩과 함께 구현한 화면을 포함해 주세요.</Text>
      <div className={styles.attachment}><span>제출 파일</span><a href='#attachment'>📎 객체지향프로그래밍 7조 프로젝트 제안서.pdf</a></div>
      <div className={styles.actions}>
        <Button label='삭제' variant='secondary' />
        <Link params={{ noticeId: '3' }} to={ROUTES.ADMIN_NOTICE_EDIT}>
          <Button label='수정' variant='primary' />
        </Link>
      </div>
    </Card>
  </div>;
}

export function AdminNoticeEditPage() {
  const [content, setContent] = useState('10주차 중간고사 10번 문제 발표는 코드, 시연(다양한 앱 예제 활용), ppt 발표자료를 준비해 주세요.\n\n발표 점수는 만점 15점이고 발표 수준에 따라 점수를 부여합니다.\n\n추가로 발표 자료에는 코딩과 함께 구현한 화면을 포함해 주세요.');
  const [section, setSection] = useState<(typeof sectionFilters)[number]>('전체');
  const [title, setTitle] = useState('10주차 발표 안내');

  return <div className={styles.page}>
    <div className={styles.titleRow}><Heading level={1}>10주차 발표 안내 공지 수정</Heading><BackToList /></div>
    <Card className={styles.formCard}>
      <Heading level={2}>공지사항 수정</Heading>
      <Text className={styles.meta} color='secondary'>작성일 : 2026-07-07 14:30</Text>
      <div className={styles.fields}>
        <TextInput label='제목' onChange={setTitle} value={title} width='100%' />
        <div className={styles.fieldGroup}><Text>분반</Text><SectionSelect onChange={setSection} value={section} /></div>
        <TextArea label='내용' onChange={setContent} rows={9} value={content} width='100%' />
        <div className={styles.fieldGroup}><Text>첨부 파일</Text><a className={styles.attachmentLink} href='#attachment'>📎 객체지향프로그래밍 7조 프로젝트 제안서.pdf</a><Button label='파일 변경' variant='secondary' /></div>
      </div>
      <div className={styles.actions}><Link params={{ noticeId: '3' }} to='/admin/notices/$noticeId'><Button label='취소' variant='secondary' /></Link><Button label='저장' variant='primary' /></div>
    </Card>
  </div>;
}

export function AdminNoticeNewPage() {
  const [content, setContent] = useState('');
  const [section, setSection] = useState<(typeof sectionFilters)[number]>('전체');
  const [title, setTitle] = useState('');

  return <div className={styles.page}>
    <div className={styles.titleRow}><Heading level={1}>공지사항 작성</Heading><BackToList /></div>
    <Card className={styles.formCard}>
      <Heading level={2}>공지사항 작성</Heading>
      <Text className={styles.meta} color='secondary'>작성일 : 2026-07-07 14:30</Text>
      <div className={styles.fields}>
        <TextInput label='제목' onChange={setTitle} placeholder='제목을 입력해 주세요.' value={title} width='100%' />
        <div className={styles.fieldGroup}><Text>분반</Text><SectionSelect onChange={setSection} value={section} /></div>
        <TextArea label='내용' onChange={setContent} placeholder='공지 내용을 입력해 주세요.' rows={9} value={content} width='100%' />
        <div className={styles.fieldGroup}><Text>첨부 파일</Text><Button label='파일 선택' variant='secondary' /></div>
      </div>
      <div className={styles.actions}><Link to={ROUTES.ADMIN_NOTICES}><Button label='취소' variant='secondary' /></Link><Button label='저장' variant='primary' /></div>
    </Card>
  </div>;
}
