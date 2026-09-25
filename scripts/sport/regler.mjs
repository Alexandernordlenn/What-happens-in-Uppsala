// Regler för sportmatcher från förbundens och ligornas egna system.
//
// Varje system har sin egen tolkare som ger en lista med matcher i samma form:
//   { system, id, hemma, borta, start, arena, liga, sport, url }
// Sedan behåller vi bara matcher på arenor i Uppsala kommun och gör om dem
// till vanliga evenemang.
//
// Systemen:
//   Sportomedia  – Allsvenskan (fotboll herr)
//   Sportality   – Damallsvenskan, Elitettan (fotboll), SSL (innebandy)
//   Swehockey    – Svenska Ishockeyförbundets schemasidor
//   Profixio     – bandy, basket, handboll, volleyboll

import { avkoda, enRad } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";
import { lasIcal } from "../gemensamt/ical.mjs";

export const KALLA = {
  id: "sport",
  namn: "Förbund och ligor",
  webbsida: "https://www.profixio.com/",
};

// Arenor i Uppsala kommun. Matcher på andra arenor tas inte med.
const UPPSALA_ARENOR =
  /studenternas|gränby ishall|upplands bilforum arena|ifu arena|fyrishov|usif arena|serwenthallen|bolandsskolan|ekebyvallen|österängen|gamla upsala|löten|disken|storvreta|sävja|gottsunda|\buppsala\b/i;

export const iUppsala = (arena) => UPPSALA_ARENOR.test(String(arena || ""));

// ---------- Sportomedia (Allsvenskan) ----------

export const SPORTOMEDIA_FRAGA = (liga, ar) =>
  `{ matchesForLeague(configLeagueName:"${liga}", configSeasonStartYear:${ar}) { matches { id startDate homeTeamName visitingTeamName arenaName status round fogisId } } }`;

export function tolkaSportomedia(svar, { liga, sport, url }) {
  return (svar?.data?.matchesForLeague?.matches || [])
    .filter((m) => m.status !== "FINISHED")
    .map((m) => ({
      system: "sportomedia",
      id: String(m.fogisId || m.id),
      hemma: m.homeTeamName,
      borta: m.visitingTeamName,
      start: m.startDate,
      arena: String(m.arenaName || "").trim(),
      liga,
      sport,
      url,
    }));
}

// ---------- Sportality (Damallsvenskan, Elitettan, SSL) ----------

// Letar upp säsongens id:n i länken "game-schedule?seasonUuid=…" på ligans startsida.
export function hittaSportalityParametrar(html) {
  const m = String(html).match(/game-schedule\?seasonUuid=([\w-]+)&(?:amp;)?seriesUuid=([\w-]+)&(?:amp;)?gameTypeUuid=([\w-]+)/);
  return m ? { seasonUuid: m[1], seriesUuid: m[2], gameTypeUuid: m[3] } : null;
}

export function tolkaSportality(svar, { liga, sport, url }) {
  const namn = (lag) => lag?.names?.long || lag?.names?.full || lag?.names?.short || "";
  return (svar?.gameInfo || [])
    .filter((g) => g.state !== "post-game")
    .map((g) => ({
      system: "sportality",
      id: g.uuid,
      hemma: namn(g.homeTeamInfo),
      borta: namn(g.awayTeamInfo),
      start: g.rawStartDateTime,
      arena: g.venueInfo?.name || "",
      liga,
      sport,
      url,
    }));
}

// ---------- Swehockey (Svenska Ishockeyförbundet) ----------

