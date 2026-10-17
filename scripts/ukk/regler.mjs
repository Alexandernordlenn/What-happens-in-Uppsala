// Regler för Uppsala Konsert & Kongress (UKK).
//
// UKK:s webbplats har ett öppet WordPress-API. Varje evenemang är ett inlägg
// där publiceringstiden är starttiden (date_gmt, i UTC). Kategorier och
// taggar står som klasser, till exempel "category-jazz" och "tag-familj".
//
// Vi hämtar bara titel, tid, kategorier och länk. Inga texter och inga bilder.
// Biljetterna säljs via Tickster, så samma evenemang slås ihop i bygget.

import { enRad } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";

export const KALLA = {
  id: "ukk",
  namn: "Uppsala Konsert & Kongress",
  webbsida: "https://ukk.se/",
};

// UKK:s kategorier (slug) till våra. Första träffen i listan vinner.
const KATEGORIER = [
  ["teater", "scen"], ["humor", "scen"], ["dans", "scen"],
  ["klassiskt", "musik"], ["jazz", "musik"], ["pop-rock", "musik"], ["nostalgi-tribute", "musik"],
  ["samtal", "prat"],
  ["hantverk-marknader", "ovrigt"],
];
const BARN = new Set(["category-barn", "tag-familj", "tag-barn", "tag-hostlov", "tag-sportlov", "tag-jullov", "tag-sommarlov"]);

const slugs = (klasser, prefix) => (klasser || []).filter((k) => k.startsWith(prefix)).map((k) => k.slice(prefix.length));

export function kategori(titel, klasser) {
  const egna = slugs(klasser, "category-");
  for (const [slug, kat] of KATEGORIER) if (egna.includes(slug)) return kat;
  // Bara "Barn & familj": på UKK är det oftast en föreställning ("Bamse och
  // Sjörövarskatten"), om inte titeln säger något annat (en julmarknad).
  if (egna.includes("barn")) return gissaKategori(titel, "scen");
  // "Övrigt", "Festligheter & högtider" och "Jul" säger inget. Då får titeln avgöra.
  return gissaKategori(titel, "ovrigt");
}

export function tillEvenemang(post) {
  const titel = enRad(post.title?.rendered ?? post.title);
  const klasser = post.class_list || [];
  return {
    id: `ukk-${post.id}`,
    titel,
    start: tillSvenskTid(post.date_gmt ? `${post.date_gmt}Z` : post.date),
    slut: null,
    plats: { namn: "Uppsala Konsert & Kongress", id: "ukk" },
    kategori: kategori(titel, klasser),
    gratis: /fri entré|gratis/i.test(titel) ? true : null,
    barnOchFamilj: klasser.some((k) => BARN.has(k)) || /familj|för barn|barnkonsert/i.test(titel),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: post.link }],
    langvarig: false,
    installd: /^inställ/i.test(titel),
    fakta: { kategorier: slugs(klasser, "category-"), taggar: slugs(klasser, "tag-") },
  };
}

export function bearbeta(poster, nu = new Date()) {
  return poster
    .filter((p) => p?.id && (p.date_gmt || p.date) && p.link)
    .map(tillEvenemang)
    .filter((e) => e.start && new Date(e.start) > nu);
}
