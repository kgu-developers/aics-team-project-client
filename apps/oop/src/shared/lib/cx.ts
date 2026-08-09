type ClassValue = string | false | null | undefined;

/**
 * vanilla-extract의 제거된 `cx` 유틸 대용.
 * truthy 클래스명만 공백으로 이어 붙인다.
 */
export function cx(...classNames: ClassValue[]): string {
  return classNames.filter(Boolean).join(' ');
}
