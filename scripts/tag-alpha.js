// node scripts/tag-alpha.js
// Increments the alpha counter in legal/build_info.json, commits that file,
// creates a tag like v0.1.0a3, then pushes both to GitHub.
// GitHub Actions picks up the tag and publishes the installer as a pre-release.
"use strict";
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const infoPath = path.join(root, "legal", "build_info.json");

if (!fs.existsSync(infoPath)) {
  console.error("legal/build_info.json not found. Run set-version.js first.");
  process.exit(1);
}

// Require a clean working tree (other than the two legal files we're about to write).
const dirty = execSync("git status --porcelain", { cwd: root })
  .toString()
  .split("\n")
  .filter(l => l.trim() && !l.includes("legal/build_info.json") && !l.includes("legal/downloads.json"))
  .filter(Boolean);

if (dirty.length > 0) {
  console.error("Working tree has uncommitted changes -- commit or stash them first:\n");
  console.error(dirty.join("\n"));
  process.exit(1);
}

const info = JSON.parse(fs.readFileSync(infoPath, "utf8"));
const version = info.version;
const counter = (info.alpha_counter || 0) + 1;
const tag = `v${version}a${counter}`;

console.log(`\nTagging ${tag}...\n`);

// Persist the new counter in build_info.json
info.alpha_counter = counter;
info.build_date = new Date().toISOString().slice(0, 10);
fs.writeFileSync(infoPath, JSON.stringify(info, null, 2) + "\n", "utf8");

// Update downloads.json so the running app can detect this as the latest version.
// The installer filename uses the base version (from package.json via electron-builder),
// while the tag and release URL include the full alpha string.
const dlPath = path.join(root, "legal", "downloads.json");
const dl = JSON.parse(fs.readFileSync(dlPath, "utf8"));
dl.version = `${version}a${counter}`;
dl.released = new Date().toISOString().slice(0, 10);
dl.base_download_url = `https://github.com/northpandalabs/Psyche-Client-Tracker/releases/download/${tag}`;
if (!dl.platforms) dl.platforms = {};
dl.platforms.windows = { filename_template: `Practice.Analytics.Setup.${version}.exe` };
fs.writeFileSync(dlPath, JSON.stringify(dl, null, 2) + "\n", "utf8");

// Commit, tag, push
execSync("git add legal/build_info.json legal/downloads.json", { cwd: root, stdio: "inherit" });
execSync(`git commit -m "Release ${tag}"`, { cwd: root, stdio: "inherit" });
execSync(`git tag ${tag}`, { cwd: root, stdio: "inherit" });
execSync("git push origin main", { cwd: root, stdio: "inherit" });
execSync(`git push origin ${tag}`, { cwd: root, stdio: "inherit" });

console.log(`\nDone. ${tag} pushed -- CI is building and publishing the pre-release.\n`);
