// Hämtar kommande evenemang från Katalin.
//
// Körs så här:
//   node scripts/katalin/hamta.mjs
//
// För att prova med sparad exempeldata:
//   node scripts/katalin/hamta.mjs --fran-fil scripts/katalin/exempel.json

import { readFile } from "node:fs/promises";
import { hamtaWpSidor } from "../gemensamt/wordpress.mjs";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, arKommande, bearbeta } from "./regler.mjs";

// API:et ger hela arkivet, nyast publicerade först. Vi bläddrar tills en hel
// sida bara har evenemang som redan har varit.
function adress(sida) {
  const u = new URL("https://www.katalin.com/wp-json/wp/v2/events");
  u.searchParams.set("per_page", "100");
  u.searchParams.set("page", String(sida));
  u.searchParams.set("_fields", "id,title,link,acf,genre_slugs,stage_slugs");
  return u.toString();
}

const idag = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date());

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  const poster =
    i !== -1
      ? JSON.parse(await readFile(process.argv[i + 1], "utf8"))
      : await hamtaWpSidor(adress, { maxSidor: 4, fortsatt: (sida) => sida.some((p) => arKommande(p, idag())) });
  const evenemang = bearbeta(poster);
  // Rådatan sparas utan Katalins texter och bilder, bara fakta.
  const radata = poster.filter((p) => arKommande(p, idag())).map(({ id, title, link, genre_slugs, stage_slugs, acf = {} }) => ({
    id, title, link, genre_slugs, stage_slugs,
    acf: { date_of_event: acf.date_of_event, time: acf.time, ticket_status: acf.ticket_status, ticket_price: acf.ticket_price, book_a_ticket: acf.book_a_ticket },
  }));
  await sparaKalla(KALLA, evenemang, radata);
}

kor(main);
