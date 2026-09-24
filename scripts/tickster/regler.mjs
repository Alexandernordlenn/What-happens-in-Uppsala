// Regler för Tickster (publika webbsidor, tills vi får en API-nyckel).
//
// Listan www.tickster.com/se/sv/events/in/<ort> ger alla kommande evenemang
// på en ort, men bara med datum. Evenemangets egen sida har exakt tid, plats,
// ort, koordinater och taggar, inbäddat som schema.org-uppmärkning.
//
// Vi sparar bara fakta: titel, tid, plats, kategori och köplänk. Inga
// beskrivningar och inga bilder (se CLAUDE.md).

import { enRad } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";

export const KALLA = {
  id: "tickster",
  namn: "Tickster",
  webbsida: "https://www.tickster.com/se/sv/events/in/uppsala",
  kategoriFranPlats: true, // Tickster har inga kategorier, bara fria taggar.
};

// Orter i Uppsala kommun som Tickster kan ha evenemang på. Små bokstäver.
export const ORTER = [
  "uppsala", "storvreta", "björklinge", "vattholma", "skyttorp", "almunge", "knutby",
  "bälinge", "järlåsa", "vänge", "länna", "gunsta", "sävja", "rasbo", "stavby",
  "gamla uppsala", "lövstalöt", "gåvsta", "ramstalund",
];

// Taggar som säger något om kategori. Arrangörerna väljer taggarna fritt.
const TAGGAR = {
  musik: "musik", konsert: "musik", jazz: "musik", rock: "musik", pop: "musik", klassiskt: "musik",
  teater: "scen", standup: "scen", humor: "scen", komedi: "scen", dans: "scen", show: "scen", musikal: "scen", film: "scen",
  utställning: "museum", konst: "museum", museum: "museum",
  föreläsning: "prat", föredrag: "prat", samtal: "prat",
  sport: "sport", basket: "sport", innebandy: "sport", hockey: "sport", fotboll: "sport", bandy: "sport",
  mat: "mat", dryck: "mat", vinprovning: "mat", ölprovning: "mat",
  klubb: "natt", nattklubb: "natt", dj: "natt", fest: "natt",
};
const BARNTAGGAR = /^(barn|familj|barnteater|barnföreställning|familjeföreställning)/;

// ---------- Listan ----------

export function lasLista(html) {
  const brickor = [];
  const re = /<div class="c-tile" data-requestcode="([A-Z0-9]+)">([\s\S]*?)<\/div>\s*<\/div>/g;
  for (const [, kod, inne] of html.matchAll(re)) {
    const lank = inne.match(/href="(\/se\/sv\/events\/[a-z0-9]+\/(\d{4}-\d\d-\d\d)\/[^"]+)"/);
    if (!lank) continue;
    const titel = inne.match(/<h2 class="c-tile__title">([\s\S]*?)<\/h2>/);
    const etikett = inne.match(/<span class="c-tile__label">([\s\S]*?)<\/span>/);
    brickor.push({
      id: kod.toLowerCase(),
      url: `https://www.tickster.com${lank[1]}`,
      datum: lank[2],
      titel: titel ? enRad(titel[1]) : "",
      etikett: etikett ? enRad(etikett[1]) : "",
    });
  }
  return brickor;
}

export function antalTraffar(html) {
  const m = html.match(/Vi hittade <strong>(\d+)<\/strong>/);
  return m ? +m[1] : 0;
}

// ---------- Evenemangets egen sida ----------

function egenskap(html, namn) {
  const m = html.match(new RegExp(`itemprop="${namn}" content="([^"]*)"`));
  return m ? m[1] : null;
}

