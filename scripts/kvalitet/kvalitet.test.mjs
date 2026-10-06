// Tester för kvalitetsmätningen, med påhittad data. Kör med: npm test
//
// Kontrollerna mot dagens riktiga data (personer.mjs) ligger inte här, eftersom
// de beror på vad som råkar hända i Uppsala just den veckan.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { mat, misstanktaDubbletter } from "./matt.mjs";
import { lasSidansFilter } from "./personer.mjs";
import { kommandeHelg } from "./sida.mjs";
import { normaliseraTitel } from "../gemensamt/titel.mjs";

const sida = {
  idag: "2026-10-06",
  kallor: { b: {}, h: {} },
  evenemang: [
    { t: "Elin Ylvasdotter", d: "2026-10-07", tm: "18:00", v: "stadsbib", c: "prat", s: ["b:x"], o: "centrum" },
    { t: "Författarbesök: Elin Ylvasdotter", d: "2026-10-07", tm: "18:00", v: "stadsbib", c: "prat", s: ["h:y"] },
    { t: "Saffransmysteriet", d: "2026-10-08", tm: "11:00", v: "x", c: "scen", s: ["h:1"], fam: 1 },
    { t: "Saffransmysteriet", d: "2026-10-08", tm: "13:00", v: "x", c: "scen", s: ["h:2"], fam: 1 },
    { t: "Loppis", d: "2026-10-09", v: "x", c: "ovrigt", s: ["h:3", "b:4"] },
  ],
};

test("normaliserad titel tar bort inledningar och stoppord", () => {
  assert.equal(normaliseraTitel("Författarbesök: Elin Ylvasdotter"), "elin ylvasdotter");
  assert.equal(normaliseraTitel("Lunchkonsert med Jan Olof Anderson"), "jan olof anderson");
  assert.equal(normaliseraTitel("Camilla Widell Quartet – på Katalins Backficka 2026"), "camilla widell quartet katalins backficka");
  assert.equal(normaliseraTitel("Rock & pop live"), "rock pop");
});

test("misstänkta dubbletter: samma dag, plats och titel inom en timme", () => {
  const par = misstanktaDubbletter(sida);
  assert.equal(par.length, 1);
  assert.deepEqual(par[0].map((e) => e.s[0][0]).sort(), ["b", "h"]);
});

test("måtten räknas per källa och totalt", () => {
  const r = mat(sida);
  assert.equal(r.totalt.antal, 5);
  assert.equal(r.totalt.ovrigt, 0.2);
  assert.equal(r.totalt.sammanslagna, 1);
  assert.equal(r.totalt.familjUtanAlder, 1);
  assert.equal(r.perKalla.b.antal, 2);
  assert.equal(r.totalt.utanKlockslag, 0.2);
});

test("helgen räknas från idag", () => {
  assert.deepEqual(kommandeHelg("2026-10-06"), ["2026-10-10", "2026-10-11"]);
  assert.deepEqual(kommandeHelg("2026-10-10"), ["2026-10-10", "2026-10-11"]);
  assert.deepEqual(kommandeHelg("2026-10-11"), ["2026-10-11"]);
});

test("åldersfiltret går att läsa ur index.html", async () => {
  const { aldersgrupp } = lasSidansFilter(await readFile(new URL("../../index.html", import.meta.url), "utf8"));
  assert.equal(aldersgrupp({ a: [3, 6] }, ["0-4"]), "exakt");
  assert.equal(aldersgrupp({ a: [7, 9] }, ["0-4"]), null);
});

test("larm: problem blir ärenden, gamla stängs, befintliga får en kommentar", async () => {
  const { hittaProblem, planera } = await import("./larm.mjs");
  const problem = hittaProblem({
    historik: { tickster: { senaste: { datum: "2026-10-06", antal: 0, status: "noll" } }, heja: { senaste: { datum: "2026-10-06", antal: 100, status: "behallen" } } },
    sida: { idag: "2026-10-06", kallor: { b: { hamtad: "2026-10-01T05:00:00Z", inaktuell: 1 } } },
    kvalitet: { personer: [{ person: "Lisa", namn: "Helgen", ok: false, varde: 2, krav: "minst 5" }, { person: "Student", ok: true }] },
    sportLag: { lag: [{ lag: "Almtuna IS", sport: "Ishockey", liga: "HockeyAllsvenskan", iSasong: true, hemmamatcher30: 0 }] },
    utfall: { Tickster: "failure", AI: "failure", Heja: "success" },
  });
  const titlar = problem.map((p) => p.titel);
  assert.deepEqual(titlar.sort(), [
    "AI-steget fungerar inte",
    "Källa: Bibliotek Uppsala är inaktuell",
    "Källa: Heja Uppsala gav för få",
    "Källa: Tickster gav 0",
    "Kvalitet: Lisa-testet",
    "Sport: Almtuna IS saknar matcher",
  ].sort());
  const plan = planera(problem, [{ number: 7, title: "Källa: Tickster gav 0" }, { number: 8, title: "Kvalitet: Student-testet" }]);
  assert.equal(plan.skapa.length, 5);
  assert.deepEqual(plan.kommentera.map((p) => p.number), [7]);
  assert.deepEqual(plan.stang.map((o) => o.number), [8]);
});

test("sidans åldersfilter: 0–99 är ingen exakt träff, familj utan ålder hamnar under ålder ej angiven", async () => {
  const { aldersgrupp } = lasSidansFilter(await readFile(new URL("../../index.html", import.meta.url), "utf8"));
  assert.equal(aldersgrupp({ t: "Schackturnering", a: [0, 99] }, ["0-4"]), null);
  assert.equal(aldersgrupp({ t: "Schackturnering", a: [0, 99], fam: 1 }, ["0-4"]), "okand");
  assert.equal(aldersgrupp({ t: "Familjelördagar på Uppsala konstmuseum", fam: 1 }, ["0-4"]), "okand");
  assert.equal(aldersgrupp({ t: "Familjekonsert: Flamencotopia", fam: 1 }, ["0-4"]), "okand");
  assert.equal(aldersgrupp({ t: "Sagostund 1–3 år", a: [1, 3], fam: 1 }, ["0-4"]), "exakt");
  assert.equal(aldersgrupp({ t: "Bokklubb 9–12 år", a: [9, 12], fam: 1 }, ["0-4"]), null);
});
