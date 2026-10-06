// Facit för reglerna: verkliga evenemang från 6 oktober 2026, märkta för hand.
// Kör med: npm test
//
// Kraven (UPPDRAG-KVALITET.md, fas 10):
//   - minst 95 % rätt på formaten kurs och utställning, åt båda hållen
//   - ålder får aldrig vara fel, hellre okänd
// Kategorin mäts också, men som information.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { klassa } from "../gemensamt/klassa.mjs";
import { normaliseraPlats } from "../gemensamt/platser.mjs";

const facit = JSON.parse(await readFile(new URL("./facit.json", import.meta.url), "utf8")).poster;
const resultat = facit.map((f) => ({ f, e: klassa(normaliseraPlats({ id: "facit", kallor: [], ...f.post }), f.kalla) }));

function traff(format) {
  const sakra = resultat.filter(({ f }) => f.facit.formatSaker);
  const sanna = sakra.filter(({ f }) => f.facit.format === format);
  const gissade = sakra.filter(({ e }) => e.format === format);
  const ratt = sanna.filter(({ e }) => e.format === format);
  return {
    tackning: sanna.length ? ratt.length / sanna.length : 1,
    precision: gissade.length ? gissade.filter(({ f }) => f.facit.format === format).length / gissade.length : 1,
    fel: [...sanna.filter(({ e }) => e.format !== format), ...gissade.filter(({ f }) => f.facit.format !== format)].map(({ f, e }) => `${f.post.titel}: ${e.format}, facit ${f.facit.format}`),
  };
}

test("facit: minst 95 % rätt på kurs", () => {
  const t = traff("kurs");
  assert.ok(t.tackning >= 0.95 && t.precision >= 0.95, t.fel.join("\n"));
});

test("facit: minst 95 % rätt på utställning", () => {
  const t = traff("utstallning");
  assert.ok(t.tackning >= 0.95 && t.precision >= 0.95, t.fel.join("\n"));
});

test("facit: åldern är aldrig fel", () => {
  const fel = resultat
    .filter(({ f, e }) => JSON.stringify(e.alder || null) !== JSON.stringify(f.facit.alder))
    .filter(({ f, e }) => e.alder) // okänd ålder är tillåtet, fel ålder är det inte
    .map(({ f, e }) => `${f.post.titel}: ${JSON.stringify(e.alder)}, facit ${JSON.stringify(f.facit.alder)}`);
  assert.deepEqual(fel, []);
});

test("facit: kategori (information)", () => {
  const ratt = resultat.filter(({ f, e }) => e.kategori === f.facit.kategori).length;
  console.log(`Kategori rätt i ${ratt} av ${resultat.length} (${Math.round((ratt / resultat.length) * 100)} %).`);
  assert.ok(facit.length >= 150);
});
