// Vilka ligor och lag sporthämtningen tittar på.
//
// Lägg till en rad här när ett nytt Uppsalalag kommer upp i en liga.
// Id:n för ligor och lag byts ofta varje säsong. Ger en rad noll matcher
// skriver hämtningen en varning, och då behöver id:t uppdateras.

// ---------- Lagtabellen ----------
//
// Seniorlag från Uppsala kommun på de tre högsta nivåerna i varje sport,
// herr och dam. Används för biljettlänkar och för larmet när ett lag mitt i
// sin säsong inte har några matcher (data/sport-lag.json).
//
//   monster   känner igen laget som hemmalag i ligans data
//   sasong    ungefärliga månader då ligan spelar, [första, sista]
//   biljetter klubbens egen biljettsida, bara om adressen är kontrollerad
//
// Lag som inte går att hämta (till exempel fotbollens division 1 och
// innebandyns Allsvenskan) står i KALLOR.md under "Luckor i sporten".
export const LAG = [
  { lag: "IK Sirius", sport: "Fotboll", kon: "herr", niva: 1, liga: "Allsvenskan", monster: /sirius/i, sasong: [3, 11], biljetter: "https://www.siriusfotboll.se/matchdag/biljetter/" },
  { lag: "IK Uppsala", sport: "Fotboll", kon: "dam", niva: 1, liga: "OBOS Damallsvenskan", monster: /ik uppsala/i, sasong: [3, 11] },
  { lag: "Gamla Upsala SK", sport: "Fotboll", kon: "dam", niva: 2, liga: "Elitettan", monster: /gamla upsala/i, sasong: [4, 10] },
  { lag: "Almtuna IS", sport: "Ishockey", kon: "herr", niva: 2, liga: "HockeyAllsvenskan", monster: /almtuna/i, sasong: [9, 3], biljetter: "https://www.almtuna.com/biljettinformation" },
  { lag: "Storvreta IBK", sport: "Innebandy", kon: "herr", niva: 1, liga: "SSL herr", monster: /storvreta/i, sasong: [9, 3] },
  { lag: "Storvreta IBK dam", sport: "Innebandy", kon: "dam", niva: 1, liga: "SSL dam", monster: /storvreta/i, sasong: [9, 3] },
  { lag: "IK Sirius bandy", sport: "Bandy", kon: "herr", niva: 1, liga: "Elitserien herr", monster: /sirius/i, sasong: [10, 3] },
  { lag: "IK Sirius bandy dam", sport: "Bandy", kon: "dam", niva: 2, liga: "Allsvenskan dam", monster: /sirius/i, sasong: [11, 2] },
  { lag: "Uppsala BoIS dam", sport: "Bandy", kon: "dam", niva: 2, liga: "Allsvenskan dam", monster: /bois/i, sasong: [11, 2] },
  { lag: "Uppsala Basket", sport: "Basket", kon: "herr", niva: 1, liga: "Basketligan herr", monster: /uppsala basket/i, sasong: [9, 4] },
  { lag: "Sloga Uppsala", sport: "Basket", kon: "herr", niva: 1, liga: "Basketligan herr", monster: /sloga/i, sasong: [9, 4] },
  { lag: "Uppsala Basket dam", sport: "Basket", kon: "dam", niva: 1, liga: "Basketligan dam", monster: /uppsala basket/i, sasong: [9, 4] },
  { lag: "Uppsala HK", sport: "Handboll", kon: "herr", niva: 3, liga: "Herr 1", monster: /uppsala hk/i, sasong: [9, 4] },
  { lag: "Uppsala VBS", sport: "Volleyboll", kon: "herr", niva: 1, liga: "Elitserien herr", monster: /uppsala vbs/i, sasong: [9, 4] },
  { lag: "Uppsala VBS dam", sport: "Volleyboll", kon: "dam", niva: 3, liga: "Division 1 dam", monster: /uppsala vbs/i, sasong: [9, 4] },
];

// Laget som spelar hemma i en match, om det finns i tabellen.
export function hittaLag(match) {
  return LAG.find((l) => l.sport === match.sport && l.liga === match.liga && l.monster.test(match.hemma || "")) || null;
}

