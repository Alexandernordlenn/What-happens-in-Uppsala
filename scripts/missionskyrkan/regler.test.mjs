// Tester för Uppsala Missionskyrka. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearbeta, skaMed } from "./regler.mjs";

const exempel = JSON.parse(readFileSync(new URL("./exempel.json", import.meta.url), "utf8"));
const NU = new Date("2026-10-16T08:00:00Z");
const evenemang = bearbeta(exempel, NU);
const medTitel = (t) => evenemang.find((e) => e.titel === t);

test("Missionskyrkan: gudstjänster, bibelstudier och församlingsmöten tas bort", () => {
  const titlar = evenemang.map((e) => e.titel);
  for (const t of ["Gudstjänst: Att leva tillsammans", "Församlingsmöte", "Bibelstudium NT 2026", "Upptäck bibeln", "Gudstjänst med nattvard: Vårt evighetshopp", "Julafton i Missionskyrkan"]) {
    assert.ok(!titlar.includes(t), t);
  }
  assert.equal(evenemang.length, 8);
});

test("Missionskyrkan: konserter och kulturkvällar behålls även med ord som meditation", () => {
  assert.ok(medTitel("Kulturkväll: Mishmosh – Judiska meditationer"));
  assert.ok(medTitel("Konsert: Mozarts Requiem"));
  assert.equal(skaMed("Taizémässa"), false);
  assert.equal(skaMed("Konsert: Requiem för fred"), true);
});

test("Missionskyrkan: tid i svensk tid och ingen falsk sluttid", () => {
  const e = medTitel("Konsert: Mozarts Requiem");
  assert.equal(e.start, "2026-10-17T16:00:00+02:00");
  assert.equal(e.slut, null, "samma start och slut är ingen sluttid");
  assert.equal(e.kategori, "musik");
  assert.equal(e.plats.id, "missionskyrkan");
  assert.equal(e.kallor[0].url, "https://uppsalamissionskyrka.se/kalender/konsert-barbro-bjorklunds-kammarkor-2/");
});

test("Missionskyrkan: annan plats och kategorier", () => {
  assert.equal(medTitel("Språk och värld i förändring").plats.namn, "Stadsbiblioteket");
  assert.equal(medTitel("Samtal pågår i Flottsundskyrkan").plats.namn, "Flottsundskyrkan");
  assert.equal(medTitel("Fredagsträffen: Islam i Sverige").kategori, "prat");
  assert.equal(medTitel("Lunchmusik: Jazzt Friends och Lena Wohlfeil").kategori, "musik");
  assert.equal(medTitel("Julmarknad").kategori, "ovrigt");
  assert.equal(medTitel("Konsert: Candlelight: Vivaldis fyra årstider").titel, "Konsert: Candlelight: Vivaldis fyra årstider");
});
