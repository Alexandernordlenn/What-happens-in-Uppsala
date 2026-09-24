// Hämtar kommande evenemang i Uppsala kommun från Tickster.
//
// Körs så här:
//   node scripts/tickster/hamta.mjs
//
// 1. Läser listan för Uppsala och för varje mindre ort i kommunen.
// 2. Läser evenemangets egen sida för exakt tid och plats, men bara för
//    evenemang vi inte har sett förut. Det vi läst sparas i data/cache/.
//
// Tillfällig lösning tills vi får en API-nyckel från Tickster.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, ORTER, antalTraffar, iKommunen, lasEvenemangssida, lasLista, tillEvenemang } from "./regler.mjs";

const CACHE = "data/cache/tickster.json";
const PER_SIDA = 100; // Mer än så ger Tickster inte per sida.
const MAX_SIDOR_PER_ORT = 10;
const MAX_NYA_EVENEMANGSSIDOR = 150; // Resten tas nästa dag.

const listadress = (ort, skip) =>
  `https://www.tickster.com/se/sv/events/in/${encodeURIComponent(ort)}?skip=${skip}&take=${PER_SIDA}&sort=eventstart`;

async function lasCache() {
  try {
    return JSON.parse(await readFile(CACHE, "utf8"));
  } catch {
    return {};
  }
}

async function hamtaOrt(ort) {
  const brickor = [];
  for (let sida = 0; sida < MAX_SIDOR_PER_ORT; sida++) {
    let html;
    try {
      html = await hamta(listadress(ort, sida * PER_SIDA));
    } catch (fel) {
      console.log(`${ort}: ${fel.message}`); // Okända orter ger 404.
      break;
    }
    const nya = lasLista(html);
    brickor.push(...nya);
    if (nya.length < PER_SIDA || brickor.length >= antalTraffar(html)) break;
  }
  console.log(`${ort}: ${brickor.length} evenemang`);
  return brickor;
}

async function main() {
  const allaBrickor = [];
  for (const ort of ORTER) allaBrickor.push(...(await hamtaOrt(ort)));
  // Samma evenemang kan dyka upp flera gånger, till exempel när listan ändras medan vi läser.
  const brickor = [...new Map(allaBrickor.map((b) => [b.id, b])).values()];

  const cache = await lasCache();
  const nyCache = {};
  let nya = 0;
  for (const b of brickor) {
    if (cache[b.url]) {
      nyCache[b.url] = cache[b.url];
    } else if (nya < MAX_NYA_EVENEMANGSSIDOR) {
      nya++;
      try {
        nyCache[b.url] = { ...lasEvenemangssida(await hamta(b.url)), hamtad: new Date().toISOString().slice(0, 10) };
      } catch (fel) {
        console.log(`Kunde inte läsa ${b.url}: ${fel.message}`);
      }
    }
  }
  console.log(`Läste ${nya} nya evenemangssidor, ${brickor.length - Object.keys(nyCache).length} väntar till nästa gång.`);

  await mkdir("data/cache", { recursive: true });
  await writeFile(CACHE, JSON.stringify(nyCache, null, 2) + "\n");

  const evenemang = brickor.filter((b) => iKommunen(nyCache[b.url])).map((b) => tillEvenemang(b, nyCache[b.url]));
  await sparaKalla(KALLA, evenemang, brickor);
}

kor(main);
