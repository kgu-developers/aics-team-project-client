export const adminSubmissionFiles = {
  'team-1151-1': {
    proposal: {
      projectTopic: 'AI 기반 팀 프로젝트 관리 서비스',
    },
    midterm: [
      {
        contentType: 'image/svg+xml',
        downloadUrl: '/evaluation/cineflow-screen-1.svg',
        fileName: 'cineflow-screen-1.svg',
      },
    ],
    presentation: {
      presentationFileDownloadUrl: '/evaluation/cineflow-presentation.pdf',
      presentationFileName: 'oop-01-1-presentation.pdf',
      sourceArchiveDownloadUrl:
        'data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
      sourceArchiveFileName: 'oop-01-1-source.zip',
      videoUrl: 'https://youtu.be/demo-oop-01-1',
    },
    finalReport: {
      reportDownloadUrl: 'data:application/pdf;base64,JVBERi0xLjQKJQ==',
      reportFileName: 'oop-01-1-final-report.pdf',
      sourceArchiveDownloadUrl:
        'data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
      sourceArchiveFileName: 'oop-01-1-final-report.zip',
    },
  },
  'team-1151-2': {
    proposal: {
      projectTopic: '캠퍼스 학습 일정 관리 서비스',
    },
    midterm: [
      {
        contentType: 'image/svg+xml',
        downloadUrl: '/evaluation/cafequeue-screen-1.svg',
        fileName: 'cafequeue-screen-1.svg',
      },
    ],
    presentation: {
      presentationFileDownloadUrl: '/evaluation/cafequeue-presentation.pdf',
      presentationFileName: 'oop-01-2-presentation.pdf',
      sourceArchiveDownloadUrl:
        'data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
      sourceArchiveFileName: 'oop-01-2-source.zip',
      videoUrl: null,
    },
    finalReport: {
      reportDownloadUrl: 'data:application/pdf;base64,JVBERi0xLjQKJQ==',
      reportFileName: 'oop-01-2-final-report.pdf',
      sourceArchiveDownloadUrl:
        'data:application/zip;base64,UEsFBgAAAAAAAAAAAAAAAAAAAAAAAA==',
      sourceArchiveFileName: 'oop-01-2-final-report.zip',
    },
  },
} as const;

export function getAdminSubmissionFiles(teamId: string) {
  return adminSubmissionFiles[teamId as keyof typeof adminSubmissionFiles];
}
