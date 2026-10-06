// Källtext för AI-klassningen (fas 9 i UPPDRAG-KVALITET.md).
//
// Under hämtningen får en kort text per evenemang (högst 600 tecken) skrivas
// till tmp/kalltext/<källa>.json, så att Claude kan läsa ut format, dagar och
// ålder som reglerna missade. Texten sparas aldrig i repot, laddas aldrig upp
// som bilaga och skrivs aldrig ut i loggen. tmp/ ligger i .gitignore.

import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";

export const MAX_TECKEN = 600;

export const kortaText = (text) => String(text || "").replace(/\s+/g, " ").trim().slice(0, MAX_TECKEN);

// texter = { "<källpostens id>": "text" }
export async function sparaKalltext(kallId, texter) {
  const ut = {};
  for (const [id, text] of Object.entries(texter)) {
    const kort = kortaText(text);
    if (kort) ut[id] = kort;
  }
  await mkdir("tmp/kalltext", { recursive: true });
  await writeFile(`tmp/kalltext/${kallId}.json`, JSON.stringify(ut) + "\n");
}

// Innehållshash: ändras titeln, platsen eller tiden klassas evenemanget om.
export function innehallshash(e) {
  return createHash("sha1")
    .update(JSON.stringify([e.titel, e.plats?.namn, e.start, e.slut]))
    .digest("hex")
    .slice(0, 12);
}
