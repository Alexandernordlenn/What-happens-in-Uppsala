# Metod: så hittar vi API:er och flöden

Skrivet 2 november 2026. Siffrorna kommer från `data/sida.json`, byggd samma dag (1 341 evenemang).

Den här filen är ingen lista över källor. Den finns i [`KALLOR.md`](KALLOR.md). Här står **hur** man letar, värderar och ber om tillgång, och vad vi ska göra först.

---

## 1. Kort sammanfattning

- **40 procent av sidan hänger på att vi läser webbsidor.** 536 av 1 341 evenemang finns bara via Kubik, Destination Uppsala, Biotopia eller sportens schemasidor. Ytterligare 298 (22 procent) kommer via JSON som en sida använder internt, utan dokumentation eller lov. Bara 38 procent kommer via ett riktigt API eller ett flöde som arrangören själv publicerar.
- **Nästan allt som läser webbsidor ägs av kommunen.** Kubik, Biotopia och Uppsala konstmuseum drivs av kommunen. Destination Uppsala AB ägs av kommunen via Uppsala Stadshus AB. Tillsammans är det 482 av de 536. Kommunen har en egen riktlinje som säger "öppenhet som standard".
- **Destination Uppsala har redan ett öppet API.** Deras WordPress visar alla evenemang på `/wp-json/wp/v2/event`, men datum och plats är dolda. Det är troligen en enda inställning hos dem.
- **Data finns oftast hos systemet, inte hos arrangören.** En arrangör använder ett biljettsystem, ett tävlingssystem eller en webbplattform. Hitta systemet först. Fråga sedan den som äger nyckeln, vilket ibland är leverantören och ibland kunden.
- **Metoden i fyra steg:** mät beroendet i datan, identifiera systemet bakom, värdera med en poängmall, och be den som faktiskt kan slå på flödet. Upprepa varje kvartal.

---

## 2. Var API:erna finns

Tänk i tre lager. De flesta arrangörer finns i minst två av dem.

1. **Biljettsystem.** De säljer biljetter åt många arrangörer och har ofta ett API över alla sina kunder.
2. **Tävlingssystem.** Förbunden lägger in sina serier och matcher där. Nyckeln ägs ofta av förbundet.
3. **Webbplattformar.** Arrangörens egen webbplats. Många plattformar har ett inbyggt API som bara behöver slås på.

Lägg till ett fjärde lager för offentlig sektor: **öppna data**, där lagen hjälper oss.

### Biljettsystem

