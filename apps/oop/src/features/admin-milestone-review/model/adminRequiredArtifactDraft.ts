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
  // 상호 평가는 고정 응답 양식으로 작성하므로 제출 산출물을 만들지 않는다.
  if (templateId === 'peer-review') return [];

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
