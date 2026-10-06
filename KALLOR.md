# Källor för Uppsala just nu

Sammanställt 25 september 2026 från en kartläggning av sport- och kulturkalendrar i Uppsala. Adresser och flöden som står som "ej kontrollerat" hittades via sökningar och behöver provas när domänerna är öppnade.

## Det här hämtar vi i dag

| Källa | Hur | Status |
|---|---|---|
| Tickster | Publika sidor | Fungerar. Byt till API när nyckeln kommer. |
| Destination Uppsala | Publika sidor | Fungerar. Har även Sirius allsvenska hemmamatcher, men utan avsparkstid. |
| Heja Uppsala | Publika sidor (tillfälligt) | Fungerar. Kräver avtal innan sidan blir skarp. |
| Uppsala stadsteater | Öppet flöde | Fungerar |
| Bibliotek Uppsala | Öppet API (Axiell) | Fungerar |
| Kubik Uppsala | Samma sökning som deras sida | Fungerar |
| Svenska kyrkan | API med nyckel | Väntar på att `SVK_API_KEY` läggs in i GitHub |

## Sport via förbunden (undersökt och byggt 25 september)

Matcher på arenor i Uppsala hämtas nu direkt från ligornas och förbundens system (`scripts/sport/`). Inget av det kräver nyckel. Alla är publika sidor eller flöden, men inget är ett officiellt API med villkor, så det faller under det tillfälliga undantaget i CLAUDE.md.

| Sport | Källa | Lag i Uppsala |
|---|---|---|
| Fotboll, Allsvenskan | Sportomedia (allsvenskan.se:s egen datatjänst) | IK Sirius |
| Fotboll, Damallsvenskan och Elitettan | Sportality (ligornas egna sidor) | IK Uppsala, Gamla Upsala SK |
| Innebandy, SSL | Sportality (ssl.se) | Storvreta IBK herr och dam |
| Ishockey, HockeyAllsvenskan | stats.swehockey.se (förbundets schemasidor) | Almtuna IS |
| Bandy | Profixio (förbundets tävlingssystem, schemasidor) | IK Sirius herr och dam, Uppsala BoIS dam |
| Basket, handboll och volleyboll | Profixio (öppen kalenderfil per lag) | Uppsala Basket, Sloga, Uppsala HK, Uppsala VBS |

Fortfarande utan källa: lägre fotbollsdivisioner (Dalkurd, Upsala IF, Sirius dam), innebandyns Allsvenskan (Sirius IBK kommer via Tickster), amerikansk fotboll (säsong på våren) och ungdomsmatcher.

### Luckor i sporten (okt 2026)

Målet är seniorlag från Uppsala kommun på de tre högsta nivåerna, herr och dam. Lagtabellen finns i `scripts/sport/konfig.mjs` (`LAG`). Det här går inte att hämta i dag:

| Sport | Nivå | Varför |
|---|---|---|
| Fotboll herr, Ettan (nivå 3) | Dalkurd FF, Upsala IF med flera | Bara på svenskfotboll.se, som förbjuder automatisk hämtning. Kräver matchdata från SvFF (FOGIS). Superettan hämtas via Sportomedia men har inget Uppsalalag 2026. |
| Fotboll dam, division 1 (nivå 3) | | Samma som ovan. |
| Innebandy, Allsvenskan och division 1 (nivå 2–3) | Sirius IBK, Hagunda IF med flera | Bara på innebandyns statistiksida, som blockerar robotar. Sirius och Hagunda kommer delvis via Tickster. |
| Ishockey, Hockeyettan och damligorna (nivå 3, dam) | | Inget Uppsalalag hittat 2026/27. Serierna finns på stats.swehockey.se och kan läggas till i `SWEHOCKEY` med seriens id. |
| Bandy herr, Allsvenskan (nivå 2) | | Inget lag kontrollerat. Profixio-lagsidan kan läggas till i `PROFIXIO_SIDA`. |
| Basket, handboll och volleyboll, nivå 2–3 | | Inte kartlagt lag för lag. Lägg till lagets Profixio-sida i `PROFIXIO_KALENDER` och en rad i `LAG`. |

