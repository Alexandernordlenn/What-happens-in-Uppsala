// Hämtning från arrangörernas WordPress-sidor.
//
// Många arrangörer i Uppsala har WordPress. Då finns ett öppet REST-API
// (/wp-json/) med samma data som sidan själv visar, så vi slipper läsa av
// HTML. Två varianter förekommer:
//
//   - vanliga inlägg och egna posttyper:  /wp-json/wp/v2/<typ>
//   - tillägget The Events Calendar:      /wp-json/tribe/events/v1/events
//
// Allt går via webb.mjs, så robots.txt och väntetiden gäller som vanligt.

import { hamta } from "./webb.mjs";
import { enRad } from "./text.mjs";
import { tillSvenskTid } from "./tid.mjs";

// Bläddrar igenom /wp-json/wp/v2/... sida för sida. Slutar när en sida är
// kortare än perSida, när fortsatt(sidan) säger nej, eller efter maxSidor.
// adressFor(sida) ger adressen till en viss sida (1, 2, 3 ...).
export async function hamtaWpSidor(adressFor, { perSida = 100, maxSidor = 5, fortsatt = () => true } = {}) {
  const alla = [];
  for (let sida = 1; sida <= maxSidor; sida++) {
    let lista;
    try {
      lista = await hamta(adressFor(sida), { json: true });
    } catch (fel) {
      // WordPress svarar 400 när man bläddrar förbi sista sidan.
      if (sida > 1 && / 400 /.test(fel.message)) break;
      throw fel;
    }
    if (!Array.isArray(lista)) throw new Error(`Oväntat svar från ${adressFor(sida)}`);
    console.log(`Sida ${sida}: ${lista.length} poster`);
    alla.push(...lista);
    if (lista.length < perSida || !fortsatt(lista)) break;
  }
  return alla;
}

// The Events Calendar: alla kommande evenemang från och med "fran" (ÅÅÅÅ-MM-DD).
// Nästa sida står i svaret (next_rest_url). Vi behåller samma värd som i
// första anropet, så att väntetiden från robots.txt gäller hela vägen.
export async function hamtaTribe(bas, { fran, perSida = 50, maxSidor = 6 } = {}) {
  const forsta = new URL("/wp-json/tribe/events/v1/events", bas);
  forsta.searchParams.set("per_page", String(perSida));
  forsta.searchParams.set("start_date", fran);
  let adress = forsta.toString();
  const alla = [];
  for (let sida = 1; adress && sida <= maxSidor; sida++) {
    const svar = await hamta(adress, { json: true });
    const lista = svar?.events || [];
    console.log(`Sida ${sida}: ${lista.length} evenemang (totalt ${svar?.total ?? "?"})`);
    alla.push(...lista);
    if (!svar?.next_rest_url) break;
    const nasta = new URL(svar.next_rest_url);
    nasta.host = forsta.host;
    adress = nasta.toString();
  }
  return alla;
}

// Plockar ut det vi behöver ur ett evenemang från The Events Calendar.
// Beskrivning, bilder och arrangörens kontaktuppgifter tas inte med.
export function franTribe(ev) {
  const venue = ev?.venue && !Array.isArray(ev.venue) ? ev.venue : null;
  const heldag = ev?.all_day === true;
  // Tiderna i UTC ("2026-10-17 14:00:00") är säkrast. Annars lokal tid.
  const tid = (utc, lokal) => tillSvenskTid(utc ? `${String(utc).replace(" ", "T")}Z` : lokal);
  const start = heldag ? String(ev.start_date || "").slice(0, 10) : tid(ev?.utc_start_date, ev?.start_date);
  let slut = heldag ? String(ev.end_date || "").slice(0, 10) : tid(ev?.utc_end_date, ev?.end_date);
  // Många arrangörer anger samma tid som start och slut. Det är ingen riktig sluttid.
  if (slut === start) slut = null;
  return {
    id: ev?.id,
    titel: enRad(ev?.title),
    start,
    slut,
    heldag,
    url: ev?.url || null,
    plats: venue
      ? { namn: enRad(venue.venue), adress: enRad(venue.address), postnummer: enRad(venue.zip), ort: enRad(venue.city) }
      : null,
    kategorier: (ev?.categories || []).map((k) => enRad(k.name)).filter(Boolean),
    taggar: (ev?.tags || []).map((k) => enRad(k.name)).filter(Boolean),
    kostnad: enRad(ev?.cost),
    installd: /^(inställt?|cancel+ed)\b/i.test(enRad(ev?.title)),
    // Arrangören kan dölja ett evenemang i sin egen lista. Då visar vi det inte heller.
    dolt: ev?.hide_from_listings === true || (ev?.status && ev.status !== "publish"),
  };
}

// "Gratis", "Fri entré", "Free" och "0 kr" är gratis. Ett pris är inte gratis.
// Står ingenting vet vi inte.
export function gratisFranText(text) {
  const t = String(text || "").toLowerCase();
  if (!t.trim()) return null;
  if (/gratis|fri entré|fritt inträde|free\b|kostnadsfri|\b0\s*kr/.test(t)) return true;
  if (/\d+\s*(kr|sek|:-|\.-)|kronor/.test(t)) return false;
  return null;
}
