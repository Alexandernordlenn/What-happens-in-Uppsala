// Regler för Katalin, jazz- och konsertscenen vid Uppsala Central.
//
// Katalins webbplats har ett öppet WordPress-API med en post per evenemang
// (/wp-json/wp/v2/events). Datum, tid, pris och biljettstatus ligger i "acf".
// Katalin är den enda källan som säger om ett evenemang är slutsålt eller
// inställt.
//
// Vi sparar bara fakta: titel, tid, scen, genre, status och länkar. Inga
// texter och inga bilder.

import { enRad } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";
import { gratisFranText } from "../gemensamt/wordpress.mjs";

export const KALLA = {
  id: "katalin",
  namn: "Katalin",
  webbsida: "https://www.katalin.com/",
};

const SCENER = { scen: "Stora scen", jazzbaren: "Bakfickan" };
const GENRER = { "stand-up": "scen", underhallning: "scen", forelasning: "prat" };

// "20261215" och "12:00:00" blir "2026-12-15T12:00:00+01:00". Utan klockslag bara datumet.
export function starttid(acf) {
  const m = String(acf?.date_of_event || "").match(/^(\d{4})(\d\d)(\d\d)$/);
  if (!m) return null;
  const dag = `${m[1]}-${m[2]}-${m[3]}`;
  const tid = String(acf.time || "").match(/^(\d\d):(\d\d)/);
  return tid ? tillSvenskTid(`${dag}T${tid[1]}:${tid[2]}:00`) : dag;
}

// "Daniel Lemma – Katalins Bakficka" blir "Daniel Lemma". Scenen står redan i rummet.
export function stadaTitel(titel) {
  return titel
    .replace(/\s*[–-]\s*(katalins\s+)?ba[ck]{1,2}fick(an|a)\s*$/i, "")
    .replace(/\s+(i|på)\s+katalins\s+ba[ck]{1,2}ficka\s*$/i, "")
    .trim();
}

export function tillEvenemang(post) {
  const acf = post.acf || {};
  const titel = stadaTitel(enRad(post.title?.rendered ?? post.title));
  const genrer = post.genre_slugs || [];
  const scen = (post.stage_slugs || []).map((s) => SCENER[s]).find(Boolean);
  const status = acf.ticket_status || "";
  const biljetter = /^https?:\/\//.test(acf.book_a_ticket || "") ? acf.book_a_ticket : null;
  const notering = { outsold: "Slutsåld", fewseats: "Få biljetter kvar" }[status];
  return {
    id: `katalin-${post.id}`,
    titel,
    start: starttid(acf),
    slut: null,
    plats: { namn: "Katalin", id: "katalin", ...(scen && { rum: scen }) },
    // Katalins genre går först. Alla genrer utom de i GENRER är musik.
    kategori: genrer.length ? genrer.map((g) => GENRER[g]).find(Boolean) || "musik" : gissaKategori(titel, "musik"),
    gratis: status === "free" ? true : gratisFranText(acf.ticket_price),
    barnOchFamilj: /familj|för barn|barnkonsert/i.test(titel),
    ...(notering && { notering }),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: post.link, ...(biljetter && { biljetter }) }],
    langvarig: false,
    installd: status === "canceled" || /^inställ/i.test(titel),
    fakta: { kategorier: genrer },
  };
}

// Sant om posten gäller ett evenemang i dag eller senare.
export const arKommande = (post, idag) => {
  const d = String(post?.acf?.date_of_event || "");
  return /^\d{8}$/.test(d) && `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` >= idag;
};

export function bearbeta(poster, nu = new Date()) {
  const idag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(nu);
  return poster.filter((p) => p?.id && arKommande(p, idag)).map(tillEvenemang);
}
