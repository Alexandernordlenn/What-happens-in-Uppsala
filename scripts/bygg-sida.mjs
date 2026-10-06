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

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PLATSER, hittaPlats, normaliseraPlats } from "./gemensamt/platser.mjs";
import { tillSvenskTid } from "./gemensamt/tid.mjs";
import { serieDatum } from "./gemensamt/veckodagar.mjs";
import { omradeForPlats, slaIhopSpann, spannFranText } from "./gemensamt/omraden.mjs";
import { klassa, stadaTitel, tillampaEtikett, tillampaRattelser } from "./gemensamt/klassa.mjs";
import { innehallshash } from "./gemensamt/kalltext.mjs";
import { arGenerisk, jamforTitlar, ordfrekvens, titelord } from "./gemensamt/dubbletter.mjs";

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
const dagarMellan = (a, b) => Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
const klockslag = (s) => (String(s).length > 10 ? String(s).slice(11, 16) : null);

// ---------- Dubbletter ----------
//
// Samma evenemang finns ofta hos flera källor. Det slås ihop i sex steg:
//   1. Långvariga poster med samma titel på samma plats och överlappande
//      perioder blir en, oavsett källa. Är någon en utställning blir alla det.
//   2. Samma källa, identiska poster (titel, plats, dag, klockslag) blir en.
//   3. En serie med uträknade datum ("varje lördag") ersätts av en annan
//      källas uttryckliga tillfällen, om den har minst två.
//   4. En speltid eller period ersätts av en annan källas tillfällen med
//      samma titel på samma plats. Länken följer med till tillfällena.
//      Gäller inte utställningar: en visning med klockslag är ett eget evenemang.
//   5. En festival (2–4 dagar) tar upp tillfällen med matchande titel på
//      samma plats under festivalens dagar.
//   6. Huvudregeln: olika källor, samma dag, samma plats eller byggnad,
//      klockslag som skiljer högst 60 minuter och titlar som matchar
//      (se gemensamt/dubbletter.mjs). Sportmatcher: samma dag, arena och tid.
//
// Skydd: aldrig olika platser, aldrig olika nummer ("del 1" och "del 2"),
// aldrig barn och vuxna när båda har känd ålder som inte överlappar, och
// generiska titlar ("Sagostund", "Konsert") kräver samma plats och klockslag.

const minuter = (tm) => (tm ? +tm.slice(0, 2) * 60 + +tm.slice(3, 5) : null);
const nara = (a, b) => !a || !b || Math.abs(minuter(a) - minuter(b)) <= 60;
const overlapparAlder = (a, b) => !a || !b || (a[0] <= b[1] && b[0] <= a[1]);

function forbered(p) {
  const kanonisk = hittaPlats(p.e.plats.namn);
  const platsnamn = [p.e.plats.namn, p.e.plats.rum, kanonisk?.namn].filter(Boolean);
  const dag = datumDel(p.e.start);
  const slutdag = datumDel(p.e.slut) || dag;
  return {
    ...p,
    ord: titelord(p.e.titel, platsnamn),
    dag,
    slutdag,
    tid: klockslag(p.e.start),
    lang: dagarMellan(dag, slutdag) + 1 > 4,
    plats: platsnyckel(p.e.plats),
    hus: kanonisk?.byggnad || platsnyckel(p.e.plats),
  };
}

// En grupp är ett evenemang på sidan: poster från en eller flera källor,
// plus länkar från poster som tagits bort (till exempel en speltid).
const nyGrupp = (p) => ({ poster: [p], extra: [] });

