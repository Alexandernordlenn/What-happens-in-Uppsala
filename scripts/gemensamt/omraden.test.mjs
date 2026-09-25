// Tester för områden och åldrar. Kör med: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { omradeForPlats, omradeFranKubik, slaIhopSpann, spannFranEtikett, spannFranText } from "./omraden.mjs";

test("område från platsnamn", () => {
  assert.equal(omradeForPlats("Gottsundabiblioteket"), "sodra");
  assert.equal(omradeForPlats("Storvretabiblioteket"), "norra-land");
  assert.equal(omradeForPlats("Gränby ishall"), "ostra");
  assert.equal(omradeForPlats("Uppsala Konsert & Kongress", "ukk"), "centrum");
  assert.equal(omradeForPlats("Rasbo Kursgård"), "ostra-land");
  assert.equal(omradeForPlats("Någonstans okänt"), null);
  assert.equal(omradeFranKubik("Centrala staden"), "centrum");
});

test("ålder från etiketter och titlar", () => {
  assert.deepEqual(spannFranEtikett("0-4 år"), [0, 4]);
  assert.deepEqual(spannFranEtikett("För alla åldrar"), [0, 99]);
  assert.deepEqual(spannFranEtikett("Barn"), [0, 12]);
  assert.deepEqual(spannFranEtikett("Vuxen"), [18, 99]);
  assert.deepEqual(spannFranText("Sagostund för 3-6 år"), [3, 6]);
  assert.deepEqual(spannFranText("Teater från 7 år"), [7, 99]);
  assert.equal(spannFranText("Kim Wilde 2027"), null);
  assert.deepEqual(slaIhopSpann([[0, 4], [5, 6], null]), [0, 6]);
});
