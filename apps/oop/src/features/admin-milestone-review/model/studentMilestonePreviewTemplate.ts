import type { AdminMilestoneType } from '@aics/api-client';

import type { MilestoneTemplateId } from './milestoneTemplates';

export type StudentMilestonePreviewTemplateId = Exclude<
  MilestoneTemplateId,
  'peer-review' | 'presentation-evaluate'
>;

/** Resolves only the student submission screen that the milestone type supports. */
export function getStudentMilestonePreviewTemplateId(
  milestoneType?: AdminMilestoneType,
  templateId?: MilestoneTemplateId,
): StudentMilestonePreviewTemplateId | undefined {
  if (milestoneType) {
    switch (milestoneType) {
      case 'PRESENTATION':
        return 'presentation-submit';
      case 'FINAL_REPORT':
        return 'final-report';
      case 'MID_REPORT':
        return 'midterm';
      case 'PROPOSAL':
        return 'proposal';
      case 'GENERAL':
      case 'PEER_EVALUATION':
        return undefined;
    }
  }

  switch (templateId) {
    case 'proposal':
    case 'midterm':
    case 'presentation-submit':
    case 'final-report':
      return templateId;
    case 'peer-review':
    case 'presentation-evaluate':
    case undefined:
      return undefined;
  }
}
