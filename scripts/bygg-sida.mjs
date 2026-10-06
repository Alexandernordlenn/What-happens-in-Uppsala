// Slår ihop alla källors filer till en fil som sidan läser: data/sida.json.
//
// Körs så här (efter hämtningarna):
//   node scripts/bygg-sida.mjs
//
// Gör tre saker:
//   1. Läser data/<källa>.json för varje källa som finns.
//   2. Slår ihop samma evenemang från flera källor: samma dag, samma plats
//      och samma eller nästan samma titel.
//   3. Skriver ett kompakt format som index.html förstår.

import { readFile, writeFile } from "node:fs/promises";
import { PLATSER } from "./gemensamt/platser.mjs";
import { omradeForPlats, slaIhopSpann, spannFranText } from "./gemensamt/omraden.mjs";
import { franKallan, tillampaRattelser } from "./gemensamt/klassa.mjs";

// Källornas id i filerna och bokstaven sidan använder för dem.
// Ordningen avgör vems titel och kategori som vinner vid en sammanslagning:
// källor med egna kategorier först.
export const KALLOR = [
  { id: "sport", bokstav: "i" },
  { id: "stadsteatern", bokstav: "s" },
  { id: "bibliotek", bokstav: "b" },
  { id: "kubik", bokstav: "u" },
  { id: "svenska-kyrkan", bokstav: "k" },
  { id: "destination-uppsala", bokstav: "d" },
  { id: "ticketmaster", bokstav: "m" },
  { id: "heja", bokstav: "h" },
  { id: "tickster", bokstav: "t" },
];

const DAGAR_FRAMAT = 120; // Sidan visar som mest 90 dagar ("3 mån").
const INAKTUELL_EFTER_DAGAR = 3; // En källa vars data är äldre än så markeras som inaktuell.

// Kort och stabilt id från källpostens id, så att favoriter fungerar dag efter dag.
export function kortId(text) {
  let h = 0x811c9dc5;
  for (const tecken of String(text)) {
    h ^= tecken.codePointAt(0);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36);
}

const KANONISKA = new Set(PLATSER.map((p) => p.id));

// "Gibrish – I spåren av Bob Dylan" och "Gibrish - I spåren av Bob Dylan" ska bli samma.
export function titelnyckel(titel) {
  return String(titel)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function platsnyckel(plats) {
  if (KANONISKA.has(plats.id)) return plats.id;
  return titelnyckel(plats.namn);
}

const datumDel = (s) => String(s || "").slice(0, 10);
const klockslag = (s) => (String(s).length > 10 ? String(s).slice(11, 16) : null);

// Samma titel, eller att den ena börjar med den andra ("Kim Wilde" och "Kim Wilde – Live 2027").
function sammaTitel(a, b) {
  if (a === b) return true;
  const [kort, lang] = a.length < b.length ? [a, b] : [b, a];
  return kort.length >= 8 && lang.startsWith(kort);
}

export function slaIhop(poster) {
  const grupper = new Map(); // "dag|plats" -> lista med sammanslagna evenemang
  for (const p of poster) {
    const nyckel = `${datumDel(p.e.start)}|${platsnyckel(p.e.plats)}`;
    const lista = grupper.get(nyckel) || [];
    const titel = titelnyckel(p.e.titel);
    const tid = klockslag(p.e.start);
    // Bara poster från olika källor slås ihop, så att till exempel en lunch- och en
    // kvällsföreställning hos teatern förblir två. Klockslagen får inte krocka.
    const tidOk = (g) => g.poster.every((q) => !tid || !klockslag(q.e.start) || klockslag(q.e.start) === tid);
    const annanKalla = (g) => !g.poster.some((q) => q.bokstav === p.bokstav);
    // Sportmatcher från förbunden heter annorlunda hos andra källor ("Almtuna-Karlskoga"
    // eller "Fotboll: IK Sirius – AIK"). Samma dag, arena och tid räcker då.
    const sammaMatch = (g) =>
      p.e.kategori === "sport" &&
      g.poster.some((q) => q.e.kategori === "sport") &&
      (p.bokstav === "i" || g.poster.some((q) => q.bokstav === "i"));
    const traff = lista.find(
      (g) => annanKalla(g) && tidOk(g) && (g.titlar.some((t) => sammaTitel(t, titel)) || sammaMatch(g)),
    );
    if (traff) {
      traff.poster.push(p);
      traff.titlar.push(titel);
    } else {
      lista.push({ poster: [p], titlar: [titel] });
    }
    grupper.set(nyckel, lista);
  }
  return [...grupper.values()].flat().map((g) => g.poster);
}

// Gör om en grupp med poster (samma evenemang) till sidans format.
// "kandaOmraden" är platser där någon källa (Kubik) har sagt vilket område de ligger i.
export function tillSidformat(grupp, kandaOmraden = {}) {
  const [forsta] = grupp; // Redan sorterad efter källornas ordning.
  const e = forsta.e;
  const medTid = grupp.find((p) => klockslag(p.e.start));
  const start = medTid ? medTid.e.start : e.start;
  const slut = grupp.map((p) => p.e.slut).filter(Boolean).map(datumDel).sort().pop();
  const noteringar = [...new Set(grupp.map((p) => p.e.notering).filter(Boolean))].filter(
    (n) => !grupp.some((p) => p.e.sport && n === `${p.e.sport}, ${p.e.liga}`),
  );
  if (grupp.some((p) => p.e.installd)) noteringar.unshift("Inställt");

  const ut = {
    id: kortId(e.id || `${e.titel}|${e.start}|${e.plats.namn}`),
    t: e.titel,
    d: datumDel(start),
    v: platsnyckel(e.plats),
    c: e.kategori,
    s: [],
  };
  if (slut && slut > ut.d) ut.e = slut;
  const format = grupp.map((p) => p.e.format).find(Boolean);
  if (format) ut.f = format;
  const dagar = grupp.map((p) => p.e.serie?.dagar).find((d) => d?.length);
  if (dagar && format === "aterkommande") ut.w = dagar;
  if (grupp.some((p) => p.e.heldag)) ut.hd = 1;
  // Sport och liga som en egen etikett. Äldre filer hade dem i noteringen.
  const sport = grupp.find((p) => p.e.sport);
  if (sport) ut.sp = [sport.e.sport, sport.e.liga].filter(Boolean).join(", ");
  const klubb = grupp.find((p) => p.bokstav === "i" && p.e.kallor?.[0]?.biljetter);
  if (klubb) ut.bl = klubb.e.kallor[0].biljetter;
  if (klockslag(start) && !grupp.some((p) => p.e.langvarig)) ut.tm = klockslag(start);
  const rum = grupp.map((p) => p.e.plats.rum).find(Boolean);
  if (rum) ut.r = rum;
  if (noteringar.length) ut.n = noteringar.join(". ");
  if (grupp.some((p) => p.e.gratis === true)) ut.free = 1;
  if (grupp.some((p) => p.e.barnOchFamilj)) ut.fam = 1;
  if (grupp.some((p) => p.e.installd)) ut.x = 1;
  // Ålder: från källorna, annars från titeln ("Sagostund 3-6 år").
  const alder = slaIhopSpann(grupp.map((p) => p.e.alder || spannFranText(p.e.titel)));
  if (alder) ut.a = alder;
  const omrade =
    grupp.map((p) => p.e.omrade).find(Boolean) ||
    omradeForPlats(e.plats.namn, ut.v) ||
    kandaOmraden[titelnyckel(e.plats.namn)];
  if (omrade) ut.o = omrade;
  for (const p of grupp) {
    const lank = p.e.kallor?.[0]?.url;
    const s = `${p.bokstav}:${lank}`;
    if (lank && !ut.s.includes(s)) ut.s.push(s);
  }
  return { ut, platsnamn: e.plats.namn };
}

function idagISverige() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
}

