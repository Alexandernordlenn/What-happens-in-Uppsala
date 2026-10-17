// Tester för Uppsala Konsert & Kongress. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearbeta, kategori } from "./regler.mjs";

const exempel = JSON.parse(readFileSync(new URL("./exempel.json", import.meta.url), "utf8"));
const NU = new Date("2026-10-16T08:00:00Z");
const evenemang = bearbeta(exempel, NU);
const efter = (id) => evenemang.find((e) => e.id === `ukk-${id}`);

test("UKK: publiceringstiden är starttiden, i svensk tid", () => {
  assert.equal(efter(34016).start, "2026-10-16T19:00:00+02:00");
  assert.equal(efter(45003).start, "2026-12-31T19:00:00+01:00", "vintertid");
  assert.equal(efter(37062).titel, "Lunchkonsert – Åkessonger", "det dolda avstavningstecknet tas bort");
  assert.equal(efter(34016).plats.id, "ukk");
});

test("UKK: kategorier från UKK:s egna kategorier", () => {
  assert.equal(efter(37062).kategori, "musik");
  assert.equal(efter(34016).kategori, "musik");
  assert.equal(efter(44566).kategori, "musik");
  assert.equal(efter(45001).kategori, "scen");
  assert.equal(efter(45002).kategori, "prat");
  assert.equal(efter(45003).kategori, "ovrigt");
});

test("UKK: barn och familj, inställt och fakta", () => {
  assert.equal(efter(45001).barnOchFamilj, true);
  assert.equal(efter(34016).barnOchFamilj, false);
  assert.equal(efter(45004).installd, true);
  assert.deepEqual(efter(44566).fakta, { kategorier: ["jazz"], taggar: ["student", "mhv"] });
});

test("UKK: bara barn och familj blir scen, utom när titeln säger annat", () => {
  assert.equal(kategori("Bamse och Sjörövarskatten", ["category-barn"]), "scen");
  assert.equal(kategori("Local Femmes julmarknad", ["category-barn"]), "ovrigt");
  assert.equal(kategori("Barnens julkonsert", ["category-barn"]), "musik");
});
