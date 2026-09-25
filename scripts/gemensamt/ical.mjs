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
    }
  }
  return ut;
}
