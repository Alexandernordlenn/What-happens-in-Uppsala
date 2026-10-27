// Provkör Billettos API och berättar vad nyckeln ger tillgång till.
//
// Körs av workflowet "Prova Billetto-API" (för hand under Actions), där
// hemligheten BILLETTO_API_KEY finns (id:secret). Sparar ingenting och ändrar
// inget på sidan, utan skriver bara en rapport. Nyckeln skrivs aldrig ut.

import { appendFile } from "node:fs/promises";
import { USER_AGENT } from "../gemensamt/webb.mjs";

const nyckel = (process.env.BILLETTO_API_KEY || "").trim();
const rader = [];
const skriv = (t = "") => {
  rader.push(t);
  console.log(t);
};
const topp = (lista, n = 15) =>
  Object.entries(lista.reduce((r, x) => ((r[x] = (r[x] || 0) + 1), r), {})).sort((a, b) => b[1] - a[1]).slice(0, n);

async function anrop(adress) {
  const svar = await fetch(adress, { headers: { "User-Agent": USER_AGENT, Accept: "application/json", "Api-Keypair": nyckel } });
  const text = await svar.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: svar.status, json, text };
}

// Plockar ut stad och namn på platsen, oavsett hur Billetto har lagt fälten.
const plats = (ev) => {
  const l = ev.location || ev.venue || {};
  return [l.name || l.location_name || "", l.city || l.postal_city || l.address?.city || "", l.postal_code || l.zip || ""].filter(Boolean).join(", ");
};

async function prova(namn, adress) {
  skriv("");
  skriv(`## ${namn}`);
  const { status, json, text } = await anrop(adress);
  skriv(`Svar: ${status}`);
  if (status >= 400 || !json) {
    skriv(`Meddelande: ${text.slice(0, 300)}`);
    return null;
  }
  const lista = json.data || json.events || json.results || (Array.isArray(json) ? json : []);
  skriv(`Fält i svaret: ${Object.keys(json).join(", ")}. Antal på första sidan: ${lista.length}.${json.total !== undefined ? ` Totalt: ${json.total}.` : ""}${json.has_more !== undefined ? ` Fler sidor: ${json.has_more}.` : ""}`);
  if (lista[0]) skriv(`Fält i ett evenemang: ${Object.keys(lista[0]).join(", ")}`);
  if (lista[0]?.location && typeof lista[0].location === "object") skriv(`Fält i platsen: ${Object.keys(lista[0].location).join(", ")}`);
  for (const ev of lista.slice(0, 15)) skriv(`- ${String(ev.startdate || ev.start_date || "").slice(0, 16)} | ${ev.title || ev.name} | ${plats(ev)} | ${ev.state || ""}`);
  return lista;
}

async function main() {
  skriv(`# Prova Billetto-API (${new Date().toISOString().slice(0, 10)})`);
  if (!nyckel || !nyckel.includes(":")) {
    skriv(nyckel ? "Hemligheten BILLETTO_API_KEY saknar kolon. Den ska vara id:secret." : "Hemligheten BILLETTO_API_KEY saknas.");
    process.exitCode = 1;
  } else {
    skriv("Nyckeln finns och har formen id:secret (den skrivs inte ut).");
    // 1. Alla publika evenemang (Public Event Search). Kräver kanske partneråtkomst.
    const se = await prova("Publika evenemang i Sverige (billetto.se)", "https://billetto.se/api/v3/public/events?limit=100");
    await prova("Publika evenemang, postnummer 753 (Uppsala centrum)", "https://billetto.se/api/v3/public/events?limit=100&postal_code=75310");
    await prova("Publika evenemang, region Uppsala", "https://billetto.se/api/v3/public/events?limit=100&region=Uppsala");
    if (se?.length) {
      skriv("");
      skriv(`Städer på första sidan: ${topp(se.map((ev) => plats(ev).split(", ")[1] || "okänd")).map(([k, n]) => `${k} (${n})`).join(", ")}`);
    }
    // 2. Arrangörens egna evenemang, för att se om nyckeln bara gäller det egna kontot.
    await prova("Bara kontots egna evenemang (organiser)", "https://billetto.se/api/v3/organiser/events?limit=10");
  }
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, rader.join("\n") + "\n");
}

main().catch((fel) => {
  console.log(`Fel: ${fel.message}`);
  process.exitCode = 1;
});
