import { recoverSession } from './sessionRecovery';

export async function submitRefresh() {
  return recoverSession();
}
