import { apiClient } from '@aics/api-client';

const previewHeader = 'X-OOP-Milestone-Preview';

export function enableDevelopmentMilestonePreview() {
  apiClient.interceptors.request.use(config => {
    const preview = new URLSearchParams(window.location.search).get(
      'milestonePreview',
    );

    if (preview) {
      config.headers.set(previewHeader, preview);
    }

    return config;
  });
}
