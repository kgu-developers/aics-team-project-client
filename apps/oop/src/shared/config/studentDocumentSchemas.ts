/**
 * 학생 문서 에디터와 관리자 미리보기가 함께 사용하는 문서 골격이다.
 *
 * 실제 작성 값과 중간보고서 블록의 서버 응답은 각 도메인 API가 소유한다.
 * 이 설정은 화면에 고정된 작성 영역의 순서·이름과 읽기 전용 미리보기의
 * 입력 형태만 정의한다.
 */
export type StudentDocumentPreviewField = {
  label: string;
  multiline?: boolean;
};

export type StudentDocumentSection = {
  fields: readonly StudentDocumentPreviewField[];
  kind?: 'team-info';
  label: string;
  slug: string;
};

export type StudentDocumentSchema = {
  path: string;
  sections: readonly StudentDocumentSection[];
  title: string;
};

export const STUDENT_DOCUMENT_SCHEMAS = {
  proposal: {
    path: '/student/editor/proposal',
    title: '제안서',
    sections: [
      {
        fields: [],
        kind: 'team-info',
        label: '팀 정보',
        slug: 'team-info',
      },
      {
        fields: [
          { label: '프로젝트 제목' },
          { label: '프로젝트 설명', multiline: true },
          { label: '프로젝트 목표', multiline: true },
        ],
        label: '주제',
        slug: 'topic',
      },
      {
        fields: [
          { label: '데이터 이름' },
          { label: '데이터 설명', multiline: true },
          { label: '예상 개수' },
        ],
        label: '데이터 구성',
        slug: 'data-composition',
      },
      {
        fields: [
          { label: '화면 이름' },
          { label: '화면 설명', multiline: true },
          { label: '화면 이미지' },
        ],
        label: '화면 구성',
        slug: 'screen-composition',
      },
      {
        fields: [
          { label: '팀 규칙', multiline: true },
          { label: '회의 시간·빈도·방식', multiline: true },
          { label: '진행 일정', multiline: true },
          { label: '역할 분담', multiline: true },
        ],
        label: '팀 운영 방식',
        slug: 'team-operations',
      },
    ],
  },
  'mid-review': {
    path: '/student/editor/mid-review',
    title: '중간보고서',
    sections: [
      {
        fields: [
          { label: '프로젝트 제목' },
          { label: '주제 설명', multiline: true },
        ],
        label: '주제',
        slug: 'topic',
      },
      {
        fields: [{ label: '화면 GUI 목록', multiline: true }],
        label: '화면 GUI 설계',
        slug: 'gui-design',
      },
      {
        fields: [
          { label: '구현된 기능 목록', multiline: true },
          { label: '클래스 구조와 주요 기능 설명', multiline: true },
          { label: '입력·출력 테스트 케이스', multiline: true },
        ],
        label: '엔진부 설계',
        slug: 'engine-design',
      },
      {
        fields: [
          { label: '완료된 내용', multiline: true },
          { label: '진행 중인 내용', multiline: true },
          { label: '미구현 내용', multiline: true },
          { label: '문제점 또는 지원 필요', multiline: true },
        ],
        label: '팀프로젝트 진행 계획',
        slug: 'project-plan',
      },
    ],
  },
} as const satisfies Record<string, StudentDocumentSchema>;
