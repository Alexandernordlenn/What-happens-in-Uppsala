// Städar text från webbsidor och API:er.

const NAMNGIVNA = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", shy: "", ndash: "–", mdash: "—", hellip: "…" };

// Gör om &amp;, &#8211; och liknande till vanliga tecken.
export function avkoda(s) {
  return String(s ?? "")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&([a-z]+);/gi, (m, n) => NAMNGIVNA[n.toLowerCase()] ?? m);
}

// Tar bort HTML-taggar men behåller styckeindelning.
export function renText(s) {
  if (!s) return "";
  return avkoda(
    String(s)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/­/g, "") // dolda avstavningstecken
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Som renText, men allt på en rad. Bra för titlar och platsnamn.
export function enRad(s) {
  return renText(s).replace(/\s+/g, " ").trim();
}
