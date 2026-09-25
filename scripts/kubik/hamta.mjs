// Hämtar aktiviteter från Kubik Uppsala.
//
// Körs så här:
//   node scripts/kubik/hamta.mjs
//
// Ett enda anrop ger alla aktiviteter, samma som sidan hitta-aktiviteter visar.

import { readFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, SOK, SOKFORMULAR, bearbeta, lasKort } from "./regler.mjs";
import { OMRADEN } from "../gemensamt/omraden.mjs";

const FORMULAR = { "Content-Type": "application/x-www-form-urlencoded" };

// Kubik skriver inte ut området på korten, men går att filtrera på det.
// En sökning per område ger vilka aktiviteter som hör dit (8 anrop).
async function omradenPerAktivitet() {
  const karta = {};
  for (const o of OMRADEN) {
    const body = `${SOKFORMULAR}&selectedFilters.geography=${encodeURIComponent(o.kubik)}`;
    for (const k of lasKort(await hamta(SOK, { method: "POST", body, headers: FORMULAR }))) karta[k.slug] = o.id;
  }
  return karta;
}

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const html =
    i !== -1
      ? await readFile(process.argv[i + 1], "utf8")
      : await hamta(SOK, { method: "POST", body: SOKFORMULAR, headers: FORMULAR });
  const kort = lasKort(html);
  if (i === -1) {
    const omraden = await omradenPerAktivitet();
    for (const k of kort) k.omrade = omraden[k.slug] || null;
    console.log(`${kort.filter((k) => k.omrade).length} av ${kort.length} aktiviteter har område.`);
  }
  await sparaKalla(KALLA, bearbeta(kort), kort);
}

kor(main);
