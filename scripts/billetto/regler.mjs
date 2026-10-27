// Regler för Billetto, biljettsystemet för många små arrangörer.
//
// Billettos Public Event Search API (GET /api/v3/public/events) ger alla
// publika evenemang i Sverige, med nyckeln BILLETTO_API_KEY (id:secret) i
// rubriken Api-Keypair. Filtren på postnummer och region fungerar inte, så vi
// läser alla sidor och väljer Uppsala kommun med koordinaterna.
//
// Villkor: länken till evenemanget ska ha kvar Billettos UTM-koder, så vi
// använder fältet url som det är. Vi sparar bara fakta: titel, tid, plats,
// kategori och länk. Inga beskrivningar och inga bilder.

import { enRad } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";
import { iUppsalaKommun } from "../gemensamt/kommungrans.mjs";
import { ORTER } from "../tickster/regler.mjs";

export const KALLA = {
  id: "billetto",
  namn: "Billetto",
  webbsida: "https://billetto.se/",
};

export const ADRESS = "https://billetto.se/api/v3/public/events?limit=100";

// Billettos kategorier till våra.
const KATEGORIER = {
  music: "musik", performing_arts: "scen", film_media: "scen", arts: "museum", visual_arts: "museum",
  food_drink: "mat", nightlife: "natt", sports: "sport", sports_fitness: "sport",
  hobbies: "aktivitet", health_wellness: "aktivitet", family: "aktivitet",
  business: "prat", science_tech: "prat", education: "prat", community: "ovrigt", lifestyle: "ovrigt",
};

export function iKommunen(ev) {
  const c = ev?.location?.coordinates;
  if (typeof c?.latitude === "number" && typeof c?.longitude === "number") return iUppsalaKommun(c.latitude, c.longitude);
  return ORTER.includes(String(ev?.location?.city || "").trim().toLowerCase());
}

export function tillEvenemang(ev) {
  const titel = enRad(ev.title);
  const l = ev.location || {};
  const kat = ev.categorization || {};
  const adress = [enRad(l.address_line), enRad(l.postal_code)].filter(Boolean).join(", ");
  const pris = ev.minimum_price?.amount_in_cents ?? ev.minimum_price?.amount;
  return {
    id: `billetto-${ev.id}`,
    titel,
    start: tillSvenskTid(ev.startdate),
    slut: tillSvenskTid(ev.enddate),
    plats: { namn: enRad(l.location_name) || enRad(l.city) || "Uppsala" },
    kategori: KATEGORIER[kat.category] || gissaKategori(titel, "ovrigt"),
    gratis: pris === 0 ? true : typeof pris === "number" ? false : null,
    barnOchFamilj: kat.category === "family" || /barn|familj|höstlov|sportlov|jullov/i.test(titel),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: ev.url }],
    langvarig: false,
    installd: ev.state === "canceled" || ev.state === "cancelled",
    fakta: { kategorier: [kat.category, kat.subcategory, kat.type].filter(Boolean), ...(adress && { adress }) },
  };
}

export function bearbeta(lista, nu = new Date()) {
  return lista
    .filter((ev) => ev?.id && ev.startdate && ev.url && iKommunen(ev) && ["published", "canceled", "cancelled"].includes(ev.state))
    .map(tillEvenemang)
    .filter((e) => e.start && new Date(e.slut || e.start) > nu);
}
