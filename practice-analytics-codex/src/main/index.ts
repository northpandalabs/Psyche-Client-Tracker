import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { createWriteStream, readFileSync } from "node:fs";
import { copyFile, writeFile } from "node:fs/promises";
import https from "node:https";
import path from "node:path";

function downloadInstaller(url: string, dest: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const follow = (u: string, depth: number) => {
      if (depth > 8) { reject(new Error("too many redirects")); return; }
      https.get(u, { headers: { "User-Agent": "practice-analytics-updater" } }, (res) => {
        if ((res.statusCode ?? 0) >= 300 && res.headers.location) {
          res.resume();
          follow(res.headers.location, depth + 1);
          return;
        }
        if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
        const total = Number(res.headers["content-length"] ?? 0);
        let received = 0;
        const file = createWriteStream(dest);
        res.on("data", (chunk: Buffer) => { received += chunk.length; if (total > 0) onProgress(Math.round(received / total * 100)); });
        res.pipe(file);
        file.on("finish", () => { file.close(); resolve(); });
        file.on("error", reject);
      }).on("error", reject);
    };
    follow(url, 0);
  });
}
import bcrypt from "bcryptjs";
import { AppDatabase } from "./database.js";
import { dailyEntrySchema, passwordSchema, settingsSchema } from "../shared/schemas.js";
import { checkNow, getUpdateStatus, scheduleUpdateCheck, setRunningVersion } from "./updater.js";

let database: AppDatabase;
let win: BrowserWindow | null = null;
const requireUnlocked = (unlocked: boolean) => { if (!unlocked) throw new Error("Application is locked."); };
let unlocked = false; let failures = 0;

app.whenReady().then(() => {
  const dbPath=path.join(app.getPath("userData"),"practice-analytics.sqlite"); database=new AppDatabase(dbPath);
  win=new BrowserWindow({width:1280,height:820,minWidth:900,minHeight:650,webPreferences:{preload:path.join(__dirname,"../preload/index.js"),contextIsolation:true,nodeIntegration:false,sandbox:true}});
  win.setMenuBarVisibility(database.settings().showMenuBar===true);
  try {
    const biPath=app.isPackaged?path.join(process.resourcesPath,"build_info.json"):path.join(__dirname,"../../../legal/build_info.json");
    const bi=JSON.parse(readFileSync(biPath,"utf8")) as {version:string,alpha_counter?:number};
    if(bi.alpha_counter) setRunningVersion(`${bi.version}a${bi.alpha_counter}`);
  } catch { /* no build_info -- use app.getVersion() as-is */ }
  if(process.env.VITE_DEV_SERVER_URL) void win.loadURL(process.env.VITE_DEV_SERVER_URL); else void win.loadFile(path.join(__dirname,"../../dist/index.html"));
  win.on("closed",()=>{database.close();win=null;});
  scheduleUpdateCheck();
});
app.on("window-all-closed",()=>app.quit());

ipcMain.handle("auth:status",()=>({configured:Boolean(database.passwordHash()),unlocked}));
ipcMain.handle("auth:setup",async(_e,payload:unknown)=>{if(database.passwordHash())throw new Error("Password already configured.");const r=passwordSchema.safeParse(payload);if(!r.success)throw new Error("Password must be at least 10 characters.");database.setPasswordHash(await bcrypt.hash(r.data,12));unlocked=true;return true;});
ipcMain.handle("auth:unlock",async(_e,payload:unknown)=>{if(failures>=5)await new Promise(r=>setTimeout(r,2000));const res=passwordSchema.safeParse(payload);if(!res.success)return false;unlocked=await bcrypt.compare(res.data,database.passwordHash()??"");failures=unlocked?0:failures+1;return unlocked;});
ipcMain.handle("auth:lock",()=>{unlocked=false;return true;});
ipcMain.handle("settings:get",()=>{requireUnlocked(unlocked);return database.settings();});
ipcMain.handle("settings:save",(_e,payload:unknown)=>{requireUnlocked(unlocked);const value=settingsSchema.parse(payload);database.saveSettings(value);win?.setMenuBarVisibility(value.showMenuBar===true);return value;});
ipcMain.handle("entries:list",(_e,range:unknown)=>{requireUnlocked(unlocked);const parsed=(range??{}) as {from?:string,to?:string};return database.entries(parsed.from,parsed.to);});
ipcMain.handle("entries:save",(_e,payload:unknown)=>{requireUnlocked(unlocked);const value=dailyEntrySchema.parse(payload);database.saveEntry(value);return value;});
ipcMain.handle("export:csv",async()=>{requireUnlocked(unlocked);const result=await dialog.showSaveDialog({defaultPath:"practice-analytics.csv",filters:[{name:"CSV",extensions:["csv"]}]});if(result.canceled||!result.filePath)return false;const rows=database.entries();const header="date,scheduled,new_evaluations,followups,therapy_med,therapy_only,other,cancellations,no_shows,gross_billed_cents,expected_allowed_cents,insurance_paid_cents,patient_paid_cents,other_paid_cents,adjustments_cents,refunds_cents\n";const body=rows.map(x=>[x.date,x.scheduledCount,...Object.values(x.visits),x.cancellationCount,x.noShowCount,x.grossBilledCents,x.expectedAllowedCents,x.insurancePaidCents,x.patientPaidCents,x.otherPaidCents,x.adjustmentsCents,x.refundsCents].join(",")).join("\n");await writeFile(result.filePath,header+body,"utf8");return true;});
ipcMain.handle("backup:create",async()=>{requireUnlocked(unlocked);const result=await dialog.showSaveDialog({defaultPath:`practice-analytics-${new Date().toISOString().slice(0,10)}.sqlite`,filters:[{name:"SQLite backup",extensions:["sqlite"]}]});if(result.canceled||!result.filePath)return false;await copyFile(path.join(app.getPath("userData"),"practice-analytics.sqlite"),result.filePath);return true;});
ipcMain.handle("data:purge",()=>{requireUnlocked(unlocked);database.purgeData();return true;});
ipcMain.handle("update:install",async(_e,url:string)=>{
  const dest=path.join(app.getPath("temp"),"PracticeAnalyticsUpdate.exe");
  await downloadInstaller(url,dest,pct=>{win?.webContents.send("update:progress",pct);});
  await shell.openPath(dest);
  setTimeout(()=>app.quit(),800);
  return true;
});
ipcMain.handle("update:check",()=>checkNow());
ipcMain.handle("update:status",()=>getUpdateStatus());
ipcMain.handle("update:open-releases",()=>{const info=getUpdateStatus();return shell.openExternal(info?.url??"https://github.com/northpandalabs/Psyche-Client-Tracker/releases/latest");});
ipcMain.handle("app:version",()=>app.getVersion());
ipcMain.handle("app:is-packaged",()=>app.isPackaged);
ipcMain.handle("app:build-info",()=>{try{const p=app.isPackaged?path.join(process.resourcesPath,"build_info.json"):path.join(__dirname,"../../../legal/build_info.json");return JSON.parse(readFileSync(p,"utf8"));}catch{return null;}});
ipcMain.handle("legal:open-eula",()=>shell.openExternal("https://github.com/northpandalabs/Psyche-Client-Tracker/blob/main/legal/eula.txt"));
ipcMain.handle("legal:open-privacy",()=>shell.openExternal("https://github.com/northpandalabs/Psyche-Client-Tracker/blob/main/legal/privacy.txt"));
