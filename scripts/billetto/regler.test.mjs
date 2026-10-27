// Tester för Billetto. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearbeta } from "./regler.mjs";

const exempel = JSON.parse(readFileSync(new URL("./exempel.json", import.meta.url), "utf8"));
const NU = new Date("2026-10-27T08:00:00Z");
const evenemang = bearbeta(exempel, NU);
const efter = (id) => evenemang.find((e) => e.id === `billetto-${id}`);

test("Billetto: bara Uppsala kommun, och bara evenemang med datum", () => {
  assert.deepEqual(evenemang.map((e) => e.id).sort(), ["billetto-1001", "billetto-1002"]);
});

test("Billetto: tid i svensk tid, plats, kategori och pris", () => {
  const e = efter(1001);
  assert.equal(e.start, "2026-11-17T18:00:00+01:00");
  assert.equal(e.plats.namn, "The Kaliber Room");
  assert.equal(e.kategori, "scen");
  assert.equal(e.gratis, false);
  assert.equal(e.fakta.adress, "Kungsgatan 33, 753 31");
  assert.equal(efter(1002).gratis, true);
  assert.equal(efter(1002).kategori, "mat");
  assert.equal(efter(1002).barnOchFamilj, true, "höstlov");
});

test("Billetto: länken behåller UTM-koderna", () => {
  assert.equal(efter(1001).kallor[0].url, "https://billetto.se/e/fyris-comedy-1001?utm_source=partner&utm_medium=api");
});
