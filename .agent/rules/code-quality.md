# Code quality

## Code style

- A file's primary React component uses `export default function ComponentName() {}`.
- Utilities and multi-export files use named exports.
- Component files use PascalCase; utility and API files use lowerCamelCase.
- Import order: framework, external packages, project packages, app aliases, relative imports.

## Accessibility and UI states

- Prefer semantic elements such as `header`, `nav`, `main`, `section`, and `article`.
- Use visible labels when possible; use `aria-label` when an accessible name is otherwise unavailable.
- Preserve visible focus, errors, descriptions, and understandable loading/empty/error/missing-prerequisite states.
- Custom composite widgets such as tabs must implement the relevant ARIA roles and keyboard interaction and receive an interaction test.

## Diff hygiene

- Keep changes ticket-scoped.
- Do not mix formatting-only rewrites into a feature diff unless requested.
- Do not commit generated caches, secrets, private source material, or `.agent-local/`.
