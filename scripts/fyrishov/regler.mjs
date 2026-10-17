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
//
// Träningspass i badet (till exempel "Virtuell vattenträning" flera gånger om
// dagen) är inga evenemang utan en del av öppettiderna, så de tas inte med.

import { datumFranRegel, lasIcal } from "../gemensamt/ical.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { LAG } from "../sport/konfig.mjs";

export const KALLA = {
  id: "fyrishov",
  namn: "Fyrishov",
  webbsida: "https://fyrishov.se/",
};

export const KALENDERFIL =
  "https://fyrishov.se/?plugin=all-in-one-event-calendar&controller=ai1ec_exporter_controller&action=export_events&no_html=true";

const DAGAR_FRAMAT = 120;

export const TRANINGSPASS = /vattenträning|vattengympa|vattengymnastik|aqua ?(fit|zumba|jogg)|simskola|babysim|minisim|crawlskola|motionssim|morgonsim/i;

// "Uppsala HK – Täby HBK" är en match även om titeln inte säger vilken sport.
// Ger sporten ("Handboll") om hemmalaget finns i lagtabellen, "" om det är en
// match men sporten är okänd, och null om det inte är en match.
const LAGORD = /basket|volleyboll|handboll|innebandy|bandy|hockey|fotboll|derby|\b(hk|if|ik|ibk|ibf|bk|bbk|vbs|vk|hbk|sk|fc)\b/i;
export function matchSport(titel) {
  const m = String(titel || "").match(/^(.+?)\s[–-]\s(.+)$/);
  if (!m) return null;
  const lag = LAG.find((l) => l.monster.test(m[1]));
  if (lag) return lag.sport;
  return LAGORD.test(titel) ? "" : null;
}

const datum = (t) => String(t || "").slice(0, 10);
const klockslag = (t) => String(t || "").slice(11, 16) || null;
const plusDagar = (dag, n) => new Date(Date.parse(`${dag}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

export function tillEvenemang(ev, idag) {
  const titel = ev.titel || "";
  const nummer = String(ev.uid || "").match(/(\d+)@/)?.[1] || String(ev.uid || titel).replace(/[^a-z0-9]+/gi, "-");
  const rum = ev.plats && !/^fyrishov$/i.test(ev.plats) ? ev.plats : null;
  const sport = matchSport(titel);
  const bas = {
    id: `fyrishov-${nummer}`,
    titel,
    plats: { namn: "Fyrishov", id: "fyrishov", ...(rum && { rum }) },
    kategori: sport !== null ? "sport" : gissaKategori([titel, ...(ev.taggar || [])].join(" "), "aktivitet"),
    ...(sport && { sport }),
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
  return lasIcal(text)
    .filter((ev) => !TRANINGSPASS.test(ev.titel || ""))
    .flatMap((ev) => tillEvenemang(ev, idag));
}
