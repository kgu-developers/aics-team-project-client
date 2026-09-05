import type { SectionResponse } from '@aics/core';
import { Selector } from '@aics/design-system';

export default function SectionSelection({
  sections,
  selectedId,
  onSelect,
}: {
  sections: readonly SectionResponse[] | undefined;
  selectedId?: number;
  onSelect: (id: number) => void;
}) {
  if (!sections || sections.length < 2) return null;
  return (
    <Selector
      label='수강 분반 선택'
      placeholder='분반을 선택해 주세요'
      value={selectedId ? String(selectedId) : ''}
      options={sections.map(section => ({
        value: String(section.id),
        label: `${section.courseName} ${section.name}`,
      }))}
      onChange={value => onSelect(Number(value))}
    />
  );
}
