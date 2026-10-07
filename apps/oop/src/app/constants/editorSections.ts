import { STUDENT_DOCUMENT_SCHEMAS } from '~/shared/config/studentDocumentSchemas';

/**
 * 에디터 섹션 공통 정의.
 * Figma "5. 에디터"의 문서별 섹션 구성을 반영한다.
 * - proposal(제안서): 팀 정보 / 주제 / 데이터 구성 / 화면 구성 / 팀 운영 방식
 * - mid-review(중간 보고서): 주제 / 화면 GUI 설계 / 엔진부 설계 / 팀프로젝트 진행 계획
 * - presentation(발표): 발표 자료 제출
 *
 * 라우트 검증(동적 세그먼트 $section), 홈 상태 리스트의 to 경로, placeholder 라벨이
 * 이 한 곳을 참조해 서로 어긋나지 않도록 한다.
 */
export const EDITOR_DOCS = {
  proposal: STUDENT_DOCUMENT_SCHEMAS.proposal,
  'mid-review': STUDENT_DOCUMENT_SCHEMAS['mid-review'],
  presentation: {
    path: '/student/editor/presentation',
    title: '발표 자료 제출',
    sections: [{ slug: 'presentation-material', label: '발표 자료 제출' }],
  },
} as const;

export type EditorDocId = keyof typeof EDITOR_DOCS;

export type EditorSectionSlug =
  (typeof EDITOR_DOCS)[EditorDocId]['sections'][number]['slug'];

/** 문서 id와 섹션 slug로 에디터 섹션 라우트 경로를 만든다. */
export function editorSectionTo(docId: EditorDocId, slug: string): string {
  return `${EDITOR_DOCS[docId].path}/${slug}`;
}
