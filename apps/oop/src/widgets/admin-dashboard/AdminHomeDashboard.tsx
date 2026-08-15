import { Button, Heading } from '@aics/design-system';
import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminHomeDashboard.css';

const schedules = [
  ['1151(월6)', '48명 / 7팀', '~10/8\n제출 7팀\n회의록 3건', '~10/29\n제출 6팀\n회의록 3건', '~11/12\n제출 6팀\n회의록 1건', '~11/19\n제출 2팀\n회의록 0건', '11/27\n시작 전', '-', '3건'],
  ['1152(월7)', '46명 / 7팀', '~10/8\n제출 7팀\n회의록 4건', '~10/29\n제출 6팀\n회의록 3건', '~11/12\n제출 6팀\n회의록 2건', '~11/19\n제출 4팀\n회의록 1건', '11/27\n시작 전', '-', '4건'],
  ['1153(월8)', '47명 / 6팀', '~10/8\n제출 6팀\n회의록 3건', '~10/29\n제출 5팀\n회의록 2건', '~11/12\n제출 1팀\n회의록 0건', '~11/19\n제출 0팀\n회의록 0건', '11/27\n시작 전', '-', '5건'],
] as const;

const notices = [['1151(월6)', '전체 접수 공지', '2025-12-17'], ['1152(월7)', '프로젝트 산출물 제출 안내', '2025-12-17'], ['1153(월8)', '기말 필기 시험 접수 공지 (수정 12/16)', '2025-12-15']] as const;
const minutes = [['1151반-A팀', '와이어프레임 기획 논의', '2025-12-17'], ['1152반-A팀', '기획 논의', '2025-12-17'], ['1152반-B팀', '주제 투표하기', '2025-12-15'], ['1153반-C팀', '주제 투표하기', '2025-12-15']] as const;
const inbox = [['1152-A팀', '김민준 교수님, 화면설계서 1차 첨부했는데 확인 부탁드려요!', '20분 전'], ['1152-B팀', '이은정 교수님, 회의록을 수정 과정에서 저장됐어요.', '1시간 전'], ['1153-B팀', '박서연 발표자료 초안 오늘 밤까지 올릴게요.', '1시간 전']] as const;

function List({ isNoticeList = false, items }: { isNoticeList?: boolean; items: readonly (readonly [string, string, string])[] }) {
  return <ul className={styles.list}>{items.map(([section, title, date], index) => <li className={styles.item} key={[section, title].join('-')}><span className={styles.label}>{section}</span>{isNoticeList ? <Link className={styles.itemTitle} params={{ noticeId: String(index + 1) }} to='/admin/notices/$noticeId'>{title}</Link> : <span className={styles.itemTitle}>{title}</span>}<time>{date}</time></li>)}</ul>;
}

function Panel({ title, items, action, isNoticePanel = false }: { title: string; items: readonly (readonly [string, string, string])[]; action?: boolean; isNoticePanel?: boolean }) {
  return <section className={styles.section}><div className={styles.sectionHeader}><Heading level={2}>{title}</Heading>{isNoticePanel ? <Link className={styles.more} to={ROUTES.ADMIN_NOTICES}>전체보기 ›</Link> : <button className={styles.more} type='button'>전체보기 ›</button>}</div><div className={styles.panel}><List isNoticeList={isNoticePanel} items={items} />{action ? <div className={styles.action}>{isNoticePanel ? <Link to={ROUTES.ADMIN_NOTICE_NEW}><Button label='작성하기' variant='primary' /></Link> : <Button label='작성하기' variant='primary' />}</div> : null}</div></section>;
}

export default function AdminHomeDashboard() {
  return <div className={styles.content}>
      <Heading level={1}>홈</Heading>
      <section className={styles.section}><div className={styles.sectionHeader}><Heading level={2}>분반별 진행 일정</Heading><Button label='일정 작성' variant='primary' /></div><div className={styles.tableWrap}><table className={styles.table}><thead><tr>{['분반', '인원/팀 수', '제안서', '중간 점검', '발표 제출', '발표 평가', '최종 보고서', '상호 평가', '쪽지'].map(header => <th key={header}>{header}</th>)}</tr></thead><tbody>{schedules.map(row => <tr key={row[0]}>{row.map(cell => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div></section>
      <div className={styles.grid}><Panel action isNoticePanel items={notices} title='공지사항' /><Panel items={minutes} title='회의록' /></div>
      <Panel items={inbox} title='쪽지함' />
  </div>;
}