export function lasEvenemangssida(html) {
  const titel = html.match(/<h1[^>]*itemprop="name"[^>]*>([\s\S]*?)<\/h1>/);
  const plats = html.match(
    /itemprop="location">[\s\S]*?href="\/se\/sv\/events\/at\/([a-z0-9]+)\/[^"]*"><span itemprop="name">([\s\S]*?)<\/span>/,
  );
  const ort = html.match(/itemprop="addressLocality">([\s\S]*?)<\/span>/);
  const karta = html.match(/maps\/search\/\?api=1&(?:amp;)?query=(-?[\d.]+),(-?[\d.]+)/);
  const taggar = [...html.matchAll(/events\/tagged\/([^"]+)"/g)].map((m) => decodeURIComponent(m[1]).toLowerCase());
  const arrangor = html.match(/Arrang(?:ör|&#246;r): <a href="\/se\/sv\/events\/by\/([a-z0-9]+)\/[^"]*">([\s\S]*?)<\/a>/);
  const kop = html.match(/href="(https:\/\/secure\.tickster\.com\/[^"]+)"[^>]*itemprop="url"/);
  const status = html.match(/id="event-purchase-status-message">([\s\S]*?)<\/div>/);
  return {
    titel: titel ? enRad(titel[1]) : null,
    start: egenskap(html, "startDate"),
    slut: egenskap(html, "endDate"),
    platsId: plats ? plats[1] : null,
    plats: plats ? enRad(plats[2]) : null,
    ort: ort ? enRad(ort[1]) : null,
    lat: karta ? +karta[1] : null,
    lng: karta ? +karta[2] : null,
    taggar: [...new Set(taggar)],
    arrangorId: arrangor ? arrangor[1] : null,
    arrangor: arrangor ? enRad(arrangor[2]) : null,
    kop: kop ? kop[1] : null,
    status: status ? enRad(status[1]) : "",
  };
}

// ---------- Färdiga evenemang ----------

export function iKommunen(detaljer) {
  if (!detaljer?.ort) return true; // Vet vi inte ort litar vi på listan vi hittade den i.
  return ORTER.includes(detaljer.ort.toLowerCase());
}

function kategori(titel, taggar) {
  for (const t of taggar) if (TAGGAR[t]) return TAGGAR[t];
  return gissaKategori(titel);
}

// "bricka" kommer från listan, "detaljer" från evenemangets sida om vi har den.
export function tillEvenemang(bricka, detaljer = null) {
  const d = detaljer || {};
  const titel = d.titel || bricka.titel;
  const taggar = d.taggar || [];
  // Utan evenemangssidan vet vi bara datum. Platsen tar vi då från etiketten,
  // som ser ut som "24 sep 2026, Katalin, Uppsala".
  const delar = bricka.etikett.split(",").map((x) => x.trim());
  const etikettPlats = delar.length > 2 ? delar.slice(1, -1).join(", ") : delar[1] || "";
  const platsnamn = d.plats || etikettPlats || "Uppsala";
  const start = d.start ? tillSvenskTid(d.start) : bricka.datum;
  const slut = d.slut ? tillSvenskTid(d.slut) : null;
  // Räknas i kalenderdagar: 18 feb kl. 16 till 21 feb kl. 15 blir 3 dagar.
  const dagar = d.start && d.slut ? (Date.parse(d.slut.slice(0, 10)) - Date.parse(d.start.slice(0, 10))) / 86400000 : 0;

  return {
    id: `tickster-${bricka.id}`,
    titel,
    start,
    slut,
    plats: {
      namn: platsnamn,
      id: d.platsId ? `tickster-plats-${d.platsId}` : `tickster-plats-${platsnamn.toLowerCase().replace(/[^a-z0-9åäö]+/g, "-")}`,
      ...(d.lat && { lat: d.lat, lng: d.lng }),
    },
    kategori: kategori(titel, taggar),
    gratis: null, // Tickster säljer biljetter, men ibland är de gratis. Vi vet inte.
    barnOchFamilj: taggar.some((t) => BARNTAGGAR.test(t)) || /\bbarn|familj/i.test(titel),
    kallor: [
      {
        id: KALLA.id,
        namn: KALLA.namn,
        url: bricka.url,
        biljetter: d.kop || `https://secure.tickster.com/sv/${bricka.id}`,
      },
    ],
    langvarig: dagar >= 3,
    installd: /inställ|cancel/i.test(`${titel} ${d.status || ""}`),
  };
}
