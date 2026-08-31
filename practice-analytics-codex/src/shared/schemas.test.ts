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

  it("accepts when completed + cancellations + no-shows exceed scheduled (re-fill / walk-in scenario)", () => {
    // previously rejected; removed constraint because walk-ins and re-fills are legitimate
    const over = {
      ...validEntry,
      scheduledCount: 9,
      cancellationCount: 1,
      noShowCount: 1,
      visits: { new_psych_eval: 2, followup_med: 3, therapy_med: 1, therapy_only: 1, other: 1 },
    };
    expect(dailyEntrySchema.safeParse(over).success).toBe(true);
  });

  it("accepts when completed + cancellations + no-shows exactly equal scheduled", () => {
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

describe("dailyEntrySchema -- refund validation", () => {
  it("rejects refunds exceeding total payments", () => {
    // 80000+20000+5000 = 105000 total payments; refundsCents 110000 > 105000
    const over = { ...validEntry, refundsCents: 110000 };
    const result = dailyEntrySchema.safeParse(over);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Refunds cannot exceed");
    }
  });

  it("accepts refunds exactly equal to total payments", () => {
    // 80000+20000+5000 = 105000; refundsCents = 105000 is valid
    expect(dailyEntrySchema.safeParse({ ...validEntry, refundsCents: 105000 }).success).toBe(true);
  });

  it("accepts zero refunds when no payments have been made", () => {
    const noPayments = {
      ...validEntry,
      insurancePaidCents: 0, patientPaidCents: 0, otherPaidCents: 0, refundsCents: 0,
    };
    expect(dailyEntrySchema.safeParse(noPayments).success).toBe(true);
  });
});

describe("settingsSchema -- visitValues validation", () => {
  it("rejects visitValues with a zero entry (min(1) required)", () => {
    const zero = { ...validSettings, visitValues: { ...validSettings.visitValues, followup_med: 0 } };
    expect(settingsSchema.safeParse(zero).success).toBe(false);
  });

  it("accepts visitValues all set to 1 (minimum allowed)", () => {
    const min = { ...validSettings, visitValues: { new_psych_eval: 1, followup_med: 1, therapy_med: 1, therapy_only: 1, other: 1 } };
    expect(settingsSchema.safeParse(min).success).toBe(true);
  });
});

describe("settingsSchema -- duplicate weekdays", () => {
  it("rejects enabledWeekdays with duplicates", () => {
    const dup = { ...validSettings, enabledWeekdays: [1, 2, 2, 3] };
    const result = settingsSchema.safeParse(dup);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("duplicates");
    }
  });

  it("accepts weekdays with no duplicates", () => {
    expect(settingsSchema.safeParse({ ...validSettings, enabledWeekdays: [1, 3, 5] }).success).toBe(true);
  });
});

describe("dailyEntrySchema -- business note trim", () => {
  it("accepts an empty business note after trim (blank is allowed)", () => {
    // trim() runs before max(300) so whitespace-only is trimmed to "" which is valid (no min constraint)
    expect(dailyEntrySchema.safeParse({ ...validEntry, businessNote: "   " }).success).toBe(true);
  });
});

describe("dailyEntrySchema -- scheduledCount is informational", () => {
  it("accepts scheduledCount = 0 with completed visits (pure walk-in day)", () => {
    const walkin = {
      ...validEntry,
      scheduledCount: 0,
      cancellationCount: 0,
      noShowCount: 0,
      visits: { new_psych_eval: 0, followup_med: 4, therapy_med: 0, therapy_only: 0, other: 0 },
    };
    expect(dailyEntrySchema.safeParse(walkin).success).toBe(true);
  });

  it("accepts completions far exceeding scheduledCount", () => {
    const heavy = {
      ...validEntry,
      scheduledCount: 5,
      cancellationCount: 3,
      noShowCount: 2,
      visits: { new_psych_eval: 4, followup_med: 6, therapy_med: 3, therapy_only: 3, other: 2 },
    };
    // 18 completed + 3 + 2 = 23 vs 5 scheduled
    expect(dailyEntrySchema.safeParse(heavy).success).toBe(true);
  });

  it("accepts cancellations alone exceeding scheduledCount", () => {
    const manyCancels = { ...validEntry, scheduledCount: 2, cancellationCount: 5, noShowCount: 0 };
    expect(dailyEntrySchema.safeParse(manyCancels).success).toBe(true);
  });

  it("accepts no-shows alone exceeding scheduledCount", () => {
    const manyNoShows = { ...validEntry, scheduledCount: 1, cancellationCount: 0, noShowCount: 4 };
    expect(dailyEntrySchema.safeParse(manyNoShows).success).toBe(true);
  });

  it("accepts scheduledCount = 0 with cancellations and no-shows", () => {
    const zeroed = { ...validEntry, scheduledCount: 0, cancellationCount: 2, noShowCount: 1 };
    expect(dailyEntrySchema.safeParse(zeroed).success).toBe(true);
  });
});

