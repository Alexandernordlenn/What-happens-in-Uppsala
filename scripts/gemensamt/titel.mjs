// Normaliserade titlar, för att jämföra evenemang från olika källor.
//
// Den normaliserade titeln används bara för att jämföra. Sidan visar alltid
// originaltiteln.
//
//   "Författarbesök: Elin Ylvasdotter"            -> "elin ylvasdotter"
//   "Lunchkonsert med Jan Olof Anderson"          -> "jan olof anderson"
//   "Camilla Widell Quartet – på Katalins Backficka" -> "camilla widell quartet katalins backficka"

export const STOPPORD = new Set(["en", "ett", "till", "med", "pa", "i", "och", "for", "av", "the", "a", "of"]);

// Inledningar som bara säger vad för sorts evenemang det är.
const INLEDNINGAR = [
  /^forfattarbesok\s*:/,
  /^forfattarsamtal\s*:/,
  /^konsert\s*:/,
  /^utstalln(ing)?\s*:/,
  /^visning\s*:/,
  /^lunchkonsert\s+med\b/,
  /^premiar\s*:/,
  /^forhandsvisning\s*:/,
];

export function forenkla(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o");
}

// Delar upp i ord. Platsens namn tas bort om det skickas med.
export function titelord(titel, platsnamn = []) {
  let t = forenkla(titel).replace(/&/g, " och ");
  for (const re of INLEDNINGAR) t = t.replace(re, " ");
  t = t
    .replace(/\b(19|20)\d\d\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\blive\b/g, " ");
  let ord = t.split(" ").filter((o) => o && !STOPPORD.has(o));
  const platsord = new Set(
    platsnamn
      .flatMap((p) => forenkla(p).replace(/[^a-z0-9]+/g, " ").split(" "))
      .filter((o) => o.length >= 4 && o !== "uppsala"),
  );
  if (platsord.size) {
    // "Katalins" och "Katalin", "Domkyrkan" och "Domkyrka" räknas som samma ord.
    const arPlatsord = (o) => platsord.has(o) || [...platsord].some((p) => p.length >= 5 && o.startsWith(p) && o.length - p.length <= 2);
    const kvar = ord.filter((o) => !arPlatsord(o));
    if (kvar.length) ord = kvar; // Titeln får inte bli tom.
  }
  return ord;
}

export function normaliseraTitel(titel, platsnamn = []) {
  return titelord(titel, platsnamn).join(" ");
}

// Andel bokstäver som är versaler.
export function andelVersaler(text) {
  const bokstaver = String(text).match(/\p{L}/gu) || [];
  if (!bokstaver.length) return 0;
  return bokstaver.filter((b) => b === b.toUpperCase() && b !== b.toLowerCase()).length / bokstaver.length;
}
