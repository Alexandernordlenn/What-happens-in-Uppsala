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

test("id är stabilt mellan körningar och sport får en egen etikett", () => {
  const ifu = { namn: "IFU Arena", id: "ifu" };
  const filer = {
    sport: {
      hamtad: "2026-09-24",
      evenemang: [ev("Storvreta – Täby (dam)", "2026-09-26T18:30:00+02:00", ifu, { id: "sport-x-1", kategori: "sport", sport: "Innebandy", liga: "SSL dam" })],
    },
  };
  const a = bygg(filer, "2026-09-24");
  const b = bygg(structuredClone(filer), "2026-09-25");
  assert.equal(a.evenemang[0].id, b.evenemang[0].id);
  assert.equal(a.evenemang[0].sp, "Innebandy, SSL dam");
  assert.equal(a.evenemang[0].n, undefined);
});

test("en källa som inte hämtats på flera dagar markeras som inaktuell", () => {
  const sida = bygg({ heja: { hamtad: "2026-09-20T05:00:00Z", evenemang: [ev("X", "2026-09-26", katalin)] } }, "2026-09-24");
  assert.equal(sida.kallor.h.inaktuell, 1);
});

test("rättelser går före källan", () => {
  const sida = bygg(
    { kubik: { hamtad: "x", evenemang: [ev("Designlabbet", "2026-09-26", katalin, { id: "kubik-d", kategori: "museum" })] } },
    "2026-09-24",
    { rattelser: { poster: { "kubik-d": { kategori: "aktivitet" } } } },
  );
  assert.equal(sida.evenemang[0].c, "aktivitet");
});

// ---------- Facit för dubbletter (avsnitt 13 i UPPDRAG-KVALITET.md) ----------

const P = {
  stadsbib: { namn: "Stadsbiblioteket", id: "stadsbib" },
  heja_stadsbib: { namn: "Uppsala stadsbibliotek", id: "heja-plats-uppsala-stadsbibliotek" },
  gottsunda: { namn: "Gottsundabiblioteket", id: "gottsundabib" },
  gottsundaTema: { namn: "Gottsundabiblioteket, temaverkstaden", id: "kubik-plats-x" },
  kulturpunkten: { namn: "Kulturpunkten, Gottsunda", id: "kulturpunkten" },
  storvreta: { namn: "Storvretabiblioteket", id: "storvretabib" },
  blackbird: { namn: "Blackbird", id: "blackbird" },
  ukk: { namn: "Uppsala Konsert & Kongress", id: "ukk" },
  katalin,
  konst: { namn: "Uppsala konstmuseum", id: "konstmuseum" },
  dom: { namn: "Uppsala domkyrka", id: "domkyrkan" },
  fyrishov: { namn: "Fyrishov", id: "fyrishov" },
  upm: { namn: "Upplandsmuseet", id: "upplandsmuseet" },
  teatern,
};
const T = (dag, tid) => `${dag}T${tid}:00+02:00`;
const kalla = (id, ...evenemang) => ({
  [id]: { hamtad: "2026-10-06", evenemang: evenemang.map((e, i) => ({ ...e, id: `${id}-${i}`, kallor: [{ url: `https://x.se/${id}/${i}` }] })) },
});
const byggMed = (...filer) => bygg(Object.assign({}, ...filer), "2026-10-06");
const antal = (sida) => sida.evenemang.length;

test("facit: författarbesök hos biblioteket och Heja blir ett", () => {
  const sida = byggMed(
    kalla("bibliotek", ev("Elin Ylvasdotter", T("2026-10-07", "18:00"), P.stadsbib, { kategori: "prat" })),
    kalla("heja", ev("Författarbesök: Elin Ylvasdotter", T("2026-10-07", "18:00"), P.stadsbib, { kategori: "prat" })),
  );
  assert.equal(antal(sida), 1);
  assert.equal(sida.evenemang[0].s.length, 2);
});

test("facit: klockslag som skiljer en halvtimme slås ihop (Ebbot Lundberg, La Tremendita)", () => {
  assert.equal(antal(byggMed(
    kalla("heja", ev("Ebbot Lundberg", T("2026-10-09", "19:30"), P.blackbird)),
    kalla("tickster", ev("Ebbot Lundberg", T("2026-10-09", "20:00"), P.blackbird)),
  )), 1);
  assert.equal(antal(byggMed(
    kalla("heja", ev("La Tremendita feat. Juanfe Pérez", T("2026-10-10", "16:00"), P.ukk)),
    kalla("tickster", ev("La Tremendita feat. Juanfe Pérez", T("2026-10-10", "16:30"), P.ukk)),
  )), 1);
});

