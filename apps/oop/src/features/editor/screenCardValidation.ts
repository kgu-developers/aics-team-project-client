type ScreenCardText = {
  title?: string | null;
  description?: string | null;
};

export function screenCardTextErrors({ title, description }: ScreenCardText) {
  return {
    title: title?.trim() ? undefined : '제목을 입력해 주세요.',
    description: description?.trim() ? undefined : '설명을 입력해 주세요.',
  };
}

export function screenCardsMissingText(rows: ScreenCardText[]) {
  const incomplete = rows.flatMap((row, index) => {
    const errors = screenCardTextErrors(row);
    const missing = [
      errors.title && '제목',
      errors.description && '설명',
    ].filter(Boolean);
    return missing.length ? [`화면 ${index + 1}: ${missing.join(', ')}`] : [];
  });
  if (!incomplete.length) return null;
  return `화면 카드에 필수 입력이 빠졌어요. ${incomplete.join(' / ')}. 각 카드를 편집해 채워 주세요.`;
}
