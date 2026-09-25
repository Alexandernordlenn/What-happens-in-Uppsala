// Tester för sammanslagningen till sidan. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { bygg, titelnyckel } from "./bygg-sida.mjs";

const ev = (titel, start, plats, extra = {}) => ({
  titel, start, slut: null, plats, kategori: "musik", gratis: null, barnOchFamilj: false,
  kallor: [{ url: `https://x.se/${titelnyckel(titel)}` }], langvarig: false, installd: false, ...extra,
});
const katalin = { namn: "Katalin", id: "katalin" };
const teatern = { namn: "Uppsala stadsteater", id: "stadsteatern" };

test("samma evenemang hos två källor blir ett, med tid och båda källorna", () => {
  const sida = bygg(
    {
      tickster: { hamtad: "x", evenemang: [ev("Gibrish - I spåren av Bob Dylan", "2026-09-26", katalin)] },
      heja: { hamtad: "x", evenemang: [ev("Gibrish – I spåren av Bob Dylan", "2026-09-26T20:00:00+02:00", katalin, { gratis: true })] },
    },
    "2026-09-24",
  );
  assert.equal(sida.evenemang.length, 1);
  const [e] = sida.evenemang;
  assert.equal(e.tm, "20:00");
  assert.equal(e.free, 1);
  assert.deepEqual(e.s.map((x) => x[0]).sort(), ["h", "t"]);
});

test("två föreställningar samma dag hos samma källa förblir två", () => {
  const sida = bygg(
    {
      stadsteatern: {
        hamtad: "x",
        evenemang: [
          ev("Sommar", "2026-09-25T12:00:00+02:00", teatern),
          ev("Sommar", "2026-09-25T19:00:00+02:00", teatern),
        ],
      },
    },
    "2026-09-24",
  );
  assert.equal(sida.evenemang.length, 2);
});

test("olika klockslag hos olika källor slås inte ihop", () => {
  const sida = bygg(
    {
      tickster: { hamtad: "x", evenemang: [ev("Jazzkväll", "2026-09-26T18:00:00+02:00", katalin)] },
      heja: { hamtad: "x", evenemang: [ev("Jazzkväll", "2026-09-26T21:00:00+02:00", katalin)] },
    },
    "2026-09-24",
  );
  assert.equal(sida.evenemang.length, 2);
});

test("gamla evenemang tas bort, pågående och inställda behålls", () => {
  const sida = bygg(
    {
      kubik: {
        hamtad: "x",
        evenemang: [
          ev("Förra veckan", "2026-09-10", katalin),
          ev("Pågår", "2026-09-01", katalin, { slut: "2026-12-01", langvarig: true }),
          ev("Inställd konsert", "2026-09-30T19:00:00+02:00", katalin, { installd: true }),
        ],
      },
    },
    "2026-09-24",
  );
  assert.deepEqual(sida.evenemang.map((e) => e.t), ["Pågår", "Inställd konsert"]);
  assert.equal(sida.evenemang[0].e, "2026-12-01");
  assert.equal(sida.evenemang[0].tm, undefined);
  assert.equal(sida.evenemang[1].x, 1);
  assert.match(sida.evenemang[1].n, /Inställt/);
});

test("sportmatch från förbunden slås ihop med samma match hos Heja", () => {
  const gr = { namn: "Gränby ishall", id: "granbyishall" };
  const sida = bygg(
    {
      sport: { hamtad: "x", evenemang: [ev("Almtuna IS – BIK Karlskoga", "2026-09-26T19:00:00+02:00", gr, { kategori: "sport" })] },
      heja: { hamtad: "x", evenemang: [ev("Almtuna-Karlskoga", "2026-09-26T19:00:00+02:00", gr, { kategori: "sport" })] },
    },
    "2026-09-24",
  );
  assert.equal(sida.evenemang.length, 1);
  assert.equal(sida.evenemang[0].t, "Almtuna IS – BIK Karlskoga");
  assert.deepEqual(sida.evenemang[0].s.map((x) => x[0]).sort(), ["h", "i"]);
});
