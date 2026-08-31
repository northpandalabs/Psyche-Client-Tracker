/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- IPC payloads are independently validated with strict Zod schemas.
const LogoMark=({size=40})=><svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="48" rx="9" fill="#154c3c"/><rect x="7" y="28" width="9" height="13" rx="2" fill="rgba(255,255,255,0.22)"/><rect x="20" y="21" width="9" height="20" rx="2" fill="rgba(255,255,255,0.52)"/><rect x="33" y="14" width="9" height="27" rx="2" fill="white"/><polyline points="11.5,24 24.5,17 37.5,10" stroke="#7bc9af" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/><circle cx="37.5" cy="10" r="3.5" fill="#7bc9af"/></svg>;
import { useEffect, useState } from "react";
import { completedVisits, planner, safeRate, summarize } from "../domain/analytics";
import type { DailyEntry, Settings, VisitCode } from "../shared/types";
import "./styles.css";
import { Dashboard } from "./Dashboard";

const visitLabels: Record<VisitCode,string>={new_psych_eval:"New psychiatric evaluations",followup_med:"Follow-up medication management",therapy_med:"Therapy + medication management",therapy_only:"Therapy only",other:"Other completed visits"};
const isoToday=()=>new Date().toISOString().slice(0,10);
const emptyEntry=(date=isoToday()):DailyEntry=>({date,scheduledCount:0,cancellationCount:0,noShowCount:0,visits:{new_psych_eval:0,followup_med:0,therapy_med:0,therapy_only:0,other:0},grossBilledCents:0,expectedAllowedCents:0,insurancePaidCents:0,patientPaidCents:0,otherPaidCents:0,adjustmentsCents:0,refundsCents:0,businessNote:""});
const money=(c:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(c/100);
const percent=(v:number|null)=>v===null?"—":`${(v*100).toFixed(1)}%`;
const toCents=(v:string)=>Math.round((Number(v)||0)*100);
const formatDate=(iso:string)=>{const d=new Date(iso+"T00:00:00");return d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});};
const netOf=(e:DailyEntry)=>e.insurancePaidCents+e.patientPaidCents+e.otherPaidCents-e.refundsCents;

