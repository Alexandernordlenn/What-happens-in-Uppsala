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

import { hittaPlats } from "./platser.mjs";
import { gissaKategori } from "./kategori.mjs";
import { lasVeckodagar } from "./veckodagar.mjs";
import { spannFranText } from "./omraden.mjs";
import { andelVersaler } from "./titel.mjs";

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

// ---------- Regler ----------

const datumDel = (s) => String(s || "").slice(0, 10);
const klockslag = (s) => (String(s || "").length > 10 ? String(s).slice(11, 16) : null);
const dagarMellan = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);

// Antal kalenderdagar evenemanget pågår.
export function langd(e) {
  const fran = datumDel(e.start);
  const till = datumDel(e.slut) || fran;
  return till > fran ? dagarMellan(fran, till) + 1 : 1;
}

// Titlar som betyder visning eller utställning, alltså konst och museum.
const MUSEITITEL = /utställ|exhibition|vernissage|finissage|visning|guidning|guidad|konstvandring/i;
// Titlar som betyder att man gör något själv.
const AKTIVITETSTITEL =
  /sagostund|pyssel|pyssla|verkstad|workshop|brädspel|sällskapsspel|spelkväll|\bspela\b|rollspel|schack|häng(\b|$)|prova på|\byoga\b|\blego\b|designlabb|science lab|makerspace|\bskapa\b|kreativ|lekstund|\blek\b|rytmik|\bbingo\b|\bquiz|kul(\b|$)|skaparläger|skattjakt|teckna|måla\b|sy\b|sömnad|textil|läxhjälp/i;

// Kubiks kategorier till våra. Den första av våra i ORDNING som finns vinner.
function kubikKategori(k, titel) {
  switch (k) {
    case "Musik": return "musik";
    case "Teater": case "Dans": case "Film/Foto": case "Cirkus": return "scen";
    case "Bollsport": case "Ridsport": case "Orientering": case "Issport/Skidsport": case "Kampsport": return "sport";
    case "Litteratur/Skrivande": case "Vetenskap/Samhälle": return "prat";
    case "Workshop/Föreläsning": return /föreläsning|föredrag|samtal/i.test(titel) ? "prat" : "aktivitet";
    case "Museum/Kulturarv": return MUSEITITEL.test(titel) ? "museum" : "aktivitet";
    case "Konst/Skapande": case "Slöjd": case "Djur/Natur": case "Övrigt": return "aktivitet";
    default: return null; // "Kurser" säger inget om kategorin, bara om formatet.
  }
}
const KUBIKORDNING = ["musik", "scen", "sport", "museum", "aktivitet", "prat"];

// Bibliotekets taggar som betyder en aktivitet.
const BIBLIOTEKSAKTIVITET = /^(quiz|spel|rollspel|pyssel|pyssla|sagostund)$/i;

export function klassaKategori(e, bokstav) {
  const titel = e.titel || "";
  let kategori = e.kategori;
  if (bokstav === "u") {
    const vara = (e.fakta?.kategorier || []).map((k) => kubikKategori(k, titel)).filter(Boolean);
    const fran = KUBIKORDNING.find((k) => vara.includes(k));
    if (fran) kategori = fran;
    // Äldre filer utan Kubiks egna kategorier: konst och skapande låg då under museum.
    else if (!e.fakta && (kategori === "museum" || kategori === "ovrigt") && !MUSEITITEL.test(titel)) kategori = "aktivitet";
  }
  if (bokstav === "b" && (e.fakta?.taggar || []).some((t) => BIBLIOTEKSAKTIVITET.test(t)) && ["ovrigt", "prat"].includes(kategori)) {
    kategori = "aktivitet";
  }
  // Barnverkstäder, spel och sagostunder är aktiviteter, inte museum, föredrag eller övrigt.
  // En visning med verkstad för familjer räknas också som aktivitet.
  const verkstad = /verkstad|workshop|pyssel/i.test(titel);
  if (["ovrigt", "prat", "museum"].includes(kategori) && AKTIVITETSTITEL.test(titel) && (verkstad || !MUSEITITEL.test(titel))) kategori = "aktivitet";
  // Film hör till scen och film, även när källan kallar det konst.
  if (kategori === "museum" && /kortfilm|filmfestival|\bfilm\b|\bbio\b/i.test(titel) && !MUSEITITEL.test(titel)) kategori = "scen";
  // Övrigt är sista utvägen. Pröva texten en gång till med de nya reglerna.
  if (kategori === "ovrigt") kategori = gissaKategori(titel, "ovrigt");
  return kategori;
}