// Schemat är en tabell. Datumet står bara på första raden för varje dag.
export function tolkaSwehockey(html, { liga, sport, url }) {
  const ut = [];
  let datum = null;
  for (const [, rad] of String(html).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const d = rad.match(/(\d{4}-\d\d-\d\d)/);
    if (d) datum = d[1];
    const tid = rad.match(/class="lnkTooltip"[^>]*title="(\d+)"[^>]*>\s*(\d\d:\d\d)/);
    const celler = [...rad.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => enRad(c[1]));
    const lag = celler.find((c) => / - /.test(c) && !/^\d+ - \d+$/.test(c) && !/^\(/.test(c));
    if (!datum || !tid || !lag) continue;
    const [hemma, borta] = lag.split(" - ").map((x) => x.trim());
    ut.push({
      system: "swehockey",
      id: tid[1],
      hemma,
      borta,
      start: tid[2] === "00:00" ? datum : tillSvenskTid(`${datum}T${tid[2]}`),
      arena: celler[celler.length - 1],
      liga,
      sport,
      url,
      spelad: celler.some((c) => /^\d+ - \d+$/.test(c)),
    });
  }
  return ut.filter((m) => !m.spelad);
}

// ---------- Profixio (bandy, basket, handboll, volleyboll) ----------

// Adressen till lagets kalenderfil står i lagsidans kod, med en signatur.
export function hittaProfixioKalender(html) {
  const m = String(html).match(/calendars\\?\/teams\\?\/(\d+)\\?\/matches\.ics\?signature=([0-9a-f]+)/);
  return m ? `https://www.profixio.com/app/api/calendars/teams/${m[1]}/matches.ics?signature=${m[2]}` : null;
}

export function tolkaProfixioIcal(text, { liga, sport, url }) {
  return lasIcal(text).map((e) => {
    const [hemma, borta] = String(e.titel || "").split(/\s+-\s+/);
    return {
      system: "profixio",
      id: String(e.uid || "").replace(/^pro-mce-/, ""),
      hemma: (hemma || e.titel || "").trim(),
      borta: (borta || "").trim(),
      start: e.start,
      arena: String(e.plats || "").split(",")[0].trim(),
      plats: e.plats,
      liga,
      sport,
      url: e.url || url,
    };
  });
}

const MANADER = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// Bandyns lagsidor saknar kalenderfil, så vi läser sidan. Varje match har
// raderna "Runde 3", "•", ligan, arenan, "Oct 31 • 15:00", hemmalag, tid, bortalag.
// Årtalet står i rubrikerna ovanför ("Oct 31, 2026").
export function tolkaProfixioSida(html, { liga, sport, url }) {
  const utan = String(html)
    .replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, "")
    .replace(/<template x-if="\$data\.match && \(\$data\.match\.hasLivescore[\s\S]*?<\/template>/g, "");
  const L = avkoda(utan.replace(/<[^>]+>/g, "\n"))
    .split("\n")
    .map((r) => r.trim())
    .filter((r) => r && !r.startsWith("<!--"));
  const ut = [];
  const sedda = new Set();
  let ar = null;
  for (let i = 0; i < L.length; i++) {
    const rubrik = L[i].match(/^([A-Z][a-z]{2}) \d{1,2}, (\d{4})$/);
    if (rubrik) ar = +rubrik[2];
    if (!/^(Runde|Round|Omgång) \d+$/.test(L[i]) || !ar) continue;
    const nar = (L[i + 4] || "").match(/^([A-Z][a-z]{2}) (\d{1,2}) • (\d\d:\d\d)$/);
    if (!nar || !L[i + 5] || !L[i + 7]) continue;
    const m = MANADER[nar[1].toLowerCase()];
    const dag = `${ar}-${String(m).padStart(2, "0")}-${nar[2].padStart(2, "0")}`;
    const nyckel = `${dag}|${L[i + 5]}|${L[i + 7]}`;
    if (sedda.has(nyckel)) continue;
    sedda.add(nyckel);
    ut.push({
      system: "profixio",
      id: nyckel,
      hemma: L[i + 5],
      borta: L[i + 7],
      start: nar[3] === "00:00" ? dag : tillSvenskTid(`${dag}T${nar[3]}`),
      arena: L[i + 3],
      liga,
      sport,
      url,
    });
  }
  return ut;
}

// ---------- Till evenemang ----------

const SYSTEMNAMN = {
  sportomedia: "Allsvenskan",
  sportality: "Ligans webbplats",
  swehockey: "Svenska Ishockeyförbundet",
  profixio: "Profixio",
};

// Ligor för damlag. Elitettan och Damallsvenskan är damfotboll.
const DAMLIGA = /\bdam\b|damallsvenskan|elitettan/i;

function medSvenskTid(start) {
  if (!start) return null;
  const s = String(start);
  if (s.length <= 10) return s;
  const svensk = tillSvenskTid(s);
  // 00:00 betyder att tiden inte är bestämd än.
  return svensk && svensk.slice(11, 16) === "00:00" ? svensk.slice(0, 10) : svensk;
}

export function tillEvenemang(m) {
  const start = medSvenskTid(m.start);
  const dag = String(start || "").slice(0, 10);
  const slug = `${m.hemma}-${m.borta}`.toLowerCase().replace(/[^a-z0-9åäö]+/g, "-");
  return {
    id: `sport-${m.system}-${m.id || `${dag}-${slug}`}`.replace(/[^\w-]+/g, "-"),
    // Damlagen heter ofta likadant som herrlagen, så vi skriver ut det.
    titel: (m.borta ? `${m.hemma} – ${m.borta}` : m.hemma) + (DAMLIGA.test(m.liga) && !/\bdam\b/i.test(m.hemma) ? " (dam)" : ""),
    start,
    slut: null,
    plats: { namn: m.arena || "Uppsala", id: `sport-plats-${String(m.arena).toLowerCase().replace(/[^a-z0-9åäö]+/g, "-")}` },
    kategori: "sport",
    gratis: null,
    barnOchFamilj: false,
    notering: `${m.sport}, ${m.liga}`,
    kallor: [{ id: KALLA.id, namn: SYSTEMNAMN[m.system] || KALLA.namn, url: m.url }],
    langvarig: false,
    installd: false,
  };
}

export function bearbeta(matcher, nu = new Date()) {
  const idag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(nu);
  const sedda = new Set();
  return matcher
    .filter((m) => m.start && iUppsala(m.arena || m.plats))
    .map(tillEvenemang)
    .filter((e) => e.start && e.start.slice(0, 10) >= idag)
    .filter((e) => (sedda.has(e.id) ? false : sedda.add(e.id)));
}
