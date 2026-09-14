import { Button, EmptyState } from '@aics/design-system';

import type { StudentContextStatus } from './resolveStudentContext';
import SectionSelection from './SectionSelection';
import type { useStudentContext } from './useStudentContext';

export const studentContextMessages: Record<StudentContextStatus, string> = {
  loading: '소속 분반과 팀 정보를 확인하는 중이에요.',
  error: '소속 정보를 불러오지 못했어요.',
  'no-section': '소속 분반이 없어요.',
  'selection-required': '수강 분반을 선택해 주세요.',
  'no-team': '소속 팀이 없어요.',
  ambiguous:
    '선택한 분반의 팀 소속을 확인할 수 없어요. 담당자에게 분반별 팀 배정 정보를 확인해 주세요.',
  ready: '',
};

export default function StudentContextState({
  context,
  sectionOnly = false,
}: {
  context: ReturnType<typeof useStudentContext>;
  sectionOnly?: boolean;
}) {
  const showState = sectionOnly ? !context.section : context.status !== 'ready';
  return (
    <>
      <SectionSelection
        sections={context.sections}
        selectedId={context.section?.id}
        onSelect={context.selectSection}
      />
      {showState ? (
        <EmptyState
          title={studentContextMessages[context.status]}
          actions={
            context.status === 'error' ||
            context.status === 'ambiguous' ||
            context.status === 'no-section' ? (
              <Button
                label='소속 정보 다시 시도'
                isDisabled={context.isFetching}
                onClick={() => void context.retry()}
              />
            ) : undefined
          }
        />
      ) : null}
    </>
  );
}
