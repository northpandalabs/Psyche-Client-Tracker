import type { DailyEntry, Settings, Summary } from "../shared/types.js";

export const completedVisits = (entry: DailyEntry) => Object.values(entry.visits).reduce((sum, count) => sum + count, 0);
export const safeRate = (part: number, total: number) => total === 0 ? null : part / total;
export const netCollected = (entry: Pick<DailyEntry, "insurancePaidCents" | "patientPaidCents" | "otherPaidCents" | "refundsCents">) =>
  entry.insurancePaidCents + entry.patientPaidCents + entry.otherPaidCents - entry.refundsCents;
export const outstanding = (expected: number, collected: number, adjustments: number) => Math.max(expected - collected - adjustments, 0);
export const goalProgress = (actual: number, goal: number) => goal === 0 ? null : actual / goal;
export const visitsRequired = (gapCents: number, averageCents: number) => averageCents <= 0 ? null : Math.ceil(Math.max(gapCents, 0) / averageCents);
export const capacity = (days: number, maxPerDay: number) => days * maxPerDay;

export function summarize(entries: DailyEntry[]): Summary {
  const result: Summary = { scheduled: 0, completed: 0, newPatients: 0, followups: 0, cancellations: 0, noShows: 0,
    grossBilledCents: 0, expectedAllowedCents: 0, insurancePaidCents: 0, patientPaidCents: 0, otherPaidCents: 0,
    refundsCents: 0, adjustmentsCents: 0, netCollectedCents: 0, outstandingCents: 0 };
  for (const e of entries) {
    result.scheduled += e.scheduledCount; result.completed += completedVisits(e); result.newPatients += e.visits.new_psych_eval;
    result.followups += e.visits.followup_med; result.cancellations += e.cancellationCount; result.noShows += e.noShowCount;
    result.grossBilledCents += e.grossBilledCents; result.expectedAllowedCents += e.expectedAllowedCents;
    result.insurancePaidCents += e.insurancePaidCents; result.patientPaidCents += e.patientPaidCents; result.otherPaidCents += e.otherPaidCents;
    result.refundsCents += e.refundsCents; result.adjustmentsCents += e.adjustmentsCents;
    const net = netCollected(e); result.netCollectedCents += net; result.outstandingCents += outstanding(e.expectedAllowedCents, net, e.adjustmentsCents);
  }
  return result;
}

export function planner(goal: number, current: number, entries: DailyEntry[], settings: Settings) {
  const summary = summarize(entries); const historical = summary.completed >= 10 ? current / Math.max(summary.completed, 1) : 0;
  const configured = Object.values(settings.visitValues).reduce((a, b) => a + b, 0) / 5;
  const average = Math.round(historical || configured); const gap = Math.max(goal - current, 0); const needed = visitsRequired(gap, average);
  const weeklyCapacity = capacity(settings.targetClinicalDaysPerWeek, settings.maxCompletedVisitsPerDay);
  return { gapCents: gap, averageCents: average, visitsNeeded: needed, weeklyCapacity, feasible: needed === null ? false : needed <= weeklyCapacity * 4.345 };
}
