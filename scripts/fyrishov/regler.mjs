// Regler för Fyrishov, Uppsalas stora idrotts-, mäss- och badanläggning.
//
// Fyrishovs kalender (tillägget All-in-One Event Calendar) kan laddas ner som
// en kalenderfil med alla aktiviteter, och robots.txt tillåter det. Matcher,
// mässor och konserter står en gång var. Återkommande aktiviteter (till
// exempel pooldisco) står en gång med en regel, och de riktiga datumen räknas
// ut från regeln (scripts/gemensamt/ical.mjs). Datum hittas aldrig på.
//
// Vi sparar bara fakta: titel, tid, hall och länk. Beskrivningar och
// kontaktuppgifter i filen används inte. Prisuppgiften i filen ("free") står
// på nästan allt och är inte pålitlig, så den används inte heller.

import { datumFranRegel, lasIcal } from "../gemensamt/ical.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";

export const KALLA = {
  id: "fyrishov",
  namn: "Fyrishov",
  webbsida: "https://fyrishov.se/",
};

export const KALENDERFIL =
  "https://fyrishov.se/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true";

const DAGAR_FRAMAT = 120;
const datum = (t) => String(t || "").slice(0, 10);
const klockslag = (t) => String(t || "").slice(11, 16) || null;
const plusDagar = (dag, n) => new Date(Date.parse(`${dag}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export function tillEvenemang(ev, idag) {
  const titel = ev.titel || "";
  const nummer = String(ev.uid || "").match(/(\d+)@/)?.[1] || String(ev.uid || titel).replace(/[^a-z0-9]+/gi, "-");
  const rum = ev.plats && !/^fyrishov$/i.test(ev.plats) ? ev.plats : null;
  const bas = {
    id: `fyrishov-${nummer}`,
    titel,
    plats: { namn: "Fyrishov", id: "fyrishov", ...(rum && { rum }) },
    kategori: gissaKategori([titel, ...(ev.taggar || [])].join(" "), "aktivitet"),
    gratis: null,
    barnOchFamilj: /barn|familj|kids|lov\b|lovet/i.test(titel),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: ev.url || KALLA.webbsida }],
    langvarig: false,
    installd: ev.status === "CANCELLED" || /^inställ/i.test(titel),
    fakta: { taggar: ev.taggar || [] },
  };
  if (!ev.upprepning) {
    if (!ev.start || datum(ev.slut || ev.start) < idag) return [];
    return [{ ...bas, start: ev.start, slut: ev.slut && ev.slut > ev.start ? ev.slut : null }];
  }
  // Återkommande: de datum regeln ger de närmaste 120 dagarna, utan undantagen.
  const dagar = datumFranRegel(ev, idag, plusDagar(idag, DAGAR_FRAMAT));
  if (!dagar?.length) return [];
  const [fran, till] = [klockslag(ev.start), klockslag(ev.slut)];
  const tid = (dag, kl) => (kl ? tillSvenskTid(`${dag}T${kl}:00`) : dag);
  return [
    {
      ...bas,
      start: tid(dagar[0], fran),
      slut: tid(dagar.at(-1), till),
      format: "aterkommande",
      serie: { datum: dagar, ...(fran && { start: fran }), ...(till && till > (fran || "") && { slut: till }) },
    },
  ];
}

export function bearbeta(text, idag) {
  return lasIcal(text).flatMap((ev) => tillEvenemang(ev, idag));
}