export function App(){
 const api=window.practiceApi; const [auth,setAuth]=useState<{configured:boolean,unlocked:boolean}|null>(api?null:{configured:true,unlocked:true});
 const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [page,setPage]=useState("Dashboard");
 const [entries,setEntries]=useState<DailyEntry[]>([]); const [settings,setSettings]=useState<Settings|null>(null); const [entry,setEntry]=useState(emptyEntry());
 const [updateInfo,setUpdateInfo]=useState<{version:string;url:string}|null>(null); const [updateDismissed,setUpdateDismissed]=useState(false); const [dirty,setDirty]=useState(false);
 const refresh=async()=>{if(api){setEntries(await api.entries.list());setSettings(await api.settings.get());}};
 useEffect(()=>{void api?.auth.status().then(setAuth)},[api]); useEffect(()=>{if(auth?.unlocked)void refresh()},[auth?.unlocked]);
 useEffect(()=>{if(!auth?.unlocked||!api)return;void api.update.check().then(info=>{if(info)setUpdateInfo(info);});const id=setInterval(async()=>{const info=await api.update.status();if(info)setUpdateInfo(info);},2*60*1000);return()=>clearInterval(id);},[auth?.unlocked]);
 useEffect(()=>{if(!settings)return;const apply=(t:string)=>{if(t==="dark")document.documentElement.dataset.theme="dark";else if(t==="light")document.documentElement.dataset.theme="light";else delete document.documentElement.dataset.theme;};if(settings.theme!=="system"){apply(settings.theme);return;}const mq=window.matchMedia("(prefers-color-scheme: dark)");const onChange=()=>apply(mq.matches?"dark":"light");onChange();mq.addEventListener("change",onChange);return()=>mq.removeEventListener("change",onChange);},[settings?.theme]);
 useEffect(()=>{if(!auth?.unlocked||!settings||!api)return;let last=Date.now();const mark=()=>{last=Date.now();};window.addEventListener("mousemove",mark);window.addEventListener("keydown",mark);const id=setInterval(()=>{if(Date.now()-last>=settings.inactivityLockMinutes*60*1000){clearInterval(id);void api.auth.lock().then(()=>setAuth({configured:true,unlocked:false}));}},30000);return()=>{window.removeEventListener("mousemove",mark);window.removeEventListener("keydown",mark);clearInterval(id);};},[auth?.unlocked,settings?.inactivityLockMinutes]);
 const authenticate=async()=>{try{setError("");if(!api)return;const ok=auth?.configured?await api.auth.unlock(password):await api.auth.setup(password);if(!ok)throw new Error("That password was not accepted.");setAuth({configured:true,unlocked:true});setPassword("");}catch(e){setPassword("");setError(e instanceof Error?e.message:"Unable to continue.");}};
 if(!auth)return <main className="center">Opening your local database…</main>;
 if(!auth.unlocked)return <main className="center"><section className="auth"><div className="logo"><LogoMark size={44}/></div><h1>{auth.configured?"Welcome back":"Set up Practice Analytics"}</h1><p>{auth.configured?"Enter your local password to unlock your data.":"Create a password of at least 10 characters. There is no email recovery."}</p><label>Password<input autoFocus type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")void authenticate()}}/></label>{error&&<p className="error" role="alert">{error}</p>}<button onClick={()=>void authenticate()}>{auth.configured?"Unlock":"Create password"}</button></section></main>;
 if(!settings)return <main className="center">Loading…</main>;
 const save=async()=>{try{setError("");await api?.entries.save(entry);await refresh();setDirty(false);setPage("Dashboard");}catch(e){setError(e instanceof Error?e.message:"Could not save.");}};
 const chooseDate=(date:string)=>{if(dirty&&date!==entry.date){if(!confirm("You have unsaved changes. Switch without saving?"))return;}setEntry(entries.find(e=>e.date===date)??emptyEntry(date));setDirty(false);};
 const updateEntry=(e:DailyEntry)=>{setEntry(e);setDirty(true);};
 const nav=["Dashboard","Daily Entry","Weekly / Monthly","Revenue Planner","Analytics","Import / Export","Backup / Restore","Settings","About"];
 return <div className="shell"><aside><div className="brand"><LogoMark size={36}/><h1>Practice<br/><span>Analytics</span></h1></div><nav>{nav.map(n=><button className={page===n?"active":""} onClick={()=>{if(page==="Daily Entry"&&dirty&&n!=="Daily Entry"){if(!confirm("You have unsaved changes. Leave without saving?"))return;setDirty(false);}setPage(n);}} key={n}>{n}</button>)}</nav><button className="lock" onClick={async()=>{await api?.auth.lock();setAuth({configured:true,unlocked:false})}}>Lock application</button></aside><main className="content">{settings.showTopBar!==false&&<header className="top"><div><p className="eyebrow">{settings.practiceName}</p><h2>{page}</h2></div><button className="secondary" onClick={()=>{setEntry(emptyEntry());setPage("Daily Entry")}}>+ Add daily entry</button></header>}{error&&<p className="error" role="alert">{error}</p>}
 {updateInfo&&!updateDismissed&&<UpdateBanner info={updateInfo} api={api} onDismiss={()=>setUpdateDismissed(true)}/>}
 {page==="Dashboard"&&<Dashboard entries={entries} settings={settings}/>} {page==="Daily Entry"&&<EntryForm entries={entries} entry={entry} setEntry={updateEntry} save={save} existing={entries.some(e=>e.date===entry.date)} chooseDate={chooseDate}/>} {page==="Weekly / Monthly"&&<Periods entries={entries} onEdit={d=>{chooseDate(d);setPage("Daily Entry");}}/>} {page==="Revenue Planner"&&<Planner entries={entries} settings={settings}/>} {page==="Analytics"&&<Analytics entries={entries} settings={settings}/>} {page==="Settings"&&<SettingsPage value={settings} save={async s=>{await api?.settings.save(s);setSettings(s)}}/>} {page==="About"&&<AboutPage api={api} updateInfo={updateInfo} onPurge={async()=>{await refresh();setSettings(await api?.settings.get() as Settings);setPage("Dashboard");}}/>} {page==="Import / Export"&&<Action title="Export aggregate data" text="Create a portable CSV of counts and financial totals. Business notes are excluded." button="Choose CSV destination" action={()=>api?.exportCsv()}/>} {page==="Backup / Restore"&&<Action title="Create a local backup" text="Choose a private destination and retain multiple dated backups." button="Create backup" action={()=>api?.createBackup()}/>}</main></div>;
}

