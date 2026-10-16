// Hämtar Fyrishovs kalender (matcher, mässor, konserter och badaktiviteter).
//
// Körs så här:
//   node scripts/fyrishov/hamta.mjs
//
// För att prova med sparad exempeldata:
//   node scripts/fyrishov/hamta.mjs --fran-fil scripts/fyrishov/exempel.ics

import { readFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { lasIcal } from "../gemensamt/ical.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALENDERFIL, KALLA, bearbeta } from "./regler.mjs";

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const text = i !== -1 ? await readFile(process.argv[i + 1], "utf8") : await hamta(KALENDERFIL);
  const idag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
  // Rådatan sparas utan beskrivningar (bara titel, tid, hall, länk och regel).
  const radata = lasIcal(text).map(({ beskrivning, ...resten }) => resten);
  await sparaKalla(KALLA, bearbeta(text, idag), radata);
}

kor(main);
