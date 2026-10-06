// Kontrollerar Claudes svar och sparar de godkända i data/etiketter.json.
//
// Körs efter Claude-steget:
//   node scripts/klassning/validera.mjs
//
// Helt förutsägbar, utan AI. Ett svar godkänns bara om:
//   - det följer schemat och bara använder tillåtna värden
//   - belägget finns ordagrant i källtexten eller titeln
//   - åldersiffrorna finns i belägget
//   - en kurs har en period på mer än 14 dagar
// Allt annat blir "okand". Belägget används bara här och sparas inte.

import { readFile, writeFile } from "node:fs/promises";
import { FORMAT, KATEGORIER } from "../gemensamt/klassa.mjs";
import { DAGKODER } from "../gemensamt/veckodagar.mjs";
import { PROMPTVERSION } from "./ko.mjs";

export const MODELL = process.env.KLASSA_MODELL || "claude-haiku-4-5-20251001";

const tvatta = (s) => String(s || "").normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
const finnsI = (belagg, k) => {
  const b = tvatta(belagg);
  return b.length >= 3 && (tvatta(k.kalltext).includes(b) || tvatta(k.titel).includes(b));
};
const dagar = (a, b) => (b ? Math.round((Date.parse(String(b).slice(0, 10)) - Date.parse(String(a).slice(0, 10))) / 86400000) + 1 : 1);
const tid = (t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

// Ger { etikett, avvisade } för ett svar mot sin post i kön.
export function validera(svar, k) {
  const ut = {};
  const avvisade = [];
  const b = svar?.belagg || {};
  const prova = (falt, ok, satt) => {
    if (ok) satt();
    else avvisade.push(falt);
  };

  if (svar.format && svar.format !== "okand") {
    const giltigt = FORMAT.includes(svar.format) && finnsI(b.format, k);
    const kursOk = svar.format !== "kurs" || dagar(k.start, k.slut) > 14;
    const dagarOk = svar.format !== "aterkommande" || (Array.isArray(svar.dagar) && svar.dagar.length && svar.dagar.every((d) => DAGKODER.includes(d)));
    prova("format", giltigt && kursOk && dagarOk, () => {
      ut.format = svar.format;
      if (svar.format === "aterkommande") {
        ut.serie = { dagar: DAGKODER.filter((d) => svar.dagar.includes(d)) };
        if (tid(svar.tider?.start)) ut.serie.start = svar.tider.start;
        if (tid(svar.tider?.slut) && svar.tider.slut > (ut.serie.start || "")) ut.serie.slut = svar.tider.slut;
      }
    });
  }
  if (svar.kategori && svar.kategori !== "okand") {
    prova("kategori", KATEGORIER.includes(svar.kategori) && finnsI(b.kategori, k), () => (ut.kategori = svar.kategori));
  }
  if (svar.alderMin !== undefined && svar.alderMin !== "okand" && svar.alderMax !== "okand") {
    const [min, max] = [svar.alderMin, svar.alderMax];
    const heltal = Number.isInteger(min) && Number.isInteger(max) && min >= 0 && max <= 99 && min <= max;
    const siffror = (String(b.alder || "").match(/\d+/g) || []).map(Number);
    // Belägget måste tala om ålder i år, inte årskurs eller årtal.
    const iAr = /\d\s*(år|-?åring)/i.test(String(b.alder || "")) && !/årskurs|\båk\b/i.test(String(b.alder || ""));
    prova("alder", heltal && iAr && finnsI(b.alder, k) && siffror.includes(min) && siffror.includes(max), () => (ut.alder = [min, max]));
  }
  if (typeof svar.barn === "boolean") {
    prova("barn", finnsI(b.barn, k), () => (ut.barnOchFamilj = svar.barn));
  }
  return { etikett: ut, avvisade };
}

async function lasJson(fil, reserv) {
  try {
    return JSON.parse(await readFile(fil, "utf8"));
  } catch {
    return reserv;
  }
}

async function main() {
  const ko = await lasJson("tmp/ko.json", { evenemang: [] });
  const svar = await lasJson("tmp/svar.json", null);
  if (!svar) {
    console.log("Inga svar från Claude (tmp/svar.json saknas). Sidan byggs med bara reglerna.");
    return;
  }
  const etiketter = await lasJson("data/etiketter.json", { poster: {} });
  if (etiketter.promptversion !== PROMPTVERSION) etiketter.poster = {}; // ny promptversion: allt klassas om
  etiketter.promptversion = PROMPTVERSION;
  const perId = new Map(ko.evenemang.map((k) => [k.id, k]));
  let godkanda = 0;
  let avvisade = 0;
  for (const s of svar.svar || []) {
    const k = perId.get(s?.id);
    if (!k || s.hash !== k.hash) continue;
    const { etikett, avvisade: nej } = validera(s, k);
    avvisade += nej.length;
    // Även ett svar utan godkända fält sparas, så att samma evenemang inte frågas om varje dag.
    etiketter.poster[k.id] = { hash: k.hash, modell: MODELL, promptversion: PROMPTVERSION, ...etikett };
    if (Object.keys(etikett).length) godkanda++;
  }
  await writeFile("data/etiketter.json", JSON.stringify(etiketter, null, 1) + "\n");
  console.log(`AI-svar: ${godkanda} evenemang fick minst en etikett, ${avvisade} fält avvisades av kontrollen.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((fel) => console.log(`::warning::AI-svaren kunde inte kontrolleras: ${fel.message}`));
}
