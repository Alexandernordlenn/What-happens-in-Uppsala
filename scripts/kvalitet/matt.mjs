// Mäter kvaliteten på data/sida.json och skriver data/kvalitet.json.
//
// Körs så här (efter bygget):
//   node scripts/kvalitet/matt.mjs
//
// Måtten räknas per källa och totalt: hur många som saknar klockslag, ålder
// eller område, hur många som hamnar i "övrigt", hur många dubbletter som
// slagits ihop och hur många som kan finnas kvar. Personkontrollerna i
// personer.mjs körs också och hamnar i samma fil.
//
// I GitHub Actions skrivs en kort tabell till körningens sammanfattning.
// Mätningen stoppar aldrig något, den bara rapporterar.

import { readFile, writeFile, appendFile } from "node:fs/promises";
import { normaliseraTitel } from "../gemensamt/titel.mjs";
import { iPagarRaden, overlapparPeriod, plusDagar } from "./sida.mjs";

const KALLNAMN = {
  i: "Sport", s: "Stadsteatern", b: "Biblioteket", u: "Kubik", k: "Svenska kyrkan",
  d: "Destination Uppsala", m: "Ticketmaster", h: "Heja", t: "Tickster",
};

const minuter = (tm) => (tm ? +tm.slice(0, 2) * 60 + +tm.slice(3, 5) : null);
const andel = (del, hela) => (hela ? Math.round((del / hela) * 1000) / 1000 : 0);

// Samma dag, samma plats, samma normaliserade titel och klockslag som skiljer
// högst 60 minuter (eller saknas). Det borde vara samma evenemang.
export function misstanktaDubbletter(sida) {
  const grupper = new Map();
  for (const e of sida.evenemang) {
    const nyckel = `${e.d}|${e.v}|${normaliseraTitel(e.t)}`;
    (grupper.get(nyckel) || grupper.set(nyckel, []).get(nyckel)).push(e);
  }
  const par = [];
  for (const lista of grupper.values()) {
    for (let i = 0; i < lista.length; i++) {
      for (let j = i + 1; j < lista.length; j++) {
        const [a, b] = [minuter(lista[i].tm), minuter(lista[j].tm)];
        if (a === null || b === null || Math.abs(a - b) <= 60) par.push([lista[i], lista[j]]);
      }
    }
  }
  return par;
}

function matt(evenemang, sida, kursAntal = 0) {
  const idag = sida.idag;
  const endags = evenemang.filter((e) => !e.e && !e.hd);
  const familj = evenemang.filter((e) => e.fam);
  const pagar = evenemang.filter((e) => iPagarRaden(e) && overlapparPeriod(e, idag, plusDagar(idag, 13)));
  return {
    antal: evenemang.length,
    utanKlockslag: andel(endags.filter((e) => !e.tm).length, endags.length),
    ovrigt: andel(evenemang.filter((e) => e.c === "ovrigt").length, evenemang.length),
    familjUtanAlder: andel(familj.filter((e) => !e.a).length, familj.length),
    utanOmrade: andel(evenemang.filter((e) => !e.o).length, evenemang.length),
    sammanslagna: evenemang.reduce((s, e) => s + Math.max(0, e.s.length - 1), 0),
    pagar14: pagar.length,
    borttagnaKurser: kursAntal,
    ...(sida.statistik?.ai && { aiTackning: sida.statistik.ai.tackning }),
  };
}

export function mat(sida) {
  const dubbletter = misstanktaDubbletter(sida);
  const kurser = sida.statistik?.kurser || {};
  const totalt = {
    ...matt(sida.evenemang, sida, Object.values(kurser).reduce((s, n) => s + n, 0)),
    misstanktaDubbletter: dubbletter.length,
  };
  const perKalla = {};
  for (const bokstav of Object.keys(sida.kallor || {})) {
    const egna = sida.evenemang.filter((e) => e.s.some((s) => s[0] === bokstav));
    perKalla[bokstav] = {
      namn: KALLNAMN[bokstav] || bokstav,
      ...matt(egna, sida, kurser[bokstav] || 0),
      misstanktaDubbletter: dubbletter.filter(([a, b]) => [a, b].some((e) => e.s.some((s) => s[0] === bokstav))).length,
    };
  }
  return {
    matt: new Date().toISOString(),
    idag: sida.idag,
    totalt,
    perKalla,
    exempelDubbletter: dubbletter.slice(0, 20).map(([a, b]) => ({ dag: a.d, plats: a.v, titlar: [a.t, b.t], tider: [a.tm || null, b.tm || null] })),
    ...(sida.statistik?.sammanslagningar && { sammanslagningar: sida.statistik.sammanslagningar }),
  };
}

const pct = (x) => `${Math.round(x * 1000) / 10} %`;

export function sammanfattning(rapport) {
  const rader = [
    "## Kvalitet",
    "",
    "| Källa | Antal | Utan klockslag | Övrigt | Familj utan ålder | Utan område | Sammanslagna | Misstänkta dubbletter | Pågår 14 dagar | Borttagna kurser |",
    "|---|---|---|---|---|---|---|---|---|---|",
  ];
  const rad = (namn, m) =>
    `| ${namn} | ${m.antal} | ${pct(m.utanKlockslag)} | ${pct(m.ovrigt)} | ${pct(m.familjUtanAlder)} | ${pct(m.utanOmrade)} | ${m.sammanslagna} | ${m.misstanktaDubbletter} | ${m.pagar14} | ${m.borttagnaKurser} |`;
  for (const m of Object.values(rapport.perKalla)) rader.push(rad(m.namn, m));
  rader.push(rad("**Totalt**", rapport.totalt));
  if (rapport.personer?.length) {
    rader.push("", "### Personkontroller", "", "| Person | Kontroll | Resultat | Krav | |", "|---|---|---|---|---|");
    for (const p of rapport.personer) {
      rader.push(`| ${p.person} | ${p.namn} | ${p.varde} | ${p.krav} | ${p.ok === null ? "–" : p.ok ? "✅" : "❌"} |`);
    }
  }
  return rader.join("\n") + "\n";
}

async function lasJson(fil) {
  try {
    return JSON.parse(await readFile(fil, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const ut = process.argv.includes("--fore") ? "data/kvalitet-fore.json" : "data/kvalitet.json";
  const sida = await lasJson("data/sida.json");
  if (!sida) throw new Error("Hittade inte data/sida.json");
  const rapport = mat(sida);
  const { korPersoner } = await import("./personer.mjs");
  rapport.personer = await korPersoner(sida, { sportLag: await lasJson("data/sport-lag.json") });
  await writeFile(ut, JSON.stringify(rapport, null, 2) + "\n");
  const text = sammanfattning(rapport);
  console.log(text);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, text);
  console.log(`Sparade ${ut}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((fel) => {
    // Mätningen får aldrig stoppa publiceringen, så felet blir bara en varning.
    console.log(`::warning::Kvalitetsmätningen misslyckades: ${fel.message}`);
  });
}
