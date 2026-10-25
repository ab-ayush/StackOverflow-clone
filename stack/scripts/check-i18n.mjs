// Checks that the six dictionaries agree with each other.
// Run from the stack folder:  node scripts/check-i18n.mjs
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "i18n", "locales");
const LANGS = ["en", "es", "hi", "pt", "zh", "fr"];

const ONE_LINE = /^\s*"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/;
const KEY_ONLY = /^\s*"([^"]+)"\s*:\s*$/; // a formatter may move a long value to the next line
const VALUE_ONLY = /^\s*"((?:[^"\\]|\\.)*)"\s*,?\s*$/;

const load = (lang) => {
  const entries = new Map();
  const duplicates = [];
  const add = (key, value, lineNumber) => {
    if (entries.has(key)) duplicates.push(`${key} (line ${lineNumber})`);
    entries.set(key, value);
  };

  let pendingKey = null;
  readFileSync(join(dir, `${lang}.ts`), "utf8")
    .split(/\r?\n/)
    .forEach((line, index) => {
      if (pendingKey) {
        const value = line.match(VALUE_ONLY);
        if (value) add(pendingKey, value[1], index + 1);
        pendingKey = null;
        return;
      }
      const full = line.match(ONE_LINE);
      if (full) return add(full[1], full[2], index + 1);
      const keyOnly = line.match(KEY_ONLY);
      if (keyOnly) pendingKey = keyOnly[1];
    });

  return { entries, duplicates };
};

const placeholders = (text) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort().join(",");

const english = load("en").entries;
let problems = 0;
const problem = (message) => {
  problems += 1;
  console.log(`  PROBLEM  ${message}`);
};

for (const lang of LANGS) {
  const { entries, duplicates } = load(lang);
  console.log(`\n${lang}: ${entries.size} entries`);

  duplicates.forEach((item) => problem(`duplicate key ${item}`));

  for (const key of english.keys()) {
    if (!entries.has(key)) problem(`missing key ${key}`);
  }
  for (const key of entries.keys()) {
    if (!english.has(key)) problem(`extra key ${key} (not in en.ts)`);
  }

  for (const [key, value] of entries) {
    if (!value.trim()) problem(`empty value for ${key}`);

    if (english.has(key) && placeholders(value) !== placeholders(english.get(key))) {
      problem(
        `placeholders differ for ${key}: en has {${placeholders(english.get(key))}}, ${lang} has {${placeholders(value)}}`
      );
    }

    if (key.endsWith(".one") && !entries.has(key.replace(/\.one$/, ".other"))) {
      problem(`${key} has no matching .other`);
    }
    if (key.endsWith(".other") && !entries.has(key.replace(/\.other$/, ".one"))) {
      problem(`${key} has no matching .one`);
    }
  }

  if (lang !== "en") {
    const same = [...entries].filter(
      ([key, value]) => value === english.get(key) && /[A-Za-z]{4,}/.test(value)
    );
    if (same.length) {
      console.log(`  review   ${same.length} value(s) identical to English (fine for names like "Tags"):`);
      same.forEach(([key, value]) => console.log(`           ${key} = "${value}"`));
    }
  }
}

console.log(problems === 0 ? "\nNo problems found." : `\n${problems} problem(s) found.`);
process.exit(problems === 0 ? 0 : 1);