// Regler för Uppsala stadsteater.
//
// Teaterns webbplats har ett öppet dataflöde (WordPress) med en post per
// uppsättning. I varje post finns en lista med föreställningar, där varje
// rad har ett id som "event-1801242000.134185": första talet är starttiden
// (sekunder sedan 1970, UTC) och andra är biljettsystemets id.
//
// Vi sparar bara fakta: titel, tid, scen, status och länkar. Inga
// beskrivningar och inga bilder.

import { enRad } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";

export const KALLA = {
  id: "stadsteatern",
  namn: "Uppsala stadsteater",
  webbsida: "https://www.uppsalastadsteater.se/",
};

const KATEGORI_BARN = 135; // Barn & Familjer
const KATEGORI_UNGA = 136; // För ungdomar
const KATEGORI_BARA_SKOLOR = 151; // För skolor (enbart), inte öppet för allmänheten

const MUSIK = /konsert|kvintett|kvartett|orkester|\bkör\b|sinfonietta|jazz/i;

function span(html, klass) {
  const m = html.match(new RegExp(`<span class="${klass}">([\\s\\S]*?)</span>`));
  return m ? enRad(m[1]) : "";
}

// Plockar ut föreställningarna ur en uppsättning. En rad per föreställning.
export function forestallningar(post) {
  const html = post?.content?.rendered || "";
  const rader = [];
  const re = /<li id="event-(\d+)\.(\d+)" class="([^"]*)">([\s\S]*?)<\/li>/g;
  for (const [, sekunder, biljettId, klass, innehall] of html.matchAll(re)) {
    const lank = innehall.match(/href="(https:\/\/biljett\.uppsalastadsteater\.se\/[^"]+)"/);
    rader.push({
      starttid: new Date(+sekunder * 1000).toISOString(),
      biljettId,
      status: /\bcancelled\b/.test(klass)
        ? "installd"
        : /\bsoldout\b/.test(klass)
          ? "slutsald"
          : /\bfewtickets\b/.test(klass)
            ? "fa-biljetter"
            : "biljetter",
      extra: span(innehall, "extra-info"),
      scen: span(innehall, "stage"),
      pris: span(innehall, "price"),
      biljettlank: lank ? lank[1] : null,
    });
  }
  return rader;
}

// Gör om en uppsättning till färdiga evenemang, en per föreställning.
// "nu" går att ändra i testerna.
export function tillEvenemang(post, nu = new Date()) {
  const kategorier = post.categories || [];
  if (kategorier.includes(KATEGORI_BARA_SKOLOR)) return [];

  const titel = enRad(post.title?.rendered ?? post.title);
  const barn = kategorier.includes(KATEGORI_BARN) || kategorier.includes(KATEGORI_UNGA);

  return forestallningar(post)
    .filter((f) => new Date(f.starttid) > nu)
    .map((f) => {
      const notering = [f.extra, f.status === "slutsald" ? "Slutsåld" : "", f.status === "fa-biljetter" ? "Få biljetter kvar" : ""]
        .filter((x) => x && !/^inställd$/i.test(x))
        .join(", ");
      return {
        id: `stadsteatern-${f.biljettId}`,
        titel,
        start: tillSvenskTid(f.starttid),
        slut: null,
        plats: { namn: "Uppsala stadsteater", id: "stadsteatern", ...(f.scen && { rum: f.scen }) },
        kategori: MUSIK.test(titel) ? "musik" : "scen",
        gratis: /fri entré|gratis/i.test(f.pris) ? true : f.pris ? false : null,
        barnOchFamilj: barn,
        ...(notering && { notering }),
        kallor: [
          {
            id: KALLA.id,
            namn: KALLA.namn,
            url: post.link,
            ...(f.biljettlank && { biljetter: f.biljettlank }),
          },
        ],
        langvarig: false,
        installd: f.status === "installd",
      };
    });
}

export function bearbeta(poster, nu = new Date()) {
  return poster.flatMap((p) => tillEvenemang(p, nu));
}