// Är laget mitt i sin säsong? Säsonger kan gå över årsskiftet, till exempel [9, 3].
export function iSasong(lag, datum = new Date()) {
  const m = datum.getUTCMonth() + 1;
  const [fran, till] = lag.sasong;
  return fran <= till ? m >= fran && m <= till : m >= fran || m <= till;
}

// Fotboll herr: Allsvenskan och Superettan. Hela ligan i ett anrop per säsong.
// Superettan har inget Uppsalalag 2026, men tas med så att ett lag som går upp
// kommer med automatiskt.
export const SPORTOMEDIA = [
  { liga: "Allsvenskan", nyckel: "allsvenskan", sport: "Fotboll", url: "https://allsvenskan.se/matcher" },
  { liga: "Superettan", nyckel: "superettan", sport: "Fotboll", url: "https://superettan.se/matcher" },
];

// Ligor på Sportality. Säsongens id läses från ligans startsida. Står det
// inget där används reservvärdena.
export const SPORTALITY = [
  {
    liga: "OBOS Damallsvenskan", sport: "Fotboll", bas: "https://www.obosdamallsvenskan.se",
    seriesUuid: "qWY-8Y5b6dXHc", reserv: { seasonUuid: "o4y104rp9a", gameTypeUuid: "qWY-8Y65Y2fs5" },
  },
  {
    liga: "Elitettan", sport: "Fotboll", bas: "https://www.elitettan.se",
    seriesUuid: "qYF-4WHRrw0UN", reserv: { seasonUuid: "o4y104rp9a", gameTypeUuid: "qWY-8Y65Y2fs5" },
  },
  {
    liga: "SSL herr", sport: "Innebandy", bas: "https://www.ssl.se",
    seriesUuid: "qRl-8B5kOFjKL", reserv: { seasonUuid: "vt4kt77vxk", gameTypeUuid: "qQ9-af37Ti40B" },
  },
  {
    liga: "SSL dam", sport: "Innebandy", bas: "https://www.ssl.se",
    seriesUuid: "qRl-8B5wsw8lj", reserv: { seasonUuid: "vt4kt77vxk", gameTypeUuid: "qQ9-af37Ti40B" },
  },
];

// Ishockey: serier på stats.swehockey.se.
export const SWEHOCKEY = [
  { liga: "HockeyAllsvenskan", sport: "Ishockey", serie: 20962 },
];

// Profixio-lag med kalenderfil (basket, handboll, volleyboll).
export const PROFIXIO_KALENDER = [
  { liga: "Basketligan herr", sport: "Basket", sida: "https://www.profixio.com/app/leagueid27640/teams/1551302" },
  { liga: "Basketligan herr", sport: "Basket", sida: "https://www.profixio.com/app/leagueid27640/teams/1552193" },
  { liga: "Basketligan dam", sport: "Basket", sida: "https://www.profixio.com/app/leagueid27644/teams/1547650" },
  { liga: "Herr 1", sport: "Handboll", sida: "https://www.profixio.com/app/leagueid28142/teams/1585885" },
  { liga: "Elitserien herr", sport: "Volleyboll", sida: "https://www.profixio.com/app/leagueid27936/teams/1589828" },
  { liga: "Division 1 dam", sport: "Volleyboll", sida: "https://www.profixio.com/app/leagueid27937/teams/1589826" },
];

// Profixio-lag utan kalenderfil (bandy). Schemasidan läses i stället.
export const PROFIXIO_SIDA = [
  { liga: "Elitserien herr", sport: "Bandy", sida: "https://www.profixio.com/app/lx/competition/leagueid28500/teams/1584303?t=schedule" },
  { liga: "Allsvenskan dam", sport: "Bandy", sida: "https://www.profixio.com/app/lx/competition/leagueid28503/teams/1588764?t=schedule" },
  { liga: "Allsvenskan dam", sport: "Bandy", sida: "https://www.profixio.com/app/lx/competition/leagueid28503/teams/1590944?t=schedule" },
];
