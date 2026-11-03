// Tester för listan över källornas filer. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { I_REPOT, kalldataFiler } from "./kalldata.mjs";

test("källornas filer och cachen, men inte det som får ligga i repot", () => {
  const data = mkdtempSync(join(tmpdir(), "kalldata-"));
  mkdirSync(join(data, "cache"));
  for (const f of ["sida.json", "historik.json", "tickster.json", "kubik.json", "anteckning.txt"]) writeFileSync(join(data, f), "{}");
  writeFileSync(join(data, "cache", "kubik.json"), "{}");
  assert.deepEqual(kalldataFiler(data), [`${data}/kubik.json`, `${data}/tickster.json`, `${data}/cache/kubik.json`]);
});

test("utan mapp blir listan tom", () => {
  assert.deepEqual(kalldataFiler(join(tmpdir(), "finns-inte-123")), []);
});

test(".gitignore släpper igenom samma filer som I_REPOT", () => {
  const ignore = readFileSync(new URL("../.gitignore", import.meta.url), "utf8");
  const tillatna = [...ignore.matchAll(/^!data\/([^/\s]+\.json)$/gm)].map((m) => m[1]).sort();
  assert.deepEqual(tillatna, [...I_REPOT].sort());
});
