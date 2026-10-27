// Hämtar publika evenemang i Uppsala kommun från Billetto.
//
// Körs så här (nyckeln finns bara i GitHub, som hemligheten BILLETTO_API_KEY):
//   node scripts/billetto/hamta.mjs
//
// För att prova med sparad exempeldata:
//   node scripts/billetto/hamta.mjs --fran-fil scripts/billetto/exempel.json

import { readFile } from "node:fs/promises";
import { USER_AGENT } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { ADRESS, KALLA, bearbeta, iKommunen } from "./regler.mjs";

const MAX_SIDOR = 30;

// Alla sidor, via next_url. Vanlig fetch, så att nyckeln aldrig skrivs i loggen.
async function hamtaAllt(nyckel) {
  const alla = [];
  let adress = ADRESS;
  for (let sida = 1; adress && sida <= MAX_SIDOR; sida++) {
    const svar = await fetch(adress, { headers: { "User-Agent": USER_AGENT, Accept: "application/json", "Api-Keypair": nyckel } });
    if (!svar.ok) throw new Error(`Billetto svarade ${svar.status}`);
    const json = await svar.json();
    alla.push(...(json.data || []));
    adress = json.has_more && json.next_url ? json.next_url : null;
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`${alla.length} publika evenemang i Sverige.`);
  return alla;
}

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const nyckel = (process.env.BILLETTO_API_KEY || "").trim();
  if (i === -1 && !nyckel) throw new Error("Hemligheten BILLETTO_API_KEY saknas.");
  const lista = i !== -1 ? JSON.parse(await readFile(process.argv[i + 1], "utf8")) : await hamtaAllt(nyckel);
  // Rådatan: bara evenemangen i kommunen, utan beskrivningar och bilder.
  const radata = lista.filter(iKommunen).map(({ description, image_link, headliners, ...resten }) => resten);
  await sparaKalla(KALLA, bearbeta(lista), radata);
}

kor(main);
