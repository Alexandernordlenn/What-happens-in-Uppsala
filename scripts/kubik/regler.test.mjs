// Tester för Kubik. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { bearbeta, lasKort, tolkaTid } from "./regler.mjs";

const kort = lasKort(await readFile(new URL("./exempel.html", import.meta.url), "utf8"));
const resultat = bearbeta(kort);
const av = (slug) => resultat.filter((e) => e.id.startsWith(`kubik-${slug}`));

test("korten läses", () => {
  assert.equal(kort.length, 6);
  const f = kort.find((k) => k.slug === "fredagsmys-2026");
  assert.equal(f.titel, "Fredagsmys");
  assert.ok(f.tider.length >= 3);
  assert.ok(f.gratis);
});

test("tider i Kubiks tre former", () => {
  assert.deepEqual(tolkaTid("25 sep. 2026 14:00 - 14:30"), { typ: "tillfalle", datum: "2026-09-25", start: "14:00", slut: "14:30" });
  assert.deepEqual(tolkaTid("25 sep. 2026 14:30 - 18 dec. 2026 15:30"), { typ: "period", fran: "2026-09-25", till: "2026-12-18", start: "14:30", slut: "15:30" });
  assert.deepEqual(tolkaTid("19 sep. 2026 - 21 nov. 2026"), { typ: "period", fran: "2026-09-19", till: "2026-11-21", start: null, slut: null });
  assert.equal(tolkaTid("03 okt. 2026 14:30 - 14:00").slut, null);
  assert.equal(tolkaTid("01 mars 2027 10:00 - 11:00").datum, "2027-03-01");
});

test("enstaka tillfällen blir ett evenemang var", () => {
  const f = av("fredagsmys-2026");
  assert.ok(f.length >= 3);
  assert.equal(f[0].start, "2026-09-25T14:00:00+02:00");
  assert.equal(f[0].langvarig, false);
  assert.equal(f[0].barnOchFamilj, true);
});

test("en period blir ett långvarigt evenemang med klockslag som notering", () => {
  const [h] = av("hoerlurar-paa-1");
  assert.equal(h.start, "2026-09-25");
  assert.equal(h.slut, "2026-12-18");
  assert.equal(h.langvarig, true);
  assert.match(h.notering, /14:30–15:30/);
});

test("två perioder ger två evenemang, och aktivitet utan tid ger inget", () => {
  assert.equal(av("gitarrundervisning-i-grupp").length, 2);
  assert.equal(av("schack-paa-graenby").length, 0);
});

test("bara 19-25 år räknas inte som barn och familj", () => {
  const [j] = av("juridisk-raadgivning");
  assert.equal(j.barnOchFamilj, false);
});

test("inga kontaktuppgifter sparas", () => {
  const text = JSON.stringify(kort);
  assert.ok(!/tel:|mailto:|@uppsala\.se/.test(text));
});