function plusDagar(dag, n) {
  const d = new Date(`${dag}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Äldre sportfiler hade "Ishockey, HockeyAllsvenskan" som notering.
function sportFranNotering(e, bokstav) {
  if (bokstav !== "i" || e.sport || !e.notering) return e;
  const [sport, ...liga] = e.notering.split(", ");
  return { ...e, sport, liga: liga.join(", ") };
}

export function bygg(filer, idag = idagISverige(), { rattelser = null } = {}) {
  const sista = plusDagar(idag, DAGAR_FRAMAT);
  const poster = [];
  const kallinfo = {};
  KALLOR.forEach(({ id, bokstav }, ordning) => {
    const fil = filer[id];
    if (!fil) return;
    kallinfo[bokstav] = { hamtad: fil.hamtad, antal: 0 };
    if (fil.hamtad && String(fil.hamtad).slice(0, 10) < plusDagar(idag, -INAKTUELL_EFTER_DAGAR)) kallinfo[bokstav].inaktuell = 1;
    for (const original of fil.evenemang) {
      const e = tillampaRattelser(franKallan(sportFranNotering(original, bokstav)), rattelser);
      const fran = datumDel(e.start);
      const till = datumDel(e.slut) || fran;
      if (till < idag || fran > sista) continue;
      poster.push({ e, bokstav, ordning });
      kallinfo[bokstav].antal++;
    }
  });
  poster.sort((a, b) => a.ordning - b.ordning);

  // Platser som Kubik har placerat i ett område gäller även för andra källor.
  const kandaOmraden = {};
  for (const p of poster) if (p.e.omrade) kandaOmraden[titelnyckel(p.e.plats.namn)] = p.e.omrade;

  const platser = {};
  const anvanda = new Set();
  const evenemang = slaIhop(poster).map((grupp) => {
    const { ut, platsnamn } = tillSidformat(grupp, kandaOmraden);
    if (!platser[ut.v]) platser[ut.v] = platsnamn;
    // Två olika evenemang får aldrig samma id.
    let id = ut.id;
    for (let n = 2; anvanda.has(id); n++) id = `${ut.id}-${n}`;
    anvanda.add(id);
    ut.id = id;
    return ut;
  });
  evenemang.sort((a, b) => (a.d + (a.tm || "99")).localeCompare(b.d + (b.tm || "99")));
  return { byggd: new Date().toISOString(), idag, kallor: kallinfo, platser, evenemang };
}

async function main() {
  const filer = {};
  for (const { id } of KALLOR) {
    try {
      filer[id] = JSON.parse(await readFile(`data/${id}.json`, "utf8"));
    } catch {
      console.log(`${id}: ingen fil, hoppas över.`);
    }
  }
  let rattelser = null;
  try {
    rattelser = JSON.parse(await readFile("data/rattelser.json", "utf8"));
  } catch {
    // Filen är valfri.
  }
  const sida = bygg(filer, idagISverige(), { rattelser });
  const poster = Object.values(sida.kallor).reduce((s, k) => s + k.antal, 0);
  console.log(`${poster} poster från källorna blev ${sida.evenemang.length} evenemang.`);
  if (!sida.evenemang.length) throw new Error("Inga evenemang alls. Sidan skrivs inte över.");
  await writeFile("data/sida.json", JSON.stringify(sida) + "\n");
  console.log("Sparade data/sida.json.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((fel) => {
    console.error(`::error::${fel.message}`);
    process.exit(1);
  });
}
