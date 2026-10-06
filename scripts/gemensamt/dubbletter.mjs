// Jämför titlar för att hitta samma evenemang hos olika källor.
//
// Titlarna normaliseras (titel.mjs) och delas i ord. Två titlar räknas som
// samma om något av detta gäller:
//   1. de är lika
//   2. den ena innehåller den andra (alla ord i den kortare finns i den
//      längre), och de har minst två ord gemensamt eller ett ovanligt ord
//      på minst 6 bokstäver
//   3. ordlikheten (Dice) är minst 0,8 och de har ett ovanligt ord gemensamt
//
// Ett ovanligt ord är inget stoppord, har minst 4 bokstäver och finns i färre
// än 1 % av alla titlar.

import { titelord } from "./titel.mjs";

// Titlar som säger för lite för att slås ihop utan samma plats och samma klockslag.
const GENERISKA = new Set([
  "sagostund", "babysagostund", "konsert", "visning", "fredagsmys", "filosofiska samtal", "kortfilmsbio",
  "bokcirkel", "sprakcafe", "lasecirkel", "quiz", "pubquiz", "allsang", "jazzlunch", "lunchkonsert",
  "stadsvandring", "familjevisning", "torsdagsbibblan", "lordagsjazz", "aftonsang", "orgelkonsert",
]);
// Ord som inte gör en titel mindre generisk: åldrar, språk och liknande.
const UTFYLLNAD = /^(barn|ar|aringar|alla|familj|familjen|svenska|engelska|polska|arabiska|persiska|spanska|franska|kinesiska|grekiska|ukrainska|\d+)$/;

export function arGenerisk(ord) {
  const karna = ord.filter((o) => !UTFYLLNAD.test(o)).join(" ");
  return !karna || GENERISKA.has(karna);
}

// Hur ovanligt varje ord är, räknat på alla titlar i bygget.
export function ordfrekvens(listaAvOrd) {
  const antal = new Map();
  for (const ord of listaAvOrd) for (const o of new Set(ord)) antal.set(o, (antal.get(o) || 0) + 1);
  const n = listaAvOrd.length || 1;
  // Ett ord i högst tre titlar räknas alltid som ovanligt, även när det finns få titlar.
  return (o) => o.length >= 4 && !/^\d+$/.test(o) && ((antal.get(o) || 0) <= 3 || (antal.get(o) || 0) / n < 0.01);
}

// Olika nummer betyder olika evenemang: "del 1" och "del 2".
function olikaNummer(a, b) {
  const na = a.filter((o) => /^\d+$/.test(o));
  const nb = b.filter((o) => /^\d+$/.test(o));
  return na.length > 0 && nb.length > 0 && na.join(" ") !== nb.join(" ");
}

// Ger { regel, poang } om titlarna räknas som samma, annars null.
export function jamforTitlar(a, b, sallsynt) {
  if (!a.length || !b.length) return null;
  if (olikaNummer(a, b)) return null;
  if (a.join(" ") === b.join(" ")) return { regel: "lika", poang: 1 };
  const A = new Set(a);
  const B = new Set(b);
  const gemensamma = [...A].filter((o) => B.has(o));
  const ovanliga = gemensamma.filter(sallsynt);
  const [kort, lang] = A.size <= B.size ? [A, B] : [B, A];
  const innehaller = [...kort].every((o) => lang.has(o));
  if (innehaller && (gemensamma.length >= 2 || ovanliga.some((o) => o.length >= 6))) {
    return { regel: "innehaller", poang: Math.round((gemensamma.length / lang.size) * 100) / 100 };
  }
  const dice = (2 * gemensamma.length) / (A.size + B.size);
  if (dice >= 0.8 && ovanliga.length) return { regel: "likhet", poang: Math.round(dice * 100) / 100 };
  return null;
}

export { titelord };
