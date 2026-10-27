// Regler för Tickster som API-vägen (api.mjs) använder: källan, orterna i
// kommunen och kategorier från Ticksters fria taggar.
//
// Vi sparar bara fakta: titel, tid, plats, kategori och köplänk. Inga
// beskrivningar och inga bilder (se CLAUDE.md).

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

export function kategoriFranTaggar(titel, taggar) {
  for (const t of taggar) if (TAGGAR[t]) return TAGGAR[t];
  return gissaKategori(titel);
}
