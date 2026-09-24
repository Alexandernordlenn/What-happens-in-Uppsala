// Tester för Bibliotek Uppsala. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { bearbeta, sokParametrar } from "./regler.mjs";

const exempel = JSON.parse(await readFile(new URL("./exempel.json", import.meta.url), "utf8"));
const resultat = bearbeta(exempel.hits);
const hitta = (t) => resultat.find((e) => e.titel === t);

test("tid i svensk tid, bibliotek och sal", () => {
  const e = hitta("Författarbesök: Iman Mersal");
  assert.equal(e.start, "2026-09-22T18:00:00+02:00");
  assert.equal(e.plats.namn, "Stadsbiblioteket");
  assert.equal(e.plats.rum, "Mallas sal");
  assert.equal(e.kallor[0].url, "https://bibliotekuppsala.se/evenemang#/events/7c8a512f-ac65-4a5d-a695-c022783ec05c");
});

test("datum som objekt, barn från målgruppen, gratis som standard", () => {
  const e = hitta("Sagostund");
  assert.equal(e.start, "2026-10-03T10:00:00+02:00");
  assert.equal(e.barnOchFamilj, true);
  assert.equal(e.gratis, true);
});

test("pris i beskrivningen och inställt evenemang", () => {
  const e = hitta("Kurs i släktforskning");
  assert.equal(e.gratis, false);
  assert.equal(e.installd, true);
});

test("inga beskrivningar eller namn i det färdiga", () => {
  const text = JSON.stringify(resultat);
  assert.ok(!text.includes("Anna Andersson"));
  assert.ok(!text.includes("Boka plats"));
});

test("sökningen ber om allt som inte är slut, även inställt", () => {
  const p = sokParametrar(new Date("2026-09-24T10:00:00Z"), 50, 50);
  assert.equal(p.get("start"), "50");
  assert.match(p.get("rangeFilters"), /2026-09-24T10:00:00.000Z/);
  assert.match(p.get("termFilters"), /CANCELLED/);
});

test("taggar ger kategori, stödtjänster tas bort, tom sal ignoreras", () => {
  const ev = (id, tags, extra = {}) => ({ event: { id, title: `T${id}`, startDate: "2026-10-01T10:00:00Z", tags, ...extra } });
  const r = bearbeta([
    ev(1, ["Musik"]),
    ev(2, ["Film"]),
    ev(3, ["Läxhjälp"]),
    ev(4, ["Sagostund", "Småbarn"], { room: { id: null, value: null } }),
  ]);
  assert.deepEqual(r.map((e) => e.kategori), ["musik", "scen", "ovrigt"]);
  assert.equal(r[2].plats.rum, undefined);
});
