// Tester för Katalin. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearbeta, stadaTitel } from "./regler.mjs";

const exempel = JSON.parse(readFileSync(new URL("./exempel.json", import.meta.url), "utf8"));
const NU = new Date("2026-10-16T08:00:00Z");
const evenemang = bearbeta(exempel, NU);
const efter = (id) => evenemang.find((e) => e.id === `katalin-${id}`);

test("Katalin: bara kommande evenemang", () => {
  assert.equal(evenemang.length, 7);
  assert.equal(efter(17228), undefined, "Kulturnatten i september har redan varit");
});

test("Katalin: datum, klockslag och scen", () => {
  assert.equal(efter(17447).start, "2026-12-15T12:00:00+01:00");
  assert.equal(efter(17447).plats.rum, "Bakfickan");
  assert.equal(efter(17450).start, "2027-03-18", "utan klockslag blir det bara datumet");
  assert.equal(efter(17450).plats.rum, "Stora scen");
});

test("Katalin: scenen tas bort ur titeln", () => {
  assert.equal(efter(16931).titel, "Daniel Lemma");
  assert.equal(efter(17238).titel, "PEPPERBYRDS");
  assert.equal(stadaTitel("Långbacka/Bådagård – Katalins Backficka"), "Långbacka/Bådagård");
  assert.equal(stadaTitel("Jazz Fellows & Laura"), "Jazz Fellows & Laura");
});

test("Katalin: gratis, slutsålt, inställt och biljettlänk", () => {
  assert.equal(efter(17447).gratis, true);
  assert.equal(efter(16931).gratis, false);
  assert.equal(efter(17045).notering, "Slutsåld");
  assert.equal(efter(16862).installd, true);
  assert.equal(efter(16931).kallor[0].biljetter, "https://secure.tickster.com/sv/1n30wv8krbb0r9t/products");
  assert.equal(efter(17447).kallor[0].biljetter, undefined);
});

test("Katalin: genren ger kategorin", () => {
  assert.equal(efter(17452).kategori, "scen", "stand-up");
  assert.equal(efter(17447).kategori, "musik");
  assert.deepEqual(efter(17447).fakta.kategorier, ["jazz"]);
});
