// Kontroller mot dagens data: hittar typiska besökare det de letar efter?
//
// Varje kontroll är en person med ett behov, till exempel Lisa som vill hitta
// något för sin treåriga dotter i helgen. Kontrollerna körs efter bygget och
// skrivs i kvalitetsrapporten. De får aldrig ligga i `npm test`, eftersom de
// beror på vad som råkar hända i Uppsala just den här veckan.
//
// Åldersfiltret läses direkt ur index.html (mellan FILTER:START och FILTER:SLUT),
// så att kontrollen prövar samma logik som besökarna möter.

import { readFile } from "node:fs/promises";
import vm from "node:vm";
import {
  allaAldrar, exaktAlder, iDagslistan, iPagarRaden, kommandeDagar, kommandeHelg, overlappar,
  overlapparPeriod, plusDagar, veckodag,
} from "./sida.mjs";
import { misstanktaDubbletter } from "./matt.mjs";

// Läser åldersfiltret ur sidans kod.
export function lasSidansFilter(html) {
  const block = html.match(/\/\* FILTER:START[\s\S]*?\/\* FILTER:SLUT \*\//);
  const aldrar = html.match(/var AGES = [^;]*;/);
  if (!block || !aldrar) throw new Error("Hittade inte åldersfiltret i index.html");
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(`${aldrar[0]}\n${block[0]}\nthis.aldersgrupp = aldersgrupp;`, ctx);
  return { aldersgrupp: ctx.aldersgrupp };
}

const KURS = (e) => e.f === "kurs";
const BARNVERKSTAD = /verkstad|workshop|pyssel|skapande|designlabb|labbet|slöjd|skaparverkstad|målarverkstad|lov ?kul/i;
const andel = (del, hela) => (hela ? del / hela : 0);
const procent = (x) => `${Math.round(x * 1000) / 10} %`;

function resultat(person, namn, ok, varde, krav) {
  return { person, namn, ok, varde, krav };
}

export function kontrollera(sida, { aldersgrupp }, { sportLag = null } = {}) {
  const idag = sida.idag;
  const helg = kommandeHelg(idag);
  const vecka = kommandeDagar(idag, 7);
  const ut = [];

  // ---------- Lisa, 34, med en treåring ----------
  const helgensDag = iDagslistan(sida, helg);
  const smaBarn = helgensDag.filter((e) => exaktAlder(e) && aldersgrupp(e, ["0-4"]) === "exakt" && !KURS(e));
  ut.push(resultat("Lisa", "Helgen, 0–4 år: evenemang med känd ålder", smaBarn.length >= 5, smaBarn.length, "minst 5"));
  const kurserForSmaBarn = helgensDag.filter((e) => KURS(e) && aldersgrupp(e, ["0-4"]));
  ut.push(resultat("Lisa", "Helgen, 0–4 år: inga kurser", kurserForSmaBarn.length === 0, kurserForSmaBarn.length, "0"));
  const utanAlder = helgensDag.filter((e) => e.fam && (!e.a || allaAldrar(e.a)));
  const doljs = utanAlder.filter((e) => aldersgrupp(e, ["0-4"]) !== "okand");
  ut.push(
    resultat(
      "Lisa",
      "Familjeevenemang utan ålder (eller 0–99) syns under \"ålder ej angiven\"",
      doljs.length === 0,
      `${utanAlder.length - doljs.length} av ${utanAlder.length}`,
      "alla",
    ),
  );
  const pagar = sida.evenemang.filter((e) => iPagarRaden(e) && overlapparPeriod(e, idag, plusDagar(idag, 13)));
  const pagarMuseum = pagar.filter((e) => e.c === "museum");
  const utstallningar = pagarMuseum.filter((e) => e.f === "utstallning");
  ut.push(
    resultat(
      "Lisa",
      "Konst & museum, raden \"Pågår\": andel utställningar",
      andel(utstallningar.length, pagarMuseum.length) >= 0.8,
      `${procent(andel(utstallningar.length, pagarMuseum.length))} (${utstallningar.length} av ${pagarMuseum.length})`,
      "minst 80 %",
    ),
  );
  const verkstader = sida.evenemang.filter((e) => e.c === "museum" && (e.fam || (e.a && e.a[1] <= 15)) && BARNVERKSTAD.test(e.t));
  ut.push(resultat("Lisa", "Inga barnverkstäder i Konst & museum", verkstader.length === 0, verkstader.length, "0"));

  // ---------- Student, 20–25 år ----------
  const veckans = iDagslistan(sida, vecka);
  const kvall = veckans.filter(
    (e) => e.tm && e.tm >= "18:00" && (e.c === "musik" || e.c === "natt") && (!e.a || overlappar(e.a, 20, 25)),
  );
  ut.push(resultat("Student", "7 dagar: kvällar med musik eller natt", kvall.length >= 10, kvall.length, "minst 10"));

  // ---------- Pensionär ----------
  const dagtid = veckans.filter((e) => {
    const vd = veckodag(e.d);
    return vd >= 1 && vd <= 5 && e.tm && e.tm >= "10:00" && e.tm <= "16:00" && (e.c === "prat" || e.c === "musik") && (!e.a || e.a[1] > 25);
  });
  ut.push(resultat("Pensionär", "7 dagar: vardagar 10–16 med prat eller musik", dagtid.length >= 10, dagtid.length, "minst 10"));

  // ---------- Tonåring, 13–15 år ----------
  const tonar = veckans.filter((e) => exaktAlder(e) && overlappar(e.a, 13, 15) && !KURS(e));
  ut.push(resultat("Tonåring", "7 dagar: evenemang för 13–15 år", tonar.length >= 5, tonar.length, "minst 5"));

  // ---------- Sportfan ----------
  if (sportLag?.lag?.length) {
    const tom = sportLag.lag.filter((l) => l.iSasong && !l.hemmamatcher30);
    ut.push(
      resultat(
        "Sportfan",
        "Lag mitt i säsongen har en hemmamatch inom 30 dagar",
        tom.length === 0,
        tom.length ? tom.map((l) => l.lag).join(", ") : "alla",
        "alla",
      ),
    );
  } else {
    ut.push(resultat("Sportfan", "Lag mitt i säsongen har en hemmamatch inom 30 dagar", null, "lagtabell saknas", "alla"));
  }

  // ---------- Allmänt ----------
  const alla = sida.evenemang;
  const endags = alla.filter((e) => !e.e && !e.hd);
  const dubbletter = misstanktaDubbletter(sida);
  ut.push(resultat("Allmänt", "Misstänkta dubbletter", dubbletter.length === 0, dubbletter.length, "0"));
  const ovrigt = andel(alla.filter((e) => e.c === "ovrigt").length, alla.length);
  ut.push(resultat("Allmänt", "Andel i kategorin övrigt", ovrigt < 0.1, procent(ovrigt), "under 10 %"));
  const utanOmrade = andel(alla.filter((e) => !e.o).length, alla.length);
  ut.push(resultat("Allmänt", "Andel utan område", utanOmrade < 0.02, procent(utanOmrade), "under 2 %"));
  const utanTid = andel(endags.filter((e) => !e.tm).length, endags.length);
  ut.push(resultat("Allmänt", "Endagsevenemang utan klockslag", utanTid < 0.05, procent(utanTid), "under 5 %"));

  return ut;
}

export async function korPersoner(sida, { sportLag } = {}) {
  const filter = lasSidansFilter(await readFile("index.html", "utf8"));
  return kontrollera(sida, filter, { sportLag });
}



