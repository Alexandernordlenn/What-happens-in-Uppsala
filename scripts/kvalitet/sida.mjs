// Hjälpfunktioner för att läsa data/sida.json på samma sätt som sidan gör.
// Används av kvalitetsmätningen (matt.mjs) och personkontrollerna (personer.mjs).

export function plusDagar(dag, n) {
  const d = new Date(`${dag}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dagarMellan(a, b) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400000);
}

// 0 = söndag, 6 = lördag
export const veckodag = (dag) => new Date(`${dag}T12:00:00Z`).getUTCDay();

export const slutdag = (e) => e.e || e.d;
export const langd = (e) => dagarMellan(e.d, slutdag(e)) + 1;

// Som på sidan: mer än 4 dagar räknas som långvarigt.
export const langvarig = (e) => langd(e) > 4;

// Raden "Pågår under perioden". När evenemangen har format (fas 2) visas bara
// utställningar och speltider där. Innan dess visades allt långvarigt.
export const iPagarRaden = (e) => (e.f ? e.f === "utstallning" || e.f === "speltid" : langvarig(e));

// Visas evenemanget i dagslistan den här dagen?
export function aktivPa(e, dag) {
  if (langvarig(e)) return false;
  return e.d <= dag && slutdag(e) >= dag;
}

export const overlapparPeriod = (e, fran, till) => e.d <= till && slutdag(e) >= fran;

// Åldern [0, 99] betyder "alla åldrar" och räknas inte som en exakt träff.
export const allaAldrar = (a) => Boolean(a && a[0] === 0 && a[1] >= 99);
export const exaktAlder = (e) => Boolean(e.a && !allaAldrar(e.a));
export const overlappar = (a, fran, till) => Boolean(a && a[0] <= till && a[1] >= fran);

// Kommande helg: lördag och söndag. Är det söndag idag gäller bara idag.
export function kommandeHelg(idag) {
  const vd = veckodag(idag);
  if (vd === 0) return [idag];
  const lordag = plusDagar(idag, (6 - vd + 7) % 7);
  return [lordag, plusDagar(lordag, 1)];
}

export const kommandeDagar = (idag, n) => Array.from({ length: n }, (_, i) => plusDagar(idag, i));

// Evenemang som visas i dagslistan någon av dagarna.
export const iDagslistan = (sida, dagar) => sida.evenemang.filter((e) => dagar.some((d) => aktivPa(e, d)));
