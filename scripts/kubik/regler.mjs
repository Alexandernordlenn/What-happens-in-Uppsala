// Regler för Kubik Uppsala (kubikuppsala.se/hitta-aktiviteter/).
//
// Kubik är Uppsala kommuns kalender för barn och unga. Sidan hämtar sina
// aktiviteter från adressen /partials/events/search, som svarar med färdig
// HTML: ett kort per aktivitet, med alla tider, plats, arrangör, kategorier,
// målgrupp och om det är gratis.
//
// Tiderna finns i två former:
// - enstaka tillfällen: "25 sep. 2026 14:00 - 14:30" blir ett evenemang var
// - perioder: "25 sep. 2026 14:30 - 18 dec. 2026 15:30" är oftast en
//   återkommande aktivitet (till exempel varje fredag). Vilka veckodagar står
//   bara i fritext, så en period blir ett långvarigt evenemang.
//
// Vi sparar bara fakta. Inga beskrivningar, bilder eller kontaktpersoner.

import { enRad, avkoda } from "../gemensamt/text.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";

export const KALLA = {
  id: "kubik",
  namn: "Kubik Uppsala",
  webbsida: "https://www.kubikuppsala.se/hitta-aktiviteter/",
};

export const SOK = "https://www.kubikuppsala.se/partials/events/search";
// Samma formulär som sidan själv skickar. pageSize=0 ger alla aktiviteter på en gång.
export const SOKFORMULAR = "query=&parentContentId=1681&pageIndex=0&pageSize=0&searchResultMaxTextLength=120";

const MANADER = { jan: 1, feb: 2, mar: 3, mars: 3, apr: 4, maj: 5, jun: 6, juni: 6, jul: 7, juli: 7, aug: 8, sep: 9, sept: 9, okt: 10, nov: 11, dec: 12 };

// Kubiks kategorier till våra. Den första av våra som finns vinner.
const KATEGORIER = {
  "Musik": "musik",
  "Teater": "scen", "Dans": "scen", "Film/Foto": "scen", "Cirkus": "scen",
  "Bollsport": "sport", "Ridsport": "sport", "Orientering": "sport", "Issport/Skidsport": "sport", "Kampsport": "sport",
  "Litteratur/Skrivande": "prat", "Vetenskap/Samhälle": "prat", "Workshop/Föreläsning": "prat", "Kurser": "prat",
  "Konst/Skapande": "museum", "Museum/Kulturarv": "museum", "Slöjd": "museum",
};
const ORDNING = ["musik", "scen", "sport", "museum", "prat"];

// Stödtjänster snarare än aktiviteter, som på biblioteket.
const TJANSTER = /^(läxhjälp)$/i;

const tvasiffrig = (n) => String(n).padStart(2, "0");

// "25 sep. 2026" -> "2026-09-25"
function datum(dag, man, ar) {
  const m = MANADER[man.toLowerCase().replace(".", "")];
  return m ? `${ar}-${tvasiffrig(m)}-${tvasiffrig(dag)}` : null;
}

// Tolkar en tid från ett kort. Ger { typ: "tillfalle" | "period", ... } eller null.
export function tolkaTid(text) {
  const D = "(\\d{1,2}) ([a-zåäö]+)\\.? (\\d{4})";
  const T = "(\\d{1,2}:\\d{2})";
  const m = text.trim().match(new RegExp(`^${D}(?: ${T})? - (?:${D})?(?: ?${T})?$`, "i"));
  if (!m) return null;
  const [, d1, m1, a1, t1, d2, m2, a2, t2] = m;
  const fran = datum(d1, m1, a1);
  const till = d2 ? datum(d2, m2, a2) : fran;
  if (!fran || !till) return null;
  if (till === fran) {
    const slut = t2 && t1 && t2 > t1 ? t2 : null; // Ibland slutar det före det börjar. Då struntar vi i sluttiden.
    return { typ: "tillfalle", datum: fran, start: t1 || null, slut };
  }
  return { typ: "period", fran, till, start: t1 || null, slut: t2 || null };
}

function falt(kort, klass) {
  const m = kort.match(new RegExp(`class="event-${klass}">([\\s\\S]*?)</div>`));
  return m ? enRad(m[1]) : "";
}

