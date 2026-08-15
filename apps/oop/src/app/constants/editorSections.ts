/**
 * 에디터 섹션 공통 정의.
 * Figma "5. 에디터"의 문서별 섹션 구성을 반영한다.
 * - proposal(제안서): 팀 정보 / 주제 / 데이터 구성 / 화면 구성 / 팀 운영 방식
 * - mid-review(중간 보고서): 주제 / 화면 GUI 설계 / 엔진부 설계 / 팀프로젝트 진행 계획 / 중간 점검 질문
 * - presentation(발표): 프로젝트 개요 / 프레젠테이션 자료 / 주요 기능 / 주요 화면 / 시연 영상
 *
 * 라우트 검증(동적 세그먼트 $section), 홈 상태 리스트의 to 경로, placeholder 라벨이
 * 이 한 곳을 참조해 서로 어긋나지 않도록 한다.
 */
export const EDITOR_DOCS = {
  proposal: {
    path: '/student/editor/proposal',
    title: '제안서',
    sections: [
      { slug: 'team-info', label: '팀 정보' },
      { slug: 'topic', label: '주제' },
      { slug: 'data-composition', label: '데이터 구성' },
      { slug: 'screen-composition', label: '화면 구성' },
      { slug: 'team-operations', label: '팀 운영 방식' },
    ],
  },
  'mid-review': {
    path: '/student/editor/mid-review',
    title: '중간 보고서',
    sections: [
      { slug: 'topic', label: '주제' },
      { slug: 'gui-design', label: '화면 GUI 설계' },
      { slug: 'engine-design', label: '엔진부 설계' },
      { slug: 'project-plan', label: '팀프로젝트 진행 계획' },
      { slug: 'mid-check-questions', label: '중간 점검 질문' },
    ],
  },
  presentation: {
    path: '/student/editor/presentation',
    title: '발표',
    sections: [
      { slug: 'project-overview', label: '프로젝트 개요' },
      { slug: 'presentation-material', label: '프레젠테이션 자료' },
      { slug: 'main-features', label: '주요 기능' },
      { slug: 'main-screens', label: '주요 화면' },
      { slug: 'demo-video', label: '시연 영상' },
    ],
  },
} as const;

export type EditorDocId = keyof typeof EDITOR_DOCS;

export type EditorSectionSlug =
  (typeof EDITOR_DOCS)[EditorDocId]['sections'][number]['slug'];

/** 문서 id와 섹션 slug로 에디터 섹션 라우트 경로를 만든다. */
export function editorSectionTo(docId: EditorDocId, slug: string): string {
  return `${EDITOR_DOCS[docId].path}/${slug}`;
}
