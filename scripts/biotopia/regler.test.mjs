// Tester för Biotopia. Körs med: npm test

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearbeta, kategori, lasKalender, tidsintervall } from "./regler.mjs";
import { normaliseraPlats } from "../gemensamt/platser.mjs";

const html = readFileSync(new URL("./exempel.html", import.meta.url), "utf8");
const poster = lasKalender(html);
const evenemang = bearbeta(poster, "2026-10-16");
const efter = (nr) => evenemang.find((e) => e.id === `biotopia-${nr}`);

test("Biotopia: JSON:en i kalendersidan läses, texten tas inte med", () => {
  assert.equal(poster.length, 7);
  assert.deepEqual(Object.keys(poster[0]).sort(), ["datum", "kategorier", "lank", "plats", "tider", "titel", "underrubrik"]);
  assert.ok(!JSON.stringify(poster).includes("påhittad"), "texten om evenemanget sparas inte");
});

test("Biotopia: bara datum, och det som har varit tas bort", () => {
  assert.equal(efter(1388).start, "2026-10-17");
  assert.equal(efter(1388).slut, null);
  assert.equal(efter(2301).slut, "2026-11-01");
  assert.equal(efter(2100), undefined, "sommarens föredrag har redan varit");
  assert.equal(evenemang.length, 6);
});

test("Biotopia: kategorier, barn och ålder", () => {
  assert.equal(efter(2195).kategori, "museum", "pågår i sex veckor: en utställning");
  assert.equal(efter(2301).kategori, "aktivitet", "lovverkstad, inte utställning");
  assert.equal(efter(2310).kategori, "prat");
  assert.equal(efter(2290).kategori, "aktivitet");
  assert.deepEqual(efter(2290).alder, [3, 4]);
  assert.equal(efter(2290).barnOchFamilj, true);
  assert.equal(efter(2320).titel, "Fågelholkar – höstkoll och nybyggen");
  assert.equal(kategori({ titel: "Friluftsliv", kategorier: ["Föredrag", "Workshop"] }, 0), "prat");
  assert.equal(kategori({ titel: "Laga kläder", kategorier: ["Workshop", "Onsdagskvällar"] }, 0), "aktivitet");
});

test("Biotopia: platser och länkar", () => {
  assert.equal(efter(2195).plats.namn, "Biotopia", "tom plats blir Biotopia");
  assert.equal(normaliseraPlats(efter(2320)).plats.id, "hammarskog");
  assert.equal(normaliseraPlats({ plats: { namn: "Vasagatan 4" } }).plats.id, "biotopia");
  assert.equal(efter(1388).kallor[0].url, "https://biotopia.nu/?post_type=post&p=1388");
});

test("Biotopia: klockslag bara från ett enda tydligt tidsintervall i texten", () => {
  assert.equal(tidsintervall("Biljetterna släpps kl 7.00."), null, "en ensam tid är inte evenemangets tid");
  assert.deepEqual(tidsintervall("Under några tisdagar kl 10-12 bjuder vi in"), { start: "10:00", slut: "12:00" });
  assert.deepEqual(tidsintervall("Samling 9.30–12 vid entrén"), { start: "09:30", slut: "12:00" });
  assert.equal(tidsintervall("kl 10-12 och kl 13-15"), null, "två olika intervall är osäkert");
  assert.equal(tidsintervall("Utställningen visas 12.10–18.10"), null, "datum, inte klockslag");
  assert.equal(efter(2290).start, "2026-10-22", "Torsdagskul: bara biljettsläppet står i texten");
});