export function slaIhop(allaPoster, logg = []) {
  const poster = allaPoster.map(forbered);
  const sallsynt = ordfrekvens(poster.map((p) => p.ord));
  const titlarMatchar = (a, b) => jamforTitlar(a.ord, b.ord, sallsynt);
  const logga = (regel, grupp, extra = {}) =>
    logg.push({
      regel,
      dag: grupp.poster[0].dag,
      plats: grupp.poster[0].plats,
      kallor: grupp.poster.map((p) => p.bokstav).concat(grupp.extra.map((x) => x.bokstav)),
      titlar: [...new Set(grupp.poster.map((p) => p.e.titel))],
      ...extra,
    });

  // 1. Långvariga
  const langa = [];
  for (const p of poster.filter((p) => p.lang)) {
    const g = langa.find(
      (g) => g.hus === p.hus && p.dag <= g.slutdag && p.slutdag >= g.dag && g.poster.some((q) => titlarMatchar(p, q)),
    );
    if (g) {
      g.poster.push(p);
      if (p.dag < g.dag) g.dag = p.dag;
      if (p.slutdag > g.slutdag) g.slutdag = p.slutdag;
    } else {
      langa.push({ ...nyGrupp(p), hus: p.hus, dag: p.dag, slutdag: p.slutdag });
    }
  }
  for (const g of langa) if (g.poster.length > 1) logga("langvariga", g);

  // 2. Samma källa, identiska poster
  const enstaka = [];
  const sedda = new Map();
  for (const p of poster.filter((p) => !p.lang)) {
    const nyckel = `${p.bokstav}|${p.hus}|${p.dag}|${p.tid}|${p.ord.join(" ")}`;
    const forra = sedda.get(nyckel);
    if (forra) {
      logga("samma-kalla", { poster: [forra, p], extra: [] });
      continue;
    }
    sedda.set(nyckel, p);
    enstaka.push(p);
  }
  const grupper = new Map(enstaka.map((p) => [p, nyGrupp(p)]));
  const borttagna = new Set();
  const lankTill = (p, kalla) => {
    const g = grupper.get(p);
    for (const k of kalla) if (!g.extra.some((x) => x.url === k.url)) g.extra.push(k);
  };
  const lankar = (lista) => lista.map((q) => ({ bokstav: q.bokstav, url: q.e.kallor?.[0]?.url })).filter((x) => x.url);

  // 3. Serier med uträknade datum mot en annan källas uttryckliga tillfällen
  const serier = new Map();
  for (const p of enstaka) if (p.e.serieId && !p.e.serie?.datum) (serier.get(p.e.serieId) || serier.set(p.e.serieId, []).get(p.e.serieId)).push(p);
  for (const [serieId, tillfallen] of serier) {
    const [forsta] = tillfallen;
    const fran = datumDel(forsta.e.serieFran) || forsta.dag;
    const till = datumDel(forsta.e.serieTill) || tillfallen[tillfallen.length - 1].dag;
    const andras = enstaka.filter(
      (q) => q.bokstav !== forsta.bokstav && !q.e.serieId && q.hus === forsta.hus && q.dag >= fran && q.dag <= till && titlarMatchar(forsta, q),
    );
    if (andras.length < 2) continue;
    for (const t of tillfallen) borttagna.add(t);
    for (const q of andras) lankTill(q, lankar([forsta]));
    logga("serie-uttryckliga-datum", { poster: [forsta, ...andras], extra: [] }, { serie: serieId });
  }

  // 4. Speltid eller period mot tillfällen från en annan källa
  const kvarLanga = [];
  for (const g of langa) {
    const format = g.poster.some((p) => p.e.format === "utstallning") ? "utstallning" : g.poster[0].e.format;
    const kallor = new Set(g.poster.map((p) => p.bokstav));
    const tillf =
      format === "speltid" || format === "period"
        ? enstaka.filter(
            (q) => !borttagna.has(q) && !kallor.has(q.bokstav) && q.hus === g.hus && q.dag >= g.dag && q.dag <= g.slutdag &&
              g.poster.some((p) => titlarMatchar(p, q)),
          )
        : [];
    if (tillf.length) {
      for (const q of tillf) lankTill(q, lankar(g.poster));
      logga("speltid-mot-tillfallen", { poster: [...g.poster, tillf[0]], extra: [] }, { tillfallen: tillf.length });
    } else {
      kvarLanga.push(g);
    }
  }

  // 5. Festivaler (2–4 dagar) tar upp sina programpunkter
  const kvar = enstaka.filter((p) => !borttagna.has(p));
  for (const f of kvar.filter((p) => p.slutdag > p.dag)) {
    if (borttagna.has(f)) continue;
    for (const q of kvar) {
      if (q === f || borttagna.has(q) || q.hus !== f.hus || q.dag < f.dag || q.dag > f.slutdag || q.slutdag > f.slutdag) continue;
      if (!titlarMatchar(f, q)) continue;
      const gf = grupper.get(f);
      gf.poster.push(...grupper.get(q).poster);
      gf.extra.push(...grupper.get(q).extra);
      borttagna.add(q);
      logga("festival", gf);
    }
  }

  // 6. Huvudregeln, och sportregeln
  const hinkar = new Map(); // "dag|byggnad" -> grupper
  for (const p of kvar) {
    if (borttagna.has(p)) continue;
    const egen = grupper.get(p);
    const nyckel = `${p.dag}|${p.hus}`;
    const lista = hinkar.get(nyckel) || [];
    const passar = (g) => {
      if (g.poster.some((q) => q.bokstav === p.bokstav)) return false;
      if (!g.poster.every((q) => nara(p.tid, q.tid))) return false;
      if (!g.poster.every((q) => overlapparAlder(p.e.alder, q.e.alder))) return false;
      const sport =
        p.e.kategori === "sport" && g.poster.some((q) => q.e.kategori === "sport") &&
        (p.bokstav === "i" || g.poster.some((q) => q.bokstav === "i")) &&
        g.poster.every((q) => !p.tid || !q.tid || p.tid === q.tid);
      if (sport) return { regel: "sport", poang: 1 };
      for (const q of g.poster) {
        const traff = titlarMatchar(p, q);
        if (!traff) continue;
        // Generiska titlar kräver samma plats (inte bara samma hus) och samma klockslag.
        if ((arGenerisk(p.ord) || arGenerisk(q.ord)) && (p.plats !== q.plats || !p.tid || p.tid !== q.tid)) continue;
        return traff;
      }
      return false;
    };
    let traff = null;
    const g = lista.find((g) => (traff = passar(g)));
    if (g) {
      g.poster.push(...egen.poster);
      g.extra.push(...egen.extra);
      logga(traff.regel, g, { poang: traff.poang });
    } else {
      lista.push(egen);
    }
    hinkar.set(nyckel, lista);
  }

  return [...kvarLanga, ...[...hinkar.values()].flat()].map((g) => ({
    poster: g.poster.sort((a, b) => a.ordning - b.ordning),
    extra: g.extra.filter((x) => !g.poster.some((p) => p.e.kallor?.[0]?.url === x.url)),
  }));
}

