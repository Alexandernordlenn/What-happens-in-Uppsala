// Områden och åldrar.
//
// Områdena är Uppsala kommuns indelning, samma som Kubik använder.
// Åldrar sparas som ett spann [från, till] i år, så att källornas olika
// indelningar ("0-4 år", "Barn", "från 7 år") går att jämföra.

export const OMRADEN = [
  { id: "centrum", namn: "Centrala staden", kubik: "Centrala staden" },
  { id: "norra", namn: "Norra staden", kubik: "Norra staden (Gamla Uppsala - Nyby - Svartbäcken - Tunabackar - Librobäck)" },
  { id: "ostra", namn: "Östra staden", kubik: "Östra staden (Kvarngärdet - Gränby - Salabacke - Årsta)" },
  { id: "sodra", namn: "Södra staden", kubik: "Södra staden (Gottsunda - Valsätra - Sunnersta - Sävja)" },
  { id: "vastra", namn: "Västra staden", kubik: "Västra staden (Stenhagen - Flogsta - Håga - Eriksberg)" },
  { id: "norra-land", namn: "Norra landsbygden", kubik: "Norra landsbygden" },
  { id: "ostra-land", namn: "Östra landsbygden", kubik: "Östra landsbygden" },
  { id: "vastra-land", namn: "Västra landsbygden", kubik: "Västra landsbygden" },
];

// Ord i platsnamn som avslöjar området. Första träffen vinner.
const ORD = [
  ["sodra", /gottsunda|valsätra|sunnersta|sävja|ulleråker|bergsbrunna|vilan|nåntuna|ultuna/],
  ["vastra", /stenhagen|flogsta|håga|eriksberg|kåbo|luthagen|rackarberg|norby|polacksbacken/],
  ["ostra", /gränby|kvarngärdet|salabacke|årsta|löten|sala backe|fyrislund|boländerna|ifu arena|husbyborg|vaksala(?! torg)/],
  ["norra", /gamla uppsala|nyby|svartbäcken|tunabackar|librobäck|fyrishov|fyrisgården|svartbäck|ekeby|bärby|kvarnbo/],
  ["norra-land", /salsta|storvreta|vattholma|björklinge|skyttorp|lövstalöt|ramstalund|tobo|läby/],
  ["vastra-land", /bälinge|järlåsa|vänge|ulva kvarn|gåvsta|lövsta|skuttunge|hagby|börje|jumkil/],
  ["ostra-land", /almunge|knutby|rasbo|länna|gunsta|funbo|faringe|stavby|linnés hammarby|alsike/],
];

// Kända platser i centrum (från platstabellen i platser.mjs).
const CENTRUM = new Set([
  "ukk", "katalin", "kaliber", "blackbird", "stadsteatern", "reginateatern", "konstmuseum", "upplandsmuseet",
  "gustavianum", "brorhjorth", "biotopia", "slottshist", "slott", "cube", "botaniska", "studenternas",
  "domkyrkan", "missionskyrkan", "stadsbib", "brygghus", "saluhall", "birgerjarl", "flustret", "humanistiska",
  "parksnackan", "kulturoasen",
]);
const CENTRUMORD = /stadsbiblioteket|läsfabriken|domkyrk|vaksala torg|stora torget|s:t eriks torg|resecentrum|stadshus|nation\b|universitetshuset|musicum|engelska parken|carolina|trefaldighet|sysslomansgatan|storgatan|bangårdsgatan|drottninggatan|kungsgatan|st olofsgatan|köttinspektionen|gillet|drabanten|kaija/;

export function omradeForPlats(namn, id) {
  const text = String(namn || "").toLowerCase();
  for (const [omrade, re] of ORD) if (re.test(text)) return omrade;
  if (CENTRUM.has(id) || CENTRUMORD.test(text)) return "centrum";
  return null;
}

export function omradeFranKubik(etikett) {
  return OMRADEN.find((o) => o.kubik === etikett)?.id || null;
}

// ---------- Åldrar ----------

const HELA = [0, 99];

// "0-4 år", "19-25 år", "För alla åldrar", "Barn", "Ungdom", "Vuxen", "18+ år"
export function spannFranEtikett(etikett) {
  const t = String(etikett).toLowerCase().trim();
  let m = t.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*år/);
  if (m) return [+m[1], +m[2]];
  m = t.match(/(\d{1,2})\s*\+/);
  if (m) return [+m[1], 99];
  if (/alla åldrar/.test(t)) return HELA;
  if (/småbarn|bebis|baby/.test(t)) return [0, 3];
  if (/^barn/.test(t)) return [0, 12];
  if (/ungdom|unga|tonår/.test(t)) return [13, 19];
  if (/vuxen|vuxna/.test(t)) return [18, 99];
  return null;
}

// Letar efter ålder i en titel: "Sagostund 3-6 år", "från 7 år", "för barn 0-2 år".
export function spannFranText(text) {
  const t = String(text || "").toLowerCase();
  let m = t.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*år/);
  if (m && +m[1] <= +m[2]) return [+m[1], +m[2]];
  m = t.match(/från\s*(\d{1,2})\s*år/);
  if (m) return [+m[1], 99];
  return null;
}

// Slår ihop flera spann till ett: [0,4] och [5,6] blir [0,6].
export function slaIhopSpann(lista) {
  const giltiga = lista.filter(Boolean);
  if (!giltiga.length) return null;
  return [Math.min(...giltiga.map((s) => s[0])), Math.max(...giltiga.map((s) => s[1]))];
}
