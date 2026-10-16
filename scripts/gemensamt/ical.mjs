// Läser kalenderfiler (iCal, .ics), som många klubbar, arenor och system erbjuder.
//
// En kalenderfil är vanlig text där varje evenemang ligger mellan
// BEGIN:VEVENT och END:VEVENT, med rader som SUMMARY:Titel och
// DTSTART:20261003T160000Z. Långa rader fortsätter på nästa rad efter ett mellanslag.

import { tillSvenskTid } from "./tid.mjs";

function avkodaVarde(v) {
  return v.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\").trim();
}

// "20261003T160000Z" -> "2026-10-03T18:00:00+02:00", "20261003" -> "2026-10-03"
function tolkaTid(varde, parametrar) {
  const m = varde.match(/^(\d{4})(\d\d)(\d\d)(?:T(\d\d)(\d\d)(\d\d)?(Z)?)?$/);
  if (!m) return null;
  const [, ar, man, dag, h, min, s, z] = m;
  if (!h || /VALUE=DATE(?!-)/.test(parametrar)) return `${ar}-${man}-${dag}`;
  const text = `${ar}-${man}-${dag}T${h}:${min}:${s || "00"}${z ? "Z" : ""}`;
  // Tider utan Z är lokala. Vi utgår från svensk tid (TZID=Europe/Stockholm).
  return tillSvenskTid(text);
}

export function lasIcal(text) {
  const rader = String(text).replace(/\r\n?/g, "\n").replace(/\n[ \t]/g, "").split("\n");
  const ut = [];
  let ev = null;
  for (const rad of rader) {
    if (rad === "BEGIN:VEVENT") ev = {};
    else if (rad === "END:VEVENT") {
      if (ev) ut.push(ev);
      ev = null;
    } else if (ev) {
      const i = rad.indexOf(":");
      if (i < 0) continue;
      const [namn, ...parametrar] = rad.slice(0, i).split(";");
      const varde = rad.slice(i + 1);
      const p = parametrar.join(";");
      if (namn === "UID") ev.uid = varde.trim();
      else if (namn === "SUMMARY") ev.titel = avkodaVarde(varde);
      else if (namn === "LOCATION") ev.plats = avkodaVarde(varde);
      else if (namn === "DESCRIPTION") ev.beskrivning = avkodaVarde(varde);
      else if (namn === "URL") ev.url = varde.trim();
      else if (namn === "CATEGORIES") ev.kategorier = avkodaVarde(varde).split(",").map((k) => k.trim());
      else if (namn === "STATUS") ev.status = varde.trim();
      else if (namn === "DTSTART") ev.start = tolkaTid(varde.trim(), p);
      else if (namn === "DTEND") ev.slut = tolkaTid(varde.trim(), p);
      else if (namn === "RRULE") ev.upprepning = varde.trim();
      else if (namn === "EXDATE") (ev.undantag ||= []).push(...varde.split(",").map((v) => tolkaTid(v.trim(), p)).filter(Boolean));
      else if (namn === "X-TAGS") ev.taggar = avkodaVarde(varde).split(",").map((k) => k.trim()).filter(Boolean);
    }
  }
  return ut;
}

// ---------- Upprepningar ----------
//
// Ett evenemang som återkommer varje vecka står bara en gång i filen, med en
// regel: RRULE:FREQ=WEEKLY;BYDAY=SA;UNTIL=20270427T235959Z. Här räknas de
// riktiga datumen ut mellan fran och till (ÅÅÅÅ-MM-DD), utan undantagen
// (EXDATE). Bara veckovisa regler stöds. Andra ger null, så att den som
// anropar kan hoppa över evenemanget i stället för att gissa.

const VECKODAG = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const DAG_MS = 86400000;
const plusDag = (dag, n) => new Date(Date.parse(`${dag}T12:00:00Z`) + n * DAG_MS).toISOString().slice(0, 10);
const veckodag = (dag) => new Date(`${dag}T12:00:00Z`).getUTCDay();

export function datumFranRegel(ev, fran, till) {
  const regel = Object.fromEntries(
    String(ev?.upprepning || "").split(";").filter(Boolean).map((del) => del.split("=").map((x) => x.trim().toUpperCase())),
  );
  if (regel.FREQ !== "WEEKLY") return null;
  const forsta = String(ev.start || "").slice(0, 10);
  if (!/^\d{4}-\d\d-\d\d$/.test(forsta)) return null;
  const dagar = regel.BYDAY ? regel.BYDAY.split(",").map((d) => VECKODAG[d.slice(-2)]) : [veckodag(forsta)];
  if (dagar.some((d) => d === undefined)) return null;
  const intervall = Math.max(1, +(regel.INTERVAL || 1));
  const antal = regel.COUNT ? +regel.COUNT : Infinity;
  const sista = regel.UNTIL ? String(tolkaTid(regel.UNTIL, "") || "").slice(0, 10) : null;
  const undantag = new Set((ev.undantag || []).map((d) => String(d).slice(0, 10)));
  // Veckorna räknas från måndagen i första veckan.
  const mandag = plusDag(forsta, -((veckodag(forsta) + 6) % 7));
  const slutdag = sista && sista < till ? sista : till;
  const ut = [];
  let raknade = 0;
  for (let dag = forsta; dag <= slutdag && raknade < antal; dag = plusDag(dag, 1)) {
    const vecka = Math.floor((Date.parse(dag) - Date.parse(mandag)) / (7 * DAG_MS));
    if (vecka % intervall !== 0 || !dagar.includes(veckodag(dag))) continue;
    raknade++;
    if (dag >= fran && !undantag.has(dag)) ut.push(dag);
  }
  return ut;
}
