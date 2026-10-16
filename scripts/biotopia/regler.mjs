// Regler för Biotopia, Uppsala kommuns naturmuseum vid Vasaparken, och dess
// utflykter (Hammarskog, Vedyxa, Röbo med flera).
//
// Kalendersidan (biotopia.nu/kalender/) har uppgifterna om varje evenemang
// som JSON i attributet data-properties: titel, underrubrik, plats,
// kategorier och datum. Det är strukturerad data, så vi behöver inte läsa av
// sidans text. Klockslag finns bara i den löpande texten, och där står också
// när biljetterna släpps ("kl 7.00"). Därför tas ett klockslag bara när texten
// har ett enda tidsintervall ("kl 10-12"). Annars sparas bara datumet.
//
// Vi sparar bara fakta: titel, datum, klockslag, plats, kategorier och länk.
// Texten om evenemanget läses bara här, under hämtningen, och sparas aldrig.

import { avkoda, enRad } from "../gemensamt/text.mjs";
import { gissaKategori } from "../gemensamt/kategori.mjs";
import { spannFranText } from "../gemensamt/omraden.mjs";
import { tillSvenskTid } from "../gemensamt/tid.mjs";

export const KALLA = {
  id: "biotopia",
  namn: "Biotopia",
  webbsida: "https://biotopia.nu/kalender/",
};

// Biotopias kategorier, i den ordning de avgör: ett föredrag med workshop är
// ett föredrag, men en workshop en onsdagskväll är en aktivitet.
const FOREDRAG = /^(föredrag|seniorlunch)$/i;
const VERKSTAD = /^(workshop|familjeaktivitet|torsdagskul)$/i;
const KVALL = /^onsdagskvällar$/i;
const AKTIVITET = /^(utflyktsprogrammet|smultronställe i naturen|lördagar i hammarskog)$/i;
const BARN = /^(för barn|familjeaktivitet|torsdagskul)$/i;
const LOV_ELLER_VERKSTAD = /lov\b|lovet|verkstad|workshop|pyssel/i;

// Unixtid (sekunder, midnatt UTC) blir ÅÅÅÅ-MM-DD.
const dag = (sekunder) => (Number.isFinite(+sekunder) && +sekunder > 0 ? new Date(+sekunder * 1000).toISOString().slice(0, 10) : null);
const dagarMellan = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

// Ett enda tidsintervall i texten, till exempel "kl 10-12" eller "17.30–19.00".
// Inga intervall, eller flera olika, ger null. En ensam tid räknas inte.
export function tidsintervall(text) {
  const t = enRad(text);
  const re = /(?:\bkl\.?\s*(\d{1,2})(?:[.:](\d{2}))?|\b(\d{1,2})[.:](\d{2}))\s*[-–]\s*(\d{1,2})(?:[.:](\d{2}))?\b/gi;
  const hittade = new Set();
  for (const m of t.matchAll(re)) {
    const [h1, m1, h2, m2] = [m[1] ?? m[3], m[2] ?? m[4] ?? "00", m[5], m[6] ?? "00"];
    if (+h1 < 7 || +h1 > 23 || +h2 > 24 || +h2 <= +h1) continue;
    // Utan "kl" kan "12.10–18.10" vara datum. Då krävs jämna minuter (00, 15, 30, 45).
    if (!m[1] && ![m1, m2].every((x) => ["00", "15", "30", "45"].includes(x))) continue;
    hittade.add(`${h1.padStart(2, "0")}:${m1}|${h2.padStart(2, "0")}:${m2}`);
  }
  if (hittade.size !== 1) return null;
  const [start, slut] = [...hittade][0].split("|");
  return { start, slut };
}

// Plockar ut evenemangen ur kalendersidan. Bara de fält vi använder sparas.
export function lasKalender(html) {
  const ut = [];
  const re = /<article\b[^>]*?\bdata-properties='([^']*)'[^>]*>([\s\S]*?)<\/article>/g;
  for (const [, egenskaper, innehall] of String(html).matchAll(re)) {
    let data;
    try {
      data = JSON.parse(avkoda(egenskaper));
    } catch {
      continue;
    }
    const s = data.search_criteria || {};
    const lank = avkoda(innehall.match(/href="([^"]+)"/)?.[1] || "");
    ut.push({
      titel: enRad(s.title),
      underrubrik: enRad(s.subtitle),
      plats: enRad(s.location),
      kategorier: (s.categories || []).map(enRad).filter(Boolean),
      datum: (data.date_range || []).map(dag).filter(Boolean),
      tider: tidsintervall(s.content),
      lank: /^https?:\/\//.test(lank) ? lank : null,
    });
  }
  return ut;
}

export function kategori(post, dagar) {
  // Något som pågår längre än en vecka och inte är en lovaktivitet är en utställning.
  if (dagar > 7 && !LOV_ELLER_VERKSTAD.test(post.titel)) return "museum";
  const har = (re) => post.kategorier.some((k) => re.test(k));
  if (har(FOREDRAG)) return "prat";
  if (har(VERKSTAD)) return "aktivitet";
  if (har(KVALL)) return "prat";
  if (har(AKTIVITET)) return "aktivitet";
  return gissaKategori(post.titel, "aktivitet");
}

export function tillEvenemang(post) {
  const [start, sista] = [post.datum[0], post.datum.at(-1)];
  const dagar = dagarMellan(start, sista);
  const nummer = post.lank?.match(/[?&]p=(\d+)/)?.[1];
  const plats = post.plats || "Biotopia";
  // Klockslag bara för endagsevenemang.
  const tider = dagar === 0 ? post.tider : null;
  return {
    id: `biotopia-${nummer || `${start}-${post.titel.toLowerCase().replace(/[^a-z0-9åäö]+/g, "-")}`}`,
    titel: post.titel,
    start: tider ? tillSvenskTid(`${start}T${tider.start}:00`) : start,
    slut: tider ? tillSvenskTid(`${start}T${tider.slut}:00`) : sista > start ? sista : null,
    plats: { namn: plats },
    kategori: kategori(post, dagar),
    gratis: null,
    barnOchFamilj: post.kategorier.some((k) => BARN.test(k)) || /barn|bäbis|bebis|familj|höstlov|sportlov|jullov|påsklov/i.test(post.titel),
    alder: spannFranText(post.underrubrik) || spannFranText(post.titel),
    kallor: [{ id: KALLA.id, namn: KALLA.namn, url: post.lank || KALLA.webbsida }],
    langvarig: dagar >= 3,
    installd: /inställ/i.test(`${post.titel} ${post.underrubrik}`),
    fakta: { kategorier: post.kategorier },
  };
}

export function bearbeta(poster, idag) {
  return poster
    .filter((p) => p.titel && p.datum.length)
    .map(tillEvenemang)
    .filter((e) => (e.slut || e.start) >= idag);
}
