// Bygger kön för AI-klassningen: tmp/ko.json.
//
// Körs efter hämtningarna och före Claude-steget:
//   node scripts/klassning/ko.mjs
//
// I kön hamnar evenemang som reglerna inte kunde sortera färdigt:
//   - format: långvarigt men okända dagar ("period")
//   - ålder: barn och familj men ingen ålder
//   - kategori: "övrigt"
// och som inte redan har ett godkänt AI-svar för samma innehåll och
// promptversion (data/etiketter.json). Högst 150 per körning, de närmaste
// i tid först. Källtexten läses från tmp/kalltext/ och skrivs aldrig ut.

import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { KALLOR } from "../bygg-sida.mjs";
import { klassa } from "../gemensamt/klassa.mjs";
import { normaliseraPlats } from "../gemensamt/platser.mjs";
import { innehallshash } from "../gemensamt/kalltext.mjs";

export const PROMPTVERSION = 1;
export const MAX_PER_KORNING = 150;

const lasJson = async (fil, reserv) => {
  try {
    return JSON.parse(await readFile(fil, "utf8"));
  } catch {
    return reserv;
  }
};

// Vad saknas efter reglerna?
export function saknas(e) {
  const ut = [];
  if (e.format === "period") ut.push("format");
  if (e.barnOchFamilj && !e.alder) ut.push("alder");
  if (e.kategori === "ovrigt") ut.push("kategori");
  return ut;
}

// Källtexten för ett evenemang. Kubik har texten per aktivitet, inte per tillfälle.
function textFor(e, texter) {
  if (e.beskrivning) return String(e.beskrivning).slice(0, 600);
  if (texter[e.id]) return texter[e.id];
  const nyckel = Object.keys(texter).find((k) => e.id.startsWith(`${k}-`));
  return nyckel ? texter[nyckel] : "";
}

export function byggKo(evenemangPerKalla, texterPerKalla, etiketter, idag) {
  const ko = [];
  for (const { id, bokstav } of KALLOR) {
    const texter = texterPerKalla[id] || {};
    for (const original of evenemangPerKalla[id] || []) {
      const e = klassa(normaliseraPlats(original), bokstav);
      const slutdag = String(e.slut || e.start).slice(0, 10);
      if (e.format === "kurs" || slutdag < idag) continue;
      const luckor = saknas(e);
      if (!luckor.length) continue;
      const hash = innehallshash(original);
      const tidigare = etiketter?.poster?.[e.id];
      if (tidigare && tidigare.hash === hash && tidigare.promptversion === PROMPTVERSION) continue;
      ko.push({
        id: e.id,
        hash,
        titel: e.titel,
        plats: e.plats?.namn,
        start: e.start,
        slut: e.slut || null,
        taggar: [...(e.fakta?.kategorier || []), ...(e.fakta?.taggar || [])],
        saknas: luckor,
        kalltext: textFor(original, texter),
      });
    }
  }
  // De närmaste i tid först. Pågående räknas som idag.
  const nar = (k) => (String(k.start).slice(0, 10) < idag ? idag : String(k.start).slice(0, 10));
  return ko.sort((a, b) => nar(a).localeCompare(nar(b))).slice(0, MAX_PER_KORNING);
}

async function main() {
  const idag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
  const evenemang = {};
  const texter = {};
  for (const { id } of KALLOR) {
    evenemang[id] = (await lasJson(`data/${id}.json`, { evenemang: [] })).evenemang;
    texter[id] = await lasJson(`tmp/kalltext/${id}.json`, {});
  }
  const ko = byggKo(evenemang, texter, await lasJson("data/etiketter.json", null), idag);
  await mkdir("tmp", { recursive: true });
  await writeFile("tmp/ko.json", JSON.stringify({ promptversion: PROMPTVERSION, evenemang: ko }, null, 1) + "\n");
  console.log(`${ko.length} evenemang i kön för AI-klassningen.`);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `antal=${ko.length}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((fel) => {
    console.log(`::warning::Kön för AI-klassningen kunde inte byggas: ${fel.message}`);
    if (process.env.GITHUB_OUTPUT) appendFile(process.env.GITHUB_OUTPUT, "antal=0\n");
  });
}
