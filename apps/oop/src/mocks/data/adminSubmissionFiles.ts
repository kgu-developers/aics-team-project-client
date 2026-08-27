export const adminSubmissionFiles = {
  'team-1151-1': {
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
  },
  'team-1151-2': {
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
  },
} as const;

export function getAdminSubmissionFiles(teamId: string) {
  return adminSubmissionFiles[teamId as keyof typeof adminSubmissionFiles];
}