// ---------- Format ----------

const KURSORD = /kurs(er|en)?\b|\btermin|anmälan krävs|nybörjarkurs|kulturis|undervisning|skridskoskola/i;
const SCENPLATSER = new Set(["ukk"]);
const MUSEIPLATS = /museum|museet|konsthall|galleri|konstnärsklubb|bror hjorth|gustavianum|biotopia|cube of art|slottshistoriska/i;
// Långvariga saker på museer som inte är utställningar: lovaktiviteter, verkstäder, tävlingar.
const INTE_UTSTALLNING = /lov(et)?\b|verkstad|läger|workshop|pyssel|tävling|skattjakt|byte|bio\b|pop ?up|öppet|visning|vandring|kul\b|night|kväll|festival/i;

function platsInfo(e) {
  const p = hittaPlats(e.plats?.namn) || null;
  return { kanonisk: p, scen: SCENPLATSER.has(e.plats?.id) || p?.kategori === "scen", museum: p?.kategori === "museum" || MUSEIPLATS.test(e.plats?.namn || "") };
}

// Kubik skrev tidigare tiderna för perioder i noteringen.
const KUBIKNOTERING = /^Återkommande(?:, kl\. (\d\d:\d\d)(?:–(\d\d:\d\d))?)?\. Se Kubik för vilka dagar\.$/;

export function tiderFor(e) {
  const t = e.fakta?.tider || (() => {
    const m = String(e.notering || "").match(KUBIKNOTERING);
    return m && m[1] ? { start: m[1], slut: m[2] || null } : null;
  })();
  return stadaTider(t);
}

// En sluttid före eller lika med starttiden tas bort. 00:00–23:59 betyder hela dagen.
export function stadaTider(t) {
  if (!t?.start) return null;
  if (t.start === "00:00" && (!t.slut || t.slut >= "23:59")) return { heldag: true };
  return t.slut && t.slut > t.start ? { start: t.start, slut: t.slut } : { start: t.start };
}

export function klassaFormat(e) {
  const titel = e.titel || "";
  const n = langd(e);
  if (n <= 4) return { format: "enstaka" };

  // 1. Kurs: längre än 14 dagar och källan eller titeln säger att det är en kurs.
  const kallanKurs = (e.fakta?.kategorier || []).includes("Kurser");
  if (n > 14 && (kallanKurs || KURSORD.test(titel.replace(/årskurs/gi, "")))) return { format: "kurs" };

  // 2. Återkommande: dagarna går att läsa ut ur titeln eller ur fakta från källan.
  const tider = tiderFor(e);
  const franTitel = lasVeckodagar(titel);
  const dagar = franTitel?.dagar || e.fakta?.dagar;
  if (dagar?.length) {
    const serie = { dagar, ...(franTitel?.varannan && { varannan: true }), ...(franTitel?.veckor && { veckor: franTitel.veckor }) };
    const start = franTitel?.start || tider?.start;
    const slut = franTitel?.slut || tider?.slut;
    if (start) serie.start = start;
    if (slut) serie.slut = slut;
    return { format: "aterkommande", serie };
  }

  // 3. Utställning.
  const plats = platsInfo(e);
  if (/vernissage|finissage/i.test(titel)) return { format: "enstaka" };
  // Källan har själv sagt "utställning" eller "konst och museum" (kategori museum från källan).
  const kallanMuseum = e.kategori === "museum" && e.ursprung?.kategori === "kalla";
  if (/utställ|exhibition/i.test(titel) || ((plats.museum || kallanMuseum) && e.kategori === "museum" && !INTE_UTSTALLNING.test(titel))) {
    return { format: "utstallning" };
  }

  // 4. Speltid: en uppsättning på en scen. Kyrkor räknas inte. Festivaler och
  // lovprogram är inga uppsättningar.
  if (plats.scen && e.kategori === "scen" && !/festival|lov(et)?\b|bio\b|läger/i.test(titel)) return { format: "speltid" };

  // 5. Allt annat långvarigt.
  return { format: "period" };
}

// ---------- Ålder och barn ----------

// Ålder som står i titeln ("Siriklubban 7-14 år") är säkrare än källans
// målgrupper ("7-9 år", "10-12 år", "13-15 år"), så titeln går först.
export function klassaAlder(e) {
  return spannFranText(e.titel) || e.alder || null;
}

// ---------- Titlar ----------

