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
};

export type PracticeApi = typeof api;

contextBridge.exposeInMainWorld("practiceApi", api);
