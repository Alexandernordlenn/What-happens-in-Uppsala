# Uppsala just nu

En samlad kalender över allt som händer i Uppsala kommun, byggd från officiella API:er och direkta flöden från källorna.

- Sida: https://alexandernordlenn.github.io/What-happens-in-Uppsala/
- Repo: https://github.com/Alexandernordlenn/What-happens-in-Uppsala

## Om projektet och hur vi arbetar

- Ideellt, privat projekt av Alexander. Inget företag.
- Alexander är inte utvecklare och vill lära sig genom att bygga. Förklara på svenska, i små steg, och säg vad varje fil och kommando gör.
- Skriv aldrig API-nycklar i kod eller i commits. De ligger som GitHub-hemligheter.

## Tekniska beslut

- **Sida:** `index.html` i roten, publicerad med GitHub Pages. I dag ligger demodatan inbakad i filen.
- **Backend:** Firebase. Firestore som databas, Authentication med inloggning via e-postlänk (magisk länk). Databasen ska ligga i en region i EU.
- **Hämtningar:** GitHub Actions enligt schema, som skriver till Firestore. Inte Cloud Functions tills vidare, eftersom de kräver Blaze-planen.
- **Princip:** officiella API:er och direkta flöden i första hand. Små arrangörer ska senare kunna lägga in evenemang själva eller klistra in en iCal-länk.
- **Tillfälligt undantag (beslut sep 2026):** tills vi har API-nycklar eller avtal får vi hämta från källornas publika webbsidor. Villkor:
  - Följ robots.txt. Säger den nej hoppar vi över sidan.
  - Använd strukturerad data när den finns (iCal, RSS, WordPress-API, JSON-LD) före att läsa av HTML.
  - Högst en hämtning per källa och dygn, lugn takt, och en User-Agent som säger vilka vi är.
  - Spara bara fakta: titel, tid, plats, kategori och länk tillbaka. Inga beskrivningar och inga bilder.
  - Byt till API eller flöde så fort ett sådant finns, och sluta direkt om en källa ber oss.

## Källor

### Svenska kyrkan CalendarAPI (aktiv)

- Anrop: `GET https://svk-apim-prod.azure-api.net/calendar/v1/event/search`
- Nyckel i rubriken `Ocp-Apim-Subscription-Key`, från GitHub-hemligheten `SVK_API_KEY` (subscription "uppsala-just-nu-hamtning").
- Parametrar: `owner_id=2218,2215,2216,2219,2217,12893` (Uppsala pastorat), `access=External`, `expand=*`, `limit=50`, `from=today`, `duration=2w`. Fler sidor hämtas via fältet `next` i svaret.
- Licens CC BY 4.0. Visa "Källa: Svenska kyrkan, CC BY 4.0, bearbetad" med länk. Ingen logotyp och inget som antyder att de står bakom tjänsten.
- Regler:
  - Ta bort gudstjänster, mässor och andakter: `eventType.gudstjanstOchMassa`, samt titlar med mässa, gudstjänst, andakt, bön eller meditation.
  - Undantag: behåll allt som också är märkt `musikOchKor` (till exempel aftonsång och Choral Evensong). Det räknas som musik.
  - Långa utställningar kommer som en post per dag. Slå ihop samma titel på samma plats till en enda långvarig post.
  - Spara inte `contact` eller `performers` (personuppgifter).
  - Beskrivningen får visas, tack vare licensen.
- Typer till våra kategorier: `musikOchKor` → musik, `konstOchKultur` → museum, `studierOchSamtal` → prat, `barnverksamhet` och `ungdomsverksamhet` → egenskapen barn och familj. Saknas typ klassificeras händelsen på titel och beskrivning.

### Tickster (ansökan skickad, väntar på nyckel)

- Event Dump API (hela utbudet en gång per dygn) som grund, Event API v1.0 för närmaste veckan.
- Filtrera på koordinater inom Uppsala kommun, inte på ortnamn.
- UKK: arrangör `y5zw8v159wk4fe3`, Stora salen `v3gu3ky2h68ytd5`, Sal B `y90dvlpxyewf4h0`, Restaurangen/Sal D `x41r2gewzkkwxy0`.
- Visa titel, tid, plats och kategori, och länka till köpsidan hos Tickster. Inga beskrivningar eller bilder.

### Senare

- Ticketmaster: öppen nyckel, täcker mest större turnéer.
- Begära data från offentlig verksamhet: Reginateatern, Musik i Uppland. (Destination Uppsala, Kubik, Bibliotek Uppsala och Uppsala stadsteater hämtas redan, se "Hämtningarna".)
- Heja Uppsala: hämtas tillfälligt under testfasen. Eventuellt samarbete.

## Datamodell

Rådata från varje källa sparas separat från den färdiga datan, så att vi kan göra om kategoriseringen utan att hämta om.

Ett färdigt evenemang har: id, titel, start, slut, plats (namn och id), kategori, gratis, barn och familj, lista över källor med länk, och om det är långvarigt.

