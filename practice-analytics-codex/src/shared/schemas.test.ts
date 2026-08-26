import { describe, expect, it } from "vitest";
import { dailyEntrySchema, passwordSchema, settingsSchema } from "./schemas";

const validEntry = {
  date: "2026-08-01",
  scheduledCount: 10,
  cancellationCount: 1,
  noShowCount: 1,
  visits: { new_psych_eval: 2, followup_med: 3, therapy_med: 1, therapy_only: 1, other: 0 },
  grossBilledCents: 200000,
  expectedAllowedCents: 150000,
  insurancePaidCents: 80000,
  patientPaidCents: 20000,
  otherPaidCents: 5000,
  adjustmentsCents: 10000,
  refundsCents: 5000,
  businessNote: "",
};

const validSettings = {
  practiceName: "My Practice",
  planningBasis: "expected" as const,
  enabledWeekdays: [1, 2, 3, 4, 5],
  targetClinicalDaysPerWeek: 5,
  maxCompletedVisitsPerDay: 10,
  weeklyPatientGoal: 35,
  monthlyPatientGoal: 150,
  weeklyNewPatientGoal: 5,
  monthlyNewPatientGoal: 20,
  weeklyRevenueGoalCents: 700000,
  monthlyRevenueGoalCents: 3000000,
  annualRevenueGoalCents: 36000000,
  forecastLookbackWeeks: 8,
  inactivityLockMinutes: 15,
  theme: "system" as const,
  visitValues: { new_psych_eval: 35000, followup_med: 17500, therapy_med: 25000, therapy_only: 20000, other: 15000 },
  showTopBar: false,
  showMenuBar: false,
};

describe("dailyEntrySchema -- valid input", () => {
  it("accepts a well-formed entry", () => {
    expect(dailyEntrySchema.safeParse(validEntry).success).toBe(true);
  });

  it("accepts zero visits and zero financials", () => {
    const minimal = {
      ...validEntry,
      scheduledCount: 0,
      cancellationCount: 0,
      noShowCount: 0,
      visits: { new_psych_eval: 0, followup_med: 0, therapy_med: 0, therapy_only: 0, other: 0 },
      grossBilledCents: 0,
      expectedAllowedCents: 0,
      insurancePaidCents: 0,
      patientPaidCents: 0,
      otherPaidCents: 0,
      adjustmentsCents: 0,
      refundsCents: 0,
    };
    expect(dailyEntrySchema.safeParse(minimal).success).toBe(true);
  });

  it("accepts a business note up to 300 characters", () => {
    const entry = { ...validEntry, scheduledCount: 10, businessNote: "x".repeat(300) };
    expect(dailyEntrySchema.safeParse(entry).success).toBe(true);
  });
});

describe("dailyEntrySchema -- invalid input", () => {
  it("rejects an invalid date string", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, date: "not-a-date" }).success).toBe(false);
    expect(dailyEntrySchema.safeParse({ ...validEntry, date: "2026/08/01" }).success).toBe(false);
  });

  it("rejects negative counts", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, scheduledCount: -1 }).success).toBe(false);
    expect(dailyEntrySchema.safeParse({ ...validEntry, cancellationCount: -1 }).success).toBe(false);
  });

  it("rejects negative financial amounts", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, grossBilledCents: -1 }).success).toBe(false);
    expect(dailyEntrySchema.safeParse({ ...validEntry, insurancePaidCents: -100 }).success).toBe(false);
  });

  it("rejects a business note longer than 300 characters", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, businessNote: "x".repeat(301) }).success).toBe(false);
  });

  it("rejects when completed + cancellations + no-shows exceed scheduled", () => {
    // 8 completed + 1 cancel + 1 no-show = 10, but scheduledCount is 9 -- over by 1
    const over = {
      ...validEntry,
      scheduledCount: 9,
      cancellationCount: 1,
      noShowCount: 1,
      visits: { new_psych_eval: 2, followup_med: 3, therapy_med: 1, therapy_only: 1, other: 1 },
    };
    const result = dailyEntrySchema.safeParse(over);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Scheduled appointments");
    }
  });

  it("accepts when completed + cancellations + no-shows exactly equal scheduled", () => {
    // 8 completed + 1 cancel + 1 no-show = 10 scheduled exactly
    const exact = {
      ...validEntry,
      scheduledCount: 10,
      cancellationCount: 1,
      noShowCount: 1,
      visits: { new_psych_eval: 2, followup_med: 3, therapy_med: 1, therapy_only: 1, other: 1 },
    };
    expect(dailyEntrySchema.safeParse(exact).success).toBe(true);
  });

  it("rejects non-integer counts", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, scheduledCount: 1.5 }).success).toBe(false);
  });

  it("rejects missing required field", () => {
    const { date: _omit, ...without } = validEntry;
    expect(dailyEntrySchema.safeParse(without).success).toBe(false);
  });
});

describe("settingsSchema -- valid input", () => {
  it("accepts complete valid settings", () => {
    expect(settingsSchema.safeParse(validSettings).success).toBe(true);
  });

  it("accepts both planning basis values", () => {
    expect(settingsSchema.safeParse({ ...validSettings, planningBasis: "collected" }).success).toBe(true);
  });

  it("accepts all three theme values", () => {
    for (const theme of ["light", "dark", "system"] as const) {
      expect(settingsSchema.safeParse({ ...validSettings, theme }).success).toBe(true);
    }
  });
});

describe("settingsSchema -- invalid input", () => {
  it("rejects empty practice name", () => {
    expect(settingsSchema.safeParse({ ...validSettings, practiceName: "" }).success).toBe(false);
    expect(settingsSchema.safeParse({ ...validSettings, practiceName: "   " }).success).toBe(false);
  });

  it("rejects practice name over 80 characters", () => {
    expect(settingsSchema.safeParse({ ...validSettings, practiceName: "x".repeat(81) }).success).toBe(false);
  });

  it("rejects invalid planning basis", () => {
    expect(settingsSchema.safeParse({ ...validSettings, planningBasis: "gross" }).success).toBe(false);
  });

  it("rejects empty enabled weekdays array", () => {
    expect(settingsSchema.safeParse({ ...validSettings, enabledWeekdays: [] }).success).toBe(false);
  });

  it("rejects negative revenue goals", () => {
    expect(settingsSchema.safeParse({ ...validSettings, monthlyRevenueGoalCents: -1 }).success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("accepts a password of exactly 10 characters", () => {
    expect(passwordSchema.safeParse("1234567890").success).toBe(true);
  });

  it("accepts a long password", () => {
    expect(passwordSchema.safeParse("a".repeat(128)).success).toBe(true);
  });

  it("rejects passwords shorter than 10 characters", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
    expect(passwordSchema.safeParse("123456789").success).toBe(false);
  });

  it("rejects a password over 128 characters", () => {
    expect(passwordSchema.safeParse("a".repeat(129)).success).toBe(false);
  });

  it("rejects empty string", () => {
    expect(passwordSchema.safeParse("").success).toBe(false);
  });
});
