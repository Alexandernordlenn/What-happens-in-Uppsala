// Skriver en källas evenemang till Firestore.
//
// Används bara om GitHub-hemligheten FIREBASE_SERVICE_ACCOUNT finns.
// Den innehåller nyckelfilen (JSON) för ett tjänstekonto i Firebase-projektet.
//
// Så här ser det ut i databasen:
//   radata/{källa}/poster/{id}          rådatan, utan personuppgifter
//   evenemang/{id}                      färdiga evenemang från alla källor

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const MAX_PER_OMGANG = 400; // Firestore tillåter högst 500 skrivningar åt gången.

async function skrivIOmgangar(db, skrivningar) {
  for (let i = 0; i < skrivningar.length; i += MAX_PER_OMGANG) {
    const omgang = db.batch();
    for (const [ref, data] of skrivningar.slice(i, i + MAX_PER_OMGANG)) omgang.set(ref, data);
    await omgang.commit();
  }
}

export async function skrivTillFirestore(kallaId, radata, evenemang, hamtad) {
  const konto = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  initializeApp({ credential: cert(konto) });
  const db = getFirestore();

  const kalla = db.collection("radata").doc(kallaId);
  const raSkrivningar = radata
    .filter((p) => p && p.id !== undefined)
    .map((p) => [kalla.collection("poster").doc(String(p.id).replace(/\//g, "_")), { ...p, _hamtad: hamtad }]);
  const evSkrivningar = evenemang.map((e) => [
    db.collection("evenemang").doc(e.id),
    { ...e, uppdaterad: hamtad },
  ]);

  await skrivIOmgangar(db, raSkrivningar);
  await skrivIOmgangar(db, evSkrivningar);
  await kalla.set({ senastHamtad: hamtad, antal: radata.length }, { merge: true });

  console.log(`Firestore: ${raSkrivningar.length} rådataposter och ${evSkrivningar.length} evenemang.`);
}
