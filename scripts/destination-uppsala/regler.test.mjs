// Tester för Destination Uppsala. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { antalSidor, lasDetaljer, lasLista, raknaUtDatum, tillEvenemang } from "./regler.mjs";

const las = (namn) => readFile(new URL(namn, import.meta.url), "utf8");
const lista = await las("./exempel-lista.html");
// Exempeldatan hämtades 24 september 2026.
const kort = raknaUtDatum(lasLista(lista), "2026-09-24");
const hitta = (borjan) => kort.find((k) => k.titel.startsWith(borjan));

test("korten läses med titel, plats och kategorier", () => {
  assert.equal(kort.length, 13);
  const loppis = hitta("Bakluckeloppis");
  assert.equal(loppis.plats, "Ulva Kvarn");
  assert.deepEqual(loppis.kategorier, ["marknad"]);
  assert.equal(antalSidor(lista), 11);
});

test("pågående utställning som började förra året", () => {
  const k = hitta("Life. Play. End.");
  assert.equal(k.startdatum, "2025-11-05");
  assert.equal(k.slutdatum, "2026-10-18");
});

test("utställning som slutar nästa år", () => {
  const k = hitta("Bruno Liljefors");
  assert.equal(k.startdatum, "2026-06-13");
  assert.equal(k.slutdatum, "2027-09-19");
});

test("årtalet stiger när månaderna börjar om", () => {
  const k = hitta("Fredrik Andersson");
  assert.equal(k.startdatum, "2027-10-22");
});

test("klockslag och årtal från evenemangets egen sida", async () => {
  const d = lasDetaljer(await las("./exempel-fredrik.html"));
  assert.equal(d.nar, "22 October 2027, 19:30–20:50");
  const e = tillEvenemang(hitta("Fredrik Andersson"), d);
  assert.equal(e.start, "2027-10-22T19:30:00+02:00");
  assert.equal(e.kategori, "scen");
  assert.equal(e.kallor[0].arrangor, "https://www.fredrikanderssonproductions.com/");
});

test("pris och klockslag med punkt", async () => {
  const d = lasDetaljer(await las("./exempel-fyris.html"));
  assert.equal(d.pris, "Betald biljett krävs");
  const k = { ...hitta("Fredrik Andersson"), startdatum: "2026-12-08" };
  const e = tillEvenemang(k, d);
  assert.equal(e.start, "2026-12-08T19:00:00+01:00");
  assert.equal(e.gratis, false);
});

test("långvarigt evenemang får inget klockslag och märks som långvarigt", () => {
  const e = tillEvenemang(hitta("Katarina Jagellonica"));
  assert.equal(e.langvarig, true);
  assert.equal(e.start, "2026-05-08");
  assert.equal(e.barnOchFamilj, true);
  assert.equal(e.kategori, "museum");
});
