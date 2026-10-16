// Hämtar programmet från Biotopia.
//
// Körs så här:
//   node scripts/biotopia/hamta.mjs
//
// För att prova med sparad exempeldata:
//   node scripts/biotopia/hamta.mjs --fran-fil scripts/biotopia/exempel.html

import { readFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, bearbeta, lasKalender } from "./regler.mjs";

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const html = i !== -1 ? await readFile(process.argv[i + 1], "utf8") : await hamta(KALLA.webbsida);
  const poster = lasKalender(html);
  const idag = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());
  // Rådatan är redan bara fakta (lasKalender tar inte med texterna).
  await sparaKalla(KALLA, bearbeta(poster, idag), poster);
}

kor(main);
