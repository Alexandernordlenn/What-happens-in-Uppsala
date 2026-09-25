// Vilka ligor och lag sporthämtningen tittar på.
//
// Lägg till en rad här när ett nytt Uppsalalag kommer upp i en liga.
// Id:n för ligor och lag byts ofta varje säsong. Ger en rad noll matcher
// skriver hämtningen en varning, och då behöver id:t uppdateras.

// Fotboll herr, Allsvenskan. Hela ligan i ett anrop.
export const SPORTOMEDIA = [
  { liga: "Allsvenskan", nyckel: "allsvenskan", sport: "Fotboll", url: "https://allsvenskan.se/matcher" },
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
