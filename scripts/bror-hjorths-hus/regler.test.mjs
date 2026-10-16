// Tester för Bror Hjorths Hus. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearbeta } from "./regler.mjs";

const exempel = JSON.parse(readFileSync(new URL("./exempel.json", import.meta.url), "utf8"));
const NU = new Date("2026-10-16T08:00:00Z");
const evenemang = bearbeta(exempel, NU);
const medTitel = (t) => evenemang.find((e) => e.titel === t);

test("Bror Hjorths Hus: museets kategorier blir våra", () => {
  assert.equal(medTitel("Konsert: SYMBIO").kategori, "musik");
  assert.equal(medTitel("Möt konstnären: Johan Thurfjell").kategori, "prat");
  assert.equal(medTitel("Höstlov: Familjeverkstad").kategori, "aktivitet");
  assert.ok(evenemang.some((e) => e.kategori === "museum" && /visning/i.test(e.titel)));
});

test("Bror Hjorths Hus: tid, adress, pris och barn", () => {
  const e = medTitel("Konsert: SYMBIO");
  assert.equal(e.start, "2026-10-18T19:00:00+02:00");
  assert.equal(e.slut, "2026-10-18T20:00:00+02:00");
  assert.equal(e.fakta.adress, "Norbyvägen 26, 752 39");
  assert.equal(e.gratis, false);
  assert.equal(medTitel("Höstlov: Familjeverkstad").barnOchFamilj, true);
  assert.equal(medTitel("Höstlovskonstskola för barn 8-12 år").barnOchFamilj, true);
});

test("Bror Hjorths Hus: en kurs för vuxna markeras som kurs, lovets konstskola inte", () => {
  assert.equal(medTitel("Målerikurs för vuxna – Måla porträtt i olja").format, "kurs");
  assert.equal(medTitel("Höstlovskonstskola för barn 8-12 år").format, undefined);
});
