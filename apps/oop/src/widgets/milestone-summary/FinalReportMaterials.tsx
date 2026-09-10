import { Button, Text } from '@aics/design-system';

import type { FinalReportSubmissionTarget } from '~/features/submission/FinalReportSubmissionPanel';
import { useStudentSubmissionVersionsQuery } from '~/features/submission/queries';
import { useSubmissionDialog } from '~/features/submission/SubmissionDialogContext';
import { safeSubmissionUrl } from '~/features/submission/submissionUploadInput';

import FinalReportSubmissionHistory from './FinalReportSubmissionHistory';
import SubmissionMaterials from './SubmissionMaterials';

function Materials({ target }: { target: FinalReportSubmissionTarget }) {
  const query = useStudentSubmissionVersionsQuery(target, target.submissionId);
  if (query.isPending)
    return <Text role='status'>제출 자료를 불러오는 중...</Text>;
  if (query.isError)
    return (
      <>
        <Text role='alert'>제출 자료를 불러오지 못했어요.</Text>
        <Button
          label='자료 다시 조회'
          clickAction={async () => {
            await query.refetch();
          }}
        />
      </>
    );
  const latest = [...query.data].sort((a, b) => b.version - a.version)[0];
  if (!latest) return <Text>아직 제출된 파일이 없어요.</Text>;
  return (
    <>
      <SubmissionMaterials
        materials={latest.artifacts.flatMap((item, index) =>
          item.type === 'FILE' || item.type === 'LINK'
            ? [
                {
                  id: `${latest.id}:${index}`,
                  kind: item.type,
                  label: item.type === 'FILE' ? '제출 파일' : '제출 링크',
                  extension:
                    item.type === 'FILE'
                      ? (item.fileName?.split('.').pop()?.toUpperCase() ??
                        'FILE')
                      : 'LINK',
                  value: item.fileName ?? item.url ?? undefined,
                  href: safeSubmissionUrl(
                    item.type === 'FILE' ? item.downloadUrl : item.url,
                  ),
                },
              ]
            : [],
        )}
        metadata={{
          submittedBy: latest.submittedBy.name,
          submittedAt: latest.submittedAt,
          updatedAt: latest.updatedAt,
        }}
      />
      <FinalReportSubmissionHistory
        versions={query.data}
        onRefresh={async () => {
          await query.refetch();
        }}
      />
    </>
  );
}

export default function FinalReportMaterials({
  milestoneId,
}: {
  milestoneId: string;
}) {
  const { finalReportTargets } = useSubmissionDialog();
  const target = finalReportTargets[milestoneId];
  return target ? (
    <Materials
      key={`${target.studentNumber}:${target.teamId}:${milestoneId}`}
      target={target}
    />
  ) : (
    <Text>제출 대상을 확인할 수 없어요.</Text>
  );
}
