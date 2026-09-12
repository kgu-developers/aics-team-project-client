import type {
  MidReport,
  MidReportBlockKey,
  UpdateMidReportBlockInput,
} from '@aics/core';

import { mapMidReport } from './mapMidReport';
import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateMidReportBlock(
  midReportId: string,
  blockKey: MidReportBlockKey,
  input: UpdateMidReportBlockInput,
): Promise<MidReport> {
  const response = await apiClient.patch<unknown>(
    ENDPOINTS.MID_REPORT.BLOCK(midReportId, blockKey),
    {
      ...input,
      fields: input.fields.map(field => {
        if (field.key !== 'guiScreens' || !field.value.trim()) return field;
        const rows = JSON.parse(field.value) as Record<string, unknown>[];
        return {
          ...field,
          value: JSON.stringify(
            rows.map(row => {
              const persisted = { ...row };
              delete persisted.imageUrl;
              return persisted;
            }),
          ),
        };
      }),
    },
  );
  return mapMidReport(response.data);
}
