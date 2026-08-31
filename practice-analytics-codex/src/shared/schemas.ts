import { z } from "zod";

const count = z.number().int().min(0).max(10000);
const money = z.number().int().min(0).max(1_000_000_000);
export const dailyEntrySchema = z.object({
  date: z.iso.date(), scheduledCount: count, cancellationCount: count, noShowCount: count,
  visits: z.object({ new_psych_eval: count, followup_med: count, therapy_med: count, therapy_only: count, other: count }),
  grossBilledCents: money, expectedAllowedCents: money, insurancePaidCents: money,
  patientPaidCents: money, otherPaidCents: money, adjustmentsCents: money, refundsCents: money,
  businessNote: z.string().trim().max(300),
}).superRefine((value, context) => {
  const totalPayments = value.insurancePaidCents + value.patientPaidCents + value.otherPaidCents;
  if (value.refundsCents > totalPayments)
    context.addIssue({ code: "custom", path: ["refundsCents"], message: "Refunds cannot exceed total payments received." });
});

export const settingsSchema = z.object({
  practiceName: z.string().trim().min(1).max(80), planningBasis: z.enum(["expected", "collected"]),
  enabledWeekdays: z.array(z.number().int().min(1).max(7)).min(1), targetClinicalDaysPerWeek: z.number().int().min(1).max(7),
  maxCompletedVisitsPerDay: z.number().int().min(1).max(100), weeklyPatientGoal: count, monthlyPatientGoal: count,
  weeklyNewPatientGoal: count, monthlyNewPatientGoal: count, weeklyRevenueGoalCents: money,
  monthlyRevenueGoalCents: money, annualRevenueGoalCents: money, forecastLookbackWeeks: z.number().int().min(4).max(104),
  inactivityLockMinutes: z.number().int().min(1).max(1440), theme: z.enum(["light", "dark", "system"]),
  visitValues: z.object({ new_psych_eval: money.min(1), followup_med: money.min(1), therapy_med: money.min(1), therapy_only: money.min(1), other: money.min(1) }),
  showTopBar: z.boolean(),
  showMenuBar: z.boolean(),
}).superRefine((value, ctx) => {
  if (new Set(value.enabledWeekdays).size !== value.enabledWeekdays.length)
    ctx.addIssue({ code: "custom", path: ["enabledWeekdays"], message: "Weekdays must not contain duplicates." });
});

export const passwordSchema = z.string().min(10).max(128);
