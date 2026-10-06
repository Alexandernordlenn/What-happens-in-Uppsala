// Hämtar kommande evenemang i Uppsala kommun från Tickster.
//
// Körs så här:
//   node scripts/tickster/hamta.mjs
//
// 1. Läser listan för Uppsala och för varje mindre ort i kommunen.
// 2. Läser evenemangets egen sida för exakt tid och plats, men bara för
//    evenemang vi inte har sett förut. Det vi läst sparas i data/cache/.
//
// Finns hemligheten TICKSTER_API_KEY används Ticksters officiella API i
// stället (api.mjs): dumpen som grund och Event API för den närmaste veckan.
// Svarar inte API:et används webbsidorna som reserv. Loggen säger vilken väg
// som användes. Nyckeln skrivs aldrig ut.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { hamta, USER_AGENT } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, ORTER, antalTraffar, iKommunen, lasEvenemangssida, lasLista, tillEvenemang } from "./regler.mjs";
import { DUMP, SOK, slaSamman, tolkaDump, tolkaSok, vantetid } from "./api.mjs";
import { sparaKalltext } from "../gemensamt/kalltext.mjs";

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

// ---------- API-vägen ----------

const idagISverige = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
const plusDagar = (dag, n) => new Date(Date.parse(`${dag}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// Vanlig fetch, så att adressen med nyckeln aldrig skrivs i loggen.
async function apiAnrop(adress, rubriker = {}) {
  const svar = await fetch(adress, { headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...rubriker } });
  const vanta_ms = vantetid(svar.headers);
  if (vanta_ms) {
    console.log(`Tickster ber oss vänta ${Math.round(vanta_ms / 1000)} sekunder (X-RATELIMIT).`);
    await vanta(vanta_ms);
  }
  if (!svar.ok) throw new Error(`Tickster API svarade ${svar.status}`);
  return svar;
}

async function hamtaFranApi(nyckel) {
  const idag = idagISverige();
  // 1. Dumpen med hela utbudet.
  const info = await (await apiAnrop(DUMP(nyckel))).json();
  const fil = Buffer.from(await (await apiAnrop(info.uri)).arrayBuffer());
  const dump = JSON.parse((fil[0] === 0x1f && fil[1] === 0x8b ? gunzipSync(fil) : fil).toString("utf8"));
  const franDump = tolkaDump(dump, idag);
  console.log(`Tickster-dumpen (${info.id}): ${dump.events?.length ?? 0} evenemang i Sverige, ${franDump.length} i Uppsala kommun.`);

  // 2. Event API för den närmaste veckan, sökt per ort.
  const sista = plusDagar(idag, 7);
  const farska = [];
  for (const ort of ORTER) {
    for (let skip = 0; skip < 1000; skip += 100) {
      const svar = await (await apiAnrop(SOK(ort, skip), { "x-api-key": nyckel })).json();
      farska.push(...tolkaSok(svar, idag, sista));
      if ((svar.items || []).length < 100) break;
    }
    await vanta(500);
  }
  console.log(`Tickster Event API: ${farska.length} evenemang de närmaste 7 dagarna.`);
  const evenemang = slaSamman(franDump, farska);
  // Beskrivningen läses bara tillfälligt, för AI-klassningen. Den sparas aldrig i repot.
  await sparaKalltext(KALLA.id, Object.fromEntries((dump.events || []).map((ev) => [`tickster-${String(ev.id).toLowerCase()}`, typeof ev.description === "string" ? ev.description : ev.description?.markdown || ""])));
  // Rådatan: dumpens poster i kommunen, utan beskrivningar, bilder, artister och priser.
  const ids = new Set(evenemang.map((e) => e.id));
  const radata = (dump.events || [])
    .filter((ev) => ids.has(`tickster-${String(ev.id).toLowerCase()}`))
    .map(({ description, imageUrl, performers, goods, links, ...resten }) => resten);
  return { evenemang, radata };
}

// ---------- Webbsidorna (reserv) ----------

async function hamtaFranWebben() {
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
  return { evenemang, radata: brickor, nyCache };
}

async function main() {
  const nyckel = process.env.TICKSTER_API_KEY;
  let resultat = null;
  if (nyckel) {
    try {
      resultat = await hamtaFranApi(nyckel);
      console.log("Väg: Ticksters API.");
    } catch (fel) {
      console.log(`::warning::Tickster API fungerade inte (${fel.message}). Läser webbsidorna i stället.`);
    }
  } else {
    console.log("Ingen TICKSTER_API_KEY. Väg: Ticksters webbsidor.");
  }
  if (!resultat) resultat = await hamtaFranWebben();

  const sparad = await sparaKalla(KALLA, resultat.evenemang, resultat.radata);

  // Minnesfilen sparas först när allt annat har lyckats. Om källan gav noll
  // evenemang stoppar sparaKalla körningen, och då ska minnet inte skrivas över.
  // Behölls gårdagens fil (för få evenemang) behålls också gårdagens minne.
  if (!sparad || !resultat.nyCache) return;
  await mkdir("data/cache", { recursive: true });
  await writeFile(CACHE, JSON.stringify(resultat.nyCache, null, 2) + "\n");
}

kor(main);
