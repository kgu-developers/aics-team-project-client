/** 파일 저장소가 반환한 팀 소유 이미지 메타데이터 fixture. */
export const midReportImages = [
  {
    id: 501,
    fileName: 'home.png',
    contentType: 'image/png',
    teamId: 'team-07',
    url: '/evaluation/cineflow-slide-1.png',
  },
  {
    id: 502,
    fileName: 'other-team.png',
    contentType: 'image/png',
    teamId: 'other-team',
    url: '/evaluation/cineflow-slide-1.png',
  },
  {
    id: 503,
    fileName: 'report.pdf',
    contentType: 'application/pdf',
    teamId: 'team-07',
    url: '/evaluation/cineflow-slide-1.png',
  },
] as const;
