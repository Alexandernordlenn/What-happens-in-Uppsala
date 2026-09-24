// Regler för Svenska kyrkans evenemang.
//
// Den här filen hämtar ingenting själv. Den tar emot rådata (en lista med
// evenemang precis som API:et skickar dem) och gör om dem till färdiga
// evenemang enligt reglerna i CLAUDE.md. Därför går den att testa utan nyckel.

export const KALLA = {
  id: "svenska-kyrkan",
  namn: "Svenska kyrkan",
  licens: "CC BY 4.0",
  licensUrl: "https://creativecommons.org/licenses/by/4.0/deed.sv",
  attribution: "Källa: Svenska kyrkan, CC BY 4.0, bearbetad",
  webb: "https://www.svenskakyrkan.se/uppsala",
};

const TIDSZON = "Europe/Stockholm";

// ---------- Små hjälpfunktioner ----------

// Hämtar första värdet som finns av flera möjliga fältnamn.
// Vi vet inte exakt vad varje fält heter i API:et, så vi provar några varianter.
function forsta(obj, ...namn) {
  for (const n of namn) {
    const v = n.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

// Gör text jämförbar: små bokstäver, inga extra mellanslag.
function normalisera(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

// Tar bort HTML-taggar ur beskrivningar.
function renText(s) {
  if (!s) return "";
  return String(s)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Tar reda på vilka typer ett evenemang har, till exempel ["musikOchKor"].
// API:et kan skicka typerna som ett objekt ({ musikOchKor: true }),
// som en lista med ord eller som en lista med objekt. Vi klarar alla tre.
export function typer(ev) {
  const t = forsta(ev, "eventType", "eventTypes", "types");
  if (!t) return [];
  if (Array.isArray(t)) {
    return t
      .map((x) => (typeof x === "string" ? x : forsta(x, "id", "key", "name", "value")))
      .filter(Boolean)
      .map(String);
  }
  if (typeof t === "object") return Object.keys(t).filter((k) => t[k]);
  if (typeof t === "string") return t.split(/[,\s]+/).filter(Boolean);
  return [];
}

// ---------- Tider ----------

// Räknar ut hur många minuter svensk tid ligger före UTC vid en viss tidpunkt
// (60 på vintern, 120 på sommaren).
function svenskForskjutning(datum) {
  const delar = new Intl.DateTimeFormat("en-US", {
    timeZone: TIDSZON, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(datum);
  const v = Object.fromEntries(delar.map((p) => [p.type, p.value]));
  const somUtc = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second);
  return Math.round((somUtc - datum.getTime()) / 60000);
}

// Gör om en tid från API:et till en tid med svensk tidszon,
// till exempel "2026-09-24T19:00:00+02:00".
// Om tiden saknar tidszon utgår vi från att den redan är i svensk tid.
export function tillSvenskTid(varde) {
  if (!varde) return null;
  const s = String(varde);
  let datum;
  if (/[zZ]$|[+-]\d\d:?\d\d$/.test(s)) {
    datum = new Date(s);
  } else {
    const m = s.match(/^(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d):(\d\d)(?::(\d\d))?)?/);
    if (!m) return null;
    const somUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    // Två varv behövs för att hamna rätt precis kring sommartidsbytet.
    let gissning = new Date(somUtc - svenskForskjutning(new Date(somUtc)) * 60000);
    gissning = new Date(somUtc - svenskForskjutning(gissning) * 60000);
    datum = gissning;
  }
  if (isNaN(datum)) return null;
  const f = svenskForskjutning(datum);
  const lokal = new Date(datum.getTime() + f * 60000).toISOString().slice(0, 19);
  const tecken = f >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(f) / 60)).padStart(2, "0");
  const mm = String(Math.abs(f) % 60).padStart(2, "0");
  return `${lokal}${tecken}${hh}:${mm}`;
}

// ---------- Filtrering ----------

// Gudstjänster, mässor, andakter, böner och meditationer tas bort.
// "bön" träffar i början av ett ord (bönegrupp) och i slutet (morgonbön),
// men inte "bönor".
const GUDSTJANST_ORD =
  /mässa|mässan|gudstjänst|andakt|meditation|(^|[^a-zåäö])bön(?!or)|bön(en|er|erna)?(?![a-zåäö])/i;

export function arGudstjanst(ev) {
  const t = typer(ev);
  const titel = String(forsta(ev, "title", "name", "heading") || "");
  return t.includes("gudstjanstOchMassa") || GUDSTJANST_ORD.test(titel);
}

// Sant om evenemanget ska vara med i kalendern.
export function skaMed(ev) {
  if (typer(ev).includes("musikOchKor")) return true; // Musik behålls alltid, t.ex. aftonsång.
  return !arGudstjanst(ev);
}

// ---------- Kategorier ----------

const TYP_TILL_KATEGORI = {
  musikOchKor: "musik",
  konstOchKultur: "museum",
  studierOchSamtal: "prat",
};

const BARNTYPER = ["barnverksamhet", "ungdomsverksamhet"];

// Används när typ saknas. Ordningen spelar roll: första träffen vinner.
const ORD_TILL_KATEGORI = [
  ["musik", /konsert|musik|kör(en|er)?\b|orgel|sång|jazz|psalm|kammar|aftonsång|evensong/i],
  ["scen", /teater|film|bio\b|föreställning|dans/i],
  ["museum", /utställning|konst|vernissage|museum|visning|guidning|vandring/i],
  ["prat", /föredrag|föreläsning|samtal|seminarium|studiecirkel|bokcirkel|berättar/i],
  ["mat", /lunch|middag|soppa|frukost|fika|våfflor|mat\b/i],
  ["ovrigt", /loppis|marknad|basar|festival/i],
];

export function kategori(ev) {
  for (const t of typer(ev)) if (TYP_TILL_KATEGORI[t]) return TYP_TILL_KATEGORI[t];
  const text = `${forsta(ev, "title", "name") || ""} ${renText(forsta(ev, "description", "text", "body"))}`;
  for (const [kat, re] of ORD_TILL_KATEGORI) if (re.test(text)) return kat;
  return "ovrigt";
}

export function barnOchFamilj(ev) {
  if (typer(ev).some((t) => BARNTYPER.includes(t))) return true;
  const text = `${forsta(ev, "title", "name") || ""}`;
  return /\bbarn|familj|knytte|babyrytmik|miniorer/i.test(text);
}

// Gratis om API:et säger det eller om beskrivningen säger "fri entré".
// Annars vet vi inte, och då blir värdet null.
export function gratis(ev) {
  const f = forsta(ev, "free", "isFree", "freeOfCharge");
  if (typeof f === "boolean") return f;
  const pris = forsta(ev, "price", "cost", "fee");
  if (pris !== undefined) {
    if (typeof pris === "number") return pris === 0;
    if (/fri entré|gratis|kostnadsfri|ingen kostnad|^0/i.test(String(pris))) return true;
  }
  const text = renText(forsta(ev, "description", "text", "body"));
  if (/fri entré|fritt inträde|gratis|kostnadsfri/i.test(text)) return true;
  return null;
}

// ---------- Plats och länk ----------

export function plats(ev) {
  const p = forsta(ev, "place", "location", "venue") || {};
  const namn =
    (typeof p === "string" ? p : forsta(p, "name", "title", "displayName")) ||
    forsta(ev, "placeName", "locationName") ||
    "Okänd plats";
  const id = forsta(p, "id", "placeId") || forsta(ev, "placeId", "locationId");
  return {
    namn: String(namn).trim(),
    id: id ? `svk-plats-${id}` : `svk-plats-${normalisera(namn).replace(/[^a-z0-9åäö]+/g, "-")}`,
  };
}

function lank(ev) {
  const u = forsta(ev, "url", "link", "webUrl", "externalUrl", "permalink");
  if (u && /^https?:\/\//.test(u)) return u;
  return `${KALLA.webb}/kalender`;
}

// ---------- Personuppgifter ----------

// Tar bort kontaktpersoner och medverkande innan något sparas.
export function utanPersonuppgifter(ev) {
  if (Array.isArray(ev)) return ev.map(utanPersonuppgifter);
  if (!ev || typeof ev !== "object") return ev;
  const ut = {};
  for (const [k, v] of Object.entries(ev)) {
    if (/^(contact|contacts|performer|performers|contactPerson)$/i.test(k)) continue;
    ut[k] = typeof v === "object" ? utanPersonuppgifter(v) : v;
  }
  return ut;
}

// ---------- Från rådata till färdigt evenemang ----------

export function tillEvenemang(ev) {
  const id = forsta(ev, "id", "eventId", "uid");
  const start = tillSvenskTid(forsta(ev, "startTime", "start", "startDate", "from", "startDateTime"));
  const slut = tillSvenskTid(forsta(ev, "endTime", "end", "endDate", "to", "endDateTime"));
  const status = normalisera(forsta(ev, "status", "state"));
  const installd =
    forsta(ev, "cancelled", "canceled", "isCancelled") === true ||
    /cancel|inställ/.test(status) ||
    /^inställt?\b/i.test(String(forsta(ev, "title", "name") || ""));
  return {
    id: `svk-${id}`,
    titel: String(forsta(ev, "title", "name", "heading") || "Utan titel").trim(),
    beskrivning: renText(forsta(ev, "description", "text", "body")),
    start,
    slut,
    plats: plats(ev),
    kategori: kategori(ev),
    gratis: gratis(ev),
    barnOchFamilj: barnOchFamilj(ev),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: lank(ev), licens: KALLA.attribution }],
    langvarig: false,
    installd,
  };
}

// Långa utställningar kommer som en post per dag. Samma titel på samma plats,
// på minst två olika dagar, slås ihop till en enda långvarig post.
export function slaIhopUtstallningar(lista) {
  const grupper = new Map();
  for (const e of lista) {
    const nyckel = `${normalisera(e.titel)}|${e.plats.id}`;
    if (!grupper.has(nyckel)) grupper.set(nyckel, []);
    grupper.get(nyckel).push(e);
  }
  const ut = [];
  for (const grupp of grupper.values()) {
    const dagar = new Set(grupp.map((e) => (e.start || "").slice(0, 10)));
    const arUtstallning = grupp[0].kategori === "museum" || /utställning/i.test(grupp[0].titel);
    if (grupp.length < 2 || dagar.size < 2 || !arUtstallning) {
      ut.push(...grupp);
      continue;
    }
    grupp.sort((a, b) => String(a.start).localeCompare(String(b.start)));
    const forstaPost = grupp[0];
    const sistaPost = grupp[grupp.length - 1];
    ut.push({
      ...forstaPost,
      slut: sistaPost.slut || sistaPost.start,
      langvarig: true,
      installd: grupp.every((e) => e.installd),
    });
  }
  return ut.sort((a, b) => String(a.start).localeCompare(String(b.start)));
}

// Hela kedjan: filtrera, gör om och slå ihop.
export function bearbeta(radata) {
  const med = radata.filter(skaMed).map(tillEvenemang).filter((e) => e.start);
  return slaIhopUtstallningar(med);
}
