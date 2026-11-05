// Bundle reference/routeready-mobile-devops into repo.js for the in-game repo browser.
// Usage (from the repo root): node tools/bundle-repo.js reference/routeready-mobile-devops repo.js
const fs = require("fs"), path = require("path");
const [repo, outJs] = process.argv.slice(2);
const SKIP = new Set([".git", "node_modules", ".tools", ".secrets", ".drills", ".expo", "build", ".gradle", "vendor"]);
const files = {};
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const full = path.join(dir, e.name), rel = path.relative(repo, full).split(path.sep).join("/");
    if (e.isDirectory()) walk(full); else files[rel] = fs.readFileSync(full, "utf8");
  }
})(repo);
const sorted = Object.fromEntries(Object.keys(files).sort().map(k => [k, files[k]]));
fs.writeFileSync(outJs, "/* Reference repo, bundled for the in-game browser. Generated. */\nconst REPO = " + JSON.stringify(sorted) + ";\n");
console.log(Object.keys(sorted).length, "files bundled,", Math.round(fs.statSync(outJs).size / 1024), "KB");
