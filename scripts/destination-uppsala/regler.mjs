// Regler för Destination Uppsala (destinationuppsala.se/event/).
//
// Webbplatsen har inget dataflöde med datum, så vi läser av listan med
// kommande evenemang. Varje kort i listan har titel, plats, kategorier och
// ett datum som "24 okt" eller "3 maj - 11 okt", men inget årtal och ingen
// klockslag. Årtalet räknar vi ut (se raknaUtDatum). Klockslaget hämtas från
// evenemangets egen sida, men bara en gång per evenemang.
//
// Vi sparar bara fakta: titel, tid, plats, kategori och länk. Inga
// beskrivningar och inga bilder.

import { enRad, avkoda } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";

export const KALLA = {
  id: "destination-uppsala",
  namn: "Destination Uppsala",
  webbsida: "https://destinationuppsala.se/event/",
};

const MANADER = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const ENGELSKA = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// Deras kategorier till våra.
const KATEGORIER = {
  konsert: "musik",
  teater: "scen", forestallning: "scen", standup: "scen", dans: "scen", film: "scen",
  utstallning: "museum", visningar: "museum",
  litteratur: "prat",
  sport: "sport",
  "mat-dryck": "mat",
};
// Den första av våra kategorier som finns bland kortets vinner.
const ORDNING = ["musik", "scen", "sport", "prat", "museum", "mat"];

// ---------- Listan ----------

