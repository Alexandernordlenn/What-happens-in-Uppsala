// Tester för klassningen: kategori, format, ålder och titlar. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { klassa, stadaTider, stadaTitel } from "./klassa.mjs";
import { lasVeckodagar, serieDatum, isoVecka } from "./veckodagar.mjs";
import { spannFranText } from "./omraden.mjs";
import { gissaKategori } from "./kategori.mjs";
import { normaliseraPlats } from "./platser.mjs";

const ev = (titel, start, slut = null, extra = {}) => ({
  id: "x", titel, start, slut, plats: { namn: "Uppsala", id: "uppsala" }, kategori: "ovrigt",
  gratis: null, barnOchFamilj: false, kallor: [{ url: "u" }], langvarig: Boolean(slut), installd: false, ...extra,
});

test("Designlabbet hos Kubik är en aktivitet, inte museum", () => {
  const e = klassa(ev("DESIGNLABBET I SÄVJA, ÅRSKURS 4-9", "2026-08-07", "2026-12-04", { kategori: "museum", fakta: { kategorier: ["Konst/Skapande"] } }), "u");
  assert.equal(e.kategori, "aktivitet");
  assert.equal(e.format, "period"); // "årskurs" är målgrupp, inte kurs
  assert.equal(stadaTitel(e.titel, e.kategori), "Designlabbet i sävja, årskurs 4-9");
});

test("sagostund, babysagostund, spela schack och onsdagshäng är aktiviteter", () => {
  for (const titel of ["Sagostund", "Babysagostund", "Spela schack", "Onsdagshäng"]) {
    assert.equal(klassa(ev(titel, "2026-10-10T10:00:00+02:00"), "b").kategori, "aktivitet", titel);
  }
  assert.equal(klassa(ev("Sagostund", "2026-10-10", null, { kategori: "prat", fakta: { taggar: ["Sagostund"] } }), "b").kategori, "aktivitet");
});

test("utställningar blir utställning, vernissage blir enstaka", () => {
  const konst = { namn: "Uppsala konstmuseum", id: "konstmuseum" };
  const ahtila = klassa(ev("Eija-Liisa Ahtila – A Possible Image", "2026-10-03", "2027-01-21", { kategori: "museum", plats: konst }), "d");
  assert.equal(ahtila.format, "utstallning");
  const bror = { namn: "Bror Hjorths Hus", id: "brorhjorth" };
  assert.equal(klassa(ev("Johan Thurfjell – Ljuset", "2026-10-10", "2026-11-22", { kategori: "museum", plats: bror }), "d").format, "utstallning");
  const gust = { namn: "Gustavianum", id: "gustavianum" };
  assert.equal(klassa(ev("Bruno Liljefors – tillfällig utställning", "2026-06-13", "2027-09-19", { kategori: "museum", plats: gust }), "d").format, "utstallning");
  const upm = { namn: "Upplandsmuseet", id: "upplandsmuseet" };
  assert.equal(klassa(ev("HER STORY – THE COAT", "2026-06-06", "2027-01-17", { kategori: "museum", plats: upm }), "d").format, "utstallning");
  assert.equal(klassa(ev("Peaks of Presence – vernissage", "2026-09-24", "2026-10-30", { kategori: "museum", plats: konst }), "h").format, "enstaka");
});

test("kurser: Kubiks kategori Kurser, titelord och kulturskolan, men inte årskurs", () => {
  const kurs = (titel, kategorier = []) => klassa(ev(titel, "2026-08-17", "2026-12-06", { fakta: { kategorier } }), "u").format;
  assert.equal(kurs("Höstens kurser på Gränby 4H-gård", ["Djur/Natur", "Kurser"]), "kurs");
  assert.equal(kurs("Arduino-kurs", ["Kurser"]), "kurs");
  assert.equal(kurs("Dans åk 1-3 Funbo Kulturis", ["Dans"]), "kurs");
  assert.equal(kurs("Designlabbet i Gottsunda, årskurs 1-3", ["Konst/Skapande"]), "period");
  // Kortare än 14 dagar är aldrig en kurs, till exempel en workshop med anmälan.
  assert.equal(klassa(ev("Workshop, anmälan krävs", "2026-10-26", "2026-10-28"), "u").format, "enstaka");
});

test("återkommande: Pumphusets lördags- och söndagsöppet blir lördag och söndag, inte utställning", () => {
  const e = klassa(
    ev("Pumphusets lördags- och söndagsöppet", "2026-09-26", "2026-12-20", { kategori: "museum", plats: { namn: "Pumphuset", id: "pumphuset" }, fakta: { tider: { start: "12:00", slut: "16:00" } } }),
    "u",
  );
  assert.equal(e.format, "aterkommande");
  assert.deepEqual(e.serie, { dagar: ["lö", "sö"], start: "12:00", slut: "16:00" });
});

test("veckodagar läses ur svensk text", () => {
  assert.deepEqual(lasVeckodagar("varje lördag kl. 11–15"), { dagar: ["lö"], start: "11:00", slut: "15:00" });
  assert.deepEqual(lasVeckodagar("tisdagar och torsdagar").dagar, ["ti", "to"]);
  assert.deepEqual(lasVeckodagar("mån–fre 10.00–16.00").dagar, ["må", "ti", "on", "to", "fr"]);
  assert.deepEqual(lasVeckodagar("Familjelördagar").dagar, ["lö"]);
  assert.deepEqual(lasVeckodagar("Torsdagskul på Biotopia").dagar, ["to"]);
  assert.equal(lasVeckodagar("varannan onsdag").varannan, true);
  assert.equal(lasVeckodagar("udda veckor på tisdagar").veckor, "udda");
  assert.equal(lasVeckodagar("Katarina Jagellonica 500 år"), null);
  assert.equal(lasVeckodagar("Startar lördagen den 5 september"), null);
});

