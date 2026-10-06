// Ticksters officiella API, när nyckeln TICKSTER_API_KEY finns.
//
// Två delar, enligt CLAUDE.md:
// - Event Dump API: hela utbudet en gång per dygn, som en gzip-fil.
//     GET https://api.tickster.com/sv/api/1.0/events/dump/upcoming?key=<nyckel>
//     ger { id, created, uri }, där uri är en signerad länk som gäller 2–3 timmar.
//     Dumpen publiceras runt 07.00 UTC. Vår körning går 04.13 UTC och får
//     därför gårdagens dump.
// - Event API v1.0: färska uppgifter för den närmaste veckan.
//     GET https://event.api.tickster.com/api/v1.0/sv/events?query=<ort>&take=100&skip=0
//     med nyckeln i rubriken x-api-key.
//
// Här finns bara ren tolkning, som går att testa. Nätverket sköts i hamta.mjs.
// Vi sparar bara fakta: titel, tider, plats, taggar, status och köplänk.
// Inga beskrivningar, bilder, artister eller priser.

import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { iUppsalaKommun } from "../gemensamt/kommungrans.mjs";
import { KALLA, ORTER, kategoriFranTaggar } from "./regler.mjs";

export const DUMP = (nyckel) => `https://api.tickster.com/sv/api/1.0/events/dump/upcoming?key=${encodeURIComponent(nyckel)}`;
export const SOK = (ort, skip, antal = 100) =>
  `https://event.api.tickster.com/api/v1.0/sv/events?query=${encodeURIComponent(ort)}&take=${antal}&skip=${skip}`;

const BARNTAGGAR = /^(barn|familj|barnteater|barnföreställning|familjeföreställning)/;

// Ligger platsen i Uppsala kommun? Koordinaterna avgör, annars orten.
export function platsIKommunen(venue) {
  const lat = venue?.geo?.latitude;
  const lng = venue?.geo?.longitude;
  if (typeof lat === "number" && typeof lng === "number" && (lat || lng)) return iUppsalaKommun(lat, lng);
  return ORTER.includes(String(venue?.city || "").trim().toLowerCase());
}

// Produktioner och samlingar är "föräldrar" till enskilda föreställningar.
// Vi tar bara de enskilda, annars blir det dubbletter.
const arEnskilt = (ev) => !["production", "collection"].includes(ev.hierarchyType || ev.eventHierarchyType || "event");

const dagar = (a, b) => (a && b ? (Date.parse(String(b).slice(0, 10)) - Date.parse(String(a).slice(0, 10))) / 86400000 : 0);

// Ett evenemang från dumpen ({ venueId }) eller från Event API ({ venue }).
export function tillEvenemang(ev, venue) {
  const start = tillSvenskTid(ev.start || ev.startUtc);
  const slut = tillSvenskTid(ev.end || ev.endUtc);
  const taggar = (ev.tags || []).map((t) => String(t).toLowerCase().replace(/^#/, ""));
  const titel = String(ev.name || "").trim();
  const lat = venue?.geo?.latitude;
  const lng = venue?.geo?.longitude;
  return {
    id: `tickster-${String(ev.id).toLowerCase()}`,
    titel,
    start,
    slut,
    plats: {
      namn: venue?.name || "Uppsala",
      id: `tickster-plats-${venue?.id || "okand"}`,
      ...(lat && lng && { lat, lng }),
    },
    kategori: kategoriFranTaggar(titel, taggar),
    gratis: null,
    barnOchFamilj: taggar.some((t) => BARNTAGGAR.test(t)) || /\bbarn|familj/i.test(titel),
    kallor: [
      {
        id: KALLA.id,
        namn: KALLA.namn,
        url: ev.infoUri || ev.infoUrl || `https://www.tickster.com/se/sv/events/${ev.id}`,
        biljetter: ev.shopUri || ev.shopUrl || `https://secure.tickster.com/sv/${ev.id}`,
      },
    ],
    langvarig: dagar(start, slut) >= 3,
    installd: ev.state === "cancelled" || /inställ/i.test(titel),
    ...(taggar.length && { fakta: { taggar } }),
  };
}

// Dumpen: { events: [...], venues: [...] }. Ger evenemangen i kommunen.
export function tolkaDump(dump, idag) {
  const platser = new Map((dump?.venues || []).map((v) => [v.id, v]));
  return (dump?.events || [])
    .filter((ev) => ev.published !== false && arEnskilt(ev))
    .filter((ev) => platsIKommunen(platser.get(ev.venueId)))
    .map((ev) => tillEvenemang(ev, platser.get(ev.venueId)))
    .filter((e) => e.start && (e.slut || e.start).slice(0, 10) >= idag);
}

// Event API: { items: [...] }. Ger evenemangen i kommunen inom de närmaste dagarna.
export function tolkaSok(svar, idag, sista) {
  return (svar?.items || [])
    .filter(arEnskilt)
    .filter((ev) => platsIKommunen(ev.venue))
    .map((ev) => tillEvenemang(ev, ev.venue))
    .filter((e) => e.start && e.start.slice(0, 10) >= idag && e.start.slice(0, 10) <= sista);
}

// Färska uppgifter från Event API går före dumpen. Taggarna finns bara i
// dumpen, så de behålls därifrån.
export function slaSamman(franDump, farska) {
  const alla = new Map(franDump.map((e) => [e.id, e]));
  for (const e of farska) {
    const gammal = alla.get(e.id);
    alla.set(e.id, gammal ? { ...e, kategori: gammal.kategori, barnOchFamilj: gammal.barnOchFamilj || e.barnOchFamilj, ...(gammal.fakta && { fakta: gammal.fakta }) } : e);
  }
  return [...alla.values()];
}

// Hur länge ska vi vänta innan nästa anrop? Läser X-RATELIMIT-rubrikerna.
// "reset" kan vara sekunder kvar eller en tidpunkt i sekunder sedan 1970.
export function vantetid(rubriker, nu = Date.now()) {
  const hamta = (namn) => rubriker?.get?.(namn) ?? rubriker?.[namn] ?? null;
  const kvar = hamta("x-ratelimit-remaining");
  if (kvar === null || +kvar > 0) return 0;
  const reset = +hamta("x-ratelimit-reset");
  if (!reset) return 60000;
  const ms = reset > 1e9 ? reset * 1000 - nu : reset * 1000;
  return Math.min(Math.max(ms, 1000), 5 * 60000);
}
