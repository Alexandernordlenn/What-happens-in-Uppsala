// Hämtar aktiviteter från Kubik Uppsala.
//
// Körs så här:
//   node scripts/kubik/hamta.mjs
//
// Ett enda anrop ger alla aktiviteter, samma som sidan hitta-aktiviteter visar.
// För perioder (återkommande aktiviteter) läses också aktivitetens egen sida,
// där veckodagarna står i fritext. Den läses högst en gång i veckan per sida,
// och det vi läst ut sparas i data/cache/kubik.json.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, SOK, SOKFORMULAR, bearbeta, lasDetaljsida, lasKort, tolkaTid } from "./regler.mjs";
import { OMRADEN } from "../gemensamt/omraden.mjs";

const FORMULAR = { "Content-Type": "application/x-www-form-urlencoded" };
const CACHE = "data/cache/kubik.json";
const DAGAR_MELLAN_LASNINGAR = 7;
const MAX_NYA_DETALJSIDOR = 150;

const idag = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
const dagarSedan = (dag) => Math.round((Date.parse(idag()) - Date.parse(dag)) / 86400000);

async function lasCache() {
  try {
    return JSON.parse(await readFile(CACHE, "utf8"));
  } catch {
    return {};
  }
}

// Kubik skriver inte ut området på korten, men går att filtrera på det.
// En sökning per område ger vilka aktiviteter som hör dit (8 anrop).
async function omradenPerAktivitet() {
  const karta = {};
  for (const o of OMRADEN) {
    const body = `${SOKFORMULAR}&selectedFilters.geography=${encodeURIComponent(o.kubik)}`;
    for (const k of lasKort(await hamta(SOK, { method: "POST", body, headers: FORMULAR }))) karta[k.slug] = o.id;
  }
  return karta;
}

// Veckodagar för perioder, från aktivitetens egen sida.
async function veckodagar(kort) {
  const cache = await lasCache();
  const nyCache = {};
  let nya = 0;
  for (const k of kort) {
    const arPeriod = k.tider.map(tolkaTid).some((t) => t?.typ === "period");
    if (!arPeriod) continue;
    const tidigare = cache[k.url];
    if (tidigare && dagarSedan(tidigare.hamtad) < DAGAR_MELLAN_LASNINGAR) {
      nyCache[k.url] = tidigare;
    } else if (nya < MAX_NYA_DETALJSIDOR) {
      nya++;
      try {
        nyCache[k.url] = { ...lasDetaljsida(await hamta(k.url)), hamtad: idag() };
      } catch (fel) {
        console.log(`Kunde inte läsa ${k.url}: ${fel.message}`);
        if (tidigare) nyCache[k.url] = tidigare;
      }
    } else if (tidigare) {
      nyCache[k.url] = tidigare;
    }
    const last = nyCache[k.url];
    if (last?.dagar?.length) {
      k.dagar = last.dagar;
      if (last.tider) k.tid = last.tider;
    }
  }
  console.log(`Läste ${nya} aktivitetssidor. ${kort.filter((k) => k.dagar).length} perioder har kända veckodagar.`);
  return nyCache;
}

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const html =
    i !== -1
      ? await readFile(process.argv[i + 1], "utf8")
      : await hamta(SOK, { method: "POST", body: SOKFORMULAR, headers: FORMULAR });
  const kort = lasKort(html);
  let nyCache = null;
  if (i === -1) {
    const omraden = await omradenPerAktivitet();
    for (const k of kort) k.omrade = omraden[k.slug] || null;
    console.log(`${kort.filter((k) => k.omrade).length} av ${kort.length} aktiviteter har område.`);
    nyCache = await veckodagar(kort);
  }
  await sparaKalla(KALLA, bearbeta(kort), kort);

  // Minnesfilen sparas först när allt annat har lyckats.
  if (nyCache) {
    await mkdir("data/cache", { recursive: true });
    await writeFile(CACHE, JSON.stringify(nyCache, null, 2) + "\n");
  }
}

kor(main);
