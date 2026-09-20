import { createFileRoute } from '@tanstack/react-router';

import { validateEditorReturnContext } from '~/features/editor/editorReturnContext';

export const Route = createFileRoute('/student/editor/mid-review/$section')({
  validateSearch: search => ({
    returnTo: validateEditorReturnContext('mid-review', search.returnTo),
  }),
});