Säsongsbyte:
- **Sportomedia** (Allsvenskan, Superettan): säsongen räknas från årtalet, automatiskt.
- **Sportality** (Damallsvenskan, Elitettan, SSL): säsongens id läses från ligans startsida vid varje körning. Dagens id är reserv.
- **Swehockey och Profixio**: id:t byts varje säsong och har ingen stabil sida att läsa det från. Dagens id används. Om ett lag mitt i sin säsong ger noll matcher skapas larmet "Sport: <lag> saknar matcher" (fas 6), och då behöver id:t bytas i `konfig.mjs`.

Biljettlänkar: bara kontrollerade adresser (Sirius fotboll och Almtuna). Storvreta IBK och Uppsala Basket visar samma sida för alla adresser, så där går det inte att kontrollera en biljettsida. AXS hämtas inte.

Förbunden i korthet:
- **Svenska Fotbollförbundet (FOGIS öppna data):** gratis nyckel direkt, men API:et innehåller i dag bara föreningar, inga matcher. Svenskfotboll.se förbjuder automatisk hämtning av matchsidorna. Ansök om matchdata, då är det enda vägen till de lägre divisionerna.
- **Svenska Ishockeyförbundet:** inget öppet API. Schemasidorna är tillåtna. Fråga om ett dataavtal.
- **Svenska Innebandyförbundet (iBIS):** bara för klubbar i de två högsta ligorna, 3 000 kr per klubb och säsong, och ger bara klubbens egna matcher. Deras statistiksida blockerar AI-robotar. Ssl.se räcker för SSL.
- **Profixio** (bandy, basket, handboll, volleyboll): öppna kalenderfiler per lag. Ett riktigt API finns (`X-Api-Secret`, 120 anrop per minut). Kontakta Profixio för en nyckel.
- **Svenska Bandyförbundet:** använder Profixio men har inga kalenderfiler. Fråga om de kan slå på dem.
- **Everysport:** nyckel via support@everysport.com. Villkoren förbjuder lagring utöver kort cachning, vilket krockar med vår modell. Inte prioriterat.

## 1. Nycklar du kan skaffa själv direkt

Gratis och utan förhandling. Ett konto räcker.

| Vad | Var | Ger oss | Värde |
|---|---|---|---|
| **Svenska kyrkan** | Nyckeln finns redan. Lägg in den som hemligheten `SVK_API_KEY` i GitHub. | Konserter och musik i Uppsala pastorat | Högt |
| **SvFF öppna data (FOGIS)** | api-fogis-opendata.developer.azure-api.net: skapa konto och prenumeration. Mejla sedan förbundet och be om matchdata. | Just nu bara föreningar. Med matchdata: lägre divisioner som Dalkurd, Upsala IF och Sirius dam | Medel |
| **Ticketmaster Discovery API** | developer.ticketmaster.com: skapa konto och en app, nyckeln kommer direkt. Lägg in den som `TICKETMASTER_API_KEY`. Hämtningen är redan byggd. | Större konserter och festivaler på Katalin, Fyrishov och Studenternas. 5 000 anrop per dygn, vi använder några få. | Medel |
| **Billetto** | Skapa konto på billetto.se och hämta en nyckel till Public Event Search API | Musicum (Uppsala universitet), Upplandsmuseet och många små arrangörer | Medel |


## 2. Förfrågningar att skicka, i prioritetsordning

