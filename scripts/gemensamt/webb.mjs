// Schysst hämtning från webbsidor, enligt villkoren i CLAUDE.md.
//
// - Läser robots.txt och vägrar hämta det som webbplatsen säger nej till.
// - Väntar mellan anropen till samma webbplats (minst 2 sekunder, eller
//   längre om robots.txt ber om det med "Crawl-delay").
// - Säger vilka vi är i rubriken User-Agent.

export const USER_AGENT =
  "UppsalaJustNu/0.1 (ideell evenemangskalender; +https://alexandernordlenn.github.io/What-happens-in-Uppsala/)";

const MINSTA_PAUS_MS = 2000;

const robotsCache = new Map(); // värd -> { regler, paus }
const senasteAnrop = new Map(); // värd -> tidpunkt

const vanta = (ms) => new Promise((r) => setTimeout(r, ms));

// Läser robots.txt och plockar ut reglerna för alla robotar ("User-agent: *").
function tolkaRobots(text) {
  const regler = [];
  let paus = 0;
  let galler = false;
  let senasteVarAgent = false;
  for (const rad of text.split(/\r?\n/)) {
    const m = rad.replace(/#.*/, "").trim().match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const falt = m[1].toLowerCase();
    const varde = m[2].trim();
    if (falt === "user-agent") {
      // Flera User-agent-rader i rad hör till samma grupp.
      if (!senasteVarAgent) galler = false;
      if (varde === "*" || /uppsalajustnu/i.test(varde)) galler = true;
      senasteVarAgent = true;
      continue;
    }
    senasteVarAgent = false;
    if (!galler) continue;
    if (falt === "disallow" && varde) regler.push({ tillat: false, sokvag: varde });
    if (falt === "allow" && varde) regler.push({ tillat: true, sokvag: varde });
    if (falt === "crawl-delay" && +varde > 0) paus = Math.max(paus, +varde * 1000);
  }
  return { regler, paus };
}

function matchar(sokvag, regel) {
  const re = new RegExp(
    "^" + regel.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$"),
  );
  return re.test(sokvag);
}

// Sant om robots.txt tillåter adressen. Längsta matchande regel vinner.
export function tillats(tolkad, adress) {
  const u = new URL(adress);
  const sokvag = u.pathname + u.search;
  let basta = null;
  for (const r of tolkad.regler) {
    if (matchar(sokvag, r.sokvag) && (!basta || r.sokvag.length > basta.sokvag.length)) basta = r;
  }
  return !basta || basta.tillat;
}

async function robotsFor(adress) {
  const u = new URL(adress);
  if (!robotsCache.has(u.host)) {
    let tolkad = { regler: [], paus: 0 };
    try {
      const svar = await fetch(`${u.origin}/robots.txt`, { headers: { "User-Agent": USER_AGENT } });
      if (svar.ok) tolkad = tolkaRobots(await svar.text());
    } catch {
      // Ingen robots.txt betyder att allt är tillåtet.
    }
    robotsCache.set(u.host, tolkad);
  }
  return robotsCache.get(u.host);
}

// Hämtar en adress. Svarar med text, eller med JSON om { json: true }.
export async function hamta(adress, { json = false, headers = {} } = {}) {
  const robots = await robotsFor(adress);
  if (!tillats(robots, adress)) {
    throw new Error(`robots.txt tillåter inte ${adress}`);
  }
  const host = new URL(adress).host;
  const paus = Math.max(MINSTA_PAUS_MS, robots.paus);

  for (let forsok = 1; forsok <= 3; forsok++) {
    const sedan = Date.now() - (senasteAnrop.get(host) || 0);
    if (sedan < paus) await vanta(paus - sedan);
    senasteAnrop.set(host, Date.now());

    const svar = await fetch(adress, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: json ? "application/json" : "text/html,*/*",
        ...headers,
      },
    });
    if (svar.ok) return json ? svar.json() : svar.text();
    if (svar.status === 429 || svar.status >= 500) {
      await vanta(paus * 2 * forsok);
      continue;
    }
    throw new Error(`${adress} svarade ${svar.status} ${svar.statusText}`);
  }
  throw new Error(`${adress} svarade inte efter tre försök.`);
}

export { tolkaRobots };
