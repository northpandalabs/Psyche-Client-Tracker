// node scripts/build-release.js
// Builds the Windows NSIS installer and places it in a versioned subfolder:
//   Releases/{version}a{n}/Practice.Analytics.Setup.{version}.exe
// The alpha counter auto-increments each run and is tracked in Releases/build_info.json.
"use strict";
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const infoPath = path.join(root, "legal", "build_info.json");
const projectDir = path.join(root, "practice-analytics-codex");
const releasesDir = path.join(root, "Releases");

if (!fs.existsSync(infoPath)) {
  console.error("legal/build_info.json not found. Run set-version.js first.");
  process.exit(1);
}

const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
const version = info.version;
const counter = (info.alpha_counter || 0) + 1;
const buildLabel = `${version}a${counter}`;
const outDir = path.join(releasesDir, buildLabel);
const installerName = `Practice.Analytics.Setup.${version}.exe`;

console.log(`\nBuilding Practice Analytics v${version} -> ${buildLabel}\n`);

// Remove leftover artifacts from a previous interrupted build
for (const name of ["win-unpacked", installerName, `${installerName}.blockmap`, "builder-debug.yml", "builder-effective-config.yaml"]) {
  const p = path.join(releasesDir, name);
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

// Build
execSync("npm run dist:win", { cwd: projectDir, stdio: "inherit" });

// Verify the installer was produced
const srcExe = path.join(releasesDir, installerName);
if (!fs.existsSync(srcExe)) {
  console.error(`\nERROR: Installer not found at ${srcExe}`);
  process.exit(1);
}

// Move into versioned subfolder
fs.mkdirSync(outDir, { recursive: true });
fs.renameSync(srcExe, path.join(outDir, installerName));

// Clean up electron-builder intermediates
for (const name of [`${installerName}.blockmap`, "win-unpacked", "builder-debug.yml", "builder-effective-config.yaml"]) {
  const p = path.join(releasesDir, name);
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

// Update build_info.json
info.alpha_counter = counter;
info.build_date = new Date().toISOString().slice(0, 10);
info.artifacts = { windows_installer: `${buildLabel}/${installerName}` };
fs.writeFileSync(infoPath, JSON.stringify(info, null, 2) + "\n", "utf8");

console.log(`\nDone: Releases/${buildLabel}/${installerName}\n`);
