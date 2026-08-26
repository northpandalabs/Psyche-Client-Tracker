import Database from "better-sqlite3";
import type { DailyEntry, Settings, VisitCode } from "../shared/types.js";

const defaultSettings: Settings = {
  practiceName: "My Practice", planningBasis: "expected", enabledWeekdays: [1,2,3,4,5], targetClinicalDaysPerWeek: 5,
  maxCompletedVisitsPerDay: 10, weeklyPatientGoal: 35, monthlyPatientGoal: 150, weeklyNewPatientGoal: 5,
  monthlyNewPatientGoal: 20, weeklyRevenueGoalCents: 700000, monthlyRevenueGoalCents: 3000000,
  annualRevenueGoalCents: 36000000, forecastLookbackWeeks: 8, inactivityLockMinutes: 15, theme: "system",
  visitValues: { new_psych_eval: 35000, followup_med: 17500, therapy_med: 25000, therapy_only: 20000, other: 15000 },
  showTopBar: false,
  showMenuBar: false,
};

export class AppDatabase {
  private db: Database.Database;
  constructor(path: string) { this.db = new Database(path); this.db.pragma("journal_mode = WAL"); this.migrate(); }
  private migrate() {
    this.db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS app_settings(id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL, password_hash TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS daily_stats(id INTEGER PRIMARY KEY, date TEXT NOT NULL UNIQUE, scheduled_count INTEGER NOT NULL CHECK(scheduled_count>=0), cancellation_count INTEGER NOT NULL CHECK(cancellation_count>=0), no_show_count INTEGER NOT NULL CHECK(no_show_count>=0), gross_billed_cents INTEGER NOT NULL CHECK(gross_billed_cents>=0), expected_allowed_cents INTEGER NOT NULL CHECK(expected_allowed_cents>=0), insurance_paid_cents INTEGER NOT NULL CHECK(insurance_paid_cents>=0), patient_paid_cents INTEGER NOT NULL CHECK(patient_paid_cents>=0), other_paid_cents INTEGER NOT NULL CHECK(other_paid_cents>=0), adjustments_cents INTEGER NOT NULL CHECK(adjustments_cents>=0), refunds_cents INTEGER NOT NULL CHECK(refunds_cents>=0), business_note TEXT NOT NULL CHECK(length(business_note)<=300), created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS daily_visit_counts(daily_stats_id INTEGER NOT NULL REFERENCES daily_stats(id) ON DELETE CASCADE, code TEXT NOT NULL, count INTEGER NOT NULL CHECK(count>=0), PRIMARY KEY(daily_stats_id,code));
      CREATE INDEX IF NOT EXISTS daily_stats_date_idx ON daily_stats(date);`);
    const now = new Date().toISOString();
    this.db.prepare("INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(1,?)").run(now);
    this.db.prepare("INSERT OR IGNORE INTO app_settings(id,json,created_at,updated_at) VALUES(1,?,?,?)").run(JSON.stringify(defaultSettings), now, now);
  }
  settings(): Settings { const raw=JSON.parse((this.db.prepare("SELECT json FROM app_settings WHERE id=1").get() as {json:string}).json); return {...defaultSettings,...raw} as Settings; }
  saveSettings(value: Settings) { this.db.prepare("UPDATE app_settings SET json=?,updated_at=? WHERE id=1").run(JSON.stringify(value), new Date().toISOString()); }
  passwordHash(): string | null { return (this.db.prepare("SELECT password_hash FROM app_settings WHERE id=1").get() as {password_hash:string|null}).password_hash; }
  setPasswordHash(hash: string) { this.db.prepare("UPDATE app_settings SET password_hash=?,updated_at=? WHERE id=1").run(hash,new Date().toISOString()); }
  saveEntry(entry: DailyEntry) { this.db.transaction(() => {
    const now = new Date().toISOString();
    this.db.prepare(`INSERT INTO daily_stats(date,scheduled_count,cancellation_count,no_show_count,gross_billed_cents,expected_allowed_cents,insurance_paid_cents,patient_paid_cents,other_paid_cents,adjustments_cents,refunds_cents,business_note,created_at,updated_at) VALUES(@date,@scheduled,@cancel,@noShow,@gross,@expected,@insurance,@patient,@other,@adjustments,@refunds,@note,@now,@now)
      ON CONFLICT(date) DO UPDATE SET scheduled_count=@scheduled,cancellation_count=@cancel,no_show_count=@noShow,gross_billed_cents=@gross,expected_allowed_cents=@expected,insurance_paid_cents=@insurance,patient_paid_cents=@patient,other_paid_cents=@other,adjustments_cents=@adjustments,refunds_cents=@refunds,business_note=@note,updated_at=@now`).run({date:entry.date,scheduled:entry.scheduledCount,cancel:entry.cancellationCount,noShow:entry.noShowCount,gross:entry.grossBilledCents,expected:entry.expectedAllowedCents,insurance:entry.insurancePaidCents,patient:entry.patientPaidCents,other:entry.otherPaidCents,adjustments:entry.adjustmentsCents,refunds:entry.refundsCents,note:entry.businessNote,now});
    const id=(this.db.prepare("SELECT id FROM daily_stats WHERE date=?").get(entry.date) as {id:number}).id;
    const stmt=this.db.prepare("INSERT INTO daily_visit_counts(daily_stats_id,code,count) VALUES(?,?,?) ON CONFLICT(daily_stats_id,code) DO UPDATE SET count=excluded.count");
    for(const [code,count] of Object.entries(entry.visits)) stmt.run(id,code,count);
  })(); }
  entries(from?: string, to?: string): DailyEntry[] {
    const rows=(from&&to?this.db.prepare("SELECT * FROM daily_stats WHERE date BETWEEN ? AND ? ORDER BY date").all(from,to):this.db.prepare("SELECT * FROM daily_stats ORDER BY date").all()) as Record<string,unknown>[];
    const counts=this.db.prepare("SELECT code,count FROM daily_visit_counts WHERE daily_stats_id=?");
    return rows.map(r=>{const visits={new_psych_eval:0,followup_med:0,therapy_med:0,therapy_only:0,other:0}; for(const v of counts.all(r.id) as {code:VisitCode,count:number}[]) visits[v.code]=v.count;
      return {date:String(r.date),scheduledCount:Number(r.scheduled_count),cancellationCount:Number(r.cancellation_count),noShowCount:Number(r.no_show_count),visits,grossBilledCents:Number(r.gross_billed_cents),expectedAllowedCents:Number(r.expected_allowed_cents),insurancePaidCents:Number(r.insurance_paid_cents),patientPaidCents:Number(r.patient_paid_cents),otherPaidCents:Number(r.other_paid_cents),adjustmentsCents:Number(r.adjustments_cents),refundsCents:Number(r.refunds_cents),businessNote:String(r.business_note)};});
  }
  purgeData() {
    const now = new Date().toISOString();
    this.db.transaction(() => {
      this.db.exec("DELETE FROM daily_stats");
      this.db.prepare("UPDATE app_settings SET json=?,updated_at=? WHERE id=1").run(JSON.stringify(defaultSettings), now);
    })();
  }
  close(){this.db.close();}
}