const Metric=({value,label}:{value:string,label:string})=><p><strong>{value}</strong>{label}</p>;
const NumberField=({label,value,onChange}:{label:string,value:number,onChange:(v:number)=>void})=><label>{label}<input type="number" min="0" step="1" value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;

function EntryForm({entries,entry,setEntry,save,existing,chooseDate}:{entries:DailyEntry[],entry:DailyEntry,setEntry:(e:DailyEntry)=>void,save:()=>void,existing:boolean,chooseDate:(d:string)=>void}){
  const recent=[...entries].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,12);
  const count=(key:keyof DailyEntry,label:string)=><NumberField label={label} value={entry[key] as number} onChange={v=>setEntry({...entry,[key]:v})}/>;
  const finances:[keyof DailyEntry,string][]=[["grossBilledCents","Gross billed"],["expectedAllowedCents","Expected / allowed"],["insurancePaidCents","Insurance paid"],["patientPaidCents","Patient paid"],["otherPaidCents","Other paid"],["adjustmentsCents","Adjustments / write-offs"],["refundsCents","Refunds"]];
  return <div className="entry-layout">
    <form className="panel form" onSubmit={e=>{e.preventDefault();save()}}>
      <div className="formhead"><div><h3>{existing?"Editing existing day":"New daily entry"}</h3><p>Enter aggregate totals only.</p></div><label>Date<input type="date" value={entry.date} onChange={e=>chooseDate(e.target.value)}/></label></div>
      <h4>Appointments</h4>
      <div className="fields">{count("scheduledCount","Scheduled appointments")}{Object.entries(visitLabels).map(([code,label])=><NumberField key={code} label={label} value={entry.visits[code as VisitCode]} onChange={v=>setEntry({...entry,visits:{...entry.visits,[code]:v}})}/>)}{count("cancellationCount","Cancellations")}{count("noShowCount","No-shows")}</div>
      <p className="notice">Completed: <strong>{completedVisits(entry)}</strong> &middot; Completion rate: <strong>{percent(safeRate(completedVisits(entry),entry.scheduledCount))}</strong></p>
      <h4>Financials</h4>
      <div className="fields">{finances.map(([key,label])=><label key={key}>{label}<span className="currency">$<input type="number" min="0" step="0.01" value={(entry[key] as number)/100} onChange={e=>setEntry({...entry,[key]:toCents(e.target.value)})}/></span></label>)}</div>
      <label className="wide"><strong>Do not enter patient names or other patient-identifying information.</strong>Optional business note<textarea maxLength={300} value={entry.businessNote} onChange={e=>setEntry({...entry,businessNote:e.target.value})}/></label>
      <button type="submit">Save day</button>
    </form>
    <aside className="entry-history panel">
      <p className="eyebrow" style={{margin:"0 0 12px"}}>Recent entries</p>
      {recent.length===0
        ?<p className="empty" style={{padding:"16px 0"}}>No entries yet.</p>
        :recent.map(r=><button key={r.date} type="button" className={"entry-hist-row"+(r.date===entry.date?" active":"")} onClick={()=>chooseDate(r.date)}>
          <span className="entry-hist-date">{formatDate(r.date)}</span>
          <span className="entry-hist-detail">{completedVisits(r)} visits &middot; {money(netOf(r))}</span>
        </button>)
      }
    </aside>
  </div>;
}
function Periods({entries,onEdit}:{entries:DailyEntry[],onEdit?:(d:string)=>void}){
  const [month,setMonth]=useState(isoToday().slice(0,7));
  const monthEntries=[...entries.filter(e=>e.date.startsWith(month))].sort((a,b)=>b.date.localeCompare(a.date));
  const s=summarize(monthEntries);
  return <section className="panel">
    <label>Month<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label>
    <h3>{s.completed} completed visits</h3>
    <div className="metrics">
      <Metric value={String(s.scheduled)} label="scheduled"/>
      <Metric value={String(s.newPatients)} label="new patients"/>
      <Metric value={String(s.followups)} label="follow-ups"/>
      <Metric value={money(s.netCollectedCents)} label="net collected"/>
      {s.outstandingCents>0?<Metric value={money(s.outstandingCents)} label="outstanding"/>:<Metric value="Fully collected" label="balance"/>}
    </div>
    <h4 style={{borderTop:"1px solid #dce6e2",paddingTop:18,marginTop:22}}>Daily entries</h4>
    {monthEntries.length===0
      ?<p className="empty">No entries recorded for this month.</p>
      :<table className="entry-log">
        <thead><tr><th>Date</th><th>Scheduled</th><th>Completed</th><th>Rate</th><th>Net collected</th>{onEdit&&<th></th>}</tr></thead>
        <tbody>{monthEntries.map(e=><tr key={e.date}>
          <td>{formatDate(e.date)}</td>
          <td>{e.scheduledCount}</td>
          <td>{completedVisits(e)}</td>
          <td>{percent(safeRate(completedVisits(e),e.scheduledCount))}</td>
          <td>{money(netOf(e))}</td>
          {onEdit&&<td><button type="button" className="secondary" style={{padding:"4px 12px",fontSize:".8rem"}} onClick={()=>onEdit(e.date)}>Edit</button></td>}
        </tr>)}</tbody>
      </table>
    }
  </section>;
}
function Planner({entries,settings}:{entries:DailyEntry[],settings:Settings}){const [goal,setGoal]=useState(settings.monthlyRevenueGoalCents);const s=summarize(entries),current=settings.planningBasis==="expected"?s.expectedAllowedCents:s.netCollectedCents,p=planner(goal,current,entries,settings);return <section className="panel"><p className="eyebrow">Business-planning estimate</p><h3>Revenue target</h3><p className="notice" style={{marginBottom:12,fontSize:".88rem"}}>Using: <strong>{settings.planningBasis==="expected"?"Expected / allowed":"Actually collected"}</strong></p><label>Target amount<span className="currency">$<input type="number" min="0" value={goal/100} onChange={e=>setGoal(toCents(e.target.value))}/></span></label><section className="cards"><article><span>Revenue gap</span><strong>{money(p.gapCents)}</strong></article><article><span>Average per visit</span><strong>{money(p.averageCents)}</strong></article><article><span>Additional visits</span><strong>{p.visitsNeeded??"—"}</strong></article><article><span>Capacity check</span><strong>{p.feasible?"Within capacity":"Above capacity"}</strong></article></section><p className="notice">Mathematical estimate for business planning, not clinical scheduling advice.</p></section>}
function Analytics({entries,settings}:{entries:DailyEntry[],settings:Settings}){const s=summarize(entries),forecast=Math.round(s.completed/Math.max(entries.length,1)*settings.targetClinicalDaysPerWeek*4);return <section className="panel"><p className="eyebrow">Forecast · {settings.forecastLookbackWeeks}-week lookback</p><h3>Next month: approximately {entries.length?forecast:0} completed visits</h3><p className="notice">Quality: {entries.length>=40?"Moderate":"Limited"}. This local forecast is an estimate, not a guarantee.</p><div className="metrics"><Metric value={percent(safeRate(s.cancellations,s.scheduled))} label="cancellation rate"/><Metric value={percent(safeRate(s.noShows,s.scheduled))} label="no-show rate"/><Metric value={percent(safeRate(s.insurancePaidCents,s.netCollectedCents))} label="insurance share"/></div></section>}
function SettingsPage({value,save}:{value:Settings,save:(s:Settings)=>Promise<void>}){const [s,setS]=useState(value);return <form className="panel form" onSubmit={e=>{e.preventDefault();void save(s)}}><h3>Display</h3><div className="fields"><label className="toggle-row"><span>Show top bar<small>Practice name and page title header</small></span><input type="checkbox" checked={s.showTopBar===true} onChange={e=>{const u={...s,showTopBar:e.target.checked};setS(u);void save(u);}}/></label>
      <label className="toggle-row"><span>Show menu bar<small>File, Edit, View, Window, Help menus</small></span><input type="checkbox" checked={s.showMenuBar===true} onChange={e=>{const u={...s,showMenuBar:e.target.checked};setS(u);void save(u);}}/></label>
      <label>Color theme<select value={s.theme} onChange={e=>{const u={...s,theme:e.target.value as Settings["theme"]};setS(u);void save(u);}}><option value="system">System default</option><option value="light">Light</option><option value="dark">Dark</option></select></label></div><h3 style={{marginTop:24}}>Practice and goals</h3><div className="fields"><label>Practice display name<input value={s.practiceName} onChange={e=>setS({...s,practiceName:e.target.value})}/></label><NumberField label="Clinical days per week" value={s.targetClinicalDaysPerWeek} onChange={v=>setS({...s,targetClinicalDaysPerWeek:v})}/><NumberField label="Maximum visits per day" value={s.maxCompletedVisitsPerDay} onChange={v=>setS({...s,maxCompletedVisitsPerDay:v})}/><label>Planning basis<select value={s.planningBasis} onChange={e=>setS({...s,planningBasis:e.target.value as Settings["planningBasis"]})}><option value="expected">Expected / allowed</option><option value="collected">Actually collected</option></select></label><label>Monthly revenue goal<span className="currency">$<input type="number" min="0" value={s.monthlyRevenueGoalCents/100} onChange={e=>setS({...s,monthlyRevenueGoalCents:toCents(e.target.value)})}/></span></label></div><button>Save settings</button></form>}
