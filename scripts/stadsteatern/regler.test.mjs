// Tester för stadsteatern. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { bearbeta } from "./regler.mjs";

const poster = JSON.parse(await readFile(new URL("./exempel.json", import.meta.url), "utf8"));
// Exempeldatan hämtades 24 september 2026 kl. 12.
const resultat = bearbeta(poster, new Date("2026-09-24T10:00:00Z"));

test("en post per föreställning, med svensk tid och scen", () => {
  const lotten = resultat.filter((e) => e.titel === "Lotten von Kræmer");
  assert.equal(lotten.length, 3);
  assert.match(lotten[0].start, /^2027-01-29T18:00:00\+01:00$/);
  assert.equal(lotten[0].plats.rum, "Stora scenen");
  assert.ok(lotten[0].kallor[0].biljetter.startsWith("https://biljett.uppsalastadsteater.se/"));
});

test("dolda avstavningstecken tas bort ur titeln", () => {
  assert.ok(resultat.some((e) => e.titel === "Linnékvintetten och Moa Silén"));
});

test("konsert blir musik, resten scen", () => {
  assert.equal(resultat.find((e) => e.titel.startsWith("Linné")).kategori, "musik");
  assert.equal(resultat.find((e) => e.titel === "Lotten von Kræmer").kategori, "scen");
});

test("slutsålt syns som notering", () => {
  assert.match(resultat.find((e) => e.titel.startsWith("Linné")).notering, /Slutsåld/);
});

test("inställda föreställningar markeras i stället för att tas bort", () => {
  const inst = resultat.filter((e) => e.installd);
  assert.equal(inst.length, 1);
  assert.equal(inst[0].titel, "Medan vi brinner");
});

test("barnföreställningar märks, uppsättning utan datum ger inget", () => {
  assert.ok(resultat.filter((e) => e.titel === "Stadens ljus").every((e) => e.barnOchFamilj));
  assert.equal(resultat.filter((e) => /parasiter/i.test(e.titel)).length, 0);
});

test("föreställningar som redan varit tas bort", () => {
  const senare = bearbeta(poster, new Date("2027-06-01T00:00:00Z"));
  assert.equal(senare.length, 0);
});
