import { isMockDevelopmentMode } from '~/shared/config/developmentMode';
/** Legacy preview documents are kept separate from the persisted Project contract. */
export function useProposalEditorSource() {
  return isMockDevelopmentMode(
    import.meta.env.DEV,
    import.meta.env.VITE_ENABLE_MSW,
  )
    ? 'preview'
    : 'project';
}
