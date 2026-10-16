// Tester för Fyrishov. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearbeta } from "./regler.mjs";

const text = readFileSync(new URL("./exempel.ics", import.meta.url), "utf8");
const evenemang = bearbeta(text, "2026-10-16");
const efter = (nr) => evenemang.find((e) => e.id === `fyrishov-${nr}`);

test("Fyrishov: enstaka evenemang med hall, och det som har varit tas bort", () => {
  assert.equal(efter(26697).start, "2026-10-23T19:04:00+02:00");
  assert.equal(efter(26697).plats.rum, "Hall A");
  assert.equal(efter(26697).kategori, "sport");
  assert.equal(efter(27279).slut, "2026-10-25T16:00:00+01:00", "mässan pågår två dagar, och vintertiden börjar den 25 oktober");
  assert.equal(efter(27279).kategori, "ovrigt");
  assert.equal(efter(28003), undefined, "mässan i september har redan varit");
  assert.equal(efter(3329), undefined, "regeln slutade 2025");
});

test("Fyrishov: en återkommande aktivitet får sina riktiga datum, utan undantagen", () => {
  const e = efter(28001);
  assert.equal(e.format, "aterkommande");
  assert.equal(e.serie.start, "10:00");
  assert.equal(e.serie.slut, "11:30");
  assert.equal(e.serie.datum[0], "2026-10-17");
  assert.ok(!e.serie.datum.includes("2026-10-31") && !e.serie.datum.includes("2026-11-01"), "undantagen tas bort");
  assert.ok(e.serie.datum.includes("2026-10-18") && e.serie.datum.includes("2026-12-19"));
  assert.equal(e.serie.datum.length, 17, "tio lördagar och nio söndagar, minus två undantag");
  assert.equal(e.start, "2026-10-17T10:00:00+02:00");
  assert.equal(e.barnOchFamilj, true);
});

test("Fyrishov: inställt, plats utan rum och ingen beskrivning", () => {
  assert.equal(efter(28002).installd, true);
  assert.equal(efter(28002).plats.rum, undefined);
  assert.ok(!JSON.stringify(evenemang).includes("Påhittad beskrivning"));
});