// Förkortningar som ska behålla sina versaler.
const FORKORTNINGAR = new Set(["UKK", "IFU", "SSL", "AIK", "IK", "HC", "DJ", "IF", "BK", "FC", "IBK", "SK", "HK", "VBS", "BOIS", "GIF", "OD", "UAK", "USIF", "KFUM", "4H", "SM", "VM", "EM", "AI"]);

export function stadaTitel(titel, kategori) {
  let t = String(titel || "");
  const bokstaver = (t.match(/\p{L}/gu) || []).length;
  if (bokstaver >= 8 && andelVersaler(t) > 0.6) {
    let forsta = true;
    t = t.replace(/[\p{L}\d]+/gu, (ord) => {
      const ut = FORKORTNINGAR.has(ord.toUpperCase()) ? ord.toUpperCase() : forsta ? ord[0].toUpperCase() + ord.slice(1).toLowerCase() : ord.toLowerCase();
      forsta = false;
      return ut;
    });
  }
  // "Sirius vs Hagunda" -> "Sirius – Hagunda"
  if (kategori === "sport") t = t.replace(/\s+(vs\.?|mot)\s+/i, " – ");
  return t;
}

// ---------- AI-etiketter ----------
//
// Godkända svar från Claude (data/etiketter.json). De fyller bara luckor:
// kategori bara om den är "ovrigt", format bara om det är "period", ålder
// bara om den saknas. De gäller bara om innehållet är oförändrat (hash).

export function tillampaEtikett(e, etikett, hash) {
  if (!etikett || etikett.hash !== hash) return e;
  let ut = e;
  const ai = (falt, namn = falt) => ({ ...ut.ursprung, [namn]: "ai" });
  if (etikett.kategori && ut.kategori === "ovrigt") ut = { ...ut, kategori: etikett.kategori, ursprung: ai("kategori") };
  if (etikett.format && ut.format === "period") {
    ut = { ...ut, format: etikett.format, ursprung: ai("format") };
    if (etikett.format === "aterkommande" && etikett.serie?.dagar?.length) ut = { ...ut, serie: etikett.serie };
    if (etikett.format === "aterkommande" && !ut.serie) ut = { ...ut, format: "period" };
  }
  if (etikett.alder && !ut.alder) {
    ut = { ...ut, alder: etikett.alder, ursprung: ai("alder") };
    if (etikett.alder[1] <= 15 && !ut.barnOchFamilj) ut = { ...ut, barnOchFamilj: true };
  }
  if (etikett.barnOchFamilj === true && !ut.barnOchFamilj) ut = { ...ut, barnOchFamilj: true, ursprung: ai("barnOchFamilj", "barn") };
  return ut;
}

// ---------- Allt på en gång ----------

export function klassa(e, bokstav) {
  let ut = franKallan(e);
  // Kategorin vi läser ut från källans egna kategorier och titeln ersätter
  // källfilens. Bara en rättelse går före (den läggs på efteråt).
  const kategori = klassaKategori(ut, bokstav);
  if (kategori !== ut.kategori) ut = { ...ut, kategori, ursprung: { ...ut.ursprung, kategori: "regel" } };
  const { format, serie } = klassaFormat(ut);
  ut = satt(ut, "format", format, "regel");
  if (serie && ut.format === "aterkommande" && !ut.serie) ut = { ...ut, serie };
  const alder = klassaAlder(ut);
  if (alder && JSON.stringify(alder) !== JSON.stringify(ut.alder)) ut = { ...ut, alder, ursprung: { ...ut.ursprung, alder: "regel" } };
  // Övre åldersgräns högst 15 betyder barn och familj. Att källan inte sa det
  // räknas inte som att den sa nej.
  if (ut.alder && ut.alder[1] <= 15 && !ut.barnOchFamilj) ut = { ...ut, barnOchFamilj: true, ursprung: { ...ut.ursprung, barn: "regel" } };
  // Klockslag 00:00 till 23:59 är hela dagen.
  if (klockslag(ut.start) === "00:00" && (!ut.slut || ["23:59", "00:00"].includes(klockslag(ut.slut)))) {
    ut = { ...ut, start: datumDel(ut.start), heldag: true };
  }
  if (ut.slut && klockslag(ut.slut) && klockslag(ut.start) && datumDel(ut.slut) === datumDel(ut.start) && klockslag(ut.slut) <= klockslag(ut.start)) {
    ut = { ...ut, slut: null };
  }
  return ut;
}