function Action({title,text,button,action}:{title:string,text:string,button:string,action:()=>unknown}){return <section className="panel"><h3>{title}</h3><p>{text}</p><button onClick={()=>void action()}>{button}</button></section>}
function UpdateBanner({info,api,onDismiss}:{info:{version:string,url:string},api:typeof window.practiceApi,onDismiss:()=>void}){
  const [progress,setProgress]=useState<number|null>(null);
  const [installing,setInstalling]=useState(false);
  const [err,setErr]=useState("");
  useEffect(()=>{api?.update.onProgress(pct=>setProgress(pct));},[]);
  const install=async()=>{try{setErr("");setInstalling(true);await api?.update.install(info.url);}catch(e){setErr(e instanceof Error?e.message:"Download failed.");setInstalling(false);}};
  return <div className="update-banner" role="status">
    {!installing&&<><span>Version {info.version} is available.</span>
      <button onClick={()=>void install()}>Update Now</button>
      <button className="secondary" onClick={()=>void api?.update.openReleases()}>Download</button>
      <button className="secondary" onClick={onDismiss}>Later</button>
    </>}
    {installing&&<><span style={{minWidth:220}}>{progress!==null?`Downloading... ${progress}%`:"Starting download..."}</span>
      <div style={{flex:1,height:7,background:"rgba(0,0,0,.12)",borderRadius:4,overflow:"hidden"}}>
        <div style={{width:`${progress??0}%`,height:"100%",background:"#176b52",borderRadius:4,transition:"width .25s"}}/>
      </div>
      <span style={{fontSize:".8rem",opacity:.7}}>Installer will launch on close</span>
    </>}
    {err&&<span style={{color:"#9b2c20"}}>{err}</span>}
  </div>;
}
function AboutPage({api,updateInfo:initial,onPurge}:{api:typeof window.practiceApi,updateInfo:{version:string,url:string}|null,onPurge:()=>Promise<void>}){
  const [ver,setVer]=useState("...");
  const [buildInfo,setBuildInfo]=useState<{version:string,alpha_counter?:number,build_date?:string}|null>(null);
  const [isPkg,setIsPkg]=useState<boolean|null>(null);
  const [upd,setUpd]=useState<{version:string,url:string}|null|false>(initial);
  const [busy,setBusy]=useState(false);
  const [confirming,setConfirming]=useState(false);
  const [purging,setPurging]=useState(false);
  useEffect(()=>{
    void api?.app.version().then(setVer);
    void api?.app.buildInfo().then(info=>setBuildInfo(info??null));
    void api?.app.isPackaged().then(setIsPkg);
  },[]);
  const fullVersion=buildInfo?.alpha_counter?`${ver}a${buildInfo.alpha_counter}`:ver;
  const isDev=isPkg===false;
  const isAlpha=isPkg===true&&(buildInfo?.alpha_counter??0)>0;
  const check=async()=>{setBusy(true);const r=await api?.update.check();setUpd(r??false);setBusy(false);};
  const purge=async()=>{setPurging(true);await api?.data.purge();await onPurge();};
  return <div className="about-page">
    <div className="panel about-card">
      <div className="about-head"><div className="logo"><LogoMark size={44}/></div><div><h3>Practice Analytics</h3><p className="eyebrow" style={{margin:"4px 0 0"}}>Version {fullVersion}{buildInfo?.build_date?" - "+buildInfo.build_date:""}</p></div></div>
      {isDev&&<p className="notice" style={{marginTop:12,fontSize:".82rem",background:"#fff8e6",color:"#6b4209",border:"1px solid #e5a43b"}}>Development build -- not for production use.</p>}
      {isAlpha&&<p className="notice" style={{marginTop:12,fontSize:".82rem"}}>Alpha release -- features may change before the final release.</p>}
      <p style={{margin:"12px 0 0",fontSize:".9rem",color:"#405b52"}}>Local-first practice analytics for mental health professionals. All data stays on your device -- nothing is ever transmitted to a server.</p>
    </div>
    <div className="panel">
      <h4 className="about-section-head">Software Updates</h4>
      {upd&&upd.version&&<div style={{marginBottom:14}}>
        <p className="notice" style={{marginBottom:10}}>Version {upd.version} is available.</p>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <button onClick={()=>void api?.update.install(upd.url)}>Update Now</button>
          <button className="secondary" onClick={()=>void api?.update.openReleases()}>Download installer</button>
        </div>
      </div>}
      {upd===false&&<p className="notice" style={{marginBottom:12}}>You are running the latest version.</p>}
      <button className="secondary" onClick={()=>void check()} disabled={busy}>{busy?"Checking...":"Check for updates"}</button>
    </div>
    <div className="panel">
      <h4 className="about-section-head">Legal</h4>
      <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
        <button className="secondary" onClick={()=>void api?.legal.openEula()}>License Agreement (EULA)</button>
        <button className="secondary" onClick={()=>void api?.legal.openPrivacy()}>Privacy Policy</button>
      </div>
      <p style={{marginTop:16,fontSize:".82rem",color:"#63766f"}}>&copy; 2026 NorthPanda Labs</p>
    </div>
    <div className="panel">
      <h4 className="about-section-head" style={{color:"#9b2c20"}}>Danger Zone</h4>
      {!confirming&&<button className="secondary" style={{color:"#9b2c20",borderColor:"#9b2c20"}} onClick={()=>setConfirming(true)}>Purge all data and reset</button>}
      {confirming&&<><p className="error" style={{marginBottom:14}}>This will permanently delete <strong>all entries</strong> and reset settings to defaults. Your password will be kept. This cannot be undone.</p><div style={{display:"flex",gap:10}}><button style={{background:"#9b2c20"}} onClick={()=>void purge()} disabled={purging}>{purging?"Purging...":"Yes, delete everything"}</button><button className="secondary" onClick={()=>setConfirming(false)}>Cancel</button></div></>}
    </div>
  </div>;
}