// Gör om en grupp med poster (samma evenemang) till sidans format.
// "kandaOmraden" är platser där någon källa (Kubik) har sagt vilket område de ligger i.
export function tillSidformat({ poster: grupp, extra = [] }, kandaOmraden = {}) {
  const [forsta] = grupp; // Redan sorterad efter källornas ordning.
  const e = forsta.e;
  // Sammanslagna långvariga poster och festivaler får tidigaste start. Klockslaget
  // tas från en post som börjar samma dag.
  const forstaDag = grupp.map((p) => datumDel(p.e.start)).sort()[0];
  const medTid = grupp.find((p) => klockslag(p.e.start) && datumDel(p.e.start) === forstaDag);
  const start = medTid ? medTid.e.start : forstaDag;
  const slut = grupp.map((p) => p.e.slut).filter(Boolean).map(datumDel).sort().pop();
  const noteringar = [...new Set(grupp.map((p) => p.e.notering).filter(Boolean))].filter(
    (n) => !grupp.some((p) => p.e.sport && n === `${p.e.sport}, ${p.e.liga}`),
  );
  if (grupp.some((p) => p.e.installd)) noteringar.unshift("Inställt");

  const ut = {
    id: kortId(e.id || `${e.titel}|${e.start}|${e.plats.namn}`),
    t: stadaTitel(e.titel, e.kategori),
    d: datumDel(start),
    v: platsnyckel(e.plats),
    c: e.kategori,
    s: [],
  };
  if (slut && slut > ut.d) ut.e = slut;
  const format = grupp.some((p) => p.e.format === "utstallning") ? "utstallning" : grupp.map((p) => p.e.format).find(Boolean);
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
    grupp.map((p) => hittaPlats(p.e.plats.namn)?.omrade).find(Boolean) ||
    omradeForPlats(e.plats.namn, ut.v) ||
    kandaOmraden[titelnyckel(e.plats.namn)] ||
    grupp.map((p) => omradeFranPostnummer(p.e.fakta?.adress)).find(Boolean);
  if (omrade) ut.o = omrade;
  for (const p of [...grupp.map((p) => ({ bokstav: p.bokstav, url: p.e.kallor?.[0]?.url })), ...extra]) {
    const s = `${p.bokstav}:${p.url}`;
    if (p.url && !ut.s.includes(s)) ut.s.push(s);
  }
  return { ut, platsnamn: e.plats.namn };
}

// Postnummer som säkert hör till ett område. 752 och 754 delas av flera områden.
export function omradeFranPostnummer(adress) {
  const m = String(adress || "").match(/\b(7[45]\d)\s?\d\d\b/);
  if (!m) return null;
  return { 753: "centrum", 755: "norra", 756: "sodra", 757: "sodra", 740: "ostra-land", 741: "ostra-land" }[m[1]] || null;
}

// Kubik skrev tidigare tiderna för perioder som notering. Nu blir de en serie.
const KUBIKNOTERING = /^Återkommande(?:, kl\. [\d:–]+)?\. Se Kubik för vilka dagar\.$/;

