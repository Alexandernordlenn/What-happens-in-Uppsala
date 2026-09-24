// Hämtar kommande evenemang från Bibliotek Uppsala.
//
// Körs så här:
//   node scripts/bibliotek/hamta.mjs
//
// För att prova med exempeldata:
//   node scripts/bibliotek/hamta.mjs --fran-fil scripts/bibliotek/exempel.json

import { readFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { API, KALLA, bearbeta, sokParametrar } from "./regler.mjs";

const PER_SIDA = 50;
const MAX_SIDOR = 40;

async function hamtaAllt() {
  const nu = new Date();
  const alla = [];
  for (let sida = 0; sida < MAX_SIDOR; sida++) {
    const svar = await hamta(`${API}/search?${sokParametrar(nu, sida * PER_SIDA, PER_SIDA)}`, {
      json: true,
      // Samma ursprung som bibliotekets egen kalender, om API:et kontrollerar det.
      headers: { Origin: "https://bibliotekuppsala.se", Referer: "https://bibliotekuppsala.se/evenemang" },
    });
    const traffar = svar.hits || [];
    alla.push(...traffar);
    console.log(`Sida ${sida + 1}: ${traffar.length} evenemang (totalt ${svar.totalHits ?? "?"})`);
    if (traffar.length < PER_SIDA || alla.length >= (svar.totalHits ?? Infinity)) break;
  }
  return alla;
}

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const traffar =
    i !== -1 ? JSON.parse(await readFile(process.argv[i + 1], "utf8")).hits : await hamtaAllt();

  // Rådatan sparas utan beskrivningar, bilder och vem som skapat evenemanget.
  const radata = traffar.map((t) => {
    const { description, images, attachments, createdBy, ...resten } = t.event ?? t;
    return resten;
  });
  await sparaKalla(KALLA, bearbeta(traffar), radata);
}

kor(main);
