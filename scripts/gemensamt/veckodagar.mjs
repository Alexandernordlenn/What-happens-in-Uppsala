// Läser ut veckodagar och klockslag ur svensk text.
//
//   "varje lördag kl. 11–15"        -> { dagar: ["lö"], start: "11:00", slut: "15:00" }
//   "tisdagar och torsdagar"        -> { dagar: ["ti", "to"] }
//   "mån–fre 10.00–16.00"           -> { dagar: ["må", "ti", "on", "to", "fr"], start: "10:00", slut: "16:00" }
//   "Familjelördagar", "Onsdagshäng" -> { dagar: ["lö"] } och { dagar: ["on"] }
//   "varannan onsdag"               -> { dagar: ["on"], varannan: true }
//   "jämna veckor"                  -> { ..., veckor: "jamna" }
//
// Används för att göra ett långvarigt evenemang till ett återkommande med
// kända dagar. Hittar tolken inga dagar ger den null. Den gissar aldrig.

export const DAGKODER = ["må", "ti", "on", "to", "fr", "lö", "sö"];
const NAMN = ["måndag", "tisdag", "onsdag", "torsdag", "fredag", "lördag", "söndag"];
const KORT = ["mån", "tis", "ons", "tor", "fre", "lör", "sön"];

// En dag skriven på något av sätten: "lördag", "lördagar", "lördags", "lör".
const DAG = `(${NAMN.join("|")})(?:ar(?:na)?|en|s)?|(${KORT.join("|")})\\.?`;

function kod(ord) {
  const o = ord.toLowerCase();
  const i = NAMN.findIndex((n) => o.startsWith(n));
  if (i >= 0) return DAGKODER[i];
  const j = KORT.findIndex((k) => o.startsWith(k));
  return j >= 0 ? DAGKODER[j] : null;
}

function intervall(fran, till) {
  const a = DAGKODER.indexOf(fran);
  const b = DAGKODER.indexOf(till);
  if (a < 0 || b < 0 || b < a) return [];
  return DAGKODER.slice(a, b + 1);
}

const tid = (h, m) => `${String(h).padStart(2, "0")}:${m || "00"}`;

// "kl. 11–15", "11.00–15.00", "kl 11:00-15:00", "kl. 18"
export function lasKlockslag(text) {
  const t = String(text || "");
  let m = t.match(/(?:\bkl\.?\s*)?\b(\d{1,2})(?:[.:](\d{2}))?\s*[-–]\s*(\d{1,2})(?:[.:](\d{2}))?\b/i);
  if (m && (/kl/i.test(m[0]) || m[2] || m[4]) && +m[1] < 24 && +m[3] < 25) {
    const start = tid(m[1], m[2]);
    const slut = tid(m[3], m[4]);
    return slut > start ? { start, slut } : { start };
  }
  m = t.match(/\bkl\.?\s*(\d{1,2})(?:[.:](\d{2}))?/i);
  if (m && +m[1] < 24) return { start: tid(m[1], m[2]) };
  return null;
}

export function lasVeckodagar(text) {
  const t = String(text || "").toLowerCase();
  const dagar = new Set();

  // "mån–fre", "måndag till fredag", "måndag-fredag"
  for (const m of t.matchAll(new RegExp(`(${DAG})\\s*(?:[-–]|till)\\s*(${DAG})`, "g"))) {
    intervall(kod(m[1]), kod(m[4])).forEach((d) => dagar.add(d));
  }
  if (/\bvardagar\b/.test(t)) intervall("må", "fr").forEach((d) => dagar.add(d));
  if (/\b(helger|helgerna|varje helg)\b/.test(t)) ["lö", "sö"].forEach((d) => dagar.add(d));

  // "varje lördag", "lördagar", "på lördagarna", "lördags- och söndagsöppet",
  // och sammansatta ord som "Familjelördagar", "Onsdagshäng", "Torsdagskul".
  for (const m of t.matchAll(new RegExp(`(?:^|[^a-zåäö])(?:varje|varannan|alla)\\s+(${NAMN.join("|")})`, "g"))) dagar.add(kod(m[1]));
  for (const m of t.matchAll(new RegExp(`(${NAMN.join("|")})(ar(na)?|s-|s(?=[a-zåäö]{2,}))`, "g"))) dagar.add(kod(m[1]));
  // "Brädspelsfredag": dagen sist i ett sammansatt ord.
  for (const m of t.matchAll(new RegExp(`[a-zåäö](${NAMN.join("|")})(?![a-zåäö])`, "g"))) dagar.add(kod(m[1]));

  if (!dagar.size) return null;
  const ut = { dagar: DAGKODER.filter((d) => dagar.has(d)) };
  if (/varannan\s+(vecka|måndag|tisdag|onsdag|torsdag|fredag|lördag|söndag)/.test(t)) ut.varannan = true;
  if (/jämna veckor/.test(t)) ut.veckor = "jamna";
  if (/udda veckor/.test(t)) ut.veckor = "udda";
  const klocka = lasKlockslag(t);
  if (klocka) Object.assign(ut, klocka);
  return ut;
}

// ---------- Datum för en serie ----------

const plusDagar = (dag, n) => {
  const d = new Date(`${dag}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
// Måndag = 0 ... söndag = 6
const veckodagIndex = (dag) => (new Date(`${dag}T12:00:00Z`).getUTCDay() + 6) % 7;

export function isoVecka(dag) {
  const d = new Date(`${dag}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); // torsdagen samma vecka avgör året
  const jan4 = new Date(Date.UTC(d.getUTCFullYear(), 0, 4, 12));
  const mandagVecka1 = jan4.getTime() - ((jan4.getUTCDay() + 6) % 7) * 86400000;
  return 1 + Math.floor((d.getTime() - mandagVecka1) / (7 * 86400000));
}

// Alla datum mellan fran och till (båda med) då serien händer.
// Uttryckliga datum används som de är. Annars räknas veckodagarna fram.
export function serieDatum(serie, fran, till, forsta = fran) {
  if (serie?.datum?.length) return serie.datum.filter((d) => d >= fran && d <= till);
  if (!serie?.dagar?.length) return [];
  const ut = [];
  const startvecka = Math.floor((Date.parse(forsta) - Date.parse("2024-01-01")) / (7 * 86400000));
  for (let dag = fran; dag <= till; dag = plusDagar(dag, 1)) {
    if (!serie.dagar.includes(DAGKODER[veckodagIndex(dag)])) continue;
    if (serie.varannan) {
      const vecka = Math.floor((Date.parse(dag) - Date.parse("2024-01-01")) / (7 * 86400000));
      if ((vecka - startvecka) % 2 !== 0) continue;
    }
    if (serie.veckor === "jamna" && isoVecka(dag) % 2 !== 0) continue;
    if (serie.veckor === "udda" && isoVecka(dag) % 2 !== 1) continue;
    ut.push(dag);
  }
  return ut;
}
