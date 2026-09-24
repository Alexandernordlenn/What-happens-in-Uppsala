// Tester för reglerna. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { bearbeta, tillSvenskTid, utanPersonuppgifter } from "./regler.mjs";

const exempel = JSON.parse(
  await readFile(new URL("./exempel.json", import.meta.url), "utf8"),
).items;
const resultat = bearbeta(utanPersonuppgifter(exempel));
const hitta = (titel) => resultat.find((e) => e.titel === titel);

test("gudstjänster, mässor och böner tas bort", () => {
  assert.equal(hitta("Högmässa"), undefined);
  assert.equal(hitta("Morgonbön"), undefined);
});

test("aftonsång behålls eftersom den är märkt musikOchKor", () => {
  assert.equal(hitta("Aftonsång")?.kategori, "musik");
});

test("typer blir våra kategorier", () => {
  assert.equal(hitta("Orgelkonsert i domkyrkan").kategori, "musik");
  assert.equal(hitta("Babyrytmik").barnOchFamilj, true);
});

test("utan typ klassas händelsen på titeln", () => {
  assert.equal(hitta("Föredrag om Linné").kategori, "prat");
});

test("fri entré i beskrivningen ger gratis", () => {
  assert.equal(hitta("Orgelkonsert i domkyrkan").gratis, true);
  assert.equal(hitta("Orgelkonsert i domkyrkan").beskrivning, "Fri entré. Välkommen!");
});

test("utställning dag för dag blir en långvarig post", () => {
  const u = resultat.filter((e) => e.titel.startsWith("Utställning"));
  assert.equal(u.length, 1);
  assert.equal(u[0].langvarig, true);
  assert.equal(u[0].start, "2026-09-25T10:00:00+02:00");
  assert.equal(u[0].slut, "2026-09-26T16:00:00+02:00");
});

test("personuppgifter sparas inte", () => {
  const text = JSON.stringify(utanPersonuppgifter(exempel));
  assert.ok(!text.includes("Anna Andersson"));
  assert.ok(!text.includes("Per Persson"));
});

test("tider får svensk tidszon, både sommar och vinter", () => {
  assert.equal(tillSvenskTid("2026-09-26T18:00:00"), "2026-09-26T18:00:00+02:00");
  assert.equal(tillSvenskTid("2026-11-02T10:00:00Z"), "2026-11-02T11:00:00+01:00");
  assert.equal(tillSvenskTid("2026-10-25T12:00:00"), "2026-10-25T12:00:00+01:00");
});