function taggar(kort, klass) {
  const m = kort.match(new RegExp(`class="${klass}">([\\s\\S]*?)</div>`));
  // Både data-bs-title och title har samma värde, så vi tar bara title.
  return m ? [...m[1].matchAll(/(?<![-\w])title="([^"]*)"/g)].map((x) => enRad(x[1])) : [];
}

export function lasKort(html) {
  return html
    .split('<div class="partial-event-page card')
    .slice(1)
    .map((kort) => {
      const lank = kort.match(/<h2 class="card-title">\s*<a href="([^"]+)"[^>]*?(?<![-\w])title="([^"]*)"/);
      if (!lank) return null;
      const block = (kort.match(/class="event-dates">([\s\S]*?)<\/div>\s*<\/div>/) || [, ""])[1];
      // Finns listan "visa alla tillfällen" tar vi den, annars de synliga tiderna.
      const lista = [...block.matchAll(/<time class="dropdown-item">([\s\S]*?)<\/time>/g)].map((x) => enRad(x[1]));
      const tider = lista.length ? lista : [...block.matchAll(/<time>([\s\S]*?)<\/time>/g)].map((x) => enRad(x[1]));
      const hemsida = kort.match(/class="event-homepage">[\s\S]*?<a href="([^"]+)"/);
      return {
        slug: lank[1].replace(/\/$/, "").split("/").pop(),
        url: `https://www.kubikuppsala.se${lank[1]}`,
        titel: enRad(lank[2]),
        tider,
        plats: falt(kort, "location"),
        adress: falt(kort, "location-address"),
        arrangor: falt(kort, "organizer"),
        hemsida: hemsida ? avkoda(hemsida[1]) : null,
        gratis: kort.includes('class="event-free'),
        kategorier: taggar(kort, "event-tags-categories"),
        malgrupp: taggar(kort, "event-tags-targetgroup"),
      };
    })
    .filter(Boolean);
}

function kategori(k) {
  const vara = k.kategorier.map((c) => KATEGORIER[c]).filter(Boolean);
  return ORDNING.find((c) => vara.includes(c)) || "ovrigt";
}

const medTid = (dag, tid) => (tid ? tillSvenskTid(`${dag}T${tid}`) : dag);

// Ett kort blir ett eller flera evenemang: ett per tillfälle eller period.
export function tillEvenemang(k) {
  if (k.kategorier.some((c) => TJANSTER.test(c))) return [];
  const barn = !k.malgrupp.length || k.malgrupp.some((m) => m !== "19-25 år");
  const gemensamt = {
    titel: k.titel,
    plats: { namn: k.plats || "Uppsala", id: `kubik-plats-${(k.plats || "uppsala").toLowerCase().replace(/[^a-z0-9åäö]+/g, "-")}` },
    kategori: kategori(k),
    gratis: k.gratis ? true : null,
    barnOchFamilj: barn,
    ...(k.malgrupp.length && { alder: k.malgrupp.join(", ") }),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: k.url, ...(k.hemsida && { arrangor: k.hemsida }) }],
    installd: /inställ/i.test(k.titel),
  };
  return k.tider
    .map(tolkaTid)
    .filter(Boolean)
    .map((t, i) =>
      t.typ === "tillfalle"
        ? {
            id: `kubik-${k.slug}-${t.datum}${t.start ? "-" + t.start.replace(":", "") : ""}`,
            ...gemensamt,
            start: medTid(t.datum, t.start),
            slut: t.slut ? medTid(t.datum, t.slut) : null,
            langvarig: false,
          }
        : {
            id: `kubik-${k.slug}${i ? "-" + (i + 1) : ""}`,
            ...gemensamt,
            start: t.fran,
            slut: t.till,
            ...(t.start && { notering: `Återkommande${t.slut ? `, kl. ${t.start}–${t.slut}` : `, kl. ${t.start}`}. Se Kubik för vilka dagar.` }),
            langvarig: true,
          },
    )
    .map(({ id, ...resten }) => ({ id, ...resten }));
}

export function bearbeta(kort) {
  return kort.flatMap(tillEvenemang);
}
