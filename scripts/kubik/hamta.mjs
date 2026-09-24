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

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const html =
    i !== -1
      ? await readFile(process.argv[i + 1], "utf8")
      : await hamta(SOK, {
          method: "POST",
          body: SOKFORMULAR,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
  const kort = lasKort(html);
  await sparaKalla(KALLA, bearbeta(kort), kort);
}

kor(main);
