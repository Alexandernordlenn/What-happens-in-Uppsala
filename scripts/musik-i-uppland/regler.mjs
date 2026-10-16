// Regler för Musik i Uppland, regionens konsertverksamhet (bland annat
// Uppsala Kammarorkester).
//
// Webbplatsen har ett öppet WordPress-API med en post per konsert
// (/wp-json/wp/v2/concert). Konserterna finns i hela länet, så bara de i
// Uppsala kommun tas med.
//
// Vi sparar bara fakta: titel, tid, plats och länkar. Biljettinformationen
// läses bara för att se om konserten är gratis och sparas aldrig, eftersom
// den ibland innehåller namn och telefonnummer.

import { enRad } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { gratisFranText } from "../gemensamt/wordpress.mjs";
import { ORTER } from "../tickster/regler.mjs";

export const KALLA = {
  id: "musik-i-uppland",
  namn: "Musik i Uppland",
  webbsida: "https://www.musikiuppland.se/",
};

const SISTA_ORTEN = new RegExp(`(^|,\\s*)(${ORTER.join("|")})$`, "i");

// Ligger konserten i Uppsala kommun? Orten står i "locality", i taxonomin
// "cities" (som klassen cities-uppsala) eller sist i platsen ("Café Bredsjön, Järlåsa").
export function iKommunen(konsert) {
  const acf = konsert?.acf || {};
  if ((konsert?.class_list || []).includes("cities-uppsala")) return true;
  if (ORTER.includes(enRad(acf.locality).toLowerCase())) return true;
  return SISTA_ORTEN.test(enRad(acf.plats));
}

export function tillEvenemang(konsert) {
  const acf = konsert.acf || {};
  const titel = enRad(konsert.title?.rendered ?? konsert.title);
  const start = tillSvenskTid(acf.konserttid);
  const slut = tillSvenskTid(acf.konsertslut);
  const ensembler = (konsert.class_list || []).filter((k) => k.startsWith("ensembles-")).map((k) => k.slice("ensembles-".length));
  const biljetter = acf.kopknapp && /^https?:\/\//.test(acf.adress_kopknapp || "") ? acf.adress_kopknapp : null;
  const adress = [enRad(acf.adress), enRad(acf.postnummer)].filter(Boolean).join(", ");
  return {
    id: `musik-i-uppland-${konsert.id}`,
    titel,
    start,
    slut: slut && slut > start ? slut : null,
    plats: { namn: enRad(acf.plats) || enRad(acf.locality) || "Uppsala" },
    kategori: "musik",
    gratis: gratisFranText(acf.biljettinfo),
    barnOchFamilj: ensembler.includes("barn-ungdom") || /familj|för barn|barnkonsert/i.test(titel),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: konsert.link, ...(biljetter && { biljetter }) }],
    langvarig: false,
    installd: /^inställ/i.test(titel),
    fakta: { kategorier: ensembler, ...(adress && { adress }) },
  };
}

export function bearbeta(konserter, nu = new Date()) {
  return konserter
    .filter((k) => k?.id && k.acf?.konserttid && iKommunen(k))
    .map(tillEvenemang)
    .filter((e) => e.start && new Date(e.slut || e.start) > nu);
}
