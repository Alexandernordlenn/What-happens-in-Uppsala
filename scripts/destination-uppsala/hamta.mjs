// Hämtar kommande evenemang från Destination Uppsala.
//
// Körs så här:
//   node scripts/destination-uppsala/hamta.mjs
//
// 1. Läser alla sidor i listan destinationuppsala.se/event/ (runt 11 sidor).
// 2. Räknar ut årtal för varje evenemang.
// 3. Hämtar klockslaget från evenemangets egen sida, men bara för evenemang
//    vi inte har sett förut. Det vi läst sparas i data/cache/, så att vi inte
//    hämtar samma sida varje dag.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, antalSidor, lasDetaljer, lasLista, raknaUtDatum, tillEvenemang } from "./regler.mjs";

const LISTA = "https://destinationuppsala.se/event/";
const CACHE = "data/cache/destination-uppsala.json";
const MAX_SIDOR = 30;
const MAX_NYA_DETALJSIDOR = 60; // Resten tas nästa dag.

function idag() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
}

async function lasCache() {
  try {
    return JSON.parse(await readFile(CACHE, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  const forsta = await hamta(LISTA);
  const sidor = Math.min(antalSidor(forsta), MAX_SIDOR);
  const kort = lasLista(forsta);
  for (let sida = 2; sida <= sidor; sida++) {
    kort.push(...lasLista(await hamta(`${LISTA}page/${sida}/`)));
  }
  console.log(`${sidor} sidor, ${kort.length} kort.`);

  // Årtalen räknas i listans ordning, innan dubbletter tas bort.
  const medDatum = raknaUtDatum(kort, idag()).filter((k) => k.startdatum);
  const unika = [...new Map(medDatum.map((k) => [k.url, k])).values()];

  const cache = await lasCache();
  const nyCache = {};
  let nya = 0;
  for (const k of unika) {
    const kortvarigt = !k.slutdatum || Date.parse(k.slutdatum) - Date.parse(k.startdatum) < 3 * 86400000;
    if (cache[k.url]) {
      nyCache[k.url] = cache[k.url];
    } else if (kortvarigt && nya < MAX_NYA_DETALJSIDOR) {
      nya++;
      try {
        nyCache[k.url] = { ...lasDetaljer(await hamta(k.url)), hamtad: idag() };
      } catch (fel) {
        console.log(`Kunde inte läsa ${k.url}: ${fel.message}`);
      }
    }
  }
  console.log(`Läste ${nya} nya evenemangssidor.`);

  await mkdir("data/cache", { recursive: true });
  await writeFile(CACHE, JSON.stringify(nyCache, null, 2) + "\n");

  const evenemang = unika.map((k) => tillEvenemang(k, nyCache[k.url]));
  await sparaKalla(KALLA, evenemang, unika);
}

kor(main);
