// Tester för Tickster. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { antalTraffar, iKommunen, lasEvenemangssida, lasLista, tillEvenemang } from "./regler.mjs";

const las = (namn) => readFile(new URL(namn, import.meta.url), "utf8");
const lista = await las("./exempel-lista.html");
const brickor = lasLista(lista);

test("listan ger id, datum, titel och etikett", () => {
  assert.equal(brickor.length, 6);
  assert.equal(antalTraffar(lista), 356);
  const gibrish = brickor.find((b) => b.id === "n57k008690b2llj");
  assert.equal(gibrish.datum, "2026-09-24");
  assert.equal(gibrish.titel, "Gibrish - I spåren av Bob Dylan");
});

test("utan evenemangssidan: datum och plats från listan", () => {
  const e = tillEvenemang(brickor.find((b) => b.id === "n57k008690b2llj"));
  assert.equal(e.start, "2026-09-24");
  assert.equal(e.plats.namn, "Katalin");
  assert.equal(e.kallor[0].biljetter, "https://secure.tickster.com/sv/n57k008690b2llj");
});

test("evenemangssidan ger tid, plats, koordinater, taggar och arrangör", async () => {
  const d = lasEvenemangssida(await las("./exempel-disco.html"));
  assert.equal(d.start, "2026-09-25T20:00:00");
  assert.equal(d.plats, "Uppsala Konsert & Kongress, Stora salen");
  assert.equal(d.platsId, "v3gu3ky2h68ytd5");
  assert.equal(d.lat, 59.8617);
  assert.deepEqual(d.taggar, ["musik"]);
  assert.equal(d.arrangorId, "y5zw8v159wk4fe3");
  const e = tillEvenemang(brickor[0], d);
  assert.equal(e.start, "2026-09-25T20:00:00+02:00");
  assert.equal(e.kategori, "musik");
});

test("flerdagarsevenemang på mindre ort i kommunen", async () => {
  const d = lasEvenemangssida(await las("./exempel-almunge.html"));
  assert.equal(d.ort, "Almunge");
  assert.equal(iKommunen(d), true);
  assert.equal(tillEvenemang(brickor[0], d).langvarig, true);
});

test("evenemang utanför kommunen tas bort", () => {
  assert.equal(iKommunen({ ort: "Knivsta" }), false);
  assert.equal(iKommunen({ ort: "Uppsala" }), true);
});

test("kategori från titeln när taggar saknas", async () => {
  const d = lasEvenemangssida(await las("./exempel-konstmuseum.html"));
  assert.equal(tillEvenemang(brickor[0], d).kategori, "museum");
});