Kategorier: musik, scen (scen och film), museum (konst och museum), prat (föredrag och samtal), sport, mat, natt (klubb och nattliv), ovrigt (marknad och festival).

Platser har ett kanoniskt namn och alias, till exempel är "Katalin and all that Jazz" samma plats som Katalin.

Tider sparas med tidszon och visas i svensk tid.

## Beslut om sidan

- Startsidan visar 3–5 förslag utifrån användarens valda kategorier, med högst ett förslag per plats. Utan valda kategorier visas evenemang som finns hos flera källor.
- Förslagen fungerar utan inloggning. Inloggning behövs bara för att spara val och favoriter mellan enheter.
- Hela kalendern finns under förslagen: lista, vecka och platser.
- Visa lite i översikten och mer när man klickar.
- Inga bilder från Tickster eller Heja.

## Nästa steg

1. Spara `SVK_API_KEY` som hemlighet i GitHub.
2. Skapa Firebase-projektet (Firestore i EU, Authentication med e-postlänk, GitHub Pages-adressen som tillåten domän).
3. Hämtningsskript och workflow som skriver till Firestore och till filer. **Byggt** för fem källor, se "Hämtningarna" nedan.
4. Låt `index.html` läsa den filen i stället för den inbakade datan.
5. Riktig inloggning och favoriter.
6. Tickster: byt från webbsidorna till API:et när nyckeln kommer.

## Hämtningarna

Allt körs av `.github/workflows/hamta-evenemang.yml` varje dag 04:13 UTC, och kan startas för hand under Actions. Varje källa är ett eget steg, så att en trasig källa inte stoppar de andra. Resultatet hamnar i `data/<källa>.json`, som workflowet sparar i repot.

| Källa | Mapp | Hur | Status |
|---|---|---|---|
| Svenska kyrkan | `scripts/svenska-kyrkan/` | Officiellt API med nyckel | Väntar på `SVK_API_KEY`. Fältnamnen är obekräftade. |
| Uppsala stadsteater | `scripts/stadsteatern/` | Teaterns öppna WordPress-flöde (`performance-page`) | Provkörd, runt 200 föreställningar. |
| Destination Uppsala | `scripts/destination-uppsala/` | Läser listan `/event/`, klockslag från evenemangens sidor | Provkörd, runt 160 evenemang. |
| Tickster | `scripts/tickster/` | Läser listan per ort och evenemangens sidor (schema.org) | Provkörd, runt 360 evenemang. Byt till API när nyckeln kommer. |
| Bibliotek Uppsala | `scripts/bibliotek/` | Axiells öppna API, samma som bibliotekets sida använder | Provkörd, runt 500 evenemang. Läxhjälp, IT-handledning och juridisk rådgivning tas bort. |
| Heja Uppsala | `scripts/heja/` | Läser kalenderlistan och "När och var?" på evenemangens sidor | Provkörd, runt 460 evenemang. Tillfälligt under testfasen, enligt Alexanders beslut. Deras RSS är låst med nyckel och kalendern är en betaltjänst, så fråga dem innan sidan blir skarp. |
| Kubik Uppsala | `scripts/kubik/` | Samma sökning som sidan hitta-aktiviteter gör (`/partials/events/search`) | Provkörd, runt 140 aktiviteter. Perioder (återkommande aktiviteter) blir långvariga evenemang. |

Gemensamma delar i `scripts/gemensamt/`:

- `webb.mjs`: schysst hämtning. Följer robots.txt, väntar minst 2 sekunder mellan anrop och säger vilka vi är.
- `spara.mjs`: sparar en källa, sätter kanonisk plats och larmar vid noll eller halverat antal.
- `platser.mjs`: platstabellen med alias och vanlig kategori per plats. Lägg till platser här.
- `kategori.mjs`: gissar kategori från text. `tid.mjs`: svensk tid med tidszon. `text.mjs`: städar HTML.
- `firestore.mjs`: skriver till Firestore om `FIREBASE_SERVICE_ACCOUNT` finns.

Övrigt:

- `start` är datum och tid med tidszon (`2026-09-24T19:00:00+02:00`), eller bara datum (`2026-09-24`) när källan inte anger klockslag.
- `data/cache/` minns evenemangssidor vi redan läst, så att de inte hämtas varje dag.
- Rådatan (`data/radata/`) läggs inte i repot. Den sparas i Firestore och som bilaga till varje körning i 14 dagar.
- Testerna körs med `npm test`. Varje källa har en `regler.test.mjs` med sparad exempeldata.
- Dubbletter mellan källor (samma konsert hos Tickster och Destination Uppsala) slås inte ihop än. Det görs när sidan börjar läsa filerna.

## Att inte glömma

- GDPR: integritetspolicy, möjlighet att radera sitt konto.
- Inställda evenemang markeras som inställda i stället för att tas bort.
- En enkel redaktörsvy för att rätta kategorier och godkänna osäkra dubbletter.
- Larm om en källa plötsligt ger noll evenemang eller hälften så många som vanligt.
