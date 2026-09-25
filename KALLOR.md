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

## 1. Nycklar du kan skaffa själv direkt

Gratis och utan förhandling. Ett konto räcker.

| Vad | Var | Ger oss | Värde |
|---|---|---|---|
| **Svenska kyrkan** | Nyckeln finns redan. Lägg in den som hemligheten `SVK_API_KEY` i GitHub. | Konserter och musik i Uppsala pastorat | Högt |
| **SvFF öppna data (FOGIS)** | api-fogis-opendata.developer.azure-api.net: skapa konto och prenumeration | Alla fotbollsmatcher: Sirius, IK Uppsala, Dalkurd, Upsala IF, Sirius dam | Högt |
| **Ticketmaster Discovery API** | developer.ticketmaster.com: nyckeln kommer direkt | Större turnéer och Katalin, fyller luckor utanför Tickster | Medel |
| **Billetto** | Skapa konto på billetto.se och hämta en nyckel till Public Event Search API | Musicum (Uppsala universitet), Upplandsmuseet och många små arrangörer | Medel |

Dessutom kräver de här ingen nyckel alls, bara att domänerna öppnas här (se avsnitt 4):
- **Allsvenskans kalenderfil för Sirius** (allsvenskan.se/kalender). Ger avsparkstider som uppdateras när tv-tiderna bestäms.
- **HockeyAllsvenskans kalenderfil för Almtuna** (hockeyallsvenskan.se).

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
| Allsvenskan och HockeyAllsvenskan | Kalenderfiler per lag (.ics) | Sirius och Almtuna med exakta tider |
| Föreningar på Svenska lag och Laget.se | Kalenderfiler per lag | Upsala IF, Uppsala 86ers, Uppsala Rugby, Sirius innebandy med flera |
| Studenternas, IFU Arena, Fyrishov | Arenornas kalendrar | Matcher och andra arrangemang (se även förfrågan 5) |

## 4. Domäner att öppna i Claudes miljö

Det här behövs bara för att jag ska kunna bygga och prova. GitHub, där hämtningarna körs varje morgon, har ingen sådan spärr.

**Viktigast:**

```
allsvenskan.se
www.siriusfotboll.se
www.hockeyallsvenskan.se
nationsguiden.se
www.nationsguiden.se
www.uu.se
kalendarium.uu.se
libcal.ub.uu.se
uppsalamissionskyrka.se
brorhjorthshus.se
www.kulturoasen.se
biotopia.nu
fyrisgarden.se
studenternas.se
www.ifuarena.se
fyrishov.se
cal.svenskalag.se
www.svenskalag.se
cal.laget.se
www.laget.se
konstmuseum.uppsala.se
```

**När nycklarna finns:**

```
api-fogis-opendata.developer.azure-api.net
app.ticketmaster.com
billetto.se
billetto.dk
api.billetto.com
www.profixio.com
api.everysport.com
```

**Senare:**

```
www.musikiuppland.se
regionuppsala.se
od.se
www.uak.se
fyrisbiografen.se
bio.se
shortfilmfestival.com
www.sensus.se
www.abf.se
www.studieframjandet.se
www.medborgarskolan.se
www.folkuniversitetet.se
kaliberroom.com
kulturnatten.uppsala.se
```

## 5. Går inte, eller inte värt det

- **Facebook-evenemang:** Meta tillåter inte att andras evenemang hämtas.
- **Eventbrite, Meetup och Luma:** API:erna ger bara ens egna evenemang, inte sökning.
- **Filmstaden och Nordisk Film:** inga öppna API:er.
- **Trav, galopp och speedway:** ingen bana i Uppsala kommun.
- **Andra evenemangssajter** (Digga, evenemang.se, Bandsintown med flera): konkurrenter, och vi hämtar inte från dem.
- **Reginateatern:** stängd sedan maj 2026 på grund av fukt och mögel, enligt sökresultat. Återuppta när den öppnar igen.
