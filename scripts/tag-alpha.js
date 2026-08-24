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

// Require a clean working tree (other than build_info.json) so we don't
// accidentally tag with uncommitted changes.
const dirty = execSync("git status --porcelain", { cwd: root })
  .toString()
  .split("\n")
  .filter(l => l.trim() && !l.includes("legal/build_info.json"))
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

// Persist the new counter
info.alpha_counter = counter;
info.build_date = new Date().toISOString().slice(0, 10);
fs.writeFileSync(infoPath, JSON.stringify(info, null, 2) + "\n", "utf8");

// Commit, tag, push
execSync("git add legal/build_info.json", { cwd: root, stdio: "inherit" });
execSync(`git commit -m "Release ${tag}"`, { cwd: root, stdio: "inherit" });
execSync(`git tag ${tag}`, { cwd: root, stdio: "inherit" });
execSync("git push origin main", { cwd: root, stdio: "inherit" });
execSync(`git push origin ${tag}`, { cwd: root, stdio: "inherit" });

console.log(`\nDone. ${tag} pushed -- CI is building and publishing the pre-release.\n`);
