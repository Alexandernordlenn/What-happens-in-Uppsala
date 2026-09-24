// Tester för de gemensamma delarna. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { tolkaRobots, tillats } from "./webb.mjs";
import { gissaKategori } from "./kategori.mjs";

test("robots.txt: tillåtet, förbjudet och Crawl-delay", () => {
  const r = tolkaRobots(`
User-agent: Googlebot
Disallow: /

User-agent: *
Disallow: /wpust/wp-admin/
Allow: /wpust/wp-admin/admin-ajax.php
Crawl-delay: 3
`);
  assert.equal(r.paus, 3000);
  assert.equal(tillats(r, "https://x.se/kalender/"), true);
  assert.equal(tillats(r, "https://x.se/wpust/wp-admin/edit.php"), false);
  assert.equal(tillats(r, "https://x.se/wpust/wp-admin/admin-ajax.php"), true);
});

test("robots.txt: tom Disallow betyder att allt är tillåtet", () => {
  const r = tolkaRobots("User-agent: *\nDisallow:\n");
  assert.equal(tillats(r, "https://x.se/vad-som-helst"), true);
});

test("kategori gissas från text", () => {
  assert.equal(gissaKategori("Storvreta – Linköping (herr)"), "sport");
  assert.equal(gissaKategori("Jazzkonsert i Bakfickan"), "musik");
  assert.equal(gissaKategori("Musikal: Sommar"), "scen");
  assert.equal(gissaKategori("Något helt annat"), "ovrigt");
});

test("platser: alias blir samma plats, salen blir rum", async () => {
  const { normaliseraPlats } = await import("./platser.mjs");
  const p = (namn, kategori = "ovrigt") =>
    normaliseraPlats({ plats: { namn, id: "x" }, kategori }, { kategoriFranPlats: true });
  assert.equal(p("Katalin and all that Jazz").plats.id, "katalin");
  assert.equal(p("Katalin, Uppsala").plats.id, "katalin");
  assert.equal(p("Katalin, Uppsala").plats.rum, undefined);
  assert.equal(p("Uppsala Konsert & Kongress, Stora salen").plats.rum, "Stora salen");
  assert.equal(p("IFU Arena").kategori, "sport");
  assert.equal(p("Katalin", "scen").kategori, "scen"); // Källans egen kategori vinner.
  assert.equal(p("Annan plats").plats.namn, "Uppsala");
});
