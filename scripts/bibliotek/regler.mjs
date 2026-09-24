// Regler för Bibliotek Uppsala.
//
// Bibliotekets kalender (bibliotekuppsala.se/evenemang) hämtar sina
// evenemang från leverantören Axiells öppna API, utan nyckel. Vi frågar
// samma API på samma sätt som bibliotekets egen sida gör.
//
// Vi sparar bara fakta: titel, tid, bibliotek, målgrupp och länk. Inga
// beskrivningar och inga bilder.

import { enRad, renText } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";

export const KALLA = {
  id: "bibliotek",
  namn: "Bibliotek Uppsala",
  webbsida: "https://bibliotekuppsala.se/evenemang",
};

export const API = "https://api.axiell.com/event/api/customers/5de8fb519cf47722f2bb9871";

// Samma sökning som bibliotekets egen kalender gör: allt som inte är slut,
// även inställda evenemang, sorterat på starttid.
export function sokParametrar(nu, start, antal) {
  return new URLSearchParams({
    queryString: "event.title:* OR event.description:* OR event.location.value:*",
    rangeFilters: JSON.stringify([{ field: "event.endDate", gte: nu.toISOString() }]),
    termFilters: JSON.stringify([
      { field: "event.status", values: ["PUBLISHED", "CANCELLED"] },
      { type: "NOT_IN", field: "event.deleted", values: [true] },
    ]),
    sorts: JSON.stringify([{ field: "event.startDate", order: "ASC" }]),
    start: String(start),
    size: String(antal),
  });
}

// Datum kommer antingen som text eller som { value: text }.
const datum = (d) => (d && typeof d === "object" ? d.value : d) || null;
const varden = (lista) => (lista || []).map((x) => (x && typeof x === "object" ? x.value ?? x.name : x)).filter(Boolean);
// Ett fält som { value: "Stadsbiblioteket" }, ibland { value: null }.
const text = (f) => enRad(f && typeof f === "object" ? f.value : f);

// Bibliotekets taggar till våra kategorier. Första träffen vinner.
const TAGGAR = [
  ["musik", /^musik$/i],
  ["scen", /^(film|teater|dans)$/i],
  ["museum", /^utställning$/i],
  ["prat", /^(föredrag|författarbesök|samhälle och debatt|historia|filosofi|bokcirkel|klimat och miljö|demokrativecka|boktips|skriva)$/i],
  ["ovrigt", /^(quiz|spel|rollspel|pyssel|pyssla|sagostund)$/i],
];

// Stödtjänster snarare än evenemang. Tas inte med.
const TJANSTER = /^(läxhjälp|it-handledning|juridisk rådgivning)$/i;

function kategori(titel, taggar) {
  for (const [kat, re] of TAGGAR) if (taggar.some((t) => re.test(t))) return kat;
  // Bibliotekens evenemang är oftast föredrag, samtal och läsning.
  return gissaKategori(titel, "prat");
}

const BARN = /barn|familj|bebis|baby|förskola|unga|ungdom|tonår|\b\d{1,2}\s*[-–]\s*\d{1,2}\s*år/i;
const KOSTAR = /\d+\s*kr\b|kostar|avgift|entré\s*\d/i;

export function tillEvenemang(ev) {
  const titel = enRad(ev.title);
  const malgrupper = varden(ev.targetAudiences);
  const taggar = varden(ev.tags);
  const beskrivning = renText(ev.description); // Används bara för att gissa, sparas inte.
  const bibliotek = text(ev.location) || "Bibliotek Uppsala";
  const rum = text(ev.room);

  return {
    id: `bibliotek-${ev.id}`,
    titel,
    start: tillSvenskTid(datum(ev.startDate)),
    slut: tillSvenskTid(datum(ev.endDate)),
    plats: {
      namn: bibliotek,
      id: `bibliotek-${bibliotek.toLowerCase().replace(/[^a-z0-9åäö]+/g, "-")}`,
      ...(rum && { rum }),
    },
    kategori: kategori(titel, taggar),
    // Bibliotekens evenemang är gratis om inget annat står.
    gratis: !KOSTAR.test(beskrivning),
    barnOchFamilj: BARN.test([...malgrupper, ...taggar, titel].join(" ")),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: `https://bibliotekuppsala.se/evenemang#/events/${ev.id}` }],
    langvarig: false,
    installd: ev.status === "CANCELLED",
  };
}

export function bearbeta(traffar) {
  return traffar
    .map((t) => t.event ?? t)
    .filter((ev) => ev && ev.id && datum(ev.startDate))
    .filter((ev) => !varden(ev.tags).some((t) => TJANSTER.test(t)))
    .map(tillEvenemang);
}