// Plockar ut korten ur en sida av listan.
export function lasLista(html) {
  const utanSkript = html.replace(/<(style|script|svg)[\s\S]*?<\/\1>/g, "");
  const delar = utanSkript.split('<div class="o-grid__item o-reverse__item o-gutter__item [ u-width-1/2');
  const kort = [];
  for (const del of delar.slice(1)) {
    const bit = del.split("</ul>")[0]; // Annars följer sidfoten med på sista kortet.
    const lank = bit.match(/href="(https:\/\/destinationuppsala\.se\/event\/[^"]+)"/);
    if (!lank) continue;
    const bricka = bit.match(/u-background-zeta[^>]*>([\s\S]*?)<\/div>/);
    const datum = bricka
      ? [...bricka[1].matchAll(/u-text-bold">\s*(\d{1,2})\s*<\/p>\s*<span[^>]*>\s*([a-zåäö]+)\s*<\/span>/gi)].map(
          ([, dag, man]) => ({ dag: +dag, manad: MANADER.indexOf(man.toLowerCase().slice(0, 3)) + 1 }),
        )
      : [];
    const titel = bit.match(/u-text-currentColor">\s*([\s\S]*?)\s*<\/p>/);
    const kategorier = [...bit.matchAll(/event-kategori\/([^/"]+)\//g)].map((m) => m[1]);
    const punkter = [...bit.matchAll(/<li class="o-inline-list__item o-breadcrumbs__item[^>]*>([\s\S]*?)<\/li>/g)]
      .map((m) => m[1])
      .filter((li) => !li.includes("event-kategori"));
    kort.push({
      url: lank[1],
      titel: titel ? enRad(titel[1]) : "",
      datum: datum.filter((d) => d.manad > 0),
      kategorier,
      plats: punkter.length ? enRad(punkter[punkter.length - 1]) : "",
    });
  }
  return kort;
}

// Högsta sidnumret i sidväljaren längst ner.
export function antalSidor(html) {
  const val = html.match(/<ol class="[^"]*c-pagination[\s\S]*?<\/ol>/);
  if (!val) return 1;
  const nummer = [...val[0].matchAll(/\/event\/page\/(\d+)\//g)].map((m) => +m[1]);
  return Math.max(1, ...nummer);
}

// ---------- Årtal ----------

const iso = (ar, m, d) => `${ar}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Första datumet med den dagen och månaden som är samma dag som "minst" eller senare.
function forstaEfter({ dag, manad }, minst) {
  const ar = +minst.slice(0, 4);
  return iso(ar, manad, dag) >= minst ? iso(ar, manad, dag) : iso(ar + 1, manad, dag);
}

// Sista datumet med den dagen och månaden som är samma dag som "hogst" eller tidigare.
function sistaFore({ dag, manad }, hogst) {
  const ar = +hogst.slice(0, 4);
  return iso(ar, manad, dag) <= hogst ? iso(ar, manad, dag) : iso(ar - 1, manad, dag);
}

// Listan är sorterad efter startdatum. Därför kan vi räkna ut årtalen:
// - Varje start ligger på eller efter föregående korts start.
// - Det allra första kortet är ofta en utställning som redan pågår, så dess
//   start ligger före idag.
// - Ett slutdatum ligger alltid idag eller senare, eftersom listan bara
//   visar sådant som inte är slut.
export function raknaUtDatum(kort, idag) {
  let foregaende = null;
  return kort.map((k) => {
    if (!k.datum.length) return { ...k, startdatum: null, slutdatum: null };
    const [forsta, sista] = k.datum;
    let startdatum;
    if (foregaende) startdatum = forstaEfter(forsta, foregaende);
    else startdatum = sista ? sistaFore(forsta, idag) : forstaEfter(forsta, idag);
    let slutdatum = null;
    if (sista) {
      slutdatum = forstaEfter(sista, startdatum > idag ? startdatum : idag);
    } else if (startdatum < idag) {
      startdatum = forstaEfter(forsta, idag); // Ett endagsevenemang kan inte ha varit.
    }
    foregaende = startdatum;
    return { ...k, startdatum, slutdatum };
  });
}

// ---------- Evenemangets egen sida ----------

const MANADSORD = new RegExp(
  `(\\d{1,2})\\s+(${[...MANADER, ...ENGELSKA].join("|")})[a-zé]*,?\\s+(20\\d\\d)`,
  "gi",
);

// Läser texten efter "När:" och "Inträde/biljett:", och knappen "Till eventet".
export function lasDetaljer(html) {
  const falt = {};
  const stycke = html.match(/Eventdetaljer<\/h2>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
  if (stycke) {
    for (const rad of stycke[1].split(/<br[^>]*>/i)) {
      const m = rad.match(/<strong[^>]*>\s*([^<:]+):?\s*<\/strong>\s*:?\s*([\s\S]*)/);
      if (m) falt[enRad(m[1]).toLowerCase()] = enRad(m[2]);
    }
  }
  const knapp = html.match(/<a href="([^"]+)" class="\[ c-btn c-btn--lg \][^>]*>\s*Till eventet/);
  return {
    nar: falt["när"] || "",
    pris: falt["inträde/biljett"] || falt["inträde"] || falt["pris"] || "",
    arrangorensSida: knapp ? avkoda(knapp[1]) : null,
  };
}

// Tolkar texten efter "När:". Sparas inte, utan räknas ut varje gång,
// så att förbättringar här gäller även för sidor vi redan läst.
export function tolkaNar(nar = "") {
  // "kl. 19.00", "kl 18:00", "kl. 11–15" eller bara "19:30".
  const klocka = nar.match(/\bkl\.?:?\s*(\d{1,2})(?:[.:](\d{2}))?/i) || nar.match(/\b(\d{1,2}):(\d{2})\b/);
  const datumIText = [...nar.matchAll(MANADSORD)].map(([, dag, man, ar]) => {
    const i = MANADER.indexOf(man.toLowerCase().slice(0, 3));
    const manad = (i >= 0 ? i : ENGELSKA.indexOf(man.toLowerCase().slice(0, 3))) + 1;
    return iso(+ar, manad, +dag);
  });
  return {
    klockslag: klocka && +klocka[1] < 24 ? `${klocka[1].padStart(2, "0")}:${klocka[2] || "00"}` : null,
    datumIText,
  };
}

// ---------- Färdiga evenemang ----------

function kategori(k) {
  const vara = k.kategorier.map((c) => KATEGORIER[c]).filter(Boolean);
  return ORDNING.find((c) => vara.includes(c)) || "ovrigt";
}

function dagarMellan(a, b) {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

// "detaljer" är det vi läst från evenemangets egen sida, om vi har det.
export function tillEvenemang(k, detaljer = null) {
  let startdatum = k.startdatum;
  const nar = tolkaNar(detaljer?.nar);
  // Står samma dag och månad med årtal på evenemangets sida litar vi på det.
  const bekraftat = nar.datumIText.find((d) => d.slice(5) === startdatum.slice(5));
  if (bekraftat) startdatum = bekraftat;

  const langvarig = Boolean(k.slutdatum && dagarMellan(startdatum, k.slutdatum) >= 3);
  const klockslag = !langvarig && nar.klockslag;
  const slug = k.url.replace(/\/$/, "").split("/").pop();
  const pris = detaljer?.pris || "";

  return {
    id: `du-${slug}`,
    titel: k.titel,
    start: klockslag ? tillSvenskTid(`${startdatum}T${klockslag}`) : startdatum,
    slut: k.slutdatum,
    plats: { namn: k.plats || "Uppsala", id: `du-plats-${(k.plats || "uppsala").toLowerCase().replace(/[^a-z0-9åäö]+/g, "-")}` },
    kategori: kategori(k),
    gratis: /fri entré|fritt inträde|gratis|kostnadsfri/i.test(pris) ? true : /betald|biljett|kr\b/i.test(pris) ? false : null,
    barnOchFamilj: k.kategorier.includes("barn-familj"),
    kallor: [
      {
        id: KALLA.id,
        namn: KALLA.namn,
        url: k.url,
        ...(detaljer?.arrangorensSida && { arrangor: detaljer.arrangorensSida }),
      },
    ],
    langvarig,
    installd: /inställ/i.test(k.titel),
  };
}
