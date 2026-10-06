// Sparar resultatet från en källa, på samma sätt för alla källor.
//
//   data/<källa>.json          färdiga evenemang, som sidan läser
//   data/radata/<källa>.json   rådatan (läggs inte i repot)
//   Firestore                  båda, om FIREBASE_SERVICE_ACCOUNT finns
//
// Innehåller också skydden:
// - Noll evenemang stoppar allt innan något skrivs över.
// - Färre än hälften av medianen för de senaste 14 körningarna: gårdagens fil
//   behålls, i högst 3 dagar, och en varning skrivs. Efter 3 dagar godtas det
//   nya antalet, eftersom källan kan ha krympt på riktigt.
// Antalen sparas i data/historik.json, som larmen (scripts/kvalitet/larm.mjs) läser.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { normaliseraPlats } from "./platser.mjs";

const HISTORIK = "data/historik.json";
const ANTAL_KORNINGAR = 14;
const MAX_DAGAR_BEHALLEN = 3;

async function lasJson(fil, reserv) {
  try {
    return JSON.parse(await readFile(fil, "utf8"));
  } catch {
    return reserv;
  }
}

export function median(tal) {
  if (!tal.length) return null;
  const s = [...tal].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Avgör om det nya antalet ska sparas. Ren funktion, så att den går att testa.
//   historik = { antal: [{ datum, antal }], dagarBehallen }
export function bedomAntal(historik, antal, datum) {
  const tidigare = (historik?.antal || []).filter((h) => h.datum !== datum).slice(-ANTAL_KORNINGAR);
  const med = median(tidigare.map((h) => h.antal));
  const behallen = historik?.dagarBehallen || 0;
  const lagt = med !== null && antal < med / 2;
  if (lagt && behallen < MAX_DAGAR_BEHALLEN) {
    return {
      spara: false,
      status: "behallen",
      varning: `bara ${antal} evenemang, mot vanligtvis ${med}. Gårdagens fil behålls (dag ${behallen + 1} av ${MAX_DAGAR_BEHALLEN}).`,
      historik: { antal: tidigare, dagarBehallen: behallen + 1 },
    };
  }
  return {
    spara: true,
    status: lagt ? "lagt" : "ok",
    ...(lagt && { varning: `bara ${antal} evenemang, mot vanligtvis ${med}. Godtas efter ${MAX_DAGAR_BEHALLEN} dagar, källan kan ha krympt.` }),
    historik: { antal: [...tidigare, { datum, antal }].slice(-ANTAL_KORNINGAR), dagarBehallen: 0 },
  };
}

async function uppdateraHistorik(id, post) {
  const alla = await lasJson(HISTORIK, {});
  alla[id] = post;
  await writeFile(HISTORIK, JSON.stringify(alla, null, 2) + "\n");
}

// kalla = { id, namn, attribution?, licensUrl?, webbsida?, kategoriFranPlats? }
// Ger true om filen sparades, false om gårdagens fil behölls.
export async function sparaKalla(kalla, evenemang, radata = []) {
  const utfil = `data/${kalla.id}.json`;
  const rafil = `data/radata/${kalla.id}.json`;
  const hamtad = new Date().toISOString();
  const datum = hamtad.slice(0, 10);

  console.log(`${kalla.namn}: ${radata.length} poster i rådatan, ${evenemang.length} evenemang.`);

  const historik = (await lasJson(HISTORIK, {}))[kalla.id];
  if (evenemang.length === 0) {
    await uppdateraHistorik(kalla.id, { ...historik, senaste: { datum, antal: 0, status: "noll" } });
    throw new Error(`${kalla.namn} gav noll evenemang. Något är troligen fel, så inget sparas.`);
  }

  // Första gången finns ingen historik. Då räknas förra filens antal som en körning.
  const forra = historik ? null : (await lasJson(utfil, null))?.antal;
  const bedomning = bedomAntal(historik || (forra ? { antal: [{ datum: "tidigare", antal: forra }] } : null), evenemang.length, datum);
  await mkdir("data/radata", { recursive: true });
  await uppdateraHistorik(kalla.id, { ...bedomning.historik, senaste: { datum, antal: evenemang.length, status: bedomning.status } });
  if (bedomning.varning) console.log(`::warning::${kalla.namn}: ${bedomning.varning}`);
  if (!bedomning.spara) {
    await writeFile(rafil, JSON.stringify({ hamtad, antal: radata.length, poster: radata }, null, 2) + "\n");
    return false;
  }

  const sorterade = evenemang
    .map((e) => normaliseraPlats(e, { kategoriFranPlats: kalla.kategoriFranPlats }))
    .sort((a, b) => String(a.start).localeCompare(String(b.start)));

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

  return true;
}

// Kör en hämtning och ser till att fel syns tydligt i GitHub.
export function kor(huvudprogram) {
  huvudprogram().catch((fel) => {
    console.error(`::error::${fel.message}`);
    process.exit(1);
  });
}
