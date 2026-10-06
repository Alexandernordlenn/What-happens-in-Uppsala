// Hämtar kommande evenemang i Uppsala kommun från Heja Uppsala.
//
// Körs så här:
//   node scripts/heja/hamta.mjs
//
// Tillfälligt, under testfasen (se CLAUDE.md).
// 1. Läser alla sidor i listan hejauppsala.com/kalender/ (runt 12 sidor).
// 2. Behåller evenemang i Uppsala kommun och räknar ut årtal.
// 3. Läser "När och var?" på evenemangets egen sida, men bara för evenemang
//    vi inte sett förut. Det vi läst sparas i data/cache/.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, finnsNastaSida, iKommunen, lasDetaljer, lasLista, raknaUtDatum, tillEvenemang } from "./regler.mjs";

const LISTA = "https://hejauppsala.com/kalender/";
const CACHE = "data/cache/heja.json";
const MAX_SIDOR = 30;
const MAX_NYA_DETALJSIDOR = 700; // Första körningen läser alla, sedan bara nya.

const idag = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());

async function lasCache() {
  try {
    return JSON.parse(await readFile(CACHE, "utf8"));
  } catch {
    return {};
  }
}

async function main() {
  const kort = [];
  for (let sida = 1; sida <= MAX_SIDOR; sida++) {
    const html = await hamta(sida === 1 ? LISTA : `${LISTA}page/${sida}/`);
    const nya = lasLista(html);
    kort.push(...nya);
    if (!nya.length || !finnsNastaSida(html)) break;
  }
  console.log(`${kort.length} kort i listan.`);

  // Årtalen räknas i listans ordning, innan något filtreras bort.
  const medDatum = raknaUtDatum(kort, idag()).filter((k) => k.startdatum && iKommunen(k));
  const unika = [...new Map(medDatum.map((k) => [k.url, k])).values()];

  const cache = await lasCache();
  const nyCache = {};
  let nya = 0;
  for (const k of unika) {
    // Sidor där vi inte hittade "När och var?" läses om, ifall vi har lärt oss läsa dem sedan dess.
    if (cache[k.url]?.nar) {
      nyCache[k.url] = cache[k.url];
    } else if (nya < MAX_NYA_DETALJSIDOR) {
      nya++;
      try {
        nyCache[k.url] = { ...lasDetaljer(await hamta(k.url)), hamtad: idag() };
      } catch (fel) {
        console.log(`Kunde inte läsa ${k.url}: ${fel.message}`);
      }
    }
  }
  console.log(`Läste ${nya} nya evenemangssidor, ${unika.length - Object.keys(nyCache).length} väntar till nästa gång.`);


  const sparad = await sparaKalla(KALLA, unika.map((k) => tillEvenemang(k, nyCache[k.url])), unika);

  // Minnesfilen sparas först när allt annat har lyckats. Om källan gav noll
  // evenemang stoppar sparaKalla körningen, och då ska minnet inte skrivas över.
  // Behölls gårdagens fil (för få evenemang) behålls också gårdagens minne.
  if (!sparad) return;
  await mkdir("data/cache", { recursive: true });
  await writeFile(CACHE, JSON.stringify(nyCache, null, 2) + "\n");
}

kor(main);
