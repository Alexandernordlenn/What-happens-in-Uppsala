// Regler för Heja Uppsala (hejauppsala.com/kalender/).
//
// Tillfälligt, under testfasen. Heja har inget öppet dataflöde, så vi läser
// listan med kommande evenemang. Varje kort har titel, plats, kategorier och
// ett datum utan årtal. Klockslag och riktigt startdatum står på evenemangets
// egen sida under "När och var?", som vi läser en gång per evenemang.
//
// Vi sparar bara fakta: titel, tid, plats, kategori och länk. Inga
// beskrivningar och inga bilder (se CLAUDE.md).

import { enRad, avkoda, renText } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { dagOchManad, raknaUtDatum, tolkaNar } from "../gemensamt/datum.mjs";

export { raknaUtDatum };

export const KALLA = {
  id: "heja",
  namn: "Heja Uppsala",
  webbsida: "https://hejauppsala.com/kalender/",
};

// Hejas kategorier till våra. Den första som finns bland kortets vinner.
const KATEGORIER = [
  ["musik", "musik"],
  ["scen", "scen"],
  ["sport", "sport"],
  ["foredrag", "prat"],
  ["kurser", "prat"],
  ["museum", "museum"],
  ["konst", "museum"],
  ["mat-dryck", "mat"],
  ["dans-event", "natt"],
];

// ---------- Listan ----------

export function lasLista(html) {
  const utan = html.replace(/<(style|script|svg)[\s\S]*?<\/\1>/g, "");
  const kort = [];
  const re = /<a href="(https:\/\/hejauppsala\.com\/kalender\/[^"]+)" class="c-img-module u-block">([\s\S]*?)<\/ul>/g;
  for (const [, url, inne] of utan.matchAll(re)) {
    const datum = [...inne.matchAll(/u-text-bold">\s*(\d{1,2})\s*<\/p>\s*<span class="u-text-uppercase u-text-6xs">\s*([a-zåäö]+)\s*<\/span>/gi)]
      .map(([, d, m]) => dagOchManad(d, m))
      .filter(Boolean);
    const titel = inne.match(/u-text-currentColor">\s*([\s\S]*?)\s*<\/p>/);
    const kategorier = [...inne.matchAll(/event-category\/([^/"]+)\//g)].map((m) => m[1]);
    const punkter = [...inne.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
    const sista = punkter[punkter.length - 1] || "";
    kort.push({
      url,
      titel: titel ? enRad(titel[1]) : "",
      datum,
      kategorier,
      plats: sista.includes("event-category") ? "" : enRad(sista),
    });
  }
  return kort;
}

// Finns en länk till nästa sida?
export const finnsNastaSida = (html) => /class="next page-numbers"/.test(html);

// ---------- Evenemangets egen sida ----------

export function lasDetaljer(html) {
  const avsnitt = html.match(/<h4[^>]*>\s*När och var\?\s*<\/h4>([\s\S]*?)<\/div>/);
  const knapp = html.match(/<a href="([^"]+)" class="\[ c-btn c-btn--lg \][^>]*>\s*([^<]*)<\/a>/);
  return {
    nar: avsnitt ? renText(avsnitt[1]) : "",
    lank: knapp ? avkoda(knapp[1]) : null,
    knapptext: knapp ? enRad(knapp[2]) : null,
  };
}

// ---------- Färdiga evenemang ----------

export function iKommunen(k) {
  return k.kategorier.includes("uppsala");
}

function kategori(k) {
  for (const [deras, vara] of KATEGORIER) if (k.kategorier.includes(deras)) return vara;
  return "ovrigt";
}

const dagar = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

export function tillEvenemang(k, detaljer = null) {
  const nar = tolkaNar(detaljer?.nar);
  // Pågående evenemang visas i listan som om de börjar idag. Står det riktiga
  // startdatumet på evenemangets sida använder vi det.
  let startdatum = k.startdatum;
  if (nar.datumIText.length && nar.datumIText[0] <= startdatum) startdatum = nar.datumIText[0];
  const slutdatum = k.slutdatum && k.slutdatum > startdatum ? k.slutdatum : null;
  const langvarig = Boolean(slutdatum && dagar(startdatum, slutdatum) >= 3);
  const klockslag = !langvarig && nar.klockslag;
  const slug = k.url.replace(/\/$/, "").split("/").pop();

  return {
    id: `heja-${slug}`,
    titel: k.titel,
    start: klockslag ? tillSvenskTid(`${startdatum}T${klockslag}`) : startdatum,
    slut: slutdatum,
    plats: { namn: k.plats || "Uppsala", id: `heja-plats-${(k.plats || "uppsala").toLowerCase().replace(/[^a-z0-9åäö]+/g, "-")}` },
    kategori: kategori(k),
    gratis: k.kategorier.includes("gratis") ? true : null,
    barnOchFamilj: k.kategorier.includes("familj"),
    kallor: [
      {
        id: KALLA.id,
        namn: KALLA.namn,
        url: k.url,
        ...(detaljer?.lank && { arrangor: detaljer.lank }),
      },
    ],
    langvarig,
    installd: /inställ/i.test(k.titel),
  };
}
