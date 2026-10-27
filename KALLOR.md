# Källor för Uppsala just nu

Sammanställt 25 september 2026 från en kartläggning av sport- och kulturkalendrar i Uppsala, och uppdaterat 16 oktober 2026 efter en genomgång av arrangörernas egna öppna flöden (se "Undersökt 16 oktober" nedan).

## Det här hämtar vi i dag

| Källa | Hur | Status |
|---|---|---|
| Destination Uppsala | Publika sidor | Fungerar. Har även Sirius allsvenska hemmamatcher, men utan avsparkstid. |
| Uppsala stadsteater | Öppet flöde | Fungerar |
| Bibliotek Uppsala | Öppet API (Axiell) | Fungerar |
| Kubik Uppsala | Samma sökning som deras sida | Fungerar |
| Svenska kyrkan | API med nyckel | Väntar på att `SVK_API_KEY` läggs in i GitHub |
| Musik i Uppland | Öppet WordPress-API | Från 16 okt 2026. Bara konserter i Uppsala kommun. |
| Katalin | Öppet WordPress-API | Från 16 okt 2026. Ger slutsålt och inställt. |
| Uppsala Konsert & Kongress | Öppet WordPress-API | Från 16 okt 2026. UKK:s egna kategorier. |
| Uppsala Missionskyrka | The Events Calendar (API) | Från 16 okt 2026. Gudstjänster tas bort. |
| Bror Hjorths Hus | The Events Calendar (API) | Från 16 okt 2026. |
| Biotopia | JSON i kalendersidan | Från 16 okt 2026. Mest datum, sällan klockslag. |
| Fyrishov | Kalenderfil (iCal) | Från 16 okt 2026. Matcher, mässor och badaktiviteter. |
| Billetto | API med nyckel | Från 28 okt 2026. Runt 10 i Uppsala av 582 i Sverige. |
| Tickster | API med nyckel | Från 28 okt 2026, webbsidorna som reserv. |

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
| **Billetto** | Skapa ett gratis arrangörskonto (billetto.se/organiser/sign_up) och skapa en nyckel under billetto.se/organiser/integrate/api_keys. Nyckeln skickas som rubriken `Api-Keypair`. Dokumentationen (api.billetto.com) stänger ute robotar, så läs den i webbläsaren och be sedan Claude bygga. | Musicum (Uppsala universitet), Upplandsmuseet, UAK och många små arrangörer. Katalin säljer en del biljetter där. | Medel |


## 2. Förfrågningar att skicka, i prioritetsordning