test("facit: omkastade och omskrivna titlar (Lunchkonsert, Moto Boy, Camilla Widell)", () => {
  assert.equal(antal(byggMed(
    kalla("heja", ev("Lunchkonsert med Jan Olof Anderson", T("2026-10-09", "12:00"), P.ukk)),
    kalla("tickster", ev("Jan Olof Anderson – Lunchkonsert", T("2026-10-09", "12:00"), P.ukk)),
  )), 1);
  assert.equal(antal(byggMed(
    kalla("heja", ev("Moto Boy tolkar Lana Del Rey", T("2026-10-11", "19:00"), P.ukk)),
    kalla("tickster", ev("Moto Boy – En hyllning till Lana Del Rey", T("2026-10-11", "19:00"), P.ukk)),
  )), 1);
  assert.equal(antal(byggMed(
    kalla("heja", ev("Camilla Widell Quartet – Katalins Backficka", T("2026-10-09", "20:00"), P.katalin)),
    kalla("tickster", ev("Camilla Widell Quartet – på Katalins Backficka", T("2026-10-09", "20:00"), P.katalin)),
  )), 1);
});

test("facit: Banned Books Festival slås ihop trots att bara den ena har ålder, men inte barnteatern två timmar senare", () => {
  const sida = byggMed(
    kalla("bibliotek",
      ev("Banned Books Festival", T("2026-10-10", "11:00"), P.stadsbib, { alder: [18, 99] }),
      ev("Banned books-festival med barnteater", T("2026-10-10", "13:00"), P.stadsbib)),
    kalla("heja", ev("Banned Books Festival", T("2026-10-10", "11:00"), P.heja_stadsbib, { barnOchFamilj: true })),
  );
  assert.equal(antal(sida), 2);
});

test("facit: sagostund och barnrytmik hos biblioteket och Kubik, samma byggnad", () => {
  assert.equal(antal(byggMed(
    kalla("bibliotek", ev("Sagostund på svenska för barn 1–3 år", T("2026-10-06", "10:30"), P.stadsbib)),
    kalla("kubik", ev("Sagostund för barn 1-3 år", T("2026-10-06", "10:30"), P.stadsbib)),
  )), 1);
  assert.equal(antal(byggMed(
    kalla("bibliotek", ev("Barnrytmik 3–5-åringar", T("2026-10-20", "15:00"), P.gottsunda)),
    kalla("kubik",
      ev("Barnrytmik 3-5 åringar", T("2026-10-20", "15:00"), P.kulturpunkten),
      ev("Barnrytmik 3-5 åringar", T("2026-11-03", "15:00"), P.kulturpunkten)),
  )), 2);
  assert.equal(antal(byggMed(
    kalla("bibliotek", ev("Torsdagsbibblan", T("2026-10-08", "15:00"), P.gottsunda)),
    kalla("kubik", ev("Torsdagsbibblan", T("2026-10-08", "15:00"), P.gottsundaTema)),
  )), 1);
});

test("facit: festivalen SciFest tar upp programpunkterna", () => {
  const sida = byggMed(
    kalla("heja", ev("Vetenskapsfestivalen SciFest", T("2026-10-08", "09:00"), P.fyrishov, { slut: "2026-10-10" })),
    kalla("kubik", ev("SciFest 2026", T("2026-10-10", "09:00"), P.fyrishov)),
    kalla("destination-uppsala", ev("Vetenskapsfestivalen SciFest 2026", T("2026-10-10", "09:00"), P.fyrishov)),
  );
  assert.equal(antal(sida), 1);
  assert.equal(sida.evenemang[0].s.length, 3);
  assert.equal(sida.evenemang[0].e, "2026-10-10");
});

