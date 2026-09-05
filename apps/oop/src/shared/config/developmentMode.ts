/** Separates deterministic MSW previews from real backend workflows. */
export function isMockDevelopmentMode(
  isDevelopment: boolean,
  enableMsw: string | undefined,
) {
  return isDevelopment && enableMsw !== 'false';
}