| # | Vem | Be om | Ger oss |
|---|---|---|---|
| 1 | **Kuratorskonventet** (Nationsguiden), kuratorskonventet.se | Lov att använda Nationsguidens kalender, gärna som iCal eller JSON | Alla 13 nationers klubbar, pubar, konserter och gasquer. Vår största lucka: nattliv och studentkultur. |
| 2 | **Uppsala universitet**, kommunikationsavdelningen, webben | Ett flöde (iCal, RSS eller JSON) från uu.se/kalendarium med publika evenemang | Öppna föreläsningar, Gustavianum, Musicum, Universitetsaulan, Botaniska trädgården, Linnéträdgården |
| 3 | **Uppsala kommun, kulturförvaltningen** | Ett gemensamt flöde från kommunens kalendrar | Uppsala konstmuseum, Biotopia, Bror Hjorths Hus, Teater Blanca, Kulturveckan, och Reginateatern när den öppnar igen |
| 4 | **Kulturnatten**, kulturnatten@uppsala.se | En export av programmet inför 2027 | Hela Kulturnatten, en gång om året |
| 5 | **Uppsala kommuns arenor** (Sportfastigheter): Studenternas, IFU Arena, Fyrishov | iCal- eller JSON-flöde från arenornas kalendrar | De flesta elitmatcher i fotboll, bandy, innebandy och basket, och andra arrangemang. Det är offentlig verksamhet. |
| 6 | **Profixio**, profixio.com/app/docs | En läsnyckel (`X-Api-Secret`) för publika matcher | Handboll, basket och volleyboll med en och samma nyckel |
| 7 | **Region Uppsala / Musik i Uppland** | Ett flöde från konsertkalendern | Uppsala Kammarorkester och regionens konserter |
| 8 | **Studieförbunden** (Sensus, ABF, Studiefrämjandet, Medborgarskolan, Folkuniversitetet, Bilda), deras nationella webbgrupper | Publika evenemang i Uppsala kommun som flöde | Föreläsningar och mindre konserter |
| 9 | **Svenska Innebandyförbundet** (iBIS API) | Ideell läsåtkomst till SSL-matcher i Uppsala. Normalt kostar det 3 000 kr per lag och säsong. | Storvreta IBK och Sirius IBK med exakta tider |
| 10 | **Fyrisbiografen / bio.se** | Ett flöde med visningar | Film på de oberoende biograferna |
| 11 | **Uppsala Kortfilmfestival** | Programmet som flöde | En vecka i oktober, cirka 300 filmer |
| 12 | **Everysport Media Group** | En ideell nyckel utöver den fria nivån, som bara ger livedata | Amerikansk fotboll, rugby och mindre sporter |
| 13 | **Ebiljett och Nortic** | Ett evenemangsflöde för arrangörerna i Uppsala | Sirius fotboll och Uppsala Basket (Ebiljett), Sirius bandy (Nortic) |
| 14 | **Initcia** (Gratis Uppsala, Barn i Uppsala) | Samarbete eller datautbyte | Gratis- och familjeevenemang |
| 15 | **Heja Uppsala**, tjena@hejauppsala.com | Avtal eller nyckel till deras låsta RSS | De cirka 135 evenemang som bara finns hos Heja |
| – | **Tickster** | Ansökan är redan skickad. Påminn om inget har hänt. | Snabbare och säkrare än webbsidorna |

## 3. Öppna källor som kan byggas direkt

Det här kräver inget tillstånd. Domänerna behöver bara öppnas här så att jag kan bygga och prova hämtningarna.

| Källa | Troligt flöde (ej kontrollerat) | Ger oss |
|---|---|---|
| Uppsala Missionskyrka | The Events Calendar: `?ical=1` och `/wp-json/tribe/events/v1/events` | Stor konsertlokal utanför Svenska kyrkan. Gudstjänster filtreras bort med samma regler. |
| Bror Hjorths Hus | The Events Calendar, som ovan | Utställningar och program |
| Kulturoasen | WordPress (`/wp-json/`) | Konserter varje söndag, cirka 40 per år |
| Biotopia | WordPress (`/wp-json/`) | Veckoaktiviteter, Torsdagskul |
| Fyrisgården | WordPress (`/wp-json/`) | Ungdom och kultur |
| Orphei Drängar, Uppsala Akademiska Kammarkör, Domkyrkokören | WordPress | Körkonserter |
| Universitetsbibliotekets evenemang | LibCal, öppen iCal | Föreläsningar och utställningar |
| Föreningar på Svenska lag och Laget.se | Kalenderfiler per lag | Upsala IF, Uppsala 86ers, Uppsala Rugby, Sirius innebandy med flera |
| Studenternas, IFU Arena, Fyrishov | Arenornas kalendrar | Matcher och andra arrangemang (se även förfrågan 5) |

## 4. Domäner i Claudes miljö

Behövs inte längre. Sedan 25 september har Claudes miljö full åtkomst till internet. GitHub, där hämtningarna körs, har aldrig haft någon spärr.

## 5. Går inte, eller inte värt det

- **Facebook-evenemang:** Meta tillåter inte att andras evenemang hämtas.
- **Eventbrite, Meetup och Luma:** API:erna ger bara ens egna evenemang, inte sökning.
- **Filmstaden och Nordisk Film:** inga öppna API:er.
- **Trav, galopp och speedway:** ingen bana i Uppsala kommun.
- **Andra evenemangssajter** (Digga, evenemang.se, Bandsintown med flera): konkurrenter, och vi hämtar inte från dem.
- **Reginateatern:** stängd sedan maj 2026 på grund av fukt och mögel, enligt sökresultat. Återuppta när den öppnar igen.
