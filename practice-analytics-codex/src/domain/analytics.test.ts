import { describe, expect, it } from "vitest";
import { capacity, completedVisits, goalProgress, netCollected, outstanding, planner, safeRate, summarize, visitsRequired } from "./analytics";
import type { DailyEntry, Settings } from "../shared/types";

const entry: DailyEntry = {
  date: "2026-08-14",
  scheduledCount: 10, cancellationCount: 1, noShowCount: 1,
  visits: { new_psych_eval: 2, followup_med: 4, therapy_med: 1, therapy_only: 1, other: 0 },
  grossBilledCents: 200000, expectedAllowedCents: 150000,
  insurancePaidCents: 80000, patientPaidCents: 20000, otherPaidCents: 5000,
  adjustmentsCents: 10000, refundsCents: 5000, businessNote: "",
};

const settings: Settings = {
  practiceName: "Test", planningBasis: "expected", enabledWeekdays: [1,2,3,4,5],
  targetClinicalDaysPerWeek: 5, maxCompletedVisitsPerDay: 10,
  weeklyPatientGoal: 35, monthlyPatientGoal: 150, weeklyNewPatientGoal: 5,
  monthlyNewPatientGoal: 20, weeklyRevenueGoalCents: 700000, monthlyRevenueGoalCents: 3000000,
  annualRevenueGoalCents: 36000000, forecastLookbackWeeks: 8, inactivityLockMinutes: 15,
  theme: "system",
  visitValues: { new_psych_eval: 35000, followup_med: 17500, therapy_med: 25000, therapy_only: 20000, other: 15000 },
  showTopBar: false, showMenuBar: false,
};

describe("completedVisits", () => {
  it("sums all visit type counts", () => expect(completedVisits(entry)).toBe(8)); // 2+4+1+1+0
  it("returns 0 when all codes are zero", () => {
    const e = { ...entry, visits: { new_psych_eval: 0, followup_med: 0, therapy_med: 0, therapy_only: 0, other: 0 } };
    expect(completedVisits(e)).toBe(0);
  });
  it("includes the other code", () => {
    expect(completedVisits({ ...entry, visits: { ...entry.visits, other: 3 } })).toBe(11);
  });
});

describe("financial analytics", () => {
  it("calculates net collected and outstanding in integer cents", () => {
    expect(netCollected(entry)).toBe(100000); // 80000+20000+5000-5000
    expect(outstanding(150000, 100000, 10000)).toBe(40000); // 150000-100000-10000
  });
  it("never reports negative outstanding", () => {
    expect(outstanding(5000, 10000, 0)).toBe(0);
    expect(outstanding(0, 50000, 0)).toBe(0);
  });
  it("refunds reduce net collected", () => {
    expect(netCollected({ ...entry, refundsCents: 110000 })).toBe(-5000);
  });
  it("handles zero denominators and goals", () => {
    expect(safeRate(1, 0)).toBeNull();
    expect(goalProgress(100, 0)).toBeNull();
  });
  it("calculates a non-null rate", () => expect(safeRate(3, 10)).toBeCloseTo(0.3));
  it("rounds visits needed upward", () => {
    expect(visitsRequired(1001, 500)).toBe(3);
    expect(visitsRequired(1000, 500)).toBe(2);
  });
  it("returns null when a visit has no value", () => expect(visitsRequired(1000, 0)).toBeNull());
  it("calculates capacity", () => {
    expect(capacity(5, 10)).toBe(50);
    expect(capacity(0, 10)).toBe(0);
  });
});

describe("summarize", () => {
  it("returns zeroed summary for empty input", () => {
    const s = summarize([]);
    expect(s.completed).toBe(0);
    expect(s.netCollectedCents).toBe(0);
    expect(s.outstandingCents).toBe(0);
  });
  it("aggregates a single entry", () => {
    const s = summarize([entry]);
    expect(s.scheduled).toBe(10);
    expect(s.completed).toBe(8);
    expect(s.newPatients).toBe(2);
    expect(s.followups).toBe(4);
    expect(s.cancellations).toBe(1);
    expect(s.noShows).toBe(1);
    expect(s.netCollectedCents).toBe(100000);
    expect(s.outstandingCents).toBe(40000);
  });
  it("aggregates entries reproducibly", () => {
    const s = summarize([entry, entry]);
    expect(s.completed).toBe(16);
    expect(s.newPatients).toBe(4);
    expect(s.netCollectedCents).toBe(200000);
    expect(s.outstandingCents).toBe(80000);
  });
  it("outstanding is never negative even when collections exceed expected", () => {
    const overpaid: DailyEntry = {
      ...entry, expectedAllowedCents: 10000,
      insurancePaidCents: 50000, patientPaidCents: 0, otherPaidCents: 0,
      refundsCents: 0, adjustmentsCents: 0,
    };
    expect(summarize([overpaid]).outstandingCents).toBe(0);
  });
});