describe("dailyEntrySchema -- field boundaries", () => {
  it("accepts scheduledCount at maximum (10000)", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, scheduledCount: 10000 }).success).toBe(true);
  });

  it("rejects scheduledCount above maximum (10001)", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, scheduledCount: 10001 }).success).toBe(false);
  });

  it("rejects non-integer scheduledCount", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, scheduledCount: 2.5 }).success).toBe(false);
  });

  it("accepts grossBilledCents at maximum (1_000_000_000)", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, grossBilledCents: 1_000_000_000 }).success).toBe(true);
  });

  it("rejects grossBilledCents above maximum", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, grossBilledCents: 1_000_000_001 }).success).toBe(false);
  });

  it("rejects non-integer cents amount", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, grossBilledCents: 100.5 }).success).toBe(false);
    expect(dailyEntrySchema.safeParse({ ...validEntry, insurancePaidCents: 0.1 }).success).toBe(false);
  });

  it("accepts all visit codes at maximum value (10000 each)", () => {
    const maxVisits = {
      ...validEntry,
      visits: { new_psych_eval: 10000, followup_med: 10000, therapy_med: 10000, therapy_only: 10000, other: 10000 },
    };
    expect(dailyEntrySchema.safeParse(maxVisits).success).toBe(true);
  });

  it("rejects any individual visit code above maximum", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, visits: { ...validEntry.visits, followup_med: 10001 } }).success).toBe(false);
    expect(dailyEntrySchema.safeParse({ ...validEntry, visits: { ...validEntry.visits, other: 10001 } }).success).toBe(false);
  });

  it("rejects negative visit counts", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, visits: { ...validEntry.visits, therapy_only: -1 } }).success).toBe(false);
  });

  it("accepts date at start and end of year", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, date: "2026-01-01" }).success).toBe(true);
    expect(dailyEntrySchema.safeParse({ ...validEntry, date: "2026-12-31" }).success).toBe(true);
  });

  it("rejects date with time component", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, date: "2026-08-01T00:00:00" }).success).toBe(false);
  });

  it("rejects missing visits object", () => {
    const { visits: _omit, ...withoutVisits } = validEntry;
    expect(dailyEntrySchema.safeParse(withoutVisits).success).toBe(false);
  });

  it("rejects missing individual visit code", () => {
    const { other: _omit, ...missingOther } = validEntry.visits;
    expect(dailyEntrySchema.safeParse({ ...validEntry, visits: missingOther }).success).toBe(false);
  });
});

describe("dailyEntrySchema -- all financial combinations", () => {
  it("accepts all financial fields at zero", () => {
    const allZero = {
      ...validEntry,
      grossBilledCents: 0, expectedAllowedCents: 0,
      insurancePaidCents: 0, patientPaidCents: 0, otherPaidCents: 0,
      adjustmentsCents: 0, refundsCents: 0,
    };
    expect(dailyEntrySchema.safeParse(allZero).success).toBe(true);
  });

  it("accepts when only insurance paid (no patient or other payment)", () => {
    const insOnly = { ...validEntry, patientPaidCents: 0, otherPaidCents: 0 };
    expect(dailyEntrySchema.safeParse(insOnly).success).toBe(true);
  });

  it("accepts gross billed higher than expected allowed (writeoffs scenario)", () => {
    const writeoff = { ...validEntry, grossBilledCents: 500000, expectedAllowedCents: 300000 };
    expect(dailyEntrySchema.safeParse(writeoff).success).toBe(true);
  });

  it("rejects negative adjustments", () => {
    expect(dailyEntrySchema.safeParse({ ...validEntry, adjustmentsCents: -1 }).success).toBe(false);
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
