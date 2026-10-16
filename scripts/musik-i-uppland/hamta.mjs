// Hämtar kommande konserter från Musik i Uppland.
//
// Körs så här:
//   node scripts/musik-i-uppland/hamta.mjs
//
// För att prova med sparad exempeldata:
//   node scripts/musik-i-uppland/hamta.mjs --fran-fil scripts/musik-i-uppland/exempel.json

import { readFile } from "node:fs/promises";
import { hamtaWpSidor } from "../gemensamt/wordpress.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, bearbeta } from "./regler.mjs";

// Bara de fält vi använder. Konsertfälten ligger i "acf".
function adress(sida) {
  const u = new URL("https://www.musikiuppland.se/wp-json/wp/v2/concert");
  u.searchParams.set("per_page", "100");
  u.searchParams.set("page", String(sida));
  u.searchParams.set("_fields", "id,link,title,class_list,acf");
  return u.toString();
}

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const konserter = i !== -1 ? JSON.parse(await readFile(process.argv[i + 1], "utf8")) : await hamtaWpSidor(adress);
  const evenemang = bearbeta(konserter);
  // Rådatan sparas utan biljettinformationen, som kan innehålla personuppgifter.
  const radata = konserter.map(({ id, link, title, class_list, acf = {} }) => ({
    id, link, title, class_list,
    acf: { plats: acf.plats, locality: acf.locality, konserttid: acf.konserttid, konsertslut: acf.konsertslut, adress: acf.adress, postnummer: acf.postnummer },
  }));
  console.log(`${konserter.length} konserter i länet, ${evenemang.length} kommande i Uppsala kommun.`);
  await sparaKalla(KALLA, evenemang, radata);
}

kor(main);
