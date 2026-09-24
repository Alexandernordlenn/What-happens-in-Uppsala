// Hämtar kommande föreställningar från Uppsala stadsteater.
//
// Körs så här:
//   node scripts/stadsteatern/hamta.mjs
//
// För att prova med sparad exempeldata:
//   node scripts/stadsteatern/hamta.mjs --fran-fil scripts/stadsteatern/exempel.json

import { readFile } from "node:fs/promises";
import { hamta } from "../gemensamt/webb.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, bearbeta } from "./regler.mjs";

// Alla uppsättningar som är till salu. Svaret sparas länge i webbplatsens
// cache, så vi lägger till dagens datum för att få färsk data.
function adress(sida) {
  const u = new URL("https://www.uppsalastadsteater.se/wp-json/wp/v2/performance-page");
  u.searchParams.set("per_page", "100");
  u.searchParams.set("page", String(sida));
  u.searchParams.set("_fields", "id,slug,link,title,modified_gmt,categories,content");
  u.searchParams.set("farsk", new Date().toISOString().slice(0, 10));
  return u.toString();
}

async function hamtaAllt() {
  const alla = [];
  for (let sida = 1; sida <= 5; sida++) {
    const lista = await hamta(adress(sida), { json: true });
    console.log(`Sida ${sida}: ${lista.length} uppsättningar`);
    alla.push(...lista);
    if (lista.length < 100) break;
  }
  return alla;
}

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const poster = i !== -1 ? JSON.parse(await readFile(process.argv[i + 1], "utf8")) : await hamtaAllt();

  // Rådatan sparas utan teaterns texter, bara listan med föreställningar.
  const radata = poster.map((p) => ({
    id: p.id,
    slug: p.slug,
    link: p.link,
    title: p.title,
    categories: p.categories,
    modified_gmt: p.modified_gmt,
    forestallningar: (p.content?.rendered.match(/<li id="event-[\s\S]*?<\/li>/g) || []).length,
  }));

  await sparaKalla(KALLA, bearbeta(poster), radata);
}

kor(main);
