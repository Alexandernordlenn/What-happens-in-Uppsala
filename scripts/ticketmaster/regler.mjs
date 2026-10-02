// Regler för Ticketmaster (Discovery API v2).
//
// Dokumentation: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
// Gratis nyckel från developer.ticketmaster.com. Gräns: 5 000 anrop per dygn och
// 5 per sekund. Vi gör ett par anrop per dygn.
//
// Villkor att komma ihåg (developer.ticketmaster.com/support/terms-of-use/):
// - Evenemang får bara sparas "under rimlig tid" för tjänsten. Vi hämtar om varje dygn.
// - Ber en arrangör oss ta bort något ska det bort inom 24 timmar.
// - Sidan ska ha en integritetspolicy länkad i sidfoten (behövs ändå för GDPR).
// - Inga intäkter från API:et. Bilder används inte.

import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";
import { spannFranText } from "../gemensamt/omraden.mjs";

export const KALLA = {
  id: "ticketmaster",
  namn: "Ticketmaster",
  webbsida: "https://www.ticketmaster.se/discover/uppsala",
};

// Uppsala centrum. Sökningen görs i en cirkel runt den punkten.
export const CENTRUM = { lat: 59.8586, lng: 17.6389 };
export const RADIE_KM = 25;

// Orter i Uppsala kommun. Evenemang på andra orter i cirkeln (Knivsta med flera) tas bort.
const ORTER = /^(uppsala|storvreta|björklinge|vattholma|skyttorp|almunge|knutby|bälinge|järlåsa|vänge|länna|gunsta|sävja|rasbo|stavby|gamla uppsala|lövstalöt|gåvsta|ramstalund)$/i;

// Ticketmaster vill ha platsen som "geohash", en kort kod för en punkt på kartan.
export function geohash(lat, lng, langd = 6) {
  const tecken = "0123456789bcdefghjkmnpqrstuvwxyz";
  let [latMin, latMax, lngMin, lngMax] = [-90, 90, -180, 180];
  let ut = "", bit = 0, varde = 0, jamn = true;
  while (ut.length < langd) {
    if (jamn) {
      const mitt = (lngMin + lngMax) / 2;
      if (lng >= mitt) { varde = varde * 2 + 1; lngMin = mitt; } else { varde *= 2; lngMax = mitt; }
    } else {
      const mitt = (latMin + latMax) / 2;
      if (lat >= mitt) { varde = varde * 2 + 1; latMin = mitt; } else { varde *= 2; latMax = mitt; }
    }
    jamn = !jamn;
    if (++bit === 5) { ut += tecken[varde]; bit = 0; varde = 0; }
  }
  return ut;
}

export function sokadress(nyckel, sida, antal = 200) {
  const p = new URLSearchParams({
    apikey: nyckel,
    countryCode: "SE",
    geoPoint: geohash(CENTRUM.lat, CENTRUM.lng),
    radius: String(RADIE_KM),
    unit: "km",
    size: String(antal),
    page: String(sida),
    sort: "date,asc",
    locale: "sv-se,*",
  });
  return `https://app.ticketmaster.com/discovery/v2/events.json?${p}`;
}

// Ticketmasters kategorier (segment och genre) till våra.
function kategori(ev) {
  const k = (ev.classifications || []).find((c) => c.primary) || (ev.classifications || [])[0] || {};
  const segment = k.segment?.name || "";
  const genre = `${k.genre?.name || ""} ${k.subGenre?.name || ""}`;
  if (segment === "Music") return "musik";
  if (segment === "Sports") return "sport";
  if (segment === "Film") return "scen";
  if (segment === "Arts & Theatre") return /museum|exhibit|utställ|lecture|föreläs/i.test(genre) ? "museum" : "scen";
  return gissaKategori(`${ev.name} ${genre}`);
}

function barn(ev) {
  const text = (ev.classifications || []).map((c) => `${c.segment?.name} ${c.genre?.name} ${c.subGenre?.name} ${c.family ? "Family" : ""}`).join(" ");
  return /family|children|familj|barn/i.test(`${text} ${ev.name}`);
}

export function tillEvenemang(ev) {
  const plats = ev._embedded?.venues?.[0] || {};
  const start = ev.dates?.start || {};
  const utanTid = start.timeTBA || start.noSpecificTime || !start.dateTime;
  const status = ev.dates?.status?.code || "";
  const notering = status === "postponed" ? "Framflyttat" : status === "rescheduled" ? "Nytt datum" : "";
  return {
    id: `ticketmaster-${ev.id}`,
    titel: String(ev.name || "").trim(),
    start: utanTid ? start.localDate : tillSvenskTid(start.dateTime),
    slut: ev.dates?.end?.localDate || null,
    plats: {
      namn: plats.name || "Uppsala",
      id: `ticketmaster-plats-${plats.id || "okand"}`,
      ...(plats.location?.latitude && { lat: +plats.location.latitude, lng: +plats.location.longitude }),
    },
    kategori: kategori(ev),
    gratis: null,
    barnOchFamilj: barn(ev),
    ...(spannFranText(ev.name) && { alder: spannFranText(ev.name) }),
    ...(notering && { notering }),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: ev.url, biljetter: ev.url }],
    langvarig: false,
    installd: status === "cancelled",
  };
}

export function iKommunen(ev) {
  const ort = ev._embedded?.venues?.[0]?.city?.name || "";
  return ORTER.test(ort.trim());
}

export function bearbeta(svar) {
  const handelser = svar.flatMap((s) => s?._embedded?.events || []);
  const sedda = new Set();
  return handelser
    .filter((ev) => !ev.test && ev.dates?.start?.localDate && iKommunen(ev))
    .filter((ev) => (sedda.has(ev.id) ? false : sedda.add(ev.id)))
    .map(tillEvenemang);
}
