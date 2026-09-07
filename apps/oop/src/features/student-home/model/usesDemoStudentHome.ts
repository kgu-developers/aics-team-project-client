import { isMockDevelopmentMode } from '~/shared/config/developmentMode';

/** Keep the existing scenario dashboard confined to the development boundary. */
export function usesDemoStudentHome() {
  return isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  );
}
