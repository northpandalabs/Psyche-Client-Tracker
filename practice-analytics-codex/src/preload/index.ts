import { contextBridge, ipcRenderer } from "electron";

const api = {
  auth: {
    status: (): Promise<{ configured: boolean; unlocked: boolean }> =>
      ipcRenderer.invoke("auth:status"),
    setup: (password: string): Promise<boolean> =>
      ipcRenderer.invoke("auth:setup", password),
    unlock: (password: string): Promise<boolean> =>
      ipcRenderer.invoke("auth:unlock", password),
    lock: (): Promise<boolean> => ipcRenderer.invoke("auth:lock"),
  },
  settings: {
    get: (): Promise<unknown> => ipcRenderer.invoke("settings:get"),
    save: (value: unknown): Promise<unknown> =>
      ipcRenderer.invoke("settings:save", value),
  },
  entries: {
    list: (range?: { from?: string; to?: string }): Promise<unknown[]> =>
      ipcRenderer.invoke("entries:list", range),
    save: (entry: unknown): Promise<unknown> =>
      ipcRenderer.invoke("entries:save", entry),
  },
  exportCsv: (): Promise<boolean> => ipcRenderer.invoke("export:csv"),
  createBackup: (): Promise<boolean> => ipcRenderer.invoke("backup:create"),
  data: {
    purge: (): Promise<boolean> => ipcRenderer.invoke("data:purge"),
  },
  update: {
    check: (): Promise<{ version: string; url: string } | null> =>
      ipcRenderer.invoke("update:check"),
    status: (): Promise<{ version: string; url: string } | null> =>
      ipcRenderer.invoke("update:status"),
    openReleases: (): Promise<void> =>
      ipcRenderer.invoke("update:open-releases"),
    install: (url: string): Promise<boolean> =>
      ipcRenderer.invoke("update:install", url),
    onProgress: (cb: (pct: number) => void): void => {
      ipcRenderer.removeAllListeners("update:progress");
      ipcRenderer.on("update:progress", (_e, pct: number) => cb(pct));
    },
  },
  app: {
    version: (): Promise<string> => ipcRenderer.invoke("app:version"),
    isPackaged: (): Promise<boolean> => ipcRenderer.invoke("app:is-packaged"),
    buildInfo: (): Promise<{ version: string; alpha_counter?: number; build_date?: string } | null> =>
      ipcRenderer.invoke("app:build-info"),
  },
  legal: {
    openEula: (): Promise<void> => ipcRenderer.invoke("legal:open-eula"),
    openPrivacy: (): Promise<void> => ipcRenderer.invoke("legal:open-privacy"),
  },
};

export type PracticeApi = typeof api;

contextBridge.exposeInMainWorld("practiceApi", api);
