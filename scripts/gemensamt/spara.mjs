// Sparar resultatet från en källa, på samma sätt för alla källor.
//
//   data/<källa>.json          färdiga evenemang, som sidan läser
//   data/radata/<källa>.json   rådatan (läggs inte i repot)
//   Firestore                  båda, om FIREBASE_SERVICE_ACCOUNT finns
//
// Innehåller också larmen: noll evenemang stoppar allt innan något skrivs
// över, och hälften så många som förra gången ger en varning.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { normaliseraPlats } from "./platser.mjs";

async function lasTidigareAntal(fil) {
  try {
    return JSON.parse(await readFile(fil, "utf8")).antal ?? null;
  } catch {
    return null;
  }
}

// kalla = { id, namn, attribution?, licensUrl?, webbsida?, kategoriFranPlats? }
export async function sparaKalla(kalla, evenemang, radata = []) {
  const utfil = `data/${kalla.id}.json`;
  const rafil = `data/radata/${kalla.id}.json`;
  const hamtad = new Date().toISOString();

  console.log(`${kalla.namn}: ${radata.length} poster i rådatan, ${evenemang.length} evenemang.`);

  if (evenemang.length === 0) {
    throw new Error(`${kalla.namn} gav noll evenemang. Något är troligen fel, så inget sparas.`);
  }

  const tidigare = await lasTidigareAntal(utfil);
  const sorterade = evenemang
    .map((e) => normaliseraPlats(e, { kategoriFranPlats: kalla.kategoriFranPlats }))
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

  await mkdir("data/radata", { recursive: true });
  await writeFile(rafil, JSON.stringify({ hamtad, antal: radata.length, poster: radata }, null, 2) + "\n");
  await writeFile(
    utfil,
    JSON.stringify(
      {
        kalla: kalla.namn,
        ...(kalla.attribution && { attribution: kalla.attribution }),
        ...(kalla.licensUrl && { licensUrl: kalla.licensUrl }),
        ...(kalla.webbsida && { webbsida: kalla.webbsida }),
        hamtad,
        antal: sorterade.length,
        evenemang: sorterade,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Sparade ${utfil} och ${rafil}.`);

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const { skrivTillFirestore } = await import("./firestore.mjs");
    await skrivTillFirestore(kalla.id, radata, sorterade, hamtad);
  } else {
    console.log("Ingen FIREBASE_SERVICE_ACCOUNT, så Firestore hoppas över.");
  }

  if (tidigare && sorterade.length < tidigare / 2) {
    // ::warning:: gör att GitHub visar en gul varning på körningen.
    console.log(`::warning::${kalla.namn}: bara ${sorterade.length} evenemang, förra gången ${tidigare}.`);
  }
}

// Kör en hämtning och ser till att fel syns tydligt i GitHub.
export function kor(huvudprogram) {
  huvudprogram().catch((fel) => {
    console.error(`::error::${fel.message}`);
    process.exit(1);
  });
}
