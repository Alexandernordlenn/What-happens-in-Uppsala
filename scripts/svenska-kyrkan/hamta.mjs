// Hämtar evenemang från Svenska kyrkans CalendarAPI för Uppsala pastorat.
//
// Körs så här (nyckeln ska ligga i miljövariabeln SVK_API_KEY):
//   node scripts/svenska-kyrkan/hamta.mjs
//
// För att prova utan nyckel, med sparad exempeldata:
//   node scripts/svenska-kyrkan/hamta.mjs --fran-fil scripts/svenska-kyrkan/exempel.json
//
// Skriptet gör så här:
//   1. Hämtar alla sidor från API:et (via fältet "next").
//   2. Tar bort personuppgifter.
//   3. Gör om rådatan till färdiga evenemang (se regler.mjs).
//   4. Sparar i data/svenska-kyrkan.json och Firestore (se gemensamt/spara.mjs).

import { readFile } from "node:fs/promises";
import { sparaKalla, kor } from "../gemensamt/spara.mjs";
import { KALLA, bearbeta, utanPersonuppgifter } from "./regler.mjs";

const API = "https://svk-apim-prod.azure-api.net/calendar/v1/event/search";
const PARAMETRAR = {
  owner_id: "2218,2215,2216,2219,2217,12893", // Uppsala pastorat
  access: "External",
  expand: "*",
  limit: "50",
  from: "today",
  duration: "2w",
};
const MAX_SIDOR = 40; // Skydd mot en oändlig loop om något går fel.

// ---------- Hämtning ----------

// Plockar ut listan med evenemang ur ett svar, vad den än heter.
function evenemangISvar(svar) {
  if (Array.isArray(svar)) return svar;
  for (const n of ["items", "data", "events", "results", "value", "hits"]) {
    if (Array.isArray(svar?.[n])) return svar[n];
  }
  return [];
}

// Räknar ut adressen till nästa sida, eller null om det inte finns fler.
function nastaAdress(svar, nuvarande) {
  const next = svar?.next ?? svar?.links?.next ?? svar?.paging?.next;
  if (next === undefined || next === null || next === "" || next === false) return null;
  if (typeof next === "object") return nastaAdress({ next: next.href ?? next.url }, nuvarande);
  const s = String(next);
  if (/^https?:\/\//.test(s) || s.startsWith("/") || s.startsWith("?")) {
    return new URL(s, nuvarande).toString();
  }
  // Annars är "next" troligen en position eller en markör.
  const u = new URL(nuvarande);
  u.searchParams.set(/^\d+$/.test(s) ? "offset" : "cursor", s);
  return u.toString();
}

async function hamtaSida(adress, nyckel) {
  for (let forsok = 1; forsok <= 3; forsok++) {
    const svar = await fetch(adress, {
      headers: { "Ocp-Apim-Subscription-Key": nyckel, Accept: "application/json" },
    });
    if (svar.ok) return svar.json();
    // 429 = för många anrop, 5xx = fel hos dem. Då väntar vi och provar igen.
    if (svar.status === 429 || svar.status >= 500) {
      await new Promise((r) => setTimeout(r, 2000 * forsok));
      continue;
    }
    throw new Error(`API:et svarade ${svar.status} ${svar.statusText}: ${(await svar.text()).slice(0, 300)}`);
  }
  throw new Error("API:et svarade inte efter tre försök.");
}

async function hamtaAllt(nyckel) {
  let adress = `${API}?${new URLSearchParams(PARAMETRAR)}`;
  const alla = [];
  const sedda = new Set();
  for (let sida = 1; adress && sida <= MAX_SIDOR; sida++) {
    if (sedda.has(adress)) break; // Samma sida två gånger betyder att vi är klara.
    sedda.add(adress);
    const svar = await hamtaSida(adress, nyckel);
    const lista = evenemangISvar(svar);
    console.log(`Sida ${sida}: ${lista.length} evenemang`);
    if (sida === 1 && lista.length === 0) {
      console.log("Svaret såg ut så här (början):", JSON.stringify(svar).slice(0, 500));
    }
    alla.push(...lista);
    if (lista.length === 0) break;
    adress = nastaAdress(svar, adress);
  }
  return alla;
}

// ---------- Huvudprogrammet ----------

async function main() {
  const i = process.argv.indexOf("--fran-fil");
  let radata;
  if (i !== -1) {
    radata = evenemangISvar(JSON.parse(await readFile(process.argv[i + 1], "utf8")));
    console.log(`Läste ${radata.length} evenemang från fil.`);
  } else {
    const nyckel = process.env.SVK_API_KEY;
    if (!nyckel) throw new Error("Miljövariabeln SVK_API_KEY saknas.");
    radata = await hamtaAllt(nyckel);
  }

  // Personuppgifter tas bort direkt, så att de aldrig sparas någonstans.
  radata = utanPersonuppgifter(radata);
  await sparaKalla(
    { id: KALLA.id, namn: KALLA.namn, attribution: KALLA.attribution, licensUrl: KALLA.licensUrl },
    bearbeta(radata),
    radata,
  );
}

kor(main);
