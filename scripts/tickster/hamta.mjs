// Hämtar kommande evenemang i Uppsala kommun från Tickster.
//
// Körs så här:
//   node scripts/tickster/hamta.mjs
//
// Använder Ticksters officiella API (api.mjs) med hemligheten TICKSTER_API_KEY:
// dumpen som grund och Event API för den närmaste veckan. Nyckeln skrivs aldrig ut.
//
// Vi läser aldrig Ticksters webbsidor (beslut 27 okt 2026: bara API där det
// finns API). Svarar inte API:et misslyckas steget, och sidan visar gårdagens
// data tills API:et svarar igen.

import { gunzipSync } from "node:zlib";
import { USER_AGENT } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, ORTER } from "./regler.mjs";
import { DUMP, SOK, slaSamman, tolkaDump, tolkaSok, vantetid } from "./api.mjs";
import { sparaKalltext } from "../gemensamt/kalltext.mjs";

const vanta = (ms) => new Promise((r) => setTimeout(r, ms));

const idagISverige = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
const plusDagar = (dag, n) => new Date(Date.parse(`${dag}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);

// Vanlig fetch, så att adressen med nyckeln aldrig skrivs i loggen.
async function apiAnrop(adress, rubriker = {}) {
  const svar = await fetch(adress, { headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...rubriker } });
  const vanta_ms = vantetid(svar.headers);
  if (vanta_ms) {
    console.log(`Tickster ber oss vänta ${Math.round(vanta_ms / 1000)} sekunder (X-RATELIMIT).`);
    await vanta(vanta_ms);
  }
  if (!svar.ok) throw new Error(`Tickster API svarade ${svar.status}`);
  return svar;
}

async function hamtaFranApi(nyckel) {
  const idag = idagISverige();
  // 1. Dumpen med hela utbudet.
  const info = await (await apiAnrop(DUMP(nyckel))).json();
  const fil = Buffer.from(await (await apiAnrop(info.uri)).arrayBuffer());
  const dump = JSON.parse((fil[0] === 0x1f && fil[1] === 0x8b ? gunzipSync(fil) : fil).toString("utf8"));
  const franDump = tolkaDump(dump, idag);
  console.log(`Tickster-dumpen (${info.id}): ${dump.events?.length ?? 0} evenemang i Sverige, ${franDump.length} i Uppsala kommun.`);

  // 2. Event API för den närmaste veckan, sökt per ort.
  const sista = plusDagar(idag, 7);
  const farska = [];
  for (const ort of ORTER) {
    for (let skip = 0; skip < 1000; skip += 100) {
      const svar = await (await apiAnrop(SOK(ort, skip), { "x-api-key": nyckel })).json();
      farska.push(...tolkaSok(svar, idag, sista));
      if ((svar.items || []).length < 100) break;
    }
    await vanta(500);
  }
  console.log(`Tickster Event API: ${farska.length} evenemang de närmaste 7 dagarna.`);
  const evenemang = slaSamman(franDump, farska);
  // Beskrivningen läses bara tillfälligt, för AI-klassningen. Den sparas aldrig i repot.
  await sparaKalltext(KALLA.id, Object.fromEntries((dump.events || []).map((ev) => [`tickster-${String(ev.id).toLowerCase()}`, typeof ev.description === "string" ? ev.description : ev.description?.markdown || ""])));
  // Rådatan: dumpens poster i kommunen, utan beskrivningar, bilder, artister och priser.
  const ids = new Set(evenemang.map((e) => e.id));
  const radata = (dump.events || [])
    .filter((ev) => ids.has(`tickster-${String(ev.id).toLowerCase()}`))
    .map(({ description, imageUrl, performers, goods, links, ...resten }) => resten);
  return { evenemang, radata };
}

async function main() {
  const nyckel = process.env.TICKSTER_API_KEY;
  if (!nyckel) throw new Error("Hemligheten TICKSTER_API_KEY saknas.");
  const { evenemang, radata } = await hamtaFranApi(nyckel);
  await sparaKalla(KALLA, evenemang, radata);
}

kor(main);
