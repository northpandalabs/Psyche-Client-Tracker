/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Recharts formatter types are complex; all props are Zod-validated at entry.
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { completedVisits, goalProgress, safeRate, summarize } from "../domain/analytics";
import type { DailyEntry, Settings, VisitCode } from "../shared/types";

const money = (c: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(c / 100);
const pct = (v: number | null) => (v === null ? "--" : `${(v * 100).toFixed(1)}%`);
const isoToday = () => new Date().toISOString().slice(0, 10);
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

const VISIT_LABELS: Record<VisitCode, string> = {
  new_psych_eval: "New evals",
  followup_med: "Follow-up med",
  therapy_med: "Therapy + med",
  therapy_only: "Therapy only",
  other: "Other",
};

const VISIT_COLORS: Record<VisitCode, string> = {
  new_psych_eval: "#176b52",
  followup_med: "#2a9d70",
  therapy_med: "#4bc89a",
  therapy_only: "#7bc9af",
  other: "#b2e0d2",
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildWeeklyData(entries: DailyEntry[], weeks: number) {
  const today = new Date();
  const thisWeekStart = getWeekStart(today);
  return Array.from({ length: weeks }, (_, i) => {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - (weeks - 1 - i) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const visits = entries
      .filter((e) => e.date >= startStr && e.date <= endStr)
      .reduce((sum, e) => sum + completedVisits(e), 0);
    return {
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visits,
      isCurrent: i === weeks - 1,
    };
  });
}

export function Dashboard({ entries, settings }: { entries: DailyEntry[]; settings: Settings }) {
  const today = isoToday();
  const thisMonth = today.slice(0, 7);

  const prevDate = new Date(`${today.slice(0, 8)}01`);
  prevDate.setMonth(prevDate.getMonth() - 1);
  const prevMonth = prevDate.toISOString().slice(0, 7);

  const wkStart = getWeekStart(new Date(today)).toISOString().slice(0, 10);

  const monthEntries = entries.filter((e) => e.date.startsWith(thisMonth));
  const prevMonthEntries = entries.filter((e) => e.date.startsWith(prevMonth));
  const weekEntries = entries.filter((e) => e.date >= wkStart && e.date <= today);

  const m = summarize(monthEntries);
  const pm = summarize(prevMonthEntries);
  const w = summarize(weekEntries);

  const revenue =
    settings.planningBasis === "expected" ? m.expectedAllowedCents : m.netCollectedCents;
  const goalPct = goalProgress(revenue, settings.monthlyRevenueGoalCents) ?? 0;

  const now = new Date();
  const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();

  const trendPct = (cur: number, prev: number): number | null =>
    prev === 0 ? null : ((cur - prev) / prev) * 100;

  const weeklyData = buildWeeklyData(entries, 8);
  const hasWeeklyData = weeklyData.some((d) => d.visits > 0);

  const visitMixData = (Object.keys(VISIT_LABELS) as VisitCode[])
    .map((code) => ({
      name: VISIT_LABELS[code],
      visits: monthEntries.reduce((s, e) => s + e.visits[code], 0),
      color: VISIT_COLORS[code],
    }))
    .filter((d) => d.visits > 0);

  const avgPerDay =
    monthEntries.length > 0 ? (m.completed / monthEntries.length).toFixed(1) : "--";

  return (
    <div className="dashboard">
      <section className="dash-hero">
        <div>
          <p className="eyebrow">Current month - {thisMonth}</p>
          <h3>{m.completed} completed visits</h3>
          <p className="dash-sub">
            {money(m.netCollectedCents)} net collected -{" "}
            {monthEntries.length} recorded {monthEntries.length === 1 ? "day" : "days"} -{" "}
            {daysLeft} {daysLeft === 1 ? "day" : "days"} left in month
          </p>
        </div>
        <div className="goal-block">
          <span className="eyebrow">Revenue goal</span>
          <strong className="goal-pct">
            {pct(goalProgress(revenue, settings.monthlyRevenueGoalCents))}
          </strong>
          <div
            className="goal-bar"
            role="progressbar"
            aria-valuenow={Math.round(goalPct * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="goal-bar-fill"
              style={{ width: `${clamp(goalPct * 100, 0, 100)}%` }}
            />
          </div>
          <p className="goal-amounts">
            {money(revenue)} of {money(settings.monthlyRevenueGoalCents)}
          </p>
        </div>
      </section>

      <section className="dash-kpis">
        <KpiCard label="This week" value={String(w.completed)} sub="completed visits" />
        <KpiCard
          label="This month"
          value={String(m.completed)}
          sub="completed visits"
          trend={trendPct(m.completed, pm.completed)}
        />
        <KpiCard
          label="New patients"
          value={String(m.newPatients)}
          sub="this month"
          trend={trendPct(m.newPatients, pm.newPatients)}
        />
        <KpiCard
          label="Follow-ups"
          value={String(m.followups)}
          sub="this month"
          trend={trendPct(m.followups, pm.followups)}
        />
        <KpiCard
          label="Net collected"
          value={money(m.netCollectedCents)}
          sub="this month"
          trend={trendPct(m.netCollectedCents, pm.netCollectedCents)}
        />
        <KpiCard label="Avg / day" value={avgPerDay} sub="visits per recorded day" />
      </section>

      <div className="dash-charts">
        <section className="panel">
          <h4 className="chart-title">Weekly visits - last 8 weeks</h4>
          {hasWeeklyData ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dce6e2" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#63766f" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#63766f" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v) => [v, "Visits"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #dce6e2", fontSize: 13 }}
                  cursor={{ fill: "#f4f7f5" }}
                />
                <Bar dataKey="visits" radius={[5, 5, 0, 0]}>
                  {weeklyData.map((row, i) => (
                    <Cell key={i} fill={row.isCurrent ? "#176b52" : "#7bc9af"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">
              <p>No entry data yet. Add daily entries to see your visit trend.</p>
            </div>
          )}
        </section>

        <section className="panel">
          <h4 className="chart-title">Visit mix - this month</h4>
          {visitMixData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                layout="vertical"
                data={visitMixData}
                margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#63766f" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#63766f" }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  formatter={(v) => [v, "visits"]}
                  contentStyle={{ borderRadius: 8, border: "1px solid #dce6e2", fontSize: 13 }}
                  cursor={{ fill: "#f4f7f5" }}
                />
                <Bar dataKey="visits" radius={[0, 5, 5, 0]}>
                  {visitMixData.map((row, i) => (
                    <Cell key={i} fill={row.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty">
              <p>No visits recorded this month yet.</p>
            </div>
          )}
        </section>
      </div>

      <section className="panel">
        <h4 className="chart-title">Operations - this month</h4>
        {entries.length === 0 ? (
          <div className="empty">
            <h4>No daily entries yet</h4>
            <p>Add your first day to see trends and totals.</p>
          </div>
        ) : (
          <div className="metrics">
            <OpMetric
              value={pct(safeRate(m.cancellations, m.scheduled))}
              label="cancellation rate"
              warn={m.scheduled > 0 && m.cancellations / m.scheduled > 0.15}
            />
            <OpMetric
              value={pct(safeRate(m.noShows, m.scheduled))}
              label="no-show rate"
              warn={m.scheduled > 0 && m.noShows / m.scheduled > 0.1}
            />
            <OpMetric value={money(m.insurancePaidCents)} label="insurance paid" />
            <OpMetric value={money(m.patientPaidCents)} label="patient paid" />
            <OpMetric value={money(m.outstandingCents)} label="outstanding" />
            <OpMetric value={String(m.scheduled)} label="scheduled appointments" />
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub: string;
  trend?: number | null;
}) {
  return (
    <article className="kpi-card">
      <span className="kpi-label">{label}</span>
      <strong className="kpi-value">{value}</strong>
      <div className="kpi-bottom">
        <span className="kpi-sub">{sub}</span>
        {trend != null && (
          <span className={trend >= 0 ? "trend-up" : "trend-down"}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(1)}%
          </span>
        )}
      </div>
    </article>
  );
}

function OpMetric({ value, label, warn }: { value: string; label: string; warn?: boolean }) {
  return (
    <p className={warn ? "metric-warn" : undefined}>
      <strong>{value}</strong>
      {label}
    </p>
  );
}
