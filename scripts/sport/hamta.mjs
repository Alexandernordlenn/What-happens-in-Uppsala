// Hämtar matcher i Uppsala kommun från förbundens och ligornas system.
//
// Körs så här:
//   node scripts/sport/hamta.mjs
//
// Vilka ligor och lag som hämtas står i konfig.mjs. Varje system hämtas för
// sig. Om ett system inte svarar hoppas det över och de andra sparas ändå.

import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import {
  KALLA, SPORTOMEDIA_FRAGA, bearbeta, hittaProfixioKalender, hittaSportalityParametrar,
  tolkaProfixioIcal, tolkaProfixioSida, tolkaSportality, tolkaSportomedia, tolkaSwehockey,
} from "./regler.mjs";
import { LAG, PROFIXIO_KALENDER, PROFIXIO_SIDA, SPORTALITY, SPORTOMEDIA, SWEHOCKEY, hittaLag, iSasong } from "./konfig.mjs";
import { writeFile } from "node:fs/promises";

const JSON_POST = { "Content-Type": "application/json" };

async function sportomedia(k) {
  const ar = new Date().getFullYear();
  const ut = [];
  for (const sasong of [ar, ar + 1]) {
    const body = JSON.stringify({ query: SPORTOMEDIA_FRAGA(k.nyckel, sasong) });
    const svar = await hamta("https://gql.sportomedia.se/graphql", { method: "POST", body, headers: JSON_POST, json: true });
    ut.push(...tolkaSportomedia(svar, k));
  }
  return ut;
}

const startsidor = new Map();
async function sportality(k) {
  if (!startsidor.has(k.bas)) {
    let hittat = null;
    try {
      hittat = hittaSportalityParametrar(await hamta(`${k.bas}/`));
    } catch {
      // Då används reservvärdena.
    }
    startsidor.set(k.bas, hittat);
  }
  const hittat = startsidor.get(k.bas);
  const seasonUuid = hittat?.seasonUuid || k.reserv.seasonUuid;
  const gameTypeUuid = hittat?.gameTypeUuid || k.reserv.gameTypeUuid;
  const adress = `${k.bas}/api/sports-v2/game-schedule?seasonUuid=${seasonUuid}&seriesUuid=${k.seriesUuid}&gameTypeUuid=${gameTypeUuid}`;
  return tolkaSportality(await hamta(adress, { json: true }), { ...k, url: k.bas });
}

async function swehockey(k) {
  const url = `https://stats.swehockey.se/ScheduleAndResults/Schedule/${k.serie}`;
  return tolkaSwehockey(await hamta(url), { ...k, url });
}

async function profixioKalender(k) {
  const kalender = hittaProfixioKalender(await hamta(k.sida));
  if (!kalender) throw new Error(`Hittade ingen kalenderfil på ${k.sida}`);
  return tolkaProfixioIcal(await hamta(kalender), { ...k, url: k.sida });
}

async function profixioSida(k) {
  return tolkaProfixioSida(await hamta(k.sida), { ...k, url: k.sida });
}

async function main() {
  const jobb = [
    ...SPORTOMEDIA.map((k) => [k, sportomedia]),
    ...SPORTALITY.map((k) => [k, sportality]),
    ...SWEHOCKEY.map((k) => [k, swehockey]),
    ...PROFIXIO_KALENDER.map((k) => [k, profixioKalender]),
    ...PROFIXIO_SIDA.map((k) => [k, profixioSida]),
  ];
  const matcher = [];
  for (const [k, hamtare] of jobb) {
    try {
      const nya = await hamtare(k);
      const iStan = bearbeta(nya).length;
      console.log(`${k.sport}, ${k.liga}: ${nya.length} kommande matcher, ${iStan} i Uppsala.`);
      if (!nya.length) console.log(`::warning::${k.sport}, ${k.liga} gav inga matcher. Kolla id:t i scripts/sport/konfig.mjs.`);
      matcher.push(...nya);
    } catch (fel) {
      console.log(`::warning::${k.sport}, ${k.liga}: ${fel.message}`);
    }
  }
  const evenemang = bearbeta(matcher, new Date(), hittaLag);
  await sparaKalla(KALLA, evenemang, matcher);
  await writeFile("data/sport-lag.json", JSON.stringify(lagStatus(matcher), null, 2) + "\n");
}

// Hur många kommande hemmamatcher i Uppsala har varje lag? Larmet
// (scripts/kvalitet/larm.mjs) använder det när ett lag mitt i säsongen saknar matcher.
function lagStatus(matcher, nu = new Date()) {
  const om30 = new Date(nu.getTime() + 30 * 86400000).toISOString().slice(0, 10);
  const hemma = bearbeta(matcher, nu); // bara matcher i Uppsala
  const status = LAG.map((l) => {
    const egna = matcher.filter((m) => hittaLag(m) === l && bearbeta([m], nu).length);
    const inom30 = egna.filter((m) => String(m.start).slice(0, 10) <= om30);
    if (iSasong(l, nu) && !egna.length) console.log(`::warning::${l.lag} (${l.liga}) är mitt i säsongen men har inga kommande hemmamatcher. Kolla id:t i scripts/sport/konfig.mjs.`);
    return { lag: l.lag, sport: l.sport, kon: l.kon, niva: l.niva, liga: l.liga, antal: egna.length, hemmamatcher30: inom30.length, iSasong: iSasong(l, nu) };
  });
  return { uppdaterad: nu.toISOString(), antalMatcherIUppsala: hemma.length, lag: status };
}

kor(main);
