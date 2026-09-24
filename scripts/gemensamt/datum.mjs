// Datum utan årtal, och datum i fritext.
//
// Destination Uppsala och Heja Uppsala visar datum som "24 okt" eller
// "3 maj - 11 okt" i sina listor, utan årtal och klockslag. Här räknar vi ut
// årtalet och läser klockslag ur texten på evenemangets egen sida.

export const MANADER = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const ENGELSKA = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

// "24 okt" -> { dag: 24, manad: 10 }
export function dagOchManad(dag, manad) {
  const m = MANADER.indexOf(String(manad).toLowerCase().slice(0, 3)) + 1;
  return m > 0 ? { dag: +dag, manad: m } : null;
}

const iso = (ar, m, d) => `${ar}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Första datumet med den dagen och månaden som är samma dag som "minst" eller senare.
function forstaEfter({ dag, manad }, minst) {
  const ar = +minst.slice(0, 4);
  return iso(ar, manad, dag) >= minst ? iso(ar, manad, dag) : iso(ar + 1, manad, dag);
}

// Sista datumet med den dagen och månaden som är samma dag som "hogst" eller tidigare.
function sistaFore({ dag, manad }, hogst) {
  const ar = +hogst.slice(0, 4);
  return iso(ar, manad, dag) <= hogst ? iso(ar, manad, dag) : iso(ar - 1, manad, dag);
}

// Listan är sorterad efter startdatum. Därför kan vi räkna ut årtalen:
// - Varje start ligger på eller efter föregående korts start.
// - Det allra första kortet är ofta en utställning som redan pågår, så dess
//   start ligger före idag.
// - Ett slutdatum ligger alltid idag eller senare, eftersom listan bara
//   visar sådant som inte är slut.
export function raknaUtDatum(kort, idag) {
  let foregaende = null;
  return kort.map((k) => {
    if (!k.datum.length) return { ...k, startdatum: null, slutdatum: null };
    const [forsta, sista] = k.datum;
    let startdatum;
    if (foregaende) startdatum = forstaEfter(forsta, foregaende);
    else startdatum = sista ? sistaFore(forsta, idag) : forstaEfter(forsta, idag);
    let slutdatum = null;
    if (sista) {
      slutdatum = forstaEfter(sista, startdatum > idag ? startdatum : idag);
    } else if (startdatum < idag) {
      startdatum = forstaEfter(forsta, idag); // Ett endagsevenemang kan inte ha varit.
    }
    foregaende = startdatum;
    return { ...k, startdatum, slutdatum };
  });
}

const MANADSORD = new RegExp(
  `(\\d{1,2})\\s+(${[...MANADER, ...ENGELSKA].join("|")})[a-zé]*,?\\s+(20\\d\\d)`,
  "gi",
);

// Tolkar texten efter "När:". Sparas inte, utan räknas ut varje gång,
// så att förbättringar här gäller även för sidor vi redan läst.
export function tolkaNar(nar = "") {
  // "kl. 19.00", "kl 18:00", "kl. 11–15", "19:30", eller "19.00" ensamt på en rad.
  const klocka =
    nar.match(/\bkl\.?:?\s*(\d{1,2})(?:[.:](\d{2}))?/i) ||
    nar.match(/\b(\d{1,2}):(\d{2})\b/) ||
    nar.match(/(?:^|\n)\s*(\d{1,2})\.(\d{2})(?!\d)/);
  const datumIText = [...nar.matchAll(MANADSORD)].map(([, dag, man, ar]) => {
    const i = MANADER.indexOf(man.toLowerCase().slice(0, 3));
    const manad = (i >= 0 ? i : ENGELSKA.indexOf(man.toLowerCase().slice(0, 3))) + 1;
    return iso(+ar, manad, +dag);
  });
  return {
    klockslag:
      klocka && +klocka[1] < 24 && +(klocka[2] || 0) < 60 ? `${klocka[1].padStart(2, "0")}:${klocka[2] || "00"}` : null,
    datumIText,
  };
}
