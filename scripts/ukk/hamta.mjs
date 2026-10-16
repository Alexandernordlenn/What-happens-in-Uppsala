// Hämtar kommande evenemang från Uppsala Konsert & Kongress.
//
// Körs så här:
//   node scripts/ukk/hamta.mjs
//
// För att prova med sparad exempeldata:
//   node scripts/ukk/hamta.mjs --fran-fil scripts/ukk/exempel.json

import { readFile } from "node:fs/promises";
import { hamtaWpSidor } from "../gemensamt/wordpress.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, bearbeta } from "./regler.mjs";

// Inlägg med publiceringstid från och med i går, äldst först. Bara de fält vi
// använder, så att inga texter hämtas.
function adress(sida) {
  const igar = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const u = new URL("https://ukk.se/wp-json/wp/v2/posts");
  u.searchParams.set("after", `${igar}T00:00:00`);
  u.searchParams.set("orderby", "date");
  u.searchParams.set("order", "asc");
  u.searchParams.set("per_page", "100");
  u.searchParams.set("page", String(sida));
  u.searchParams.set("_fields", "id,date,date_gmt,link,title,class_list");
  return u.toString();
}

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const poster = i !== -1 ? JSON.parse(await readFile(process.argv[i + 1], "utf8")) : await hamtaWpSidor(adress);
  await sparaKalla(KALLA, bearbeta(poster), poster);
}

kor(main);