| # | Vem | Be om | Ger oss |
|---|---|---|---|
| 1 | **Kuratorskonventet** (Nationsguiden), kuratorskonventet.se | Lov att använda Nationsguidens kalender, gärna som iCal eller JSON. I dag finns inget flöde, bara sidans egen sökning en dag i taget (`admin-ajax.php`), och nationernas egna sidor har inga användbara flöden. | Alla 13 nationers klubbar, pubar, konserter och gasquer, runt 40–60 per dag. Vår största lucka: nattliv och studentkultur. |
| 2 | **Uppsala universitet**, kommunikationsavdelningen, webben | Kalendariet har redan kalenderfil, RSS och JSON (under `/appresource/`), men robots.txt stänger `/appresource` för alla robotar. Be dem öppna den för oss, eller ge oss lov. | Öppna föreläsningar, Gustavianum, Musicum, Universitetsaulan, Botaniska trädgården, Linnéträdgården. Runt 100 publika evenemang. |
| 3 | **Uppsala kommun, kulturförvaltningen** | Ett gemensamt flöde från kommunens kalendrar | Uppsala konstmuseum, Biotopia, Bror Hjorths Hus, Teater Blanca, Kulturveckan, och Reginateatern när den öppnar igen |
| 4 | **Kulturnatten**, kulturnatten@uppsala.se | En export av programmet inför 2027 | Hela Kulturnatten, en gång om året |
| 5 | **Uppsala kommuns arenor** (Sportfastigheter): Studenternas, IFU Arena, Fyrishov | iCal- eller JSON-flöde från arenornas kalendrar | De flesta elitmatcher i fotboll, bandy, innebandy och basket, och andra arrangemang. Det är offentlig verksamhet. |
| 6 | **Profixio**, profixio.com/app/docs | En läsnyckel (`X-Api-Secret`) för publika matcher | Handboll, basket och volleyboll med en och samma nyckel |
| 7 | **Studieförbunden** (Sensus, ABF, Studiefrämjandet, Medborgarskolan, Folkuniversitetet, Bilda), deras nationella webbgrupper | Publika evenemang i Uppsala kommun som flöde | Föreläsningar och mindre konserter |
| 8 | **Svenska Innebandyförbundet** (iBIS API) | Ideell läsåtkomst till SSL-matcher i Uppsala. Normalt kostar det 3 000 kr per lag och säsong. | Storvreta IBK och Sirius IBK med exakta tider |
| 9 | **Fyrisbiografen / bio.se** | Ett flöde med visningar | Film på de oberoende biograferna |
| 10 | **Uppsala Kortfilmfestival** | Programmet som flöde | En vecka i oktober, cirka 300 filmer |
| 11 | **Everysport Media Group** | En ideell nyckel utöver den fria nivån, som bara ger livedata | Amerikansk fotboll, rugby och mindre sporter |
| 12 | **Ebiljett och Nortic** | Ett evenemangsflöde för arrangörerna i Uppsala | Sirius fotboll och Uppsala Basket (Ebiljett), Sirius bandy (Nortic) |
| 13 | **Initcia** (Gratis Uppsala, Barn i Uppsala) | Samarbete eller datautbyte | Gratis- och familjeevenemang |
| 14 | **Heja Uppsala**, tjena@hejauppsala.com | Avtal eller nyckel till deras låsta RSS | De cirka 135 evenemang som bara finns hos Heja |
| – | **Tickster** | Ansökan är redan skickad. Påminn om inget har hänt. | Snabbare och säkrare än webbsidorna |

## 3. Öppna källor som kan byggas direkt

Kräver inget tillstånd. Undersökt 16 oktober 2026: robots.txt tillåter, och det finns strukturerad data.

| Källa | Flöde | Ger oss | Status |
|---|---|---|---|
| IFU Arena | Arenans egen kalender: `/wp-json/gital/calendar/fetch_calendar?date=ÅÅÅÅ-MM` (en månad per anrop, HTML i JSON) | Innebandyns Allsvenskan (Sirius IBK, Hagunda) och SSL, runt 12 evenemang på sex veckor | Nästa att bygga |
| Laget.se och Svenska lag | En kalenderfil per lag: `cal.laget.se/<lag>.ics` och `cal.svenskalag.se/<id>`. Bara matcher tas med (inte träningar). | Lägre divisioner: Upsala IF, UNIK, Uppsala BoIS, Uppsala 86ers, Uppsala Rugby med flera | Nästa att bygga, lag för lag i `scripts/sport/konfig.mjs` |
| SLU | Sökningens JSON (`/api/search`, Uppsala = 79) och schema.org Event på varje sida | Öppna föreläsningar på Ultuna ("Värt att veta"), runt 5 publika i månaden. Mest disputationer och konferenser. | Liten, senare |
| Universitetsbiblioteket | LibCal: `libcal.ub.uu.se` (JSON och iCal, 10 sekunder mellan anrop) | 4 publika av 48, resten är kurser. Finns också i universitetets kalendarium. | Låg prioritet |
| Kulturoasen, Upplandsmuseet | Bara HTML (inget flöde) | Söndagskonserter och museets helgprogram, runt 5–10 i månaden | Senare, som HTML |
| Uppsala Missionskyrka, Bror Hjorths Hus, Biotopia, Fyrishov, Katalin, UKK, Musik i Uppland | Se "Det här hämtar vi i dag" | | Byggda 16 okt 2026 |

Inte värt det (undersökt 16 okt): Fyrisgården (mest läger och kurser, inga datum i flödet), Orphei Drängar och UAK (några få konserter om året, finns redan via andra), Studenternas (bara säsonger, inga datum), Slottsbiografen (säljs via Tickster), Visit Swedens öppna data (inga evenemang i Uppsala kommun), kommunens öppna data (inga evenemang).

## Undersökt 16 oktober: behöver nyckel eller lov

