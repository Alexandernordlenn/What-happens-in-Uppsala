// Källornas egna filer, som inte ska ligga i det öppna repot.
//
// Sidan behöver bara data/sida.json. Källornas filer (data/<källa>.json) och
// minnet av lästa sidor (data/cache/) behövs bara av morgonkörningen. De
// sparas krypterade mellan körningarna, med hemligheten DATA_NYCKEL, i
// GitHubs cache (se .github/workflows/hamta-evenemang.yml).
//
// Skriver ut filernas sökvägar, en per rad, för tar:
//   node scripts/kalldata.mjs

import { readdirSync } from "node:fs";

// Filer i data/ som får ligga i repot: det sidan läser, kvalitetsrapporten,
// antal per dag, rättelser och AI-etiketter. Samma lista finns i .gitignore.
export const I_REPOT = new Set([
  "sida.json", "kvalitet.json", "kvalitet-fore.json", "historik.json",
  "rattelser.json", "etiketter.json", "sport-lag.json",
]);

const lista = (mapp) => {
  try {
    return readdirSync(mapp).filter((f) => f.endsWith(".json")).sort();
  } catch {
    return [];
  }
};

export function kalldataFiler(data = "data") {
  return [
    ...lista(data).filter((f) => !I_REPOT.has(f)).map((f) => `${data}/${f}`),
    ...lista(`${data}/cache`).map((f) => `${data}/cache/${f}`),
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const fil of kalldataFiler()) console.log(fil);
}
