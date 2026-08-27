import type { SectionAnnouncement } from '@aics/core';

export const studentNoticeAnnouncements: SectionAnnouncement[] = [
  {
    id: '10',
    sectionId: 'oop-2026-2-01',
    title: '[첨부 테스트] 이미지 미리보기 확인',
    content:
      '이미지 첨부파일이 본문 하단에 표시되는지 확인하기 위한 공지입니다.\n\n두 이미지의 크기와 모바일 레이아웃을 확인해 주세요.',
    createdAt: '2026-08-27 15:00',
    updatedAt: '2026-08-27 15:00',
    authorName: 'OOP 운영팀',
    attachments: [
      {
        id: 'notice-10-image-svg',
        fileName: 'CineFlow 화면 구성.svg',
        contentType: 'image/svg+xml',
        sizeBytes: 18_240,
        url: '/evaluation/cineflow-screen-1.svg',
      },
      {
        id: 'notice-10-image-png',
        fileName: 'CineFlow 발표 화면.png',
        contentType: 'image/png',
        sizeBytes: 132_480,
        url: '/evaluation/cineflow-slide-1.png',
      },
    ],
  },
  {
    id: '11',
    sectionId: 'oop-2026-2-01',
    title: '[첨부 테스트] PDF 다운로드 확인',
    content:
      '일반 첨부파일의 다운로드 동작을 확인하기 위한 공지입니다.\n\nPDF 파일은 이미지 미리보기 버튼 없이 다운로드만 제공됩니다.',
    createdAt: '2026-08-27 14:30',
    updatedAt: '2026-08-27 14:30',
    authorName: 'OOP 운영팀',
    attachments: [
      {
        id: 'notice-11-pdf',
        fileName:
          'KD3-95 공지사항 첨부파일 다운로드 테스트용 프로젝트 운영 안내.pdf',
        contentType: 'application/pdf',
        sizeBytes: 248_320,
        url: '/evaluation/cineflow-presentation.pdf',
      },
    ],
  },
  {
    id: '12',
    sectionId: 'oop-2026-2-01',
    title: '[읽음 테스트] 첨부파일 없는 공지',
    content:
      '공지 목록과 홈에서 새 글 배지를 확인한 뒤 상세 화면을 열어 주세요.\n\n상세 확인 후 목록으로 돌아가면 새 글 표시가 사라집니다.',
    createdAt: '2026-08-27 14:00',
    updatedAt: '2026-08-27 14:00',
    authorName: 'OOP 운영팀',
  },
  {
    id: '1',
    sectionId: 'oop-2026-2-01',
    title: '전체 접수 공지',
    content:
      '객체지향프로그래밍 팀 프로젝트 운영을 위한 전체 접수 일정을 안내합니다.\n\n분반별 제출 일정과 공지사항을 확인해 주세요.',
    createdAt: '2025-12-17 09:00',
    updatedAt: '2025-12-17 09:00',
    authorName: '이은정',
    attachments: [
      {
        id: 'notice-1-image',
        fileName: '전체 접수 일정 이미지.svg',
        contentType: 'image/svg+xml',
        sizeBytes: 18_240,
        url: '/evaluation/cineflow-screen-1.svg',
      },
      {
        id: 'notice-1-pdf',
        fileName: '전체 접수 안내.pdf',
        contentType: 'application/pdf',
        sizeBytes: 248_320,
        url: '/evaluation/cineflow-presentation.pdf',
      },
    ],
  },
  {
    id: '4',
    sectionId: 'oop-2026-2-01',
    title: '프로젝트 중간 점검 일정 안내',
    content:
      '프로젝트 중간 점검 일정과 발표 순서를 안내합니다.\n\n점검 전까지 팀별 진행 상황을 정리해 주세요.',
    createdAt: '2025-12-12 16:00',
    updatedAt: '2025-12-12 16:00',
    authorName: '이은정',
  },
  {
    id: '7',
    sectionId: 'oop-2026-2-01',
    title: '발표 자료 제출 전 확인 사항',
    content:
      '발표 자료 제출 전에 파일 형식과 제출 항목을 확인해 주세요.\n\n업로드한 자료는 발표 전까지 수정할 수 있습니다.',
    createdAt: '2025-12-10 09:30',
    updatedAt: '2025-12-10 09:30',
    authorName: '이은정',
  },
  {
    id: '2',
    sectionId: 'oop-2026-2-02',
    title: '프로젝트 산출물 제출 안내',
    content: '프로젝트 산출물 제출 전 파일명과 필수 제출 항목을 확인해 주세요.',
    createdAt: '2025-12-17 10:30',
    updatedAt: '2025-12-17 10:30',
    authorName: '이은정',
  },
];
