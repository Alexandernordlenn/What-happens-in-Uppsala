// Tester för AI-klassningens kö och kontroll. Kör med: npm test
// Ingen AI körs här. Svaren är påhittade för att pröva kontrollen.
import { test } from "node:test";
import assert from "node:assert/strict";
import { validera } from "./validera.mjs";
import { byggKo, saknas } from "./ko.mjs";
import { tillampaEtikett } from "../gemensamt/klassa.mjs";

const k = {
  id: "kubik-designlabbet", hash: "abc", titel: "Designlabbet i Sävja, årskurs 4-9", start: "2026-08-07", slut: "2026-12-04",
  kalltext: "Kom och skapa med 3D-skrivare varje onsdag 15–17.30. För dig 10–15 år. Ingen anmälan.",
};

test("godkänt svar: belägg ordagrant, åldersiffror i belägget, dagar och tider", () => {
  const { etikett, avvisade } = validera(
    {
      id: k.id, hash: "abc", format: "aterkommande", dagar: ["on"], tider: { start: "15:00", slut: "17:30" },
      kategori: "aktivitet", alderMin: 10, alderMax: 15,
      belagg: { format: "varje onsdag 15–17.30", kategori: "Kom och skapa", alder: "För dig 10–15 år" },
    },
    k,
  );
  assert.deepEqual(avvisade, []);
  assert.deepEqual(etikett, { format: "aterkommande", serie: { dagar: ["on"], start: "15:00", slut: "17:30" }, kategori: "aktivitet", alder: [10, 15] });
});

test("avvisat: påhittat belägg, ålder som inte står i belägget, kurs för kort, okänt värde", () => {
  const { etikett, avvisade } = validera(
    {
      id: k.id, hash: "abc", format: "kurs", kategori: "konst", alderMin: 4, alderMax: 9,
      belagg: { format: "Terminskurs med anmälan", kategori: "Designlabbet", alder: "årskurs 4-9" },
    },
    k,
  );
  assert.deepEqual(etikett, {});
  assert.deepEqual(avvisade.sort(), ["alder", "format", "kategori"]);
  const kort = { ...k, slut: "2026-08-10", kalltext: "Kurs med anmälan." };
  assert.deepEqual(validera({ format: "kurs", belagg: { format: "Kurs med anmälan." } }, kort).etikett, {});
});

test("okand är alltid tillåtet och ger ingen etikett", () => {
  const { etikett, avvisade } = validera({ id: k.id, hash: "abc", format: "okand", kategori: "okand", alderMin: "okand", alderMax: "okand", barn: "okand" }, k);
  assert.deepEqual(etikett, {});
  assert.deepEqual(avvisade, []);
});

test("AI fyller bara luckor: skriver aldrig över källans eller reglernas uppgifter", () => {
  const e = { id: "x", titel: "T", kategori: "musik", format: "period", alder: [3, 6], barnOchFamilj: true, ursprung: { kategori: "kalla" } };
  const ut = tillampaEtikett(e, { hash: "h", kategori: "aktivitet", format: "aterkommande", serie: { dagar: ["on"] }, alder: [10, 12] }, "h");
  assert.equal(ut.kategori, "musik");
  assert.deepEqual(ut.alder, [3, 6]);
  assert.equal(ut.format, "aterkommande");
  assert.equal(ut.ursprung.format, "ai");
  // Ändrat innehåll (annan hash) ger ingen etikett.
  assert.equal(tillampaEtikett(e, { hash: "gammal", format: "kurs" }, "ny").format, "period");
});

test("kön: bara luckor, de närmaste först, och inte om svaret redan finns", () => {
  const ev = (id, titel, start, extra = {}) => ({ id, titel, start, slut: null, plats: { namn: "P", id: "p" }, kategori: "ovrigt", barnOchFamilj: false, kallor: [{ url: "u" }], ...extra });
  const filer = {
    heja: [ev("heja-1", "Loppis", "2026-11-01"), ev("heja-2", "Jazzkonsert", "2026-10-07", { kategori: "musik" }), ev("heja-3", "Något", "2026-10-08")],
  };
  const ko = byggKo(filer, {}, null, "2026-10-06");
  assert.deepEqual(ko.map((x) => x.id), ["heja-3", "heja-1"]);
  assert.deepEqual(saknas({ format: "period", barnOchFamilj: true, kategori: "ovrigt" }), ["format", "alder", "kategori"]);
  const igen = byggKo(filer, {}, { poster: { "heja-3": { hash: ko[0].hash, promptversion: 1 } } }, "2026-10-06");
  assert.deepEqual(igen.map((x) => x.id), ["heja-1"]);
});
