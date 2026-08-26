// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AppDatabase } from "./database";
import type { DailyEntry, Settings } from "../shared/types";

const makeEntry = (date: string, overrides: Partial<DailyEntry> = {}): DailyEntry => ({
  date,
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
  ...overrides,
});

let db: AppDatabase;
beforeEach(() => { db = new AppDatabase(":memory:"); });
afterEach(() => { db.close(); });

describe("default state", () => {
  it("has no entries on a fresh database", () => {
    expect(db.entries()).toHaveLength(0);
  });

  it("returns merged defaults for settings", () => {
    const s = db.settings();
    expect(s.practiceName).toBe("My Practice");
    expect(s.showTopBar).toBe(false);
    expect(s.showMenuBar).toBe(false);
    expect(s.targetClinicalDaysPerWeek).toBe(5);
  });

  it("has no password hash set initially", () => {
    expect(db.passwordHash()).toBeNull();
  });
});

describe("saveEntry / entries roundtrip", () => {
  it("saves and retrieves a single entry", () => {
    const entry = makeEntry("2026-08-01");
    db.saveEntry(entry);
    const rows = db.entries();
    expect(rows).toHaveLength(1);
    expect(rows[0].date).toBe("2026-08-01");
    expect(rows[0].scheduledCount).toBe(10);
    expect(rows[0].visits.new_psych_eval).toBe(2);
    expect(rows[0].visits.followup_med).toBe(3);
    expect(rows[0].grossBilledCents).toBe(200000);
    expect(rows[0].businessNote).toBe("");
  });

  it("saves multiple entries ordered by date", () => {
    db.saveEntry(makeEntry("2026-08-03"));
    db.saveEntry(makeEntry("2026-08-01"));
    db.saveEntry(makeEntry("2026-08-02"));
    const rows = db.entries();
    expect(rows.map(r => r.date)).toEqual(["2026-08-01", "2026-08-02", "2026-08-03"]);
  });

  it("upserts when saving the same date twice", () => {
    db.saveEntry(makeEntry("2026-08-01", { scheduledCount: 5 }));
    db.saveEntry(makeEntry("2026-08-01", { scheduledCount: 12 }));
    const rows = db.entries();
    expect(rows).toHaveLength(1);
    expect(rows[0].scheduledCount).toBe(12);
  });

  it("upsert also updates visit counts", () => {
    db.saveEntry(makeEntry("2026-08-01", { visits: { new_psych_eval: 1, followup_med: 0, therapy_med: 0, therapy_only: 0, other: 0 } }));
    db.saveEntry(makeEntry("2026-08-01", { visits: { new_psych_eval: 0, followup_med: 4, therapy_med: 0, therapy_only: 0, other: 0 } }));
    const rows = db.entries();
    expect(rows[0].visits.new_psych_eval).toBe(0);
    expect(rows[0].visits.followup_med).toBe(4);
  });

  it("preserves all visit code counts", () => {
    const visits = { new_psych_eval: 1, followup_med: 2, therapy_med: 3, therapy_only: 4, other: 5 };
    db.saveEntry(makeEntry("2026-08-01", { scheduledCount: 20, visits }));
    expect(db.entries()[0].visits).toEqual(visits);
  });

  it("saves and retrieves a business note", () => {
    db.saveEntry(makeEntry("2026-08-01", { businessNote: "Busy Monday." }));
    expect(db.entries()[0].businessNote).toBe("Busy Monday.");
  });
});

describe("date range filtering", () => {
  beforeEach(() => {
    ["2026-07-31", "2026-08-01", "2026-08-15", "2026-08-31", "2026-09-01"].forEach(d =>
      db.saveEntry(makeEntry(d))
    );
  });

  it("returns only entries within the inclusive date range", () => {
    const rows = db.entries("2026-08-01", "2026-08-31");
    expect(rows.map(r => r.date)).toEqual(["2026-08-01", "2026-08-15", "2026-08-31"]);
  });

  it("returns no entries when range has no matches", () => {
    expect(db.entries("2026-10-01", "2026-10-31")).toHaveLength(0);
  });

  it("returns all entries when no range is given", () => {
    expect(db.entries()).toHaveLength(5);
  });
});

describe("settings persistence", () => {
  it("persists saved settings", () => {
    const s = db.settings();
    db.saveSettings({ ...s, practiceName: "My Clinic", monthlyRevenueGoalCents: 5000000 });
    const updated = db.settings();
    expect(updated.practiceName).toBe("My Clinic");
    expect(updated.monthlyRevenueGoalCents).toBe(5000000);
  });

  it("merges defaults for fields not present in stored json", () => {
    // Simulate an older stored settings blob missing showMenuBar.
    const s = db.settings();
    const withoutMenuBar = { ...s } as Record<string, unknown>;
    delete withoutMenuBar["showMenuBar"];
    db.saveSettings(withoutMenuBar as unknown as Settings);
    expect(db.settings().showMenuBar).toBe(false);
  });
});

describe("password hash", () => {
  it("stores and retrieves a password hash", () => {
    db.setPasswordHash("$2b$12$fakehash");
    expect(db.passwordHash()).toBe("$2b$12$fakehash");
  });

  it("returns null before any hash is set", () => {
    expect(db.passwordHash()).toBeNull();
  });
});

describe("purgeData", () => {
  it("removes all entries", () => {
    db.saveEntry(makeEntry("2026-08-01"));
    db.saveEntry(makeEntry("2026-08-02"));
    db.purgeData();
    expect(db.entries()).toHaveLength(0);
  });

  it("resets settings to defaults", () => {
    db.saveSettings({ ...db.settings(), practiceName: "Custom Clinic", showTopBar: true });
    db.purgeData();
    expect(db.settings().practiceName).toBe("My Practice");
    expect(db.settings().showTopBar).toBe(false);
  });

  it("does not clear the password hash", () => {
    db.setPasswordHash("$2b$12$keepme");
    db.purgeData();
    expect(db.passwordHash()).toBe("$2b$12$keepme");
  });

  it("purging an already empty database is a no-op", () => {
    expect(() => db.purgeData()).not.toThrow();
    expect(db.entries()).toHaveLength(0);
  });
});
