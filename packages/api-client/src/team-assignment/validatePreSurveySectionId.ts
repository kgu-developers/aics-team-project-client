export function validatePreSurveySectionId(sectionId: number) {
  if (!Number.isSafeInteger(sectionId) || sectionId <= 0) {
    throw new Error('설문에 응답할 수강 분반을 선택해 주세요.');
  }
}