test("facit: långvariga poster blir en utställning (Katarina Jagellonica, Walmstedtska gården)", () => {
  const sida = byggMed(
    kalla("destination-uppsala", ev("Katarina Jagellonica 500 år", "2026-05-08", P.dom, { slut: "2026-11-08", kategori: "museum" })),
    kalla("heja",
      ev("Utställn: Katarina Jagellonica i Domkyrkan", "2026-05-08", P.dom, { slut: "2026-10-31", kategori: "museum" }),
      ev("Utställn: Katarina Jagellonica i Domkyrkan", "2026-05-08", P.dom, { slut: "2026-11-08", kategori: "museum" }),
      ...["2026-10-11", "2026-10-18", "2026-12-20"].map((slut) => ev("Visning: Walmstedtska gården", "2026-07-04", P.upm, { slut, kategori: "museum" }))),
    kalla("kubik", ev("Katarina Jagellonica 500 år", T("2026-10-26", "10:00"), P.dom, { kategori: "museum" })),
  );
  const kj = sida.evenemang.filter((e) => /Jagellonica/.test(e.t));
  assert.equal(kj.length, 2); // utställningen och Kubiks visning med klockslag
  const utst = kj.find((e) => e.e);
  assert.equal(utst.f, "utstallning");
  assert.equal(utst.d, "2026-05-08");
  assert.equal(utst.e, "2026-11-08");
  assert.equal(sida.evenemang.filter((e) => /Walmstedtska/.test(e.t)).length, 1);
});

test("facit: teaterns föreställningar ersätter Destinations speltid, med båda länkarna", () => {
  const sida = byggMed(
    kalla("stadsteatern",
      ev("Stadens ljus", T("2026-10-09", "18:00"), P.teatern, { kategori: "scen" }),
      ev("Stadens ljus", T("2026-10-10", "16:00"), P.teatern, { kategori: "scen" })),
    kalla("destination-uppsala", ev("Stadens ljus", "2026-09-25", P.teatern, { slut: "2026-12-19", kategori: "scen" })),
  );
  assert.equal(antal(sida), 2);
  assert.ok(sida.evenemang.every((e) => e.s.length === 2 && !e.e));
});

test("facit: Familjelördagar får Hejas uttryckliga datum i stället för varje lördag", () => {
  const sida = byggMed(
    kalla("destination-uppsala", ev("Familjelördagar på Uppsala Konstmuseum", "2026-09-05", P.konst, { slut: "2026-12-05", kategori: "museum", barnOchFamilj: true })),
    kalla("heja", ...["2026-10-10", "2026-10-24", "2026-11-14"].map((d) => ev("Familjelördagar på Uppsala konstmuseum", d, P.konst, { barnOchFamilj: true }))),
  );
  assert.deepEqual(sida.evenemang.map((e) => e.d), ["2026-10-10", "2026-10-24", "2026-11-14"]);
  assert.ok(sida.evenemang.every((e) => e.s.some((s) => s.startsWith("d:")) && e.s.some((s) => s.startsWith("h:"))));
});

test("facit: samma källa, identiska poster blir en; olika klockslag förblir flera", () => {
  const himlen = { namn: "Himlen är blå som en apelsin", id: "himlen" };
  assert.equal(antal(byggMed(kalla("heja", ...[1, 2, 3, 4].map(() => ev("Art Muse Music", T("2026-10-06", "18:00"), himlen))))), 1);
  assert.equal(antal(byggMed(kalla("kubik", ...["11:00", "13:00", "15:00"].map((t) => ev("Saffransmysteriet", T("2026-10-10", t), P.konst))))), 3);
  assert.equal(antal(byggMed(kalla("tickster", ...["12:30", "14:30"].map((t) => ev("Familjevisning med verkstad", T("2026-10-10", t), P.konst))))), 2);
});

test("facit: ska inte slås ihop: olika platser och olika program", () => {
  assert.equal(antal(byggMed(
    kalla("bibliotek",
      ev("Kortfilmsbio: Stor och liten", T("2026-10-10", "13:00"), P.storvreta),
      ev("Kortfilmsbio: Stor och liten", T("2026-10-10", "13:00"), P.gottsunda),
      ev("Filosofiska samtal", T("2026-10-13", "14:00"), P.stadsbib),
      ev("Filosofiska samtal", T("2026-10-13", "18:30"), P.storvreta)),
  )), 4);
  assert.equal(antal(byggMed(
    kalla("heja", ev("Uppsala Internationella Gitarrfestival", T("2026-10-08", "18:00"), P.katalin)),
    kalla("tickster", ev("Uppsala Internationella Gitarrfestival", T("2026-10-08", "18:00"), P.ukk)),
  )), 2);
  assert.equal(antal(byggMed(
    kalla("heja", ev("Föreläsning del 1", T("2026-10-08", "18:00"), P.stadsbib)),
    kalla("bibliotek", ev("Föreläsning del 2", T("2026-10-08", "18:00"), P.stadsbib)),
  )), 2);
});
