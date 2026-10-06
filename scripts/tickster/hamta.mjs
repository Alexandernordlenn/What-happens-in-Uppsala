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
const MAX_NYA_EVENEMANGSSIDOR = 600; // Första körningen läser alla, sedan bara nya.

const listadress = (ort, skip) =>
  `https://www.tickster.com/se/sv/events/in/${encodeURIComponent(ort)}?skip=${skip}&take=${PER_SIDA}&sort=eventstart`;

async function lasCache() {
  try {
    return JSON.parse(await readFile(CACHE, "utf8"));
  } catch {
    return {};
  }
}

const vanta = (ms) => new Promise((r) => setTimeout(r, ms));

// Vad sidan innehöll, för loggen när något ser fel ut.
function beskriv(html) {
  const titel = String(html).match(/<title>([^<]*)/i);
  return `rubrik "${titel ? titel[1].trim() : "saknas"}", ${String(html).length} tecken`;
}

// Läser första sidan för en ort. Ger Uppsala en tom lista har Tickster troligen
// ett tillfälligt fel, så då väntar vi en minut och försöker igen (högst två gånger).
async function forstaSidan(ort) {
  const forsok = ort === "uppsala" ? 3 : 1;
  for (let i = 1; i <= forsok; i++) {
    try {
      const html = await hamta(listadress(ort, 0));
      if (lasLista(html).length || antalTraffar(html) === 0 && ort !== "uppsala") return html;
      console.log(`${ort}: tom lista (${beskriv(html)}), försök ${i} av ${forsok}.`);
      if (i === forsok) return html;
    } catch (fel) {
      console.log(`${ort}: ${fel.message}, försök ${i} av ${forsok}.`); // Okända orter ger 404.
      if (i === forsok) return null;
    }
    await vanta(60000);
  }
  return null;
}

async function hamtaOrt(ort) {
  const brickor = [];
  let html = await forstaSidan(ort);
  for (let sida = 0; html && sida < MAX_SIDOR_PER_ORT; sida++) {
    const nya = lasLista(html);
    brickor.push(...nya);
    if (nya.length < PER_SIDA || brickor.length >= antalTraffar(html)) break;
    try {
      html = await hamta(listadress(ort, (sida + 1) * PER_SIDA));
    } catch (fel) {
      console.log(`${ort}: ${fel.message}`);
      break;
    }
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


  const evenemang = brickor.filter((b) => iKommunen(nyCache[b.url])).map((b) => tillEvenemang(b, nyCache[b.url]));
  await sparaKalla(KALLA, evenemang, brickor);

  // Minnesfilen sparas först när allt annat har lyckats. Om källan gav noll
  // evenemang stoppar sparaKalla körningen, och då ska minnet inte skrivas över.
  await mkdir("data/cache", { recursive: true });
  await writeFile(CACHE, JSON.stringify(nyCache, null, 2) + "\n");
}

kor(main);
