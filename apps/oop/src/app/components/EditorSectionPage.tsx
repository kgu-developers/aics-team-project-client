import { Navigate } from '@tanstack/react-router';

import {
  EDITOR_DOCS,
  editorSectionTo,
  type EditorDocId,
} from '~/app/constants/editorSections';

import PagePlaceholder from '~/course/components/PagePlaceholder';

type EditorSectionPageProps = {
  docId: EditorDocId;
  section: string;
};

export default function EditorSectionPage({
  docId,
  section,
}: EditorSectionPageProps) {
  const doc = EDITOR_DOCS[docId];
  const sectionMeta = doc.sections.find(item => item.slug === section);

  if (!sectionMeta) {
    const firstSlug = doc.sections[0].slug;
    return <Navigate replace to={editorSectionTo(docId, firstSlug)} />;
  }

  return (
    <PagePlaceholder
      description={`${doc.title} 에디터의 '${sectionMeta.label}' 섹션입니다. 에디터 화면은 추후 제공 예정이에요.`}
      title={`${doc.title} · ${sectionMeta.label}`}
      todos={[
        '문서 요약과 작성률 표시',
        '섹션 내비게이션과 협업 상태 표시',
        '블록 편집 UI와 초안 저장',
      ]}
    />
  );
}
