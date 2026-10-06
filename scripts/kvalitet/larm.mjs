// Larm som GitHub-ärenden (issues) med etiketten "larm".
//
// Körs sist i morgonkörningen:
//   node scripts/kvalitet/larm.mjs
//
// Ett ärende per problem, till exempel "Källa: Tickster gav 0" eller
// "Kvalitet: Lisa-testet". Finns redan ett öppet ärende för samma problem
// skrivs en kommentar i stället. När kontrollen går igenom igen stängs
// ärendet automatiskt. Larmen stoppar aldrig publiceringen.
//
// Behöver GH_TOKEN (GitHubs egen token i workflowet räcker) och gh, som finns
// på GitHubs datorer. Stegens utfall kommer som JSON i miljövariabeln UTFALL.

import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";

export const ETIKETT = "larm";

const KALLNAMN = {
  "svenska-kyrkan": "Svenska kyrkan", stadsteatern: "Uppsala stadsteater", "destination-uppsala": "Destination Uppsala",
  tickster: "Tickster", bibliotek: "Bibliotek Uppsala", heja: "Heja Uppsala", kubik: "Kubik Uppsala", sport: "Sport",
  ticketmaster: "Ticketmaster",
};
const BOKSTAV_TILL_ID = { i: "sport", s: "stadsteatern", b: "bibliotek", u: "kubik", k: "svenska-kyrkan", d: "destination-uppsala", m: "ticketmaster", h: "heja", t: "tickster" };

// Samlar alla problem från dagens körning. Ren funktion, så att den går att testa.
export function hittaProblem({ historik = {}, kvalitet = null, sida = null, sportLag = null, utfall = {}, harClaude = null } = {}) {
  const ut = [];
  if (harClaude === false) {
    ut.push({ titel: "AI-steget fungerar inte", text: "Hemligheten CLAUDE_CODE_OAUTH_TOKEN saknas, så Claude-steget körs inte. Sidan byggs med bara reglerna. Se BACKLOG.md för hur token skapas." });
  }
  const idag = sida?.idag;
  for (const [id, h] of Object.entries(historik)) {
    const namn = KALLNAMN[id] || id;
    const s = h.senaste;
    if (!s || (idag && s.datum !== idag)) continue;
    if (s.status === "noll") ut.push({ titel: `Källa: ${namn} gav 0`, text: `${namn} gav noll evenemang den ${s.datum}. Gårdagens data visas fortfarande.` });
    if (s.status === "behallen" || s.status === "lagt") {
      ut.push({
        titel: `Källa: ${namn} gav för få`,
        text: `${namn} gav ${s.antal} evenemang den ${s.datum}, mindre än hälften av det vanliga. ${s.status === "behallen" ? "Gårdagens fil behålls." : "Det nya antalet har godtagits efter tre dagar."}`,
      });
    }
  }
  for (const [namn, resultat] of Object.entries(utfall)) {
    if (resultat !== "failure") continue;
    if (namn === "AI") {
      if (ut.some((p) => p.titel === "AI-steget fungerar inte")) continue;
      ut.push({ titel: "AI-steget fungerar inte", text: "Claude-steget misslyckades. Sidan byggdes med bara reglerna. Kontrollera att hemligheten CLAUDE_CODE_OAUTH_TOKEN finns och inte har gått ut." });
      continue;
    }
    if (ut.some((p) => p.titel.startsWith(`Källa: ${namn} `))) continue;
    ut.push({ titel: `Källa: ${namn} misslyckades`, text: `Steget "${namn}" misslyckades. Se loggen för körningen.` });
  }
  for (const [bokstav, k] of Object.entries(sida?.kallor || {})) {
    if (!k.inaktuell) continue;
    const namn = KALLNAMN[BOKSTAV_TILL_ID[bokstav]] || bokstav;
    ut.push({ titel: `Källa: ${namn} är inaktuell`, text: `${namn} hämtades senast ${String(k.hamtad).slice(0, 10)}, mer än tre dygn sedan. Sidan visar den gamla datan och markerar källan som inaktuell.` });
  }
  const perPerson = {};
  for (const p of kvalitet?.personer || []) if (p.ok === false) (perPerson[p.person] ||= []).push(p);
  for (const [person, lista] of Object.entries(perPerson)) {
    ut.push({
      titel: `Kvalitet: ${person}-testet`,
      text: lista.map((p) => `- ${p.namn}: ${p.varde} (krav: ${p.krav})`).join("\n"),
    });
  }
  for (const lag of sportLag?.lag || []) {
    if (lag.iSasong && !lag.hemmamatcher30) {
      ut.push({ titel: `Sport: ${lag.lag} saknar matcher`, text: `${lag.lag} (${lag.sport}, ${lag.liga}) är mitt i säsongen men har ingen hemmamatch de kommande 30 dagarna. Troligen har ligans eller lagets id bytts. Se scripts/sport/konfig.mjs.` });
    }
  }
  return ut;
}

// Vad ska göras med ärendena? oppna = [{ number, title }]
export function planera(problem, oppna) {
  const titlar = new Set(problem.map((p) => p.titel));
  return {
    skapa: problem.filter((p) => !oppna.some((o) => o.title === p.titel)),
    kommentera: problem.flatMap((p) => oppna.filter((o) => o.title === p.titel).map((o) => ({ ...p, number: o.number }))),
    stang: oppna.filter((o) => !titlar.has(o.title)),
  };
}

async function lasJson(fil) {
  try {
    return JSON.parse(await readFile(fil, "utf8"));
  } catch {
    return null;
  }
}

const gh = (...args) => execFileSync("gh", args, { encoding: "utf8" });

async function main() {
  const korning = process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : null;
  const problem = hittaProblem({
    historik: (await lasJson("data/historik.json")) || {},
    kvalitet: await lasJson("data/kvalitet.json"),
    sida: await lasJson("data/sida.json"),
    sportLag: await lasJson("data/sport-lag.json"),
    utfall: JSON.parse(process.env.UTFALL || "{}"),
    harClaude: process.env.HAR_CLAUDE ? process.env.HAR_CLAUDE === "true" : null,
  });
  console.log(`${problem.length} problem: ${problem.map((p) => p.titel).join(", ") || "inga"}`);
  if (!process.env.GH_TOKEN) {
    console.log("Ingen GH_TOKEN, så inga ärenden skapas.");
    return;
  }
  gh("label", "create", ETIKETT, "--color", "D93F0B", "--description", "Automatiskt larm från morgonkörningen", "--force");
  const oppna = JSON.parse(gh("issue", "list", "--label", ETIKETT, "--state", "open", "--json", "number,title", "--limit", "100"));
  const plan = planera(problem, oppna);
  const fot = korning ? `\n\n[Körningen](${korning})` : "";
  for (const p of plan.skapa) gh("issue", "create", "--title", p.titel, "--label", ETIKETT, "--body", p.text + fot);
  for (const p of plan.kommentera) gh("issue", "comment", String(p.number), "--body", `Finns kvar ${new Date().toISOString().slice(0, 10)}.\n\n${p.text}${fot}`);
  for (const o of plan.stang) gh("issue", "close", String(o.number), "--comment", `Kontrollen gick igenom igen.${fot}`);
  console.log(`Nya ärenden: ${plan.skapa.length}, kommentarer: ${plan.kommentera.length}, stängda: ${plan.stang.length}.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((fel) => console.log(`::warning::Larmen kunde inte skickas: ${fel.message}`));
}
