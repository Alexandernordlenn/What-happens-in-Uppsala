// Regler för Bror Hjorths Hus, konstnärshemmet och museet i Uppsala.
//
// Webbplatsen använder The Events Calendar, som har ett öppet API
// (/wp-json/tribe/events/v1/events). Museets egna kategorier säger vad det är:
// Visning, Föredrag & Konsert, Barn & Familj och Verkstad/kurs.
// Utställningarna finns inte i kalendern, bara programmet.
//
// Vi sparar bara fakta: titel, tid, kategori, pris och länk. Inga texter och
// inga bilder.

import { franTribe, gratisFranText } from "../gemensamt/wordpress.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";

export const KALLA = {
  id: "bror-hjorths-hus",
  namn: "Bror Hjorths Hus",
  webbsida: "https://brorhjorthshus.se/",
};

export function kategori(titel, kategorier) {
  if (kategorier.includes("Visning")) return "museum";
  // "Föredrag & Konsert" är antingen musik eller ett samtal ("Möt konstnären").
  if (kategorier.includes("Föredrag & Konsert")) return gissaKategori(titel, null) === "musik" ? "musik" : "prat";
  if (kategorier.includes("Verkstad/kurs") || kategorier.includes("Barn & Familj")) return "aktivitet";
  return gissaKategori(titel, "museum");
}

// En kurs (anmälan till flera tillfällen) visas inte på sidan. Lovverkstäder
// och konstskola på lovet är aktiviteter.
export const arKurs = (titel, kategorier) => kategorier.includes("Verkstad/kurs") && /kurs/i.test(titel) && !/lov/i.test(titel);

export function tillEvenemang(raw) {
  const ev = franTribe(raw);
  const adress = [ev.plats?.adress, ev.plats?.postnummer].filter(Boolean).join(", ");
  return {
    id: `bror-hjorths-hus-${ev.id}`,
    titel: ev.titel,
    start: ev.start,
    slut: ev.slut,
    ...(ev.heldag && { heldag: true }),
    plats: { namn: ev.plats?.namn || "Bror Hjorths Hus" },
    kategori: kategori(ev.titel, ev.kategorier),
    ...(arKurs(ev.titel, ev.kategorier) && { format: "kurs" }),
    gratis: gratisFranText(ev.kostnad),
    barnOchFamilj: ev.kategorier.includes("Barn & Familj") || /barn|familj/i.test(ev.titel),
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
    .filter((e) => e.start && new Date(e.slut || e.start) > nu);
}
