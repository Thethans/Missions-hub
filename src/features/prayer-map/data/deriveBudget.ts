import type { Missionary, MissionaryWithBudget } from './types';

/** Sum of all monthly budget line items. */
export function monthlyNeedOf(m: Pick<Missionary, 'budget'>): number {
  return m.budget.reduce((total, line) => total + line.amount, 0);
}

/**
 * Attach the derived funding figures to a missionary. Keeping `monthlyNeed`
 * and `raised` computed (never hand-typed) guarantees they stay consistent
 * with the budget line items and the funding percentage.
 */
export function withDerivedBudget(m: Missionary): MissionaryWithBudget {
  const monthlyNeed = monthlyNeedOf(m);
  const raised = Math.round((monthlyNeed * m.supportGoal) / 100);
  return { ...m, monthlyNeed, raised };
}
