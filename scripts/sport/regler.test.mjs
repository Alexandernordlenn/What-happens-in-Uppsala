// Tester för sporthämtningen. Kör med: npm test
// Exempeldatan hämtades 25 september 2026 från respektive system.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  bearbeta, hittaProfixioKalender, hittaSportalityParametrar, iUppsala,
  tolkaProfixioIcal, tolkaProfixioSida, tolkaSportality, tolkaSportomedia, tolkaSwehockey,
} from "./regler.mjs";

const las = (f) => readFile(new URL(`./exempel/${f}`, import.meta.url), "utf8");
const nu = new Date("2026-09-25T08:00:00Z");

test("Allsvenskan: spelade matcher tas bort, Sirius hemmamatcher blir kvar", async () => {
  const m = tolkaSportomedia(JSON.parse(await las("sportomedia.json")), { liga: "Allsvenskan", sport: "Fotboll", url: "u" });
  assert.equal(m.length, 3);
  const ev = bearbeta(m, nu);
  assert.equal(ev.length, 2);
  assert.equal(ev[0].titel, "IK Sirius – IF Elfsborg");
  assert.equal(ev[0].start, "2026-10-18T14:00:00+02:00");
  assert.equal(ev[0].kategori, "sport");
});

test("Damallsvenskan: IK Uppsala på Studenternas, med (dam) i titeln", async () => {
  const m = tolkaSportality(JSON.parse(await las("sportality.json")), { liga: "OBOS Damallsvenskan", sport: "Fotboll", url: "u" });
  const ev = bearbeta(m, nu);
  assert.equal(ev.length, 2);
  assert.match(ev[0].titel, /IK Uppsala.*\(dam\)$/);
  assert.equal(ev[0].plats.namn, "Studenternas");
});

test("Sportality: säsongens id läses från startsidan", () => {
  const p = hittaSportalityParametrar('<a href="/game-schedule?seasonUuid=abc&amp;seriesUuid=def&amp;gameTypeUuid=ghi">');
  assert.deepEqual(p, { seasonUuid: "abc", seriesUuid: "def", gameTypeUuid: "ghi" });
});

test("Swehockey: datum förs vidare till raderna under, spelade matcher tas bort", async () => {
  const m = tolkaSwehockey(await las("swehockey.html"), { liga: "HockeyAllsvenskan", sport: "Ishockey", url: "u" });
  assert.ok(m.length >= 2);
  assert.ok(m.every((x) => !x.spelad));
  const almtuna = bearbeta(m, nu);
  assert.equal(almtuna.length, 1);
  assert.equal(almtuna[0].titel, "Almtuna IS – BIK Karlskoga");
  assert.equal(almtuna[0].start, "2026-09-25T19:00:00+02:00");
});

test("Profixio: kalenderfil med tid i UTC och hall", async () => {
  const m = tolkaProfixioIcal(await las("profixio.ics"), { liga: "Basketligan herr", sport: "Basket", url: "u" });
  assert.equal(m[0].hemma, "Uppsala Basket");
  assert.equal(m[0].arena, "Fyrishov A");
  const [ev] = bearbeta(m, nu);
  assert.equal(ev.start, "2026-09-25T19:04:00+02:00");
  assert.equal(ev.notering, "Basket, Basketligan herr");
});

test("Profixio: kalenderadressen hittas i lagsidans kod", () => {
  const html = '"url":"https:\\/\\/www.profixio.com\\/app\\/api\\/calendars\\/teams\\/1551302\\/matches.ics?signature=24a1&quot;';
  assert.equal(
    hittaProfixioKalender(html),
    "https://www.profixio.com/app/api/calendars/teams/1551302/matches.ics?signature=24a1",
  );
});

test("Profixio: bandyns schemasida, årtal från rubriken", async () => {
  const m = tolkaProfixioSida(await las("profixio-sida.html"), { liga: "Elitserien herr", sport: "Bandy", url: "u" });
  const hemma = bearbeta(m, nu);
  assert.equal(hemma[0].titel, "IK Sirius – IFK Vänersborg");
  assert.equal(hemma[0].start, "2026-10-31T15:00:00+01:00");
  assert.ok(m.every((x) => x.hemma && x.borta));
});

test("bara arenor i Uppsala", () => {
  assert.ok(iUppsala("Gränby Ishallar A-hall"));
  assert.ok(iUppsala("Fyrishov A, Uppsala"));
  assert.ok(!iUppsala("Avicii Arena"));
});
