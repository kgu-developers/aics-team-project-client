import type {
  RequiredArtifactInput,
  RequiredArtifactType,
} from '@aics/api-client';

import {
  findMilestoneTemplate,
  type MilestoneTemplateId,
} from './milestoneTemplates';

export type AdminRequiredArtifactDraft = RequiredArtifactInput & {
  clientId: string;
};

function getDefaultType(
  templateId: MilestoneTemplateId,
  label: string,
): RequiredArtifactType {
  if (templateId === 'final-report') return 'FILE';
  if (templateId === 'presentation-submit' && label === '프레젠테이션 자료') {
    return 'FILE';
  }
  if (templateId === 'presentation-submit' && label === '시연 영상') {
    return 'LINK';
  }
  return 'TEXT';
}

function getDefaultExtensions(label: string): string[] | undefined {
  if (label === '최종보고서 PDF') return ['pdf'];
  if (label === '최종 소스코드 ZIP') return ['zip'];
  return undefined;
}

export function createAdminRequiredArtifactDrafts(
  templateId: MilestoneTemplateId,
): AdminRequiredArtifactDraft[] {
  // 제안서와 중간보고서는 전용 문서 편집기에서 작성한다. 제출 산출물은
  // 학생 제출 화면이 있는 발표 자료와 최종보고서에서만 만든다.
  if (templateId !== 'presentation-submit' && templateId !== 'final-report')
    return [];

  const template = findMilestoneTemplate(templateId);
  if (!template) return [];

  return template.fields.map((label, index) => {
    const type = getDefaultType(templateId, label);
    const allowedExtensions =
      type === 'FILE' ? getDefaultExtensions(label) : undefined;

    return {
      ...(allowedExtensions ? { allowedExtensions } : {}),
      clientId: `${templateId}-${index}`,
      label,
      required: true,
      type,
    };
  });
}
