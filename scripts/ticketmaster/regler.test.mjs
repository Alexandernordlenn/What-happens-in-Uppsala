// Tester för Ticketmaster. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { bearbeta, geohash, sokadress } from "./regler.mjs";

const exempel = JSON.parse(await readFile(new URL("./exempel.json", import.meta.url), "utf8"));
const resultat = bearbeta([exempel]);
const hitta = (borjan) => resultat.find((e) => e.titel.startsWith(borjan));

test("bara Uppsala kommun, inga testevenemang", () => {
  assert.equal(resultat.length, 3);
  assert.equal(hitta("Påhittat evenemang i Knivsta"), undefined);
  assert.equal(hitta("Testevenemang"), undefined);
});

test("tid i svensk tid, kategori och köplänk", () => {
  const e = hitta("Påhittad konsert");
  assert.equal(e.start, "2026-10-10T20:00:00+02:00");
  assert.equal(e.kategori, "musik");
  assert.equal(e.plats.namn, "Katalin");
  assert.equal(e.kallor[0].biljetter, "https://www.ticketmaster.se/event/A1");
});

test("tid som inte är bestämd ger bara datum, familj och ålder från titeln", () => {
  const e = hitta("Påhittad familjeshow");
  assert.equal(e.start, "2026-11-01");
  assert.equal(e.kategori, "scen");
  assert.equal(e.barnOchFamilj, true);
  assert.deepEqual(e.alder, [3, 7]);
});

test("inställda evenemang markeras", () => {
  assert.equal(hitta("Påhittad inställd").installd, true);
});

test("sökningen görs runt Uppsala", () => {
  assert.equal(geohash(59.8586, 17.6389).length, 6);
  assert.ok(geohash(59.8586, 17.6389).startsWith("u6"));
  const u = new URL(sokadress("NYCKEL", 2));
  assert.equal(u.searchParams.get("page"), "2");
  assert.equal(u.searchParams.get("countryCode"), "SE");
  assert.equal(u.searchParams.get("radius"), "25");
});
