export const visitCodes = ["new_psych_eval", "followup_med", "therapy_med", "therapy_only", "other"] as const;
export type VisitCode = typeof visitCodes[number];

export interface DailyEntry {
  date: string; scheduledCount: number; cancellationCount: number; noShowCount: number;
  visits: Record<VisitCode, number>; grossBilledCents: number; expectedAllowedCents: number;
  insurancePaidCents: number; patientPaidCents: number; otherPaidCents: number;
  adjustmentsCents: number; refundsCents: number; businessNote: string;
}

export interface Settings {
  practiceName: string; planningBasis: "expected" | "collected"; enabledWeekdays: number[];
  targetClinicalDaysPerWeek: number; maxCompletedVisitsPerDay: number;
  weeklyPatientGoal: number; monthlyPatientGoal: number; weeklyNewPatientGoal: number;
  monthlyNewPatientGoal: number; weeklyRevenueGoalCents: number; monthlyRevenueGoalCents: number;
  annualRevenueGoalCents: number; forecastLookbackWeeks: number; inactivityLockMinutes: number;
  theme: "light" | "dark" | "system"; visitValues: Record<VisitCode, number>;
  showTopBar: boolean;
  showMenuBar: boolean;
}

export interface Summary {
  scheduled: number; completed: number; newPatients: number; followups: number; cancellations: number;
  noShows: number; grossBilledCents: number; expectedAllowedCents: number; insurancePaidCents: number;
  patientPaidCents: number; otherPaidCents: number; refundsCents: number; adjustmentsCents: number;
  netCollectedCents: number; outstandingCents: number;
}
