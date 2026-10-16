// Tester för Musik i Uppland. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearbeta, iKommunen } from "./regler.mjs";

const exempel = JSON.parse(readFileSync(new URL("./exempel.json", import.meta.url), "utf8"));
const NU = new Date("2026-10-16T08:00:00Z");
const evenemang = bearbeta(exempel, NU);
const efter = (id) => evenemang.find((e) => e.id === `musik-i-uppland-${id}`);

test("Musik i Uppland: bara kommande konserter i Uppsala kommun", () => {
  assert.deepEqual(evenemang.map((e) => e.id).sort(), ["musik-i-uppland-24278", "musik-i-uppland-24772", "musik-i-uppland-25559", "musik-i-uppland-25600"]);
  assert.equal(iKommunen(exempel.find((k) => k.id === 25601)), false, "Enköping är inte med");
});

test("Musik i Uppland: tid, plats, sal och biljettlänk", () => {
  const e = efter(24278);
  assert.equal(e.titel, "Bruch och Brahms");
  assert.equal(e.start, "2026-10-22T19:00:00+02:00");
  assert.equal(e.slut, "2026-10-22T21:10:00+02:00");
  assert.equal(e.plats.namn, "Uppsala Konsert & Kongress, Stora salen");
  assert.equal(e.kategori, "musik");
  assert.equal(e.kallor[0].biljetter, "https://secure.tickster.com/tfwjdg6m57bjy8b");
  assert.equal(e.fakta.adress, "Vaksala Torg 1, 753 31");
});

test("Musik i Uppland: familjekonsert, pris och ort sist i platsen", () => {
  assert.equal(efter(24772).titel, "Familjekonsert – Peter och vargen");
  assert.equal(efter(24772).barnOchFamilj, true);
  assert.equal(efter(24772).gratis, false);
  assert.equal(efter(25559).gratis, false);
  assert.equal(efter(25559).slut, null);
  assert.equal(efter(25600).gratis, true, "Fri entré");
});

test("Musik i Uppland: biljettinformationen sparas aldrig", () => {
  for (const e of evenemang) assert.ok(!JSON.stringify(e).includes("Biljettpris"), e.id);
});
