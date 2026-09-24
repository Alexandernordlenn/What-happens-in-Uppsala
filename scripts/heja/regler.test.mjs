// Tester för Heja Uppsala. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { finnsNastaSida, iKommunen, lasDetaljer, lasLista, raknaUtDatum, tillEvenemang } from "./regler.mjs";

const las = (namn) => readFile(new URL(namn, import.meta.url), "utf8");
const lista = await las("./exempel-lista.html");
// Exempeldatan hämtades 24 september 2026.
const kort = raknaUtDatum(lasLista(lista), "2026-09-24");
const hitta = (borjan) => kort.find((k) => k.titel.startsWith(borjan));

test("korten läses med titel, plats, kategorier och datum", () => {
  assert.equal(kort.length, 12);
  const k = hitta("Gibrish");
  assert.equal(k.plats, "Katalins bakficka");
  assert.equal(k.startdatum, "2026-09-24");
  assert.ok(iKommunen(k));
  assert.ok(finnsNastaSida(lista));
});

test("klockslag från 'När och var?'", async () => {
  const e = tillEvenemang(hitta("Gibrish"), lasDetaljer(await las("./exempel-gibrish.html")));
  assert.equal(e.start, "2026-09-24T20:00:00+02:00");
  assert.equal(e.kategori, "musik");
  assert.equal(e.kallor[0].arrangor, "https://secure.tickster.com/sv/n57k008690b2llj/products");
});

test("klockslag på egen rad och gratis", async () => {
  const e = tillEvenemang(hitta("Sirius dam"), lasDetaljer(await las("./exempel-sirius.html")));
  assert.equal(e.start, "2026-09-24T20:00:00+02:00");
  assert.equal(e.kategori, "sport");
  assert.equal(e.gratis, true);
});

test("pågående utställning får riktigt startdatum och inget klockslag", async () => {
  const k = { ...hitta("Gibrish"), titel: "Jill Eriksson", startdatum: "2026-09-24", slutdatum: "2026-09-27" };
  const e = tillEvenemang(k, lasDetaljer(await las("./exempel-jill.html")));
  assert.equal(e.start, "2026-09-11");
  assert.equal(e.slut, "2026-09-27");
  assert.equal(e.langvarig, true);
});
