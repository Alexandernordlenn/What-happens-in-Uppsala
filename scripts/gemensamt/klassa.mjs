// Klassning av evenemang: format, kategori, ålder och barn.
//
// Körs från bygg-sida.mjs, så att allt kan göras om utan att källorna hämtas
// på nytt. Varje uppgift får ett ursprung, och den med högst prioritet vinner:
//
//   rattelse  en rättelse i data/rattelser.json
//   kalla     källan har själv sagt det
//   regel     reglerna här har räknat ut det
//   ai        Claude har fyllt en lucka (data/etiketter.json)
//
// AI fyller bara luckor och skriver aldrig över något annat.

export const FORMAT = ["enstaka", "aterkommande", "utstallning", "speltid", "period", "kurs"];
export const KATEGORIER = ["musik", "scen", "museum", "prat", "aktivitet", "sport", "mat", "natt", "ovrigt"];
const PRIORITET = { rattelse: 4, kalla: 3, regel: 2, ai: 1 };

// Sätter ett värde om det nya ursprunget väger tyngre än det gamla.
export function satt(e, falt, varde, ursprung, faltnamn = falt) {
  if (varde === undefined || varde === null) return e;
  const nu = e.ursprung?.[faltnamn];
  if (nu && e[falt] !== undefined && e[falt] !== null && PRIORITET[nu] > PRIORITET[ursprung]) return e;
  return { ...e, [falt]: varde, ursprung: { ...e.ursprung, [faltnamn]: ursprung } };
}

// Det källan själv har sagt räknas som "kalla".
export function franKallan(e) {
  const ursprung = { ...e.ursprung };
  if (e.kategori && !ursprung.kategori) ursprung.kategori = "kalla";
  if (e.format && !ursprung.format) ursprung.format = "kalla";
  if (e.alder && !ursprung.alder) ursprung.alder = "kalla";
  if (e.barnOchFamilj !== undefined && !ursprung.barn) ursprung.barn = "kalla";
  return { ...e, ursprung };
}

// ---------- Rättelser ----------
//
// data/rattelser.json är valfri. Den skrivs av framtida Claude-sessioner,
// aldrig för hand. Format:
//   {
//     "poster":  { "<källpostens id>": { "kategori": "aktivitet", "format": "kurs", "alder": [3, 6], "barnOchFamilj": true } },
//     "monster": [ { "titel": "^Designlabbet", "kategori": "aktivitet" } ]
//   }

const RATTBART = { kategori: "kategori", format: "format", alder: "alder", barnOchFamilj: "barn" };

export function rattelserFor(e, rattelser) {
  if (!rattelser) return null;
  const direkt = rattelser.poster?.[e.id];
  const monster = (rattelser.monster || []).filter((m) => m.titel && new RegExp(m.titel, "i").test(e.titel));
  if (!direkt && !monster.length) return null;
  return Object.assign({}, ...monster.map(({ titel, ...resten }) => resten), direkt || {});
}

export function tillampaRattelser(e, rattelser) {
  const r = rattelserFor(e, rattelser);
  if (!r) return e;
  let ut = e;
  for (const [falt, namn] of Object.entries(RATTBART)) if (falt in r) ut = satt(ut, falt, r[falt], "rattelse", namn);
  return ut;
}