| Källa | Vad som finns | Vad som behövs |
|---|---|---|
| Billetto | Public API v3 (`billetto.se/api/v3/public/events`), svarar 401 utan nyckel | En gratis nyckel, se avsnitt 1 |
| Profixio | Riktigt API (`X-Api-Secret`, 120 anrop per minut) | En nyckel från Profixio (förfrågan 6) |
| Uppsala universitet | Kalenderfil, RSS och JSON, stängda i robots.txt | Lov eller att de öppnar (förfrågan 2) |
| Nationsguiden | Ingen datakälla, bara sidans sökning dag för dag | Lov från Kuratorskonventet (förfrågan 1) |
| Fyrisbiografen | Bara HTML med tre dagar i taget | Fråga om ett flöde (förfrågan 9) |
| Uppsala konstmuseum | Bara en HTML-sida med månadens program | Fråga kulturförvaltningen (förfrågan 3) |
| Kulturnatten | Ett internt JSON-API på kulturnatten.uppsala.se, inte dokumenterat | Fråga kommunen (förfrågan 4) |
| Uppsala Kortfilmfestival | Bara HTML och PDF. Biljetterna säljs via Tickster. | Kommer via Tickster-API:t när nyckeln finns |
| Nortic, Ebiljett | robots.txt stänger Nortics API. Ebiljett gick inte att nå. | Partneråtkomst (förfrågan 12) |

## Mål: bara API:er och flöden (beslut 27 oktober 2026)

Heja Uppsala hämtas inte längre. Så här hämtas resten:

| Nivå | Källor |
|---|---|
| API med nyckel | Tickster, Billetto. Väntar på nyckel: Svenska kyrkan, Ticketmaster. |
| Öppna API:er och flöden som arrangören publicerar | Stadsteatern, Musik i Uppland, Katalin, UKK, Missionskyrkan, Bror Hjorths Hus (WordPress), Fyrishov och Profixio för basket, handboll och volleyboll (kalenderfiler) |
| Samma JSON-API som källans egen sida använder, utan avtal | Bibliotek Uppsala (Axiell), Allsvenskan och Superettan (Sportomedia), Damallsvenskan, Elitettan och SSL (Sportality) |
| Läser webbsidor, ska ersättas | Destination Uppsala, Kubik (sökningen ger HTML, perioderna läser aktivitetens sida), Biotopia (JSON inuti kalendersidan), HockeyAllsvenskan (stats.swehockey.se), bandyn (Profixios schemasidor), och Ticksters webbsidor som reserv när API:et inte svarar |

Vägen bort från sista raden: Kubik och Biotopia drivs av kommunen (förfrågan 2), Destination Uppsala (förfrågan 8), sporten via Profixio och Ishockeyförbundet (sportförfrågningarna nedan). Upplandsmuseets slöjdverkstäder säljs via Billetto men syns inte i Billettos öppna API (förfrågan 4, och Billetto om partneråtkomst).

## Plan: sluta hämta från Heja Uppsala (undersökt 27 oktober 2026, Heja avstängd samma dag)

Av 1 664 evenemang på sidan fanns 126 bara hos Heja (data från 20 okt). Runt 27 av dem finns redan hos andra källor under en annan titel ("Elvis, Elvis, Elvis! – Ukk – 2026"). Det är ett sammanslagningsfel som Claude rättar. Den verkliga luckan är alltså runt 100 evenemang.

### Görs utan att fråga någon

| Vad | Vem | Ersätter |
|---|---|---|
| Lägg in `SVK_API_KEY` | Du | Uppsala domkyrka (6) och fler kyrkkonserter |
| Skaffa Billetto-nyckel (gratis arrangörskonto) | Du | Musicum (2), en del av Kaliber Room |
| Ticksters API (inlagt 27 okt) | Klart | KAIJA (3), en del av Kaliber, konstmuseet |
| Rätta sammanslagningen av titlar med "– Ukk – 2026" och liknande | Claude | Runt 27 |
| Nya säsongs-id för bandyn i Profixio (`scripts/sport/konfig.mjs`) | Claude | Sirius och Uppsala BoIS (runt 12) |

### Förfrågningar, kultur, i den här ordningen

