// Provkör Ticksters API och berättar vad som finns i Uppsala kommun.
//
// Körs av workflowet "Prova Tickster-API" (för hand under Actions), där
// hemligheten TICKSTER_API_KEY finns. Sparar ingenting och ändrar inget på
// sidan, utan skriver bara en rapport i körningens sammanfattning och logg.
// Nyckeln skrivs aldrig ut.
//
//   TICKSTER_API_KEY=... node scripts/tickster/prova-api.mjs

import { appendFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { USER_AGENT } from "../gemensamt/webb.mjs";
import { DUMP, SOK, platsIKommunen, tolkaDump, tolkaSok } from "./api.mjs";

const nyckel = process.env.TICKSTER_API_KEY;
const rader = [];
const skriv = (text = "") => {
  rader.push(text);
  console.log(text);
};
const idag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
const plusDagar = (dag, n) => new Date(Date.parse(`${dag}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const topp = (lista, n = 15) =>
  Object.entries(lista.reduce((r, x) => ((r[x] = (r[x] || 0) + 1), r), {}))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

async function anrop(adress, rubriker = {}) {
  const svar = await fetch(adress, { headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...rubriker } });
  const grans = ["x-ratelimit-limit", "x-ratelimit-remaining", "x-ratelimit-reset"].map((n) => `${n}=${svar.headers.get(n) ?? "–"}`).join(", ");
  return { svar, grans };
}

async function provaDumpen() {
  skriv("## 1. Event Dump API (hela utbudet)");
  const { svar, grans } = await anrop(DUMP(nyckel));
  skriv(`Svar: ${svar.status} ${svar.statusText}. Begränsning: ${grans}`);
  if (!svar.ok) {
    skriv(`Fel: ${(await svar.text()).slice(0, 300)}`);
    return;
  }
  const info = await svar.json();
  skriv(`Dumpens id: ${info.id}, skapad: ${info.created}`);
  const fil = Buffer.from(await (await fetch(info.uri)).arrayBuffer());
  const dump = JSON.parse((fil[0] === 0x1f && fil[1] === 0x8b ? gunzipSync(fil) : fil).toString("utf8"));
  const evenemang = dump.events || [];
  const platser = new Map((dump.venues || []).map((v) => [v.id, v]));
  skriv(`Hela Sverige: ${evenemang.length} evenemang och ${platser.size} platser.`);
  skriv(`Fält i ett evenemang: ${Object.keys(evenemang[0] || {}).join(", ")}`);
  skriv(`Fält i en plats: ${Object.keys(dump.venues?.[0] || {}).join(", ")}`);

  const iKommunen = evenemang.filter((ev) => platsIKommunen(platser.get(ev.venueId)));
  const kommande = tolkaDump(dump, idag);
  skriv("");
  skriv(`**Uppsala kommun: ${iKommunen.length} poster, ${kommande.length} kommande evenemang efter våra regler.**`);
  const datum = kommande.map((e) => e.start.slice(0, 10)).sort();
  if (datum.length) skriv(`Från ${datum[0]} till ${datum.at(-1)}.`);
  skriv("");
  skriv("Platser (antal evenemang):");
  for (const [namn, n] of topp(kommande.map((e) => e.plats.namn), 40)) skriv(`- ${namn}: ${n}`);
  skriv("");
  skriv(`Våra kategorier: ${topp(kommande.map((e) => e.kategori)).map(([k, n]) => `${k} ${n}`).join(", ")}`);
  skriv(`Vanligaste taggarna: ${topp(kommande.flatMap((e) => e.fakta?.taggar || []), 25).map(([k, n]) => `${k} (${n})`).join(", ")}`);
  skriv(`Utan klockslag: ${kommande.filter((e) => e.start.length <= 10).length}. Inställda: ${kommande.filter((e) => e.installd).length}. Barn och familj: ${kommande.filter((e) => e.barnOchFamilj).length}.`);
  skriv("");
  skriv("De första 25:");
  for (const e of kommande.sort((a, b) => a.start.localeCompare(b.start)).slice(0, 25)) {
    skriv(`- ${e.start.slice(0, 16).replace("T", " ")} | ${e.titel} | ${e.plats.namn} | ${e.kategori}`);
  }
  // Orter i närheten som filtrerades bort, för att se att kommungränsen fungerar.
  const utanfor = evenemang
    .map((ev) => platser.get(ev.venueId))
    .filter((v) => v && !platsIKommunen(v) && /uppsala|storvreta|knivsta|enköping|östhammar|tierp|heby/i.test(`${v.city} ${v.name}`));
  skriv("");
  skriv(`Bortfiltrerade platser nära Uppsala: ${topp(utanfor.map((v) => `${v.name} (${v.city})`), 15).map(([k, n]) => `${k}: ${n}`).join("; ") || "inga"}`);
}

async function provaEventApi() {
  skriv("");
  skriv("## 2. Event API v1.0 (den närmaste veckan)");
  const { svar, grans } = await anrop(SOK("uppsala", 0), { "x-api-key": nyckel });
  skriv(`Svar: ${svar.status} ${svar.statusText}. Begränsning: ${grans}`);
  if (!svar.ok) {
    skriv(`Fel: ${(await svar.text()).slice(0, 300)}`);
    return;
  }
  const data = await svar.json();
  const items = data.items || [];
  skriv(`Sökningen "uppsala": ${items.length} poster på första sidan${data.totalItems !== undefined ? ` av ${data.totalItems}` : ""}.`);
  skriv(`Fält i svaret: ${Object.keys(data).join(", ")}. Fält i en post: ${Object.keys(items[0] || {}).join(", ")}`);
  const veckan = tolkaSok(data, idag, plusDagar(idag, 7));
  skriv(`I kommunen de närmaste 7 dagarna (första sidan): ${veckan.length}.`);
  for (const e of veckan.slice(0, 10)) skriv(`- ${e.start.slice(0, 16).replace("T", " ")} | ${e.titel} | ${e.plats.namn}`);
}

async function main() {
  skriv(`# Prova Tickster-API (${idag})`);
  if (!nyckel) {
    skriv("Hemligheten TICKSTER_API_KEY saknas. Lägg in den under Settings → Secrets and variables → Actions.");
    process.exitCode = 1;
  } else {
    skriv("Nyckeln finns (den skrivs inte ut).");
    for (const prov of [provaDumpen, provaEventApi]) {
      try {
        await prov();
      } catch (fel) {
        skriv(`Fel: ${fel.message}`);
        process.exitCode = 1;
      }
    }
  }
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, rader.join("\n") + "\n");
}

main();
