// node scripts/set-version.js <old> <new>
// e.g. node scripts/set-version.js 0.1.0 0.2.0
// Updates practice-analytics-codex/package.json, legal/downloads.json, and legal/build_info.json.
"use strict";
const fs = require("fs");
const path = require("path");

const [,, oldVer, newVer] = process.argv;
if (!oldVer || !newVer) {
  console.error("Usage: node scripts/set-version.js <old> <new>");
  process.exit(1);
}
const semverRe = /^\d+\.\d+\.\d+$/;
if (!semverRe.test(oldVer) || !semverRe.test(newVer)) {
  console.error("Both versions must be x.y.z semver (e.g. 0.2.0)");
  process.exit(1);
}

const root = path.join(__dirname, "..");

// JSON files: bump "version" key only
const jsonFiles = [
  path.join(root, "practice-analytics-codex", "package.json"),
  path.join(root, "legal", "downloads.json"),
  path.join(root, "legal", "build_info.json"),
];

// Plain-text files: replace all occurrences
const textFiles = [
  path.join(root, "README.md"),
];

let changed = 0;
const today = new Date().toISOString().slice(0, 10);

for (const file of jsonFiles) {
  if (!fs.existsSync(file)) { console.log(`SKIP (not found): ${file}`); continue; }
  const raw = fs.readFileSync(file, "utf8");
  const obj = JSON.parse(raw);
  if (obj.version !== oldVer) {
    console.log(`SKIP (has ${obj.version}): ${path.relative(root, file)}`);
    continue;
  }
  obj.version = newVer;
  if (file.endsWith("downloads.json")) obj.released = today;
  if (file.endsWith("build_info.json")) {
    obj.build_date = today;
    obj.alpha_counter = 0;
    obj.artifacts = {};
  }
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + "\n", "utf8");
  console.log(`Updated: ${path.relative(root, file)}`);
  changed++;
}

for (const file of textFiles) {
  if (!fs.existsSync(file)) continue;
  const raw = fs.readFileSync(file, "utf8");
  if (!raw.includes(oldVer)) continue;
  fs.writeFileSync(file, raw.replaceAll(oldVer, newVer), "utf8");
  console.log(`Updated: ${path.relative(root, file)}`);
  changed++;
}

console.log(`\nDone -- ${changed} file(s) updated. Review, commit, then tag v${newVer}.`);
