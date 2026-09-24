// Tider i svensk tid, med tidszon.
//
// Alla källor ska spara tider som till exempel "2026-09-24T19:00:00+02:00",
// alltså svensk klocktid följd av hur många timmar den ligger före UTC.

const TIDSZON = "Europe/Stockholm";

// Räknar ut hur många minuter svensk tid ligger före UTC vid en viss tidpunkt
// (60 på vintern, 120 på sommaren).
function svenskForskjutning(datum) {
  const delar = new Intl.DateTimeFormat("en-US", {
    timeZone: TIDSZON, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(datum);
  const v = Object.fromEntries(delar.map((p) => [p.type, p.value]));
  const somUtc = Date.UTC(+v.year, +v.month - 1, +v.day, +v.hour, +v.minute, +v.second);
  return Math.round((somUtc - datum.getTime()) / 60000);
}

// Gör om en tid från en källa till en tid med svensk tidszon,
// till exempel "2026-09-24T19:00:00+02:00".
// Om tiden saknar tidszon utgår vi från att den redan är i svensk tid.
export function tillSvenskTid(varde) {
  if (!varde) return null;
  const s = String(varde);
  let datum;
  if (/[zZ]$|[+-]\d\d:?\d\d$/.test(s)) {
    datum = new Date(s);
  } else {
    const m = s.match(/^(\d{4})-(\d\d)-(\d\d)(?:[T ](\d\d):(\d\d)(?::(\d\d))?)?/);
    if (!m) return null;
    const somUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
    // Två varv behövs för att hamna rätt precis kring sommartidsbytet.
    let gissning = new Date(somUtc - svenskForskjutning(new Date(somUtc)) * 60000);
    gissning = new Date(somUtc - svenskForskjutning(gissning) * 60000);
    datum = gissning;
  }
  if (isNaN(datum)) return null;
  const f = svenskForskjutning(datum);
  const lokal = new Date(datum.getTime() + f * 60000).toISOString().slice(0, 19);
  const tecken = f >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(f) / 60)).padStart(2, "0");
  const mm = String(Math.abs(f) % 60).padStart(2, "0");
  return `${lokal}${tecken}${hh}:${mm}`;
}
