// Regler för Uppsala Missionskyrka, en av stadens största konsertlokaler.
//
// Kyrkans webbplats använder The Events Calendar, som har ett öppet API
// (/wp-json/tribe/events/v1/events). robots.txt ber om 10 sekunder mellan
// anropen och förbjuder kalenderfilerna (ical=1), så vi använder API:et.
//
// Samma regel som för Svenska kyrkan: gudstjänster, mässor och andakter tas
// bort, och här även bibelstudier och församlingsmöten. Konserter och
// kulturkvällar behålls även om titeln innehåller ett sådant ord.
//
// Vi sparar bara fakta: titel, tid, plats och länk. Inga texter och inga bilder.

import { franTribe, gratisFranText } from "../gemensamt/wordpress.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";
import { GUDSTJANST_ORD } from "../svenska-kyrkan/regler.mjs";

export const KALLA = {
  id: "missionskyrkan",
  namn: "Uppsala Missionskyrka",
  webbsida: "https://www.uppsalamissionskyrka.se/",
};

const FORSAMLINGEN = /bibelstudi|upptäck bibeln|församlingsmöte|medlemsmöte|konfirmand|julafton i missionskyrkan/i;
const KULTUR = /^(\S*konsert|kulturkväll|lunchmusik|litteratur)/i;
const PRAT = /fredagsträff|litteratur|kvinnofrukost|poetiskt|föredrag|samtal|seminari/i;
const HANG = /fika med|språkcaf|språkkaf/i;

export function skaMed(titel) {
  if (KULTUR.test(titel)) return true;
  return !GUDSTJANST_ORD.test(titel) && !FORSAMLINGEN.test(titel);
}

// Plats: arrangörens egen uppgift, annars en annan kyrka i titeln
// ("Samtal pågår i Flottsundskyrkan"), annars Missionskyrkan.
function plats(ev) {
  if (ev.plats?.namn) return { namn: ev.plats.namn };
  const annan = ev.titel.match(/\bi (\p{Lu}\p{Ll}+kyrkan)$/u);
  if (annan && !/^missionskyrkan$/i.test(annan[1])) return { namn: annan[1] };
  return { namn: "Missionskyrkan", id: "missionskyrkan" };
}

export function tillEvenemang(raw) {
  const ev = franTribe(raw);
  const adress = [ev.plats?.adress, ev.plats?.postnummer].filter(Boolean).join(", ");
  return {
    id: `missionskyrkan-${ev.id}`,
    titel: ev.titel,
    start: ev.start,
    slut: ev.slut,
    ...(ev.heldag && { heldag: true }),
    plats: plats(ev),
    // I kyrkan är det oftast musik. På andra platser vet vi inte.
    kategori: PRAT.test(ev.titel) ? "prat" : HANG.test(ev.titel) ? "aktivitet" : gissaKategori(ev.titel, ev.plats?.namn ? "ovrigt" : "musik"),
    gratis: gratisFranText(ev.kostnad),
    barnOchFamilj: /barn|familj|\bunga\b/i.test(ev.titel),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: ev.url }],
    langvarig: false,
    installd: ev.installd,
    fakta: { kategorier: ev.kategorier, ...(adress && { adress }) },
  };
}

export function bearbeta(lista, nu = new Date()) {
  return lista
    .filter((raw) => raw?.id && !franTribe(raw).dolt)
    .map(tillEvenemang)
    .filter((e) => e.start && skaMed(e.titel) && new Date(e.slut || e.start) > nu);
}
