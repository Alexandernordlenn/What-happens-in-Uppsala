// Provkör Billettos API och berättar vad nyckeln ger tillgång till.
//
// Körs av workflowet "Prova Billetto-API" (för hand under Actions), där
// hemligheten BILLETTO_API_KEY finns (id:secret). Sparar ingenting och ändrar
// inget på sidan, utan skriver bara en rapport. Nyckeln skrivs aldrig ut.

import { appendFile } from "node:fs/promises";
import { USER_AGENT } from "../gemensamt/webb.mjs";
import { iUppsalaKommun } from "../gemensamt/kommungrans.mjs";

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
    // 2. Alla sidor, och vilka som ligger i Uppsala kommun (koordinaterna avgör).
    skriv("");
    skriv("## Alla publika evenemang, sida för sida");
    let adress = "https://billetto.se/api/v3/public/events?limit=100";
    const alla = [];
    for (let sida = 1; adress && sida <= 20; sida++) {
      const { status, json } = await anrop(adress);
      if (status >= 400 || !json) {
        skriv(`Sida ${sida}: svar ${status}`);
        break;
      }
      alla.push(...(json.data || []));
      adress = json.has_more && json.next_url ? json.next_url : null;
    }
    skriv(`Hämtade ${alla.length} evenemang.`);
    if (alla[0]) skriv(`Exempel på plats: ${JSON.stringify(alla[0].location)}. Starttid: ${alla[0].startdate}. Kategori: ${JSON.stringify(alla[0].categorization)}`);
    const koord = (ev) => {
      const c = ev.location?.coordinates || {};
      const lat = +(c.latitude ?? c.lat ?? (Array.isArray(c) ? c[0] : NaN));
      const lng = +(c.longitude ?? c.lng ?? c.lon ?? (Array.isArray(c) ? c[1] : NaN));
      return [lat, lng];
    };
    const uppsala = alla.filter((ev) => {
      const [lat, lng] = koord(ev);
      return Number.isFinite(lat) && Number.isFinite(lng) ? iUppsalaKommun(lat, lng) : /uppsala/i.test(ev.location?.city || "");
    });
    skriv(`**I Uppsala kommun: ${uppsala.length}.** Utan koordinater totalt: ${alla.filter((ev) => !Number.isFinite(koord(ev)[0])).length}.`);
    for (const ev of uppsala) skriv(`- ${String(ev.startdate).slice(0, 16)} | ${ev.title} | ${plats(ev)} | ${ev.categorization?.category || ev.categorization?.type || ""} | ${ev.state}`);
    skriv(`Regioner i Uppsala-evenemangen: ${topp(uppsala.map((ev) => `${ev.location?.region}/${ev.location?.subregion}`)).map(([k, n]) => `${k} (${n})`).join(", ")}`);

    // 3. Finns kända Billetto-evenemang i Uppsala med? (Säljs via Billetto enligt arrangörerna.)
    skriv("");
    skriv("## Kända Billetto-evenemang i Uppsala");
    for (const ord of ["oslipat", "glans", "musicum", "akademiska kammarkör", "uak", "upplandsmuseet", "kaliber"]) {
      const traffar = alla.filter((ev) => `${ev.title} ${ev.location?.location_name}`.toLowerCase().includes(ord));
      skriv(`- "${ord}": ${traffar.length} träffar${traffar.length ? ` (${traffar.slice(0, 3).map((ev) => `${ev.title} | ${plats(ev)}`).join("; ")})` : ""}`);
    }
    skriv(`Svenska städer totalt: ${topp(alla.map((ev) => ev.location?.city || "okänd"), 25).map(([k, n]) => `${k} (${n})`).join(", ")}`);
    // 4. Samma sökning på andra domäner, för att jämföra storleken.
    for (const doman of ["billetto.dk", "billetto.co.uk"]) {
      const { status, json } = await anrop(`https://${doman}/api/v3/public/events?limit=1`);
      skriv(`${doman}: svar ${status}, totalt ${json?.total ?? "?"}`);
    }
    // 5. Filter som kanske finns: datum, stad, sök.
    for (const [namn, q] of [["city=Uppsala", "city=Uppsala"], ["subregion=Uppsala län", "subregion=Uppsala%20l%C3%A4n"], ["macroregion=Östra Mellansverige", "macroregion=%C3%96stra%20Mellansverige"], ["q=Uppsala", "q=Uppsala"], ["search=Uppsala", "search=Uppsala"]]) {
      const { status, json } = await anrop(`https://billetto.se/api/v3/public/events?limit=100&${q}`);
      skriv(`Filter ${namn}: svar ${status}, totalt ${json?.total ?? "?"}`);
    }

    // 6. Fråga API:et om kända Billetto-evenemang i Uppsala, ett i taget.
    skriv("");
    skriv("## Kända evenemang i Uppsala, ett i taget");
    const kanda = [2021663, 1976325, 2021252, 2028720, 1989068, 1976323];
    for (const id of kanda) {
      const finns = alla.find((ev) => String(ev.id) === String(id));
      const { status, json, text } = await anrop(`https://billetto.se/api/v3/public/events/${id}`);
      const ev = json?.data || json;
      skriv(`- ${id}: i listan: ${finns ? "ja" : "nej"}. Direkt fråga: svar ${status}` +
        (status < 400 && ev ? `, "${ev.title}", state=${ev.state}, kind=${ev.kind}, startdate=${ev.startdate}, stad=${ev.location?.city}, koordinater=${JSON.stringify(ev.location?.coordinates)}, tillgänglighet=${JSON.stringify(ev.availability)}, fält: ${Object.keys(ev).join(",")}` : `, ${text.slice(0, 160)}`));
    }

    // 7. Samma evenemang via arrangörsdelen (Retrieve an event, /organiser/events/{id}).
    skriv("");
    skriv("## Samma evenemang via arrangörsdelen");
    for (const id of kanda) {
      const { status, text } = await anrop(`https://billetto.se/api/v3/organiser/events/${id}`);
      skriv(`- ${id}: svar ${status}, ${text.slice(0, 140)}`);
    }

    // 8. Arrangörens egna evenemang, för att se om nyckeln bara gäller det egna kontot.
    await prova("Bara kontots egna evenemang (organiser)", "https://billetto.se/api/v3/organiser/events?limit=10");
  }
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, rader.join("\n") + "\n");
}

main().catch((fel) => {
  console.log(`Fel: ${fel.message}`);
  process.exitCode = 1;
});