describe("completedVisits -- edge cases", () => {
  it("counts only non-zero visit types", () => {
    const e = { ...entry, visits: { new_psych_eval: 0, followup_med: 0, therapy_med: 0, therapy_only: 0, other: 5 } };
    expect(completedVisits(e)).toBe(5);
  });

  it("handles very large visit counts without overflow", () => {
    const e = { ...entry, visits: { new_psych_eval: 10000, followup_med: 10000, therapy_med: 10000, therapy_only: 10000, other: 10000 } };
    expect(completedVisits(e)).toBe(50000);
  });

  it("returns 0 for an entry with scheduledCount > 0 but no completed visits", () => {
    const e = { ...entry, visits: { new_psych_eval: 0, followup_med: 0, therapy_med: 0, therapy_only: 0, other: 0 } };
    expect(completedVisits(e)).toBe(0);
  });
});

describe("safeRate -- edge cases", () => {
  it("returns 1.0 when part equals total", () => expect(safeRate(10, 10)).toBe(1));
  it("returns value > 1 when part exceeds total (walk-in scenario)", () => expect(safeRate(12, 10)).toBeCloseTo(1.2));
  it("returns null for both-zero input", () => expect(safeRate(0, 0)).toBeNull());
  it("returns 0.0 when part is zero and total is non-zero", () => expect(safeRate(0, 5)).toBe(0));
});

describe("netCollected -- edge cases", () => {
  it("returns negative when refunds exceed payments", () => {
    expect(netCollected({ insurancePaidCents: 100, patientPaidCents: 0, otherPaidCents: 0, refundsCents: 150 })).toBe(-50);
  });

  it("returns zero when all fields are zero", () => {
    expect(netCollected({ insurancePaidCents: 0, patientPaidCents: 0, otherPaidCents: 0, refundsCents: 0 })).toBe(0);
  });

  it("sums all three payment sources before subtracting refunds", () => {
    expect(netCollected({ insurancePaidCents: 50000, patientPaidCents: 10000, otherPaidCents: 5000, refundsCents: 5000 })).toBe(60000);
  });
});

describe("outstanding -- edge cases", () => {
  it("returns 0 when expected equals collected plus adjustments", () => {
    expect(outstanding(100000, 80000, 20000)).toBe(0);
  });

  it("returns 0 when collected exceeds expected (overpayment)", () => {
    expect(outstanding(50000, 100000, 0)).toBe(0);
  });

  it("clamps at 0 when adjustments alone exceed expected", () => {
    expect(outstanding(10000, 0, 20000)).toBe(0);
  });

  it("computes correctly with no adjustments", () => {
    expect(outstanding(200000, 150000, 0)).toBe(50000);
  });
});

describe("summarize -- additional coverage", () => {
  it("counts newPatients from new_psych_eval only", () => {
    const e = { ...entry, visits: { new_psych_eval: 7, followup_med: 0, therapy_med: 5, therapy_only: 0, other: 0 } };
    expect(summarize([e]).newPatients).toBe(7);
  });

  it("counts followups from followup_med only", () => {
    const e = { ...entry, visits: { new_psych_eval: 0, followup_med: 4, therapy_med: 3, therapy_only: 2, other: 1 } };
    expect(summarize([e]).followups).toBe(4);
  });

  it("sums cancellations and no-shows across entries", () => {
    const e2 = { ...entry, date: "2026-08-15", cancellationCount: 3, noShowCount: 2 };
    const s = summarize([entry, e2]);
    expect(s.cancellations).toBe(entry.cancellationCount + 3);
    expect(s.noShows).toBe(entry.noShowCount + 2);
  });

  it("sums gross billed and expected allowed across entries", () => {
    const e2 = { ...entry, date: "2026-08-15", grossBilledCents: 100000, expectedAllowedCents: 75000 };
    const s = summarize([entry, e2]);
    expect(s.grossBilledCents).toBe(entry.grossBilledCents + 100000);
    expect(s.expectedAllowedCents).toBe(entry.expectedAllowedCents + 75000);
  });

  it("outstandingCents does not go negative when one day is overpaid", () => {
    const overpaid = { ...entry, expectedAllowedCents: 1000, insurancePaidCents: 99999, patientPaidCents: 0, otherPaidCents: 0, refundsCents: 0, adjustmentsCents: 0 };
    const s = summarize([overpaid]);
    expect(s.outstandingCents).toBe(0);
  });

  it("calculates outstandingCents per-day before summing (prevents cross-day netting)", () => {
    // Day A: expected=100000, net=50000, adjustments=0 -> outstanding=50000
    // Day B: expected=10000, net=90000, adjustments=0 -> outstanding=0 (clamped)
    // Total = 50000, NOT 100000 - 90000 - 50000 = -40000
    const dayA = { ...entry, date: "2026-08-01", expectedAllowedCents: 100000, insurancePaidCents: 50000, patientPaidCents: 0, otherPaidCents: 0, refundsCents: 0, adjustmentsCents: 0 };
    const dayB = { ...entry, date: "2026-08-02", expectedAllowedCents: 10000, insurancePaidCents: 90000, patientPaidCents: 0, otherPaidCents: 0, refundsCents: 0, adjustmentsCents: 0 };
    expect(summarize([dayA, dayB]).outstandingCents).toBe(50000);
  });

  it("handles a single-entry list identically to operating on the entry directly", () => {
    const s = summarize([entry]);
    expect(s.netCollectedCents).toBe(netCollected(entry));
  });

  it("handles 100 identical entries without precision loss", () => {
    const many = Array.from({ length: 100 }, (_, i) =>
      ({ ...entry, date: `2026-${String(Math.floor(i / 31) + 1).padStart(2, "0")}-${String((i % 28) + 1).padStart(2, "0")}` })
    );
    const s = summarize(many);
    expect(s.completed).toBe(completedVisits(entry) * 100);
    expect(s.netCollectedCents).toBe(netCollected(entry) * 100);
  });
});

