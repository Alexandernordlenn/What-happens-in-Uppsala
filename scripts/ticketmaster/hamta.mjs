// Hämtar evenemang i Uppsala kommun från Ticketmaster.
//
// Körs så här (nyckeln ska ligga i miljövariabeln TICKETMASTER_API_KEY):
//   node scripts/ticketmaster/hamta.mjs
//
// För att prova med exempeldata:
//   node scripts/ticketmaster/hamta.mjs --fran-fil scripts/ticketmaster/exempel.json

import { readFile } from "node:fs/promises";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, bearbeta, sokadress } from "./regler.mjs";

const MAX_SIDOR = 5; // 5 sidor à 200 = 1 000, som är det mesta Ticketmaster ger ut.

async function hamtaAllt(nyckel) {
  const svar = [];
  for (let sida = 0; sida < MAX_SIDOR; sida++) {
    const r = await fetch(sokadress(nyckel, sida), { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`Ticketmaster svarade ${r.status} ${r.statusText}`);
    const json = await r.json();
    svar.push(json);
    const antal = json._embedded?.events?.length || 0;
    console.log(`Sida ${sida + 1}: ${antal} evenemang (totalt ${json.page?.totalElements ?? "?"})`);
    if (sida + 1 >= (json.page?.totalPages || 0)) break;
    await new Promise((v) => setTimeout(v, 500)); // Gränsen är 5 anrop per sekund.
  }
  return svar;
}

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  let svar;
  if (i !== -1) {
    svar = [JSON.parse(await readFile(process.argv[i + 1], "utf8"))];
  } else {
    const nyckel = process.env.TICKETMASTER_API_KEY;
    if (!nyckel) throw new Error("Miljövariabeln TICKETMASTER_API_KEY saknas.");
    svar = await hamtaAllt(nyckel);
  }
  const radata = svar.flatMap((s) => s?._embedded?.events || []).map(({ images, ...resten }) => resten);
  await sparaKalla(KALLA, bearbeta(svar), radata);
}

kor(main);
