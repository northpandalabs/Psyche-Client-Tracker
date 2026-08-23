import { describe, expect, it } from "vitest";
import { capacity, goalProgress, netCollected, outstanding, safeRate, summarize, visitsRequired } from "./analytics";
import type { DailyEntry } from "../shared/types";

const entry: DailyEntry={date:"2026-08-14",scheduledCount:10,cancellationCount:1,noShowCount:1,visits:{new_psych_eval:2,followup_med:4,therapy_med:1,therapy_only:1,other:0},grossBilledCents:200000,expectedAllowedCents:150000,insurancePaidCents:80000,patientPaidCents:20000,otherPaidCents:5000,adjustmentsCents:10000,refundsCents:5000,businessNote:""};
describe("financial analytics",()=>{
 it("calculates net collected and outstanding in integer cents",()=>{expect(netCollected(entry)).toBe(100000);expect(outstanding(150000,100000,10000)).toBe(40000)});
 it("never reports negative outstanding",()=>expect(outstanding(5000,10000,0)).toBe(0));
 it("handles zero denominators and goals",()=>{expect(safeRate(1,0)).toBeNull();expect(goalProgress(100,0)).toBeNull()});
 it("rounds visits needed upward",()=>expect(visitsRequired(1001,500)).toBe(3));
 it("returns null when a visit has no value",()=>expect(visitsRequired(1000,0)).toBeNull());
 it("calculates capacity",()=>expect(capacity(5,10)).toBe(50));
 it("aggregates entries reproducibly",()=>{const result=summarize([entry,entry]);expect(result.completed).toBe(16);expect(result.newPatients).toBe(4);expect(result.netCollectedCents).toBe(200000);expect(result.outstandingCents).toBe(80000)});
});