describe("planner", () => {
  it("returns zero gap and zero visits when current meets goal", () => {
    const p = planner(100000, 100000, [entry], settings);
    expect(p.gapCents).toBe(0);
    expect(p.visitsNeeded).toBe(0);
  });
  it("uses configured visit value average when history is sparse (< 10 entries)", () => {
    // (35000+17500+25000+20000+15000) / 5 = 22500
    const p = planner(200000, 100000, [entry], settings);
    expect(p.averageCents).toBe(22500);
    expect(p.gapCents).toBe(100000);
  });
  it("uses historical average once >= 10 entries exist", () => {
    // 10 entries × 8 completed = 80 total completed visits
    // current passed in = 100000, so historical avg = 100000 / 80 = 1250
    const entries = Array.from({ length: 10 }, (_, i) =>
      ({ ...entry, date: `2026-08-${String(i + 1).padStart(2, "0")}` })
    );
    const p = planner(200000, 100000, entries, settings);
    expect(p.averageCents).toBe(1250); // 100000 / 80
    expect(p.visitsNeeded).toBe(80); // ceil(100000 / 1250)
  });
  it("marks plan feasible within monthly capacity", () => {
    // need 1 visit, capacity = 5*10*4.345 ~ 217 visits/month
    const p = planner(122500, 100000, [entry], settings);
    expect(p.feasible).toBe(true);
  });
  it("marks plan infeasible when visits needed are astronomical", () => {
    const p = planner(1_000_000_000, 0, [entry], { ...settings, targetClinicalDaysPerWeek: 1, maxCompletedVisitsPerDay: 1 });
    expect(p.feasible).toBe(false);
  });
  it("exposes weekly capacity from settings", () => {
    const p = planner(0, 0, [], { ...settings, targetClinicalDaysPerWeek: 4, maxCompletedVisitsPerDay: 8 });
    expect(p.weeklyCapacity).toBe(32);
  });

  it("does not divide by zero when historical average rounds to 0", () => {
    // 10 entries × 1 completed = 10 total; current = 1 cent
    // historical = 1/10 = 0.1 (truthy) => Math.round(0.1) = 0
    // visitsRequired(gap, 0) must return null -- no division by zero
    const tiny = { ...entry, scheduledCount: 2, cancellationCount: 0, noShowCount: 0,
      visits: { new_psych_eval: 0, followup_med: 0, therapy_med: 0, therapy_only: 1, other: 0 } };
    const entries10 = Array.from({ length: 10 }, (_, i) =>
      ({ ...tiny, date: `2026-08-${String(i + 1).padStart(2, "0")}` })
    );
    const p = planner(100000, 1, entries10, settings);
    expect(p.averageCents).toBe(0);
    expect(p.visitsNeeded).toBeNull();
    expect(p.feasible).toBe(false);
    expect(() => planner(100000, 1, entries10, settings)).not.toThrow();
  });

  it("handles maxCompletedVisitsPerDay of 0 without throwing", () => {
    const p = planner(100000, 0, [entry], { ...settings, maxCompletedVisitsPerDay: 0 });
    expect(p.weeklyCapacity).toBe(0);
    expect(() => planner(100000, 0, [entry], { ...settings, maxCompletedVisitsPerDay: 0 })).not.toThrow();
  });
});