// Ett återkommande evenemang blir ett tillfälle per dag inom fönstret.
export function tillfallen(e, fran, till) {
  const forsta = datumDel(e.start);
  const sista = datumDel(e.slut) || forsta;
  const dagar = serieDatum(e.serie, fran > forsta ? fran : forsta, till < sista ? till : sista, forsta);
  return dagar.map((dag) => ({
    ...e,
    id: `${e.id}-${dag}`,
    serieId: e.id,
    serieFran: forsta,
    serieTill: sista,
    start: e.serie.start ? tillSvenskTid(`${dag}T${e.serie.start}`) : dag,
    slut: e.serie.slut ? tillSvenskTid(`${dag}T${e.serie.slut}`) : null,
    langvarig: false,
  }));
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

export function bygg(filer, idag = idagISverige(), { rattelser = null, etiketter = null } = {}) {
  const sista = plusDagar(idag, DAGAR_FRAMAT);
  const poster = [];
  const kallinfo = {};
  const kurser = {};
  let aiAntal = 0;
  KALLOR.forEach(({ id, bokstav }, ordning) => {
    const fil = filer[id];
    if (!fil) return;
    kallinfo[bokstav] = { hamtad: fil.hamtad, antal: 0 };
    if (fil.hamtad && String(fil.hamtad).slice(0, 10) < plusDagar(idag, -INAKTUELL_EFTER_DAGAR)) kallinfo[bokstav].inaktuell = 1;
    for (const original of fil.evenemang) {
      // Platsen normaliseras igen, så att nya rader i platstabellen gäller direkt.
      let e = normaliseraPlats(sportFranNotering(original, bokstav));
      // Ordning: regler, sedan AI i luckorna, sist rättelser (som går före allt).
      e = klassa(e, bokstav);
      e = tillampaEtikett(e, etiketter?.poster?.[original.id], innehallshash(original));
      if (Object.values(e.ursprung || {}).includes("ai")) aiAntal++;
      e = tillampaRattelser(e, rattelser);
      if (KUBIKNOTERING.test(e.notering || "")) e = { ...e, notering: undefined };
      // Kurser visas inte på sidan, men räknas i kvalitetsrapporten.
      if (e.format === "kurs") {
        if ((datumDel(e.slut) || datumDel(e.start)) >= idag) kurser[bokstav] = (kurser[bokstav] || 0) + 1;
        continue;
      }
      const delar = e.format === "aterkommande" && e.serie ? tillfallen(e, idag, sista) : [e];
      for (const del of delar) {
        const fran = datumDel(del.start);
        const till = datumDel(del.slut) || fran;
        if (till < idag || fran > sista) continue;
        poster.push({ e: del, bokstav, ordning });
        kallinfo[bokstav].antal++;
      }
    }
  });
  poster.sort((a, b) => a.ordning - b.ordning);

  // Platser som Kubik har placerat i ett område gäller även för andra källor.
  const kandaOmraden = {};
  for (const p of poster) if (p.e.omrade) kandaOmraden[titelnyckel(p.e.plats.namn)] = p.e.omrade;

  const platser = {};
  const anvanda = new Set();
  const logg = [];
  const evenemang = slaIhop(poster, logg).map((grupp) => {
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
  return { byggd: new Date().toISOString(), idag, kallor: kallinfo, platser, statistik: { kurser, sammanslagna: logg.length, ai: { evenemang: aiAntal } }, evenemang, logg };
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
  let etiketter = null;
  try {
    etiketter = JSON.parse(await readFile("data/etiketter.json", "utf8"));
  } catch {
    // Inga AI-etiketter än. Sidan byggs med bara reglerna.
  }
  const sida = bygg(filer, idagISverige(), { rattelser, etiketter });
  const poster = Object.values(sida.kallor).reduce((s, k) => s + k.antal, 0);
  console.log(`${poster} poster från källorna blev ${sida.evenemang.length} evenemang.`);
  if (!sida.evenemang.length) throw new Error("Inga evenemang alls. Sidan skrivs inte över.");
  // Loggen över sammanslagningar hamnar i kvalitetsrapporten, inte på sidan.
  const { logg, ...utanLogg } = sida;
  await mkdir("tmp", { recursive: true });
  await writeFile("tmp/sammanslagningar.json", JSON.stringify(logg, null, 1) + "\n");
  await writeFile("data/sida.json", JSON.stringify(utanLogg) + "\n");
  console.log("Sparade data/sida.json.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((fel) => {
    console.error(`::error::${fel.message}`);
    process.exit(1);
  });
}
