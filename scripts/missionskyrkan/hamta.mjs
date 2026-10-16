// Hämtar kommande evenemang från Uppsala Missionskyrka.
//
// Körs så här:
//   node scripts/missionskyrkan/hamta.mjs
//
// För att prova med sparad exempeldata:
//   node scripts/missionskyrkan/hamta.mjs --fran-fil scripts/missionskyrkan/exempel.json

import { readFile } from "node:fs/promises";
import { franTribe, hamtaTribe } from "../gemensamt/wordpress.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, bearbeta } from "./regler.mjs";

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const idag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
  const lista = i !== -1 ? JSON.parse(await readFile(process.argv[i + 1], "utf8")) : await hamtaTribe(KALLA.webbsida, { fran: idag });
  // Rådatan sparas utan beskrivningar och kontaktuppgifter.
  await sparaKalla(KALLA, bearbeta(lista), lista.map(franTribe));
}

kor(main);
