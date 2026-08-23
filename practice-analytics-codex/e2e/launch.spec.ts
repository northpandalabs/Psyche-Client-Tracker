import { test, expect, _electron as electron } from "@playwright/test";

test("launches into local authentication", async () => {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;
  const application = await electron.launch({ args: ["."], env });
  const window = await application.firstWindow();
  await expect(window.getByRole("heading", { name: /Practice Analytics|Welcome back|Set up Practice Analytics/i })).toBeVisible();
  void application.close();
});