test("datum för en serie, med varannan vecka och vecka 53", () => {
  assert.deepEqual(serieDatum({ dagar: ["lö"] }, "2026-10-06", "2026-10-31"), ["2026-10-10", "2026-10-17", "2026-10-24", "2026-10-31"]);
  assert.deepEqual(serieDatum({ dagar: ["on"], varannan: true }, "2026-10-06", "2026-11-10", "2026-09-02"), ["2026-10-14", "2026-10-28"]);
  assert.equal(isoVecka("2026-12-31"), 53);
  assert.equal(isoVecka("2027-01-04"), 1);
  // Udda veckor: v53 (2026) och v1 (2027) är båda udda, så det blir två veckor i rad.
  assert.deepEqual(serieDatum({ dagar: ["to"], veckor: "udda" }, "2026-12-24", "2027-01-08"), ["2026-12-31", "2027-01-07"]);
  assert.deepEqual(serieDatum({ datum: ["2026-10-10", "2026-10-24", "2026-12-05"] }, "2026-10-06", "2026-11-30"), ["2026-10-10", "2026-10-24"]);
});

test("ålder anges bara när den står utskriven", () => {
  assert.deepEqual(spannFranText("Barnrytmik 3–5-åringar"), [3, 5]);
  assert.deepEqual(spannFranText("Sagostund för barn 1-3 år"), [1, 3]);
  assert.deepEqual(spannFranText("För 3-åringar"), [3, 3]);
  assert.equal(spannFranText("Designlabbet, årskurs 4-9"), null);
  assert.equal(spannFranText("Schackturnering"), null);
  const e = klassa(ev("Sagostund 3-6 år", "2026-10-10T10:00:00+02:00"), "b");
  assert.deepEqual(e.alder, [3, 6]);
  assert.equal(e.barnOchFamilj, true); // övre gränsen är högst 15
});

test("klockslag: sluttid före start tas bort, 00:00–23:59 är hela dagen", () => {
  assert.deepEqual(stadaTider({ start: "16:00", slut: "15:00" }), { start: "16:00" });
  assert.deepEqual(stadaTider({ start: "20:00", slut: "20:00" }), { start: "20:00" });
  assert.deepEqual(stadaTider({ start: "00:00", slut: "23:59" }), { heldag: true });
  const e = klassa(ev("Hittaut", "2026-10-10T00:00:00+02:00", "2026-10-10T23:59:00+02:00"), "u");
  assert.equal(e.start, "2026-10-10");
  assert.equal(e.heldag, true);
});

test("titlar: versaler och sportens vs", () => {
  assert.equal(stadaTitel("HER STORY – THE COAT"), "Her story – the coat");
  assert.equal(stadaTitel("UKK JULKONSERT MED IK SIRIUS"), "UKK julkonsert med IK sirius");
  assert.equal(stadaTitel("Sirius vs Hagunda", "sport"), "Sirius – Hagunda");
  assert.equal(stadaTitel("Moto Boy tolkar Lana Del Rey"), "Moto Boy tolkar Lana Del Rey");
});

test("gissad kategori: aktivitet före museum, men visning och utställning är museum", () => {
  assert.equal(gissaKategori("Pyssel för hela familjen"), "aktivitet");
  assert.equal(gissaKategori("Familjevisning"), "museum");
  assert.equal(gissaKategori("Utställn: Katarina Jagellonica"), "museum");
});

test("platser: felstavningar, alias och rum", () => {
  const p = (namn) => normaliseraPlats({ plats: { namn, id: "x" }, kategori: "ovrigt" }).plats;
  assert.equal(p("Gottsunabiblioteke, Sagorummet").id, "gottsundabib");
  assert.equal(p("Gottsunabiblioteke, Sagorummet").rum, "Sagorummet");
  assert.equal(p("Uppsala stadsbibliotek").id, "stadsbib");
  assert.equal(p("Bror Hjorth Hus").id, "brorhjorth");
  assert.equal(p("Katalis Bakficka").id, "katalin");
  assert.deepEqual(p("Sävja kulturhus, ateljén (Bildsalen)").id, "savjakulturhus");
  const okand = p("Nya huset, Lilla salen");
  assert.equal(okand.namn, "Nya huset");
  assert.equal(okand.rum, "Lilla salen");
});

test("kommungränsen: Uppsala, Storvreta och Knutby är innanför, Enköping och Arlanda utanför", async () => {
  const { iUppsalaKommun } = await import("./kommungrans.mjs");
  assert.equal(iUppsalaKommun(59.8617, 17.6469), true);
  assert.equal(iUppsalaKommun(59.958, 17.703), true);
  assert.equal(iUppsalaKommun(59.903, 18.268), true);
  assert.equal(iUppsalaKommun(59.636, 17.077), false);
  assert.equal(iUppsalaKommun(59.65, 17.93), false);
});
