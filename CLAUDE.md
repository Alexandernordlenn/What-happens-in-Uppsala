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
- **Princip:** bara officiella API:er och direkta flöden. Ingen skrapning. Små arrangörer ska senare kunna lägga in evenemang själva eller klistra in en iCal-länk.

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
- Begära data från offentlig verksamhet: Destination Uppsala, Kubik, Bibliotek Uppsala, Reginateatern, Uppsala stadsteater, Musik i Uppland.
- Heja Uppsala: hämtas inte. Eventuellt samarbete.

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
3. Hämtningsskript och workflow för Svenska kyrkan som skriver till Firestore och till en fil med de kommande två veckorna.
4. Låt `index.html` läsa den filen i stället för den inbakade datan.
5. Riktig inloggning och favoriter.
6. Tickster när nyckeln kommer.

## Att inte glömma

- GDPR: integritetspolicy, möjlighet att radera sitt konto.
- Inställda evenemang markeras som inställda i stället för att tas bort.
- En enkel redaktörsvy för att rätta kategorier och godkänna osäkra dubbletter.
- Larm om en källa plötsligt ger noll evenemang eller hälften så många som vanligt.
