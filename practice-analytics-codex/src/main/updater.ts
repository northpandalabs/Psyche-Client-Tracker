import https from "node:https";
import { app } from "electron";

const DOWNLOADS_URL =
  "https://raw.githubusercontent.com/northpandalabs/Psyche-Client-Tracker/refs/heads/main/legal/downloads.json";
const RELEASES_FALLBACK =
  "https://github.com/northpandalabs/Psyche-Client-Tracker/releases/latest";
const INTERVAL_MS = 24 * 60 * 60 * 1000;

interface DownloadsJson {
  version: string;
  base_download_url?: string;
  platforms?: { windows?: { filename_template?: string } };
}

export interface UpdateInfo {
  version: string;
  url: string;
}

let cachedUpdate: UpdateInfo | null = null;

function semverGt(a: string, b: string): boolean {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av > bv) return true;
    if (av < bv) return false;
  }
  return false;
}

function fetchDownloads(): Promise<DownloadsJson> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      DOWNLOADS_URL,
      { headers: { "User-Agent": "practice-analytics-updater" }, timeout: 10_000 },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += String(chunk);
          if (body.length > 65_536) {
            req.destroy();
            reject(new Error("response too large"));
          }
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(body) as DownloadsJson);
          } catch {
            reject(new Error("invalid json"));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("timeout"));
    });
  });
}

function msUntilNextNoon(): number {
  const now = new Date();
  const noon = new Date(now);
  noon.setHours(12, 0, 0, 0);
  if (noon <= now) noon.setDate(noon.getDate() + 1);
  return noon.getTime() - now.getTime();
}

export async function checkNow(): Promise<UpdateInfo | null> {
  try {
    const data = await fetchDownloads();
    if (!/^\d+\.\d+\.\d+$/.test(data.version)) return cachedUpdate;
    if (semverGt(data.version, app.getVersion())) {
      const base = data.base_download_url ?? RELEASES_FALLBACK;
      const template = data.platforms?.windows?.filename_template ?? "Practice.Analytics.Setup.{version}.exe";
      const filename = template.replace("{version}", data.version);
      cachedUpdate = { version: data.version, url: `${base}/${filename}` };
    }
    return cachedUpdate;
  } catch {
    return cachedUpdate;
  }
}

export function getUpdateStatus(): UpdateInfo | null {
  return cachedUpdate;
}

export function scheduleUpdateCheck(): void {
  void checkNow();
  setTimeout(() => {
    void checkNow();
    setInterval(() => void checkNow(), INTERVAL_MS);
  }, msUntilNextNoon());
}