| # | Till | Be om | Ersätter hos Heja |
|---|---|---|---|
| 1 | Kaliber Room, info@kaliberroom.com | Lov att läsa programmet, eller en iCal- eller JSON-länk | 25 (största luckan) |
| 2 | Uppsala kommun, kulturförvaltningen, kulturforvaltningen@uppsala.se | Ett flöde för Uppsala konstmuseum och Reginateatern (som spelar på Den Lilla Teatern under renoveringen) | 9 |
| 3 | Himlen är blå som en apelsin (kaféet saknar biljettsystem) | En iCal-länk, eller att de lägger in själva när den funktionen finns | 7 |
| 4 | Upplandsmuseet, info@upplandsmuseet.se | Ett flöde. Ger också Gamla Uppsala museum, som Upplandsmuseet driver. | 5 |
| 5 | Uppsala universitet, kommunikation@uu.se | Lov att använda kalendariets kalenderfil (stängd i robots.txt) | 5, plus runt 100 som inte finns hos Heja |
| 6 | Kulturoasen (drivs med Studiefrämjandet) | En kalenderlänk. WordPress-API:et saknar datum. | 9 |
| 7 | Uppsala Saluhall och krögarna (Taysta, Svenssons) | Ett flöde för matevenemangen | 8 |
| 8 | Destination Uppsala och Kulturnatten, kulturnatten@uppsala.se | Programexport, och att lägga evenemangen i Visit Swedens öppna nationella API | Få, men stort värde |
| 9 | Heja Uppsala, tjena@hejauppsala.com | Licenspris för det som blir kvar: runt 15–20 (gallerier, Fyrisgården, Auktionskammaren) | Resten |

Det som blir kvar (gallerier och små föreningar) löses bäst med självinmatning eller inklistrad iCal-länk (BACKLOG, "Sidan").

### Förfrågningar, sport, i den här ordningen

| # | Till | Finns | Ger oss |
|---|---|---|---|
| 1 | Profixio, tel 08-20 22 10 (www.profixio.com/app/docs) | API med `X-Api-Secret`, 120 anrop per minut | Handboll, basket, bandy, rugby, troligen volleyboll |
| 2 | Svensk Orientering (Eventor), eventorsupport@orientering.se, via Upplands OF | Dokumenterat API, nyckel per organisation | Hela orienteringskalendern |
| 3 | Everysport, support@everysport.com | API för många idrotter, källhänvisning krävs | Luckor i innebandy, bandy och lägre fotboll |
| 4 | Svenska Fotbollförbundet, api-support@svenskfotboll.se | Matchdata finns men kostar. Gratisnivån ger bara föreningar. | Fotboll under Superettan (Dalkurd, Upsala IF). Be om ideellt pris för Uppsala. |
| 5 | Svenska Ishockeyförbundet eller Impleo | API "för externa intressenter" (villkor ej bekräftade) | Ersätter läsningen av stats.swehockey.se |
| 6 | Svensk Friidrott, tävlingsavdelningen | Inget API, be om export | Lopp och friidrott |

Inte värt det: innebandyns iBIS (3 000 kr per förening och bara det egna laget), RF-SISU IdrottOnline (inget kalender-API), Ridsportens TDB, Tempus (simning), tennis och padel (inga API:er), Eventbrite och Luma (bara egna evenemang), Biljettkiosken och Ebiljett.

## 4. Domäner i Claudes miljö

Behövs inte längre. Sedan 25 september har Claudes miljö full åtkomst till internet. GitHub, där hämtningarna körs, har aldrig haft någon spärr.

## 5. Går inte, eller inte värt det

- **Facebook-evenemang:** Meta tillåter inte att andras evenemang hämtas.
- **Eventbrite, Meetup och Luma:** API:erna ger bara ens egna evenemang, inte sökning.
- **Filmstaden och Nordisk Film:** inga öppna API:er.
- **Trav, galopp och speedway:** ingen bana i Uppsala kommun.
- **Andra evenemangssajter** (Digga, evenemang.se, Bandsintown med flera): konkurrenter, och vi hämtar inte från dem.
- **Reginateatern:** stängd sedan maj 2026 på grund av fukt och mögel, enligt sökresultat. Återuppta när den öppnar igen.