| System | Öppet API? | Hur man får tillgång | Kommentar |
|---|---|---|---|
| Tickster | Ja. [Event Dump API](https://developer.tickster.com/documentation/eventdump) (hela utbudet som en fil) och Event API. | Nyckel efter ansökan. Vi har den. | Bäst täckning i Uppsala bland biljettsystemen. |
| Billetto | Ja, Public Event Search API. Dokumentationen på api.billetto.com stänger ute robotar (enligt `KALLOR.md`). | Gratis nyckel via arrangörskonto. Vi har den. | API:et visar färre evenemang än webbplatsen (11 av 39, `BACKLOG.md`). Fråga om partneråtkomst. |
| Ticketmaster | Ja, [Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/getting-started/). 5 000 anrop per dygn och 5 per sekund som standard. | Gratis nyckel direkt. | Hämtningen är byggd och väntar på nyckeln. |
| Nortic | Inget öppet API hittat. `KALLOR.md`: robots.txt stänger deras API. | Partneravtal, i så fall. Inte kontrollerat. | Sirius bandy säljer här. |
| Ebiljett | Inget hittat. Sidan gick inte att nå 16 okt (`KALLOR.md`). | Okänt. | Sirius fotboll och Uppsala Basket. |
| Eventbrite, Luma, Meetup | Bara ens egna evenemang (`KALLOR.md`). | | Inte värt det. |

**Slutsats:** biljettsystemen är redan täckta så långt det går. Det som saknas där är partneravtal, inte nya API:er.

### Sportens system

| System | Vem använder det | Öppet API? | Vem äger nyckeln |
|---|---|---|---|
| Profixio | Bandy, basket, handboll, volleyboll | Ja, [dokumenterat API](https://www.profixio.com/app/docs) med rubriken `X-Api-Secret`, 120 anrop per minut. Har anrop för matcher per turnering och säsong. | **Förbundet eller distriktet.** Dokumentationen säger att nycklar skapas "for either an organisation (forbund) or a district (krets)". Profixio skriver "Contact Profixio to get an API token". |
| FOGIS och Svensk Fotboll | Fotboll | Det finns en [utvecklarportal](https://api-fogis-opendata.developer.azure-api.net/). Enligt `KALLOR.md` ger gratisnivån bara föreningar, inga matcher. | Svenska Fotbollförbundet. |
| Impleo (stats.swehockey.se) | Ishockey | Inget öppet API hittat. Impleo IT Solutions AB står bakom förbundets [app](https://apps.apple.com/us/app/swehockey/id914022805). | Svenska Ishockeyförbundet. |
| Sportomedia och Sportality | Allsvenskan, Superettan, Damallsvenskan, Elitettan, SSL | Inga publika dokument. Vi läser JSON som ligornas egna sidor använder. | Ligorna (inte kontrollerat vem). |
| IdrottOnline (RF-SISU) | Föreningarnas medlemssystem | Inget öppet kalender-API hittat. Ett RF-SISU-dokument från mars 2026 säger att [Idrottsarenan ska ersätta IdrottOnline under 2026](https://www.skidskytte.se/download/18.398ac79b19d0535972792159/1774253818189/RFSISUSF%20Fr%C3%A5gor%20och%20svar%20%C3%A4ndrad%20tidsplan%20Idrottsarenan.pdf). | RF-SISU. Vänta tills Idrottsarenan finns och fråga då. |
| Laget.se och Svenska lag | Föreningar och lag | En kalenderfil per lag (`cal.laget.se/<lag>.ics`, `cal.svenskalag.se/<id>`), kontrollerat av oss 16 okt (`KALLOR.md`). Inget sök-API. | Varje lag slår på sin egen kalender. |
| SportAdmin | Föreningar | Inget API eller kalenderflöde hittat. | Inte kontrollerat. |
| Everysport | Samlar många idrotter | API med nyckel. [Dokumentationen har flyttat till SwaggerHub](https://github.com/everysportmediagroup/everysport-api-documentation). Äldre villkor förbjöd att blanda deras data med andra källor och krävde länk tillbaka. | Everysport. Krockar med vår modell, se `KALLOR.md`. |
| Eventor | Orientering | Ja, [REST-API](https://eventor.orientering.se/Documents/Guide_Eventor_-_Get_data_via_API.pdf) med rubriken `ApiKey`. | **Förbundets eller klubbens administratör** skapar nyckeln i Eventor. Gå alltså till en klubb eller Upplands OF, inte till leverantören. |

### Webbplattformar

| Plattform | Inbyggt API | Vad som kan vara avstängt |
|---|---|---|
| WordPress | REST-API på `/wp-json/`, på som standard. Sidan talar om var API:et finns i en `Link`-rubrik med `rel="https://api.w.org/"` ([WordPress dokumentation](https://developer.wordpress.org/rest-api/using-the-rest-api/discovery/)). | Egna fält från tillägget ACF syns inte i API:et förrän man bockar i "Show in REST API" för fältgruppen. Standard är nej ([ACF dokumentation](https://www.advancedcustomfields.com/resources/wp-rest-api-integration/)). |
| WordPress med The Events Calendar | `/wp-json/tribe/events/v1/events`, gratis och på som standard. Varje sida beskriver sig själv på `/wp-json/tribe/events/v1/doc` ([sammanfattning hos Liquid Web](https://www.liquidweb.com/?p=454176), [officiell kodreferens](https://docs.theeventscalendar.com/reference/files/src/tribe/rest/v1/endpoints/archive/event.php)). | Sällan något. Vi använder det redan för Missionskyrkan och Bror Hjorths Hus. |
| Umbraco (Kubik) | Content Delivery API. Det är **avstängt som standard** och slås på i inställningarna. Kan vara öppet för alla eller kräva nyckel ([Umbraco dokumentation](https://docs.umbraco.com/umbraco-cms/reference/content-delivery-api)). | Hela API:et. Kubiks robots.txt stänger dessutom `/umbraco/` för robotar. Vi får alltså inte pröva själva, utan måste fråga. |
| Sitevision (många kommuner och myndigheter) | Ett inbyggt REST-API som **måste slås på** för webbplatsen. Innehåll syns bara om besökare utan inloggning har läsrätt ([Sitevision REST API](https://developer.sitevision.se/docs/rest-api), [hjälpen](https://help.sitevision.se/en/restAppImportGeneralHelp.html)). Kalendermodulen sparar evenemang som artiklar ([hjälpen om kalendern](https://help.sitevision.se/en/eventCalendarHelp.html)). | Ofta allt. Fråga webbredaktören om REST-API:et eller ett RSS-flöde från kalenderns nyhetsmodul (inte kontrollerat att det fungerar för evenemang). |
| LibCal (universitetsbiblioteket) | JSON och iCal (`KALLOR.md`). | |

### Öppna data och nationella samlingsställen

| Vad | Vad det ger | Läget |
|---|---|---|
| [Visit Swedens nationella API](https://corporate.visitsweden.com/nationellt-api) | Öppet sedan 15 september 2025, schema.org-format, "utan licensrestriktioner" och utan licenskostnad. Destinationer lägger in data själva i verktyget EntryScape eller skördas automatiskt. [Dokumentation](https://docs.visitsweden.com/sv/). | `KALLOR.md` (16 okt): inga evenemang i Uppsala kommun. Om Destination Uppsala börjar leverera dit får vi ett nationellt, öppet API på köpet. |
| [dataportal.se](https://www.dataportal.se/sv/datasets?q=evenemang) | Sveriges katalog över öppna data. | Andra kommuner publicerar evenemang där: Malmö ("Evenemang", [länk](https://opendata-api.malmo.se/dataset/2c11b7aa-a5fa-4087-9dce-b0d9f4c12ddb)), Eskilstuna ("Aktuella evenemang", [länk](https://eskilstuna.entryscape.net/store/1/resource/138)), Tomelilla bibliotek ([länk](https://data.tomelilla.se/store/1/resource/333)) och Västsverige ([länk](https://vgregion.entryscape.net/store/7/resource/82)). Inget från Uppsala. Bra argument mot kommunen. |
| [opendata.uppsala.se](https://opendata.uppsala.se/) | Kommunens portal för öppna data. robots.txt kräver 60 sekunder mellan anrop. | `KALLOR.md`: inga evenemang. |
| [Uppsala kommuns riktlinje för öppna data](https://www.uppsala.se/contentassets/72257880b1a9476d89f8072c707a8b9d/riktlinje-for-publicering-av-oppna-data-2022-04-06.pdf) (KSN-2022-00073) | Gäller "hela kommunkoncernen, både nämnder och bolagsstyrelser". Princip 1: "Öppenhet som standard". Princip 3: API:er och maskinläsbara format. Princip 4: som utgångspunkt inget krav på ansökan eller registrering, och avgiftsfritt. Princip 6: dialog med användarna. | Vårt starkaste argument. Dokumentansvarig: stadsarkivarien på kommunledningskontoret. |
| [Lag (2022:818) om den offentliga sektorns tillgängliggörande av data](https://lagen.nu/2022:818) | Gäller myndigheter, och offentliga företag för data som hör till en tjänst av allmänt intresse. Villkor ska vara "objektivt, proportionerligt och icke-diskriminerande". På begäran ska data lämnas i öppet, maskinläsbart format när det är lämpligt och tekniskt möjligt. | Lagen tvingar inte fram nya API:er, men den gör det svårt att säga ja till en aktör och nej till en annan. Se avsnitt 8. |
| Kulturrådet | Inget evenemangs-API hittat. | Inte kontrollerat närmare. |

---

## 3. Så upptäcker man ett flöde

Gör kontrollerna i den här ordningen. De flesta tar under en minut. Läs alltid robots.txt först, och gå aldrig förbi en spärr.

| # | Kontroll | Vad man letar efter | Exempel från Uppsala |
|---|---|---|---|
| 1 | **robots.txt** | Om vi får läsa. Den avslöjar ofta plattformen också: "Yoast" betyder WordPress, "Umbraco" betyder Umbraco. | Destination Uppsala: Yoast, allt tillåtet. Kubik: Umbraco, `/umbraco/` stängt. |
| 2 | **Biljettlänken** | Vilket system säljer biljetterna? Då kanske evenemanget redan kommer via Tickster, Billetto eller Ticketmaster. | Kortfilmfestivalen säljer via Tickster. |
| 3 | **Tävlingssystemet** | Adressen på lagets schemalänk: `profixio.com`, `swehockey.se`, `svenskfotboll.se`, `laget.se`. | Bandy och basket via Profixio. |
| 4 | **`/wp-json/`** | Svarar den med JSON är det WordPress. Titta i listan `namespaces` och `routes` efter `event`, `tribe/events` eller liknande. Kontrollera sedan om datum syns, eller om fältet `acf` är tomt. | Destination Uppsala: `/wp/v2/event` med 1 482 poster, men `acf` är tom. |
| 5 | **`/wp-json/wp/v2/types`** | Vilka typer av innehåll som finns i API:et. Saknas evenemangen där är de dolda. | Biotopia: inga evenemang i listan. |
| 6 | **Kalenderfil** | Ord som "Prenumerera", "Lägg till i kalender", `.ics` eller `webcal://`. | Fyrishov, Laget.se. |
| 7 | **RSS** | `<link rel="alternate" type="application/rss+xml">` i sidhuvudet, eller `/feed/`. | |
| 8 | **JSON-LD** | `<script type="application/ld+json">` med `"@type": "Event"` ([Googles beskrivning](https://developers.google.com/search/docs/appearance/structured-data/event)). | SLU. |
| 9 | **Sidor om öppna data** | "API", "utvecklare", "öppna data" på webbplatsen, och sök på [dataportal.se](https://www.dataportal.se/). | |
| 10 | **Appen** | Har arrangören en app finns det nästan alltid ett API bakom. Fråga efter det. Plocka aldrig isär appen själv. | Swehockey-appen. |

**Viktigt om punkt 8:** JSON-LD är strukturerad data, men den sitter inne i webbsidorna. För att läsa den måste vi hämta en sida per evenemang. Enligt målet från 27 oktober är det inte ett flöde. Se JSON-LD som ett tecken på att systemet redan har strukturerad data, och be då om ett riktigt flöde.

**Samma sak gäller "samma JSON som sidan använder"** (Axiell för biblioteket, Sportomedia och Sportality). Det fungerar tekniskt, men det är inte publicerat för oss. Ett kort "ok?"-mejl gör det till ett flöde med lov.

---

## 4. Så värderar man ett API

Ge varje kandidat 0, 1 eller 2 poäng på sju frågor. Under 8 poäng: vänta. 8–11: bygg om insatsen är liten. 12 eller mer: bygg.

| Fråga | 0 poäng | 1 poäng | 2 poäng |
|---|---|---|---|
| **Täckning:** hur många evenemang i Uppsala kommun per månad som vi inte redan har? Mät mot `sida.json`. | Under 5 | 5–30 | Över 30 |
| **Ersätter webbläsning:** hur många av dem kommer i dag bara via webbsidor? | Inga | Några | Många |
| **Stabilitet:** finns dokumentation, versionsnummer och en ansvarig? | Odokumenterat | Dokumenterat men utan versioner | Dokumenterat och versionerat |
| **Villkor och licens:** får vi spara, bearbeta och visa fakta med länk tillbaka? | Förbjudet eller oklart | Tillåtet med krav (till exempel källtext eller kort cachning) | Öppen licens eller skriftligt ja |
| **Kostnad** | Kostar pengar | Gratis med gränser | Gratis |
| **Åtkomst** | Kräver avtal som tar månader | Nyckel efter ansökan | Öppet eller nyckel direkt |
| **Personuppgifter:** innehåller svaret namn, telefon eller e-post som vi måste filtrera bort? | Mycket, och svårt att skilja ut | Några fält som går att ta bort | Inga |

Fyra frågor att alltid ställa utöver poängen:

- **Datakvalitet:** finns klockslag, plats med koordinater, kategori och "inställt"? Tickster gav koordinater och taggar som webbsidorna saknade.
- **Underhåll:** byts id varje säsong? Swehockey och Profixio kräver nya id varje höst (`BACKLOG.md`).
- **Villkor som krockar:** Everysports äldre villkor förbjöd att blanda med andra källor. Ticketmaster kräver att vi tar bort evenemang inom 24 timmar på begäran.
- **Unikhet:** räkna hur många evenemang som bara kommer från den här källan. En källa som bara dubblerar Tickster är inte värd mycket.

Exempel med dagens kunskap:

| Kandidat | Tä | Er | St | Vi | Ko | Åt | Pe | Summa | Beslut |
|---|---|---|---|---|---|---|---|---|---|
| Kubik via kommunens API (om det slås på) | 2 | 2 | 1 | 2 | 2 | 1 | 2 | 12 | Fråga först |
| Destination Uppsala med datum i `/wp-json/` | 2 | 2 | 1 | 1 | 2 | 2 | 2 | 12 | Fråga |
| Profixio-API för bandy | 1 | 2 | 2 | 1 | 2 | 1 | 1 | 10 | Fråga |
| Everysport | 1 | 1 | 2 | 0 | 1 | 1 | 2 | 8 | Vänta |
| Visit Swedens nationella API | 0 | 0 | 2 | 2 | 2 | 2 | 2 | 10 | Värt först när Uppsala levererar dit |

---

## 5. Så ber man om tillgång

### Vem ska man fråga: leverantören eller kunden?

Fråga den som kan slå på flödet.

| Läge | Fråga | Exempel |
|---|---|---|
| Leverantören har ett API över alla sina kunder, och nyckeln är gratis eller efter ansökan. | **Leverantören.** | Tickster, Billetto, Ticketmaster, Svenska kyrkan. |
| Nyckeln skapas per kund (förbund, distrikt, klubb). | **Kunden**, med leverantören i kopia. Annars får leverantören fråga kunden ändå. | Profixio (per förbund eller distrikt), Eventor (per förbund eller klubb). |
| Datan finns, men en inställning döljer den. | **Kunden** (den som ansvarar för webbplatsen), och säg exakt vilken inställning. | Destination Uppsala (ACF i WordPress), Kubik (Umbraco), kommuners Sitevision. |
| robots.txt stänger ett flöde som redan finns. | **Kunden.** Be om lov eller att de öppnar. | Uppsala universitets kalendarium. |
| Offentlig sektor utan flöde. | **Förvaltningen eller bolaget som äger informationen**, och hänvisa till kommunens riktlinje och lagen. | Kubik, Biotopia, konstmuseet. |
| Ingen har ett system. | Ingen. Låt arrangören klistra in en kalenderlänk eller lägga in själv (`BACKLOG.md`, "Sidan"). | Små gallerier och kaféer. |

Kontaktadresser står i `KALLOR.md`. Gissa aldrig en adress. Hittar du ingen, skriv till organisationens allmänna adress eller registratur och be dem skicka vidare.

### Argument som brukar fungera

- **Det kostar dem nästan ingenting.** Ofta en inställning, inte ett projekt. Säg exakt vilken.
- **Låg belastning.** En hämtning per dygn, med en User-Agent som säger vilka vi är.
- **Vi sparar bara fakta** (titel, tid, plats, kategori och länk tillbaka). Inga beskrivningar, bilder eller personuppgifter.
- **De får besökare.** Varje evenemang länkar till deras egen sida eller biljettsida.
- **De kan be oss sluta.** Vi slutar direkt, och tar bort enskilda evenemang inom 24 timmar.
- **Ideellt.** Ingen reklam, inget företag.
- **Konkreta siffror.** "Ni har 409 tillfällen hos oss som vi i dag måste läsa från er webbsida."
- **För offentlig sektor:** kommunens egen riktlinje (öppenhet som standard, API:er, ingen registrering, avgiftsfritt) och lag (2022:818). Malmö och Eskilstuna publicerar redan evenemang som öppna data.
- **Det blir bättre för dem också.** Med ett flöde visar vi rätt tider och inställda evenemang, i stället för en gammal kopia.

### Mejlmall

> **Ämne:** Fråga om ett öppet flöde för era evenemang
>
> Hej!
>
> Jag heter Alexander Nordström och driver Uppsala just nu (alexandernordlenn.github.io/What-happens-in-Uppsala), en ideell kalender över allt som händer i Uppsala kommun. Ingen reklam och inget företag.
>
> Vi visar i dag **[antal]** av era evenemang, med titel, tid, plats och en länk tillbaka till er. Vi vill hämta dem från ett flöde i stället för att läsa er webbsida, så att tiderna blir rätt och belastningen på er blir så liten som möjligt.
>
> **[Välj ett av styckena nedan.]**
>
> Vi hämtar en gång per dygn och sparar bara fakta: titel, tid, plats, kategori och länk. Inga beskrivningar, bilder eller personuppgifter. Säger ni till slutar vi direkt.
>
> Vem hos er är rätt person att fråga, om det inte är du?
>
> Vänliga hälsningar
> Alexander Nordström

**Stycke A, när en inställning döljer datan:**
> Er webbplats har redan ett öppet API på [adress], men datum och plats syns inte där. I WordPress-tillägget ACF räcker det att bocka i "Show in REST API" för fältgruppen med evenemangens fält. Skulle ni kunna göra det?

**Stycke B, när nyckeln ägs av förbundet:**
> Ert tävlingssystem [Profixio/Eventor] har ett API, och enligt dokumentationen skapas nycklar för ett förbund eller distrikt. Kan ni skapa en läsnyckel åt oss, för publika matcher i [serier]? Jag har [leverantören] i kopia.

**Stycke C, offentlig sektor:**
> Uppsala kommuns riktlinje för öppna data (KSN-2022-00073) säger att information ska vara öppen som standard, gärna via API, utan krav på registrering. Malmö och Eskilstuna publicerar redan sina evenemang som öppna data på dataportal.se. Kan ni publicera [Kubiks aktiviteter / Biotopias program / konstmuseets program] på samma sätt, eller ge oss ett flöde eller en export? Vi vill hellre ha det än läsa er webbsida.

**Påminnelse efter tre veckor:** svara på samma tråd, en mening: "Hej igen, jag ville bara höra om ni hunnit titta på det här?" Efter ytterligare tre veckor, prova en annan kontaktväg.

---

## 6. Läget i Uppsala i siffror

Alla siffror från `data/sida.json`, byggd 2 november 2026, 1 341 evenemang. Varje evenemang räknas efter den **bästa** vägen det kommer in.

| Hur evenemanget kommer in | Källor (bokstav) | Evenemang | Andel |
|---|---|---|---|
| API med nyckel | Tickster (t), Billetto (o) | 222 | 17 % |
| Öppet flöde som arrangören publicerar | Stadsteatern, Musik i Uppland, Katalin, UKK, Missionskyrkan, Bror Hjorths Hus, Fyrishov, Profixios kalenderfiler | 285 | 21 % |
| Samma JSON som sidan använder, utan lov | Biblioteket (b), Allsvenskan och Sportality | 298 | 22 % |
| **Bara via webbsidor** | Kubik (u), Destination Uppsala (d), Biotopia (n), stats.swehockey.se och Profixios schemasidor | **536** | **40 %** |

### De 536 som bara kommer via webbsidor, efter vem som kan ersätta dem

| Vem kan ersätta | Evenemang | Olika titlar | Vad det är |
|---|---|---|---|
| Kommunen: Kubik | 409 | 73 | Mest återkommande aktiviteter för barn och unga i allaktivitetshus och idrottshallar. Gränby allaktivitetshus ensamt: 100. 363 är gratis. |
| Destination Uppsala, övrigt | 43 | 40 | Julmarknader, stadsevenemang, lopp, enstaka konserter. |
| Profixio och Bandyförbundet | 22 | | Sirius och Uppsala BoIS bandy, från Profixios schemasidor och Destination Uppsala. |
| Kommunen: Biotopia | 19 | 19 | Naturaktiviteter och föredrag. |
| Ishockeyförbundet | 17 | 12 | Almtunas hemmamatcher i Gränby ishall. |
| Kommunen: Uppsala konstmuseum (via Destination Uppsala) | 11 | 7 | Utställningar, familjelördagar, konserter. |
| Uppsala universitet (via Destination Uppsala) | 8 | | Humanistiska teatern, Botaniska trädgården, Gustavianum, Universitetshuset. |
| Svenska kyrkan (via Destination Uppsala) | 7 | | Konserter i domkyrkan. Löses av nyckeln vi redan har. |

**Kommunen och dess bolag står för 482 av 536** (Kubik, Biotopia, konstmuseet och Destination Uppsala).

### Kategorier som hänger mest på webbsidor

| Kategori | Totalt | Bara via webbsidor |
|---|---|---|
| aktivitet | 302 | 187 (62 %) |
| sport | 237 | 163 (69 %) |
| ovrigt | 39 | 23 (59 %) |
| museum | 65 | 21 (32 %) |
| scen | 242 | 82 (34 %) |
| musik | 252 | 47 (19 %) |
| prat | 192 | 12 (6 %) |

**Luckor som inte handlar om webbsidor:** kategorin natt har bara 4 evenemang och mat 8. Där saknas källan helt. Studentlivet (nationerna) är den största luckan enligt `KALLOR.md`.

### Det som fungerar men vilar på lånad mark

- Biblioteket: 281 evenemang, varav 197 bara därifrån. Axiells JSON, utan dokumentation eller lov.
- Allsvenskan, Superettan, Damallsvenskan, Elitettan och SSL: 17 matcher, odokumenterad JSON.

Ett "ok"-mejl flyttar dem till raden "öppet flöde".

---

## 7. Handlingsplan

Ordnad efter största vinst per insats. "Du" är Alexander, "Claude" bygger.

| # | Vem | Vad | Vinst | Insats |
|---|---|---|---|---|
| 1 | Du | **Ett mejl till kommunen** (kulturförvaltningen, med stadsarkivarien på kommunledningskontoret i kopia som ansvarig för riktlinjen om öppna data). Be om: Kubiks aktiviteter som öppna data (Umbracos Content Delivery API eller en export), Biotopias program som flöde, konstmuseets program som flöde, och ett skriftligt "ok" för bibliotekets Axiell-API. Använd mall med stycke C. | 439 evenemang slutar läsas från webbsidor. 197 till får lov. | Ett mejl och en påminnelse. |
| 2 | Du | **Ett mejl till Destination Uppsala:** be dem bocka i "Show in REST API" för evenemangens fältgrupp i ACF (mall med stycke A). Fråga samtidigt om de kan leverera evenemang till Visit Swedens nationella API. | 83 evenemang, och hela källan (225) blir ett flöde. | Ett mejl. För dem troligen en inställning. |
| 3 | Du | **Svenska Bandyförbundet med Profixio i kopia:** be om en läsnyckel till Profixio (mall med stycke B). Fråga i samma veva Basket-, Handbolls- och Volleybollförbundet, så att kalenderfilerna kan bytas mot API:et. | 22 bandymatcher, och säkrare sport för 50 matcher till (basket, handboll och volleyboll från kalenderfiler). | Ett mejl per förbund. |
| 4 | Du | Lägg in `SVK_API_KEY` (står redan i `BACKLOG.md`). | 7 konserter i domkyrkan, och troligen många nya kyrkkonserter. | Fem minuter. |
| 5 | Claude | **Mät beroendet varje morgon.** Lägg till andelen per nivå (API, flöde, lånad JSON, webbsida) och listan "bara via webbsidor" per källa i `data/kvalitet.json`, och ett larm om andelen webbsidor ökar. | Metoden håller över tid utan manuellt arbete. | Liten. |
| 6 | Du | **Svenska Ishockeyförbundet:** fråga om ett dataavtal eller en export för HockeyAllsvenskan. | 17 matcher. | Ett mejl. Osäkert svar. |
| 7 | Du | **Uppsala universitet:** be om lov att använda kalendariets kalenderfil (finns redan, stängd i robots.txt). | 8 som läses från webbsidor i dag, plus runt 100 nya. | Ett mejl. |
| 8 | Du | **Kuratorskonventet** (Nationsguiden) enligt `KALLOR.md`. | Natt har 4 evenemang. Detta är den största luckan i utbudet. | Ett mejl, kanske ett möte. |
| 9 | Claude | **Kalenderlänk från arrangörer** (`BACKLOG.md`, "Sidan"). Små arrangörer klistrar in sin iCal-länk. | De sista små arrangörerna utan system. | Medel. |
| 10 | Claude och du | **Datum för avveckling.** När ett flöde kommer: stäng av webbläsningen samma dag. Har en förfrågan inte gett svar på åtta veckor, bestäm om källan ska vara kvar under undantaget eller stängas av. Uppdatera `KALLOR.md` efter varje svar. | Målet "bara API:er och flöden" blir verkligt. | Liten. |

**Varje kvartal** (sätt en påminnelse): gör om stegen i avsnitt 3 för de tio största platserna som saknar flöde, värdera med mallen i avsnitt 4, och skicka nya förfrågningar.

---

## 8. Osäkerheter

- **Destination Uppsala:** jag har sett att `/wp-json/wp/v2/event` finns (1 482 poster) och att fältet `acf` är tomt. Att datumen ligger i ACF-fält är en slutsats, inte kontrollerat. Det kan också vara ett annat tillägg. Ägandet via Uppsala Stadshus AB bygger på [kommunens dokument](https://www.uppsala.se/contentassets/8fac1bccef6b4cc9b6f630f576558292/missiv---grundlaggande-granskning-destination-uppsala-ab-sign.pdf) i sökresultat, inte på bolagets årsredovisning.
- **Kubik:** att Kubik kör Umbraco syns i robots.txt. Vilken version och om Content Delivery API går att slå på är inte kontrollerat. Om Kubik har en app är inte bekräftat.
- **Biotopia:** WordPress, men evenemangen finns inte i API:et. Varför vet vi inte.
- **Profixio:** att nyckeln skapas per förbund eller distrikt står i dokumentationens ändringslogg (maj 2025). Om Profixio kan ge en ideell läsnyckel utan förbundets ja är okänt.
- **Lag (2022:818):** sammanfattningen bygger på [lagen.nu](https://lagen.nu/2022:818) och är ingen juridisk bedömning. Lagen gäller offentliga företag bara för data om tjänster av allmänt intresse som inte är direkt konkurrensutsatta. Om det täcker Destination Uppsala AB är oklart. Lagen ger ingen rätt att kräva ett nytt API.
- **Visit Swedens API:** sidan nämner inte uttryckligen evenemang, men dokumentationen har en kategori "Evenemang" i redigeringsverktyget. Om nyckel krävs står inte. Licensen för själva datan står inte i dokumentationen, bara "utan licensrestriktioner" på företagssidan.
- **The Events Calendar:** uppgifterna om API:et kommer från tredjepartsdokumentation och kodreferensen, inte från tillverkarens huvudsida.
- **Everysport:** villkoren jag hittade är från 2013. Dagens villkor är inte lästa.
- **IdrottOnline och Idrottsarenan:** uppgiften om bytet kommer från ett enda dokument från Skidskytteförbundet.
- **Nortic, Ebiljett, SportAdmin, Sitevisions kalendermodul och Kulturrådet:** inget API hittat vid sökning. Det betyder inte att inget finns.
- **Siffrorna:** de gäller en enda dag. Kubik har många återkommande tillfällen (409 tillfällen av 73 aktiviteter), så antalet tillfällen överdriver dess vikt något jämfört med enstaka evenemang. Indelningen "vem kan ersätta" bygger på plats och titel och kan slå fel för enstaka evenemang.
