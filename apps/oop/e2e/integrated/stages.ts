export const dependencies = {
  '01': [],
  '02': ['01'],
  '03': ['02'],
  '04': ['02'],
  '05': ['01'],
  '06': ['04'],
  M01: ['04'],
  M02: ['M01'],
  M03: ['M02'],
  M04: ['M01'],
  M05: ['M01'],
  M06: ['M02'],
  M07: ['M01'],
  M08: ['M07', 'M02'],
  M09: ['M07'],
  M10: ['M01'],
  M11: ['M10', 'M02'],
  M12: ['M10'],
  N01: ['01'],
  N02: ['N01', '02'],
  N03: ['N01'],
  N04: ['N03', '02'],
  '07': ['05', '06'],
  '08': ['07'],
  '09': ['05', '06'],
  '10': ['09'],
  '11': ['05', '06'],
  '12': ['11'],
  '13': ['12'],
  '14': ['05', '06'],
  '15': ['14'],
  '16': ['14'],
  '17': ['04'],
  '18': ['17', '06'],
} as const;
export type StageId = keyof typeof dependencies;
export type Outcome = {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'skipped';
  reason?: string;
};

// This runner has no browser or service dependency. Evidence failures never abort siblings.
export function createStageRunner({
  graph = dependencies,
  execute,
  capture,
  persist,
  describeError = String,
}: {
  graph?: Record<string, readonly string[]>;
  execute: (
    id: string,
    title: string,
    action: () => Promise<void>,
  ) => Promise<void>;
  capture: (id: string) => Promise<void>;
  persist: (outcomes: Outcome[]) => Promise<void>;
  describeError?: (error: unknown) => string;
}) {
  for (const [id, required] of Object.entries(graph)) {
    if (
      required.some(dependency => !(dependency in graph) || dependency === id)
    )
      throw new Error(`Invalid dependency for ${id}`);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) throw new Error(`Dependency cycle at ${id}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of graph[id]!) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of Object.keys(graph)) visit(id);
  const outcomes: Outcome[] = [];
  const evidenceErrors: string[] = [];
  async function evidence(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      evidenceErrors.push(describeError(error));
    }
  }
  return {
    outcomes,
    evidenceErrors,
    async phase(id: string, title: string, action: () => Promise<void>) {
      if (!(id in graph) || outcomes.some(outcome => outcome.id === id))
        throw new Error(`Unknown or duplicate stage ${id}`);
      const blocked = graph[id]!.filter(
        dependency =>
          !outcomes.some(
            outcome => outcome.id === dependency && outcome.status === 'passed',
          ),
      );
      if (blocked.length) {
        outcomes.push({
          id,
          title,
          status: 'skipped',
          reason: `Unsuccessful prerequisite: ${blocked.join(', ')}`,
        });
      } else {
        try {
          await execute(id, title, action);
          outcomes.push({ id, title, status: 'passed' });
        } catch (error) {
          outcomes.push({
            id,
            title,
            status: 'failed',
            reason: describeError(error),
          });
          await evidence(() => capture(id));
        }
      }
      await evidence(() => persist(outcomes));
    },
  };
}
