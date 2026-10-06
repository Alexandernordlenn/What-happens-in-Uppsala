# Uppdrag: kvalitetslyft för Uppsala just nu

## Status

Uppdateras efter varje fas. Fortsätt med den första fasen som inte är klar.

| Fas | Status |
|---|---|
| 0. Läs och kontrollera | Klar. 70 tester gick igenom, 1 446 evenemang. Rådatabilagan går inte att ladda ner från Claudes miljö, så arbetet görs med filerna i `data/`. |
| 1. Mät först | Klar. Före-mätningen ligger i `data/kvalitet-fore.json`. |
| 2. Datamodell | Klar. |
| 3. Regler som sorterar rätt | Klar. Övrigt 13,9 % → 2,6 %, utan område 5,5 % → 1,2 %, 22 kurser borttagna. |
| 4. Dubbletter | Klar. 456 sammanslagningar, misstänkta dubbletter 38 → 0. Alla fall i avsnitt 13 är tester. |
| 5. Sidan | – |
| 6. Skydd och larm | – |
| 7. Tickster-API, Ticketmaster och biljettlänkar | – |
| 8. Sport på de tre högsta nivåerna | – |
| 9. Claude som klassare | – |
| 10. Facit, dokumentation och villkor | – |

Gren: arbetet görs i `claude/svenska-kyrkan-auto-fetch-l14p8s` i stället för `kvalitet-v1`, eftersom Claude Code-sessionen bara får pusha till sin egen gren. Antaganden och beslut som tas under arbetet står i BACKLOG.md under "Antaganden".

Datum: 6 oktober 2026. Beställare: Alexander, som inte är utvecklare. Förklara på enkel svenska efter varje fas, som CLAUDE.md säger.

Målet är att rätt evenemang syns för rätt person, utan att Alexander behöver göra något för hand. Uppdraget gäller kvalitet. Lägg inte till nya källor, utom undantagen i avsnitt 1.

## 0. Läs och kontrollera först

1. Läs CLAUDE.md, README.md, BACKLOG.md och KALLOR.md och följ principerna där:
   - inga nycklar i koden
   - spara bara fakta
   - följ robots.txt
   - hämta högst en gång per källa och dygn
   - markera inställda evenemang i stället för att ta bort dem.
2. Kör `npm ci`, `npm test` och `npm run bygg:sida` för att se utgångsläget. I dag går 70 tester igenom.
3. Hämta inte om källorna under arbetet, eftersom dagens hämtning redan är gjord. Arbeta i stället med:
   - filerna i `data/`
   - exempelfilerna i `scripts/<källa>/`
   - den senaste rådatabilagan, som du hämtar med `gh run download -n radata`.
4. Läs den externa dokumentationen nedan innan du bygger mot den, eftersom den kan ha ändrats:
   - Ticksters Swagger
   - Claude Code GitHub Actions
   - ligornas sidor.

## 1. Beslut som redan är fattade

Följ dem och ändra dem inte.

- **Kalendern ska vara bred.** En och samma person har flera behov samma helg. Testperson: "Lisa, 34" vill hitta något för sin treåriga dotter och en konstutställning med väninnor, samma helg.
- **Kvalitet före mängd.** Inga nya källor. Tre undantag:
  - Ticksters officiella API. Det är samma källa, men en säkrare väg.
  - Fler ligor i den befintliga sporthämtningen (fas 8).
  - Ticketmaster och Svenska kyrkan, som redan är byggda och väntar på nycklar.
- **Inget manuellt arbete för Alexander i vardagen.** Hellre några fel kvar än en granskningslista. Kvaliteten mäts och larmar automatiskt.
  - Punkten "redaktörsvy" i BACKLOG.md och CLAUDE.md flyttas till "Idéer, senare".
  - Texten "En redaktör avgör" i index.html skrivs om, eftersom det inte längre stämmer.
- **Kurser tas bort.** Det gäller kurser som kräver anmälan till en termin eller en serie tillfällen. Utställningar, återkommande drop-in och enstaka evenemang är kvar.
- **Åldersfiltret finns kvar.** Men inget familjeevenemang utan ålder, eller med åldern 0–99, får döljas när man väljer en ålder.
- **Sport:** seniormatcher på de tre högsta nivåerna i varje sport, herr och dam, som spelas i Uppsala kommun. Inga ungdomsmatcher.
- **AI:**
  - Regler är grunden, och Claude fyller bara luckor.
  - Claude körs via Alexanders Claude-prenumeration i GitHub Actions, med hemligheten `CLAUDE_CODE_OAUTH_TOKEN`.
  - Sidan ska fungera fullt ut utan AI-steget.
- **AXS** har inget öppet API och ska inte hämtas. Sirius- och Almtunamatcherna kommer redan via ligorna. Lägg bara till en länk till klubbens egen biljettsida.

## 2. Arbetssätt

- **Gren och commits:**
  - Arbeta i grenen `kvalitet-v1`, med en commit per fas.
  - Kör `npm test` och `npm run bygg:sida` efter varje fas.
- **Mät först.** Gör fas 1 före allt annat, så att varje senare fas kan visa före och efter i siffror.
- **Genererade filer:** committa inte `data/sida.json` eller `data/kvalitet.json` i grenen. Morgonkörningen sparar dem på main varje dag, så de skulle ge konflikter. De byggs om efter sammanslagningen. Undantag: `data/kvalitet-fore.json` är en ny fil och ska committas.
- **Följ repots stil:**
  - svenska namn, `.mjs` och `node:test`
  - inget ramverk och så få nya paket som möjligt, så skriv hellre små egna funktioner
  - `regler.mjs` är ren och testbar logik, och `hamta.mjs` sköter nätverket.
- **Klassningen och dubblettlogiken ligger i bygget,** det vill säga `bygg-sida.mjs` med hjälpfiler. Då kan allt göras om utan att källorna hämtas på nytt.
- **Sidan får aldrig gå sönder mellan två faser.** Varje fas som ändrar datan ändrar också `index.html` i samma commit. Ett exempel: kategorin `aktivitet` läggs in i sidan i samma fas som i datan.
- **Testerna:**
  - `npm test` får bara innehålla tester mot fast testdata, som regler och facit.
  - Kontrollerna mot dagens data (`personer.mjs`) får aldrig ligga i `npm test`, eftersom ett misslyckat test stoppar hela morgonkörningen.
- **Om du fastnar på ett beslut:** välj det säkraste alternativet, skriv in antagandet i BACKLOG.md och fortsätt.
- **När allt är klart:** ge Alexander en sammanfattning av före och efter på enkel svenska, och fråga om du får slå ihop grenen med main.

## 3. Utgångsläge 6 oktober

Siffrorna gäller `data/sida.json`, som har 1 446 evenemang.

- **Kategorin ovrigt:** 201 evenemang (14 %), som sidan visar som "Marknad & festival".
  - Bland dem finns bibliotekets "Sagostund" (9 st), "Babysagostund" (7 st) och "Spela schack" (11 st).
  - Orsaken är tabellen `TAGGAR` i `scripts/bibliotek/regler.mjs`, som översätter quiz, spel, rollspel, pyssel, pyssla och sagostund till ovrigt.
- **Kategorin museum:** 133 evenemang, varav 66 från Kubik.
  - `scripts/kubik/regler.mjs` översätter Kubiks "Konst/Skapande", "Slöjd" och "Museum/Kulturarv" till museum. Kubiks "Kurser" blir prat.
  - Ett exempel är de tolv Designlabbet-posterna, som är verkstäder för skolbarn.
- **Långvariga poster:** 132 poster pågår mer än 4 dagar, sett över hela 120-dagarsfönstret. 96 av dem kommer från Kubik.
  - Med sidans standardperiod på 14 dagar visar raden "Pågår under perioden" 109 av dem.
  - De flesta är Kubik-perioder, alltså kurser och återkommande aktiviteter där veckodagarna bara står i fritext.
- **Ålder:**
  - 71 familjeevenemang saknar ålder och döljs helt när man väljer en ålder (`ageOk` i `index.html`). Exempel: "Familjelördagar på Uppsala konstmuseum" och "Familjekonsert: Flamencotopia".
  - 34 evenemang har åldern 0–99 och räknas som träff för en treåring, till exempel "Schackturnering".
- **Platser:**
  - 79 evenemang (5,5 %) saknar område.
  - Det finns 157 platsnycklar. 117 av dem saknas i platstabellen, och 78 av dessa förekommer bara en gång.
  - Exempel: "gottsundacentrumtemaverkstanlangstnedbredvidteaternochbiblioteket" och den felstavade "gottsunabibliotekesagorummet".
- **Dubbletter:** flera dubbletter missas, se avsnitt 13.
- **Spärren i `spara.mjs`:** bara noll evenemang stoppar. Ett halverat antal skrivs ändå över och ger bara en varning.
- **Ticketmaster:** `scripts/ticketmaster/regler.mjs` letar efter statusen "cancelled", men Discovery API skriver "canceled". Exempelfilen använder också "cancelled".
- **Klockslag i Kubik:** vissa noteringar har en sluttid före eller lika med starttiden ("kl. 16:00–15:00", "20:00–20:00", "19:00–15:15"). Två har "kl. 00:00–23:59".
- **Versaler:** 24 titlar har mer än 60 % versaler, till exempel "DESIGNLABBET I SÄVJA, ÅRSKURS 4-9".
- **Sport:** ligorna ger 107 matcher. Övriga sportposter kommer från Kubik (21), Heja (17), Tickster (7) och Destination (1).
- **Favoriter:** sidans favoriter sparas med id:t `"e"+index`. Det id:t byts varje dag, så sparade favoriter pekar fel.
- **Källdata som inte sparas:** källfilerna sparar inte källans egna kategorier och taggar, adresser eller veckodagar. Kubik läser till exempel ut `adress` och `kategorier` men slänger dem.

## Fas 1: Mät först

Målet är ett automatiskt kvalitetsmått och ett Lisa-test skrivet som kod. I den här fasen rapporterar det bara och larmar inte.

### `scripts/kvalitet/matt.mjs`

Läser `data/sida.json` och källfilerna och skriver `data/kvalitet.json`. Följande räknas per källa och totalt:

- antal
- andel endagsevenemang utan klockslag, där heldagsevenemang inte räknas
- andel i kategorin ovrigt
- andel familjeevenemang utan ålder
- andel utan område
- antal sammanslagna dubbletter
- antal misstänkta kvarvarande dubbletter: samma dag, samma plats, samma normaliserade titel och klockslag som skiljer högst 60 minuter eller saknas
- antal i raden "Pågår" under de kommande 14 dagarna
- antal borttagna kurser
- AI-täckning, som läggs till i fas 9.

### `scripts/kvalitet/personer.mjs`

Kontroller mot `sida.json` för den kommande helgen (lördag–söndag) och de kommande 7 dagarna:

- **Lisa:**
  - Med åldern 0–4 ska helgen ge minst 5 träffar med känd ålder och inga kurser.
  - Alla familjeevenemang utan ålder eller med 0–99 ska synas i gruppen "ålder ej angiven".
  - Med filtret Konst & museum ska minst 80 % av raden "Pågår" vara utställningar, och inga barnverkstäder ska ligga i museum.
- **Student, 20–25 år:** minst 10 kvällsevenemang (efter kl. 18) med musik eller natt de kommande 7 dagarna.
- **Pensionär:** minst 10 evenemang på vardagar mellan kl. 10 och 16, med prat eller musik, de kommande 7 dagarna.
- **Tonåring, 13–15 år:** minst 5 evenemang vars ålder överlappar 13–15 de kommande 7 dagarna.
- **Sportfan:** varje lag i lagtabellen (fas 8) som är mitt i sin säsong har minst en hemmamatch de kommande 30 dagarna.
- **Allmänt:**
  - inga misstänkta dubbletter enligt definitionen ovan
  - ovrigt under 10 %
  - under 2 % utan område
  - under 5 % endagsevenemang utan klockslag.

### Workflow och före-mätning

- Skriv en kort tabell till körningens sammanfattning (`$GITHUB_STEP_SUMMARY`), och lägg steget efter "Bygg filen som sidan läser".
- Spara en före-mätning från dagens data i `data/kvalitet-fore.json`.

## Fas 2: Datamodell

Dokumentera allt under Datamodell i CLAUDE.md.

### Källfilerna

Lägg till följande fält i `data/<källa>.json`:

- **`format`**, ett av sex värden:
  - **`enstaka`**: ett tillfälle. Hit hör också en festival på 2–4 dagar.
  - **`aterkommande`**: samma aktivitet på kända dagar, till exempel en sagostund varje lördag.
    - Fältet `serie` anger dagarna, till exempel `{ dagar: ["lö"], start: "11:00", slut: "15:00" }`, eller en lista med uttryckliga datum.
    - Bygget gör ett tillfälle per dag inom fönstret, med ett stabilt id: seriens id plus datum.
    - Om en källa anger uttryckliga datum används de i stället för att räkna fram datum. Hitta aldrig på datum.
  - **`utstallning`**: pågår över tid, och man går dit när det är öppet.
  - **`speltid`**: en uppsättning som spelas under en period, men utan kända föreställningsdagar.
  - **`period`**: långvarigt, med okända dagar, och varken utställning eller kurs.
  - **`kurs`**: kräver anmälan till en serie tillfällen. Kurser tas bort ur `sida.json` men räknas i kvalitetsrapporten.
- **`ursprung`**, som anger varifrån format, kategori, ålder och barn kommer: `kalla`, `regel`, `ai` eller `rattelse`.
  - Prioritet: `rattelse` före `kalla` före `regel` före `ai`.
  - AI fyller bara luckor och skriver aldrig över något.
- **Fakta från källan,** sparade från och med nästa körning:
  - källans egna kategorier och taggar
  - adress
  - utlästa veckodagar och tider.

  Själva texten läses bara under hämtningen och sparas aldrig, utom Svenska kyrkans beskrivning, som licensen tillåter.

### Kategorier

- **Ny kategori: `aktivitet`,** med etiketten "Aktiviteter". Den gäller verkstäder, pyssel, spel, sagostunder, häng och prova på.
- **`ovrigt` behåller sitt id,** eftersom användarnas sparade val bygger på det. Etiketten blir "Marknad, festival & övrigt".

### Sidans kompakta format

Lägg till följande nycklar och dokumentera dem i README:

- **`id`:** stabilt, från källpostens id eller från seriens id plus datum. Favoriter sparas med det här id:t. Gamla favoriter med `"e"+index` får försvinna.
- **`f`:** format.
- **`w`:** veckodagar för återkommande.
- **Hela dagen:** en flagga för heldagsevenemang.
- **Sport:** sport och liga som en egen etikett. I dag ligger den i `n`.
- **Biljettlänk:** klubbens biljettlänk.
- **Inaktuell källa:** en flagga för källor vars data är för gammal.

### Rättelser och index.html

- **`data/rattelser.json`:**
  - En valfri fil med rättelser, nycklade på källpostens id (till exempel `bibliotek-<uuid>` eller `kubik-<slug>`) eller på ett titelmönster.
  - Den används av framtida Claude-sessioner, och Alexander behöver aldrig röra den.
- **I `index.html`, i samma fas:**
  - lägg till `aktivitet` i `CATS` och `CAT_ORDER`
  - lägg till färgen `--c-aktivitet` i alla tre färgblocken
  - lägg in den nya etiketten för ovrigt
  - uppdatera Kubik-texten i `SRC`.

  Demodatan ska fortfarande fungera utan de nya nycklarna.

## Fas 3: Regler som sorterar rätt

Samla klassningen i `scripts/gemensamt/klassa.mjs` och kör den från `bygg-sida.mjs`. Källans egna uppgifter gäller först.

### 3.1 Kategorier

- **Kubik:**
  - "Konst/Skapande" och "Slöjd" blir `aktivitet`.
  - "Museum/Kulturarv" blir museum bara om det är en utställning eller en visning, annars `aktivitet`.
  - "Kurser" är en kandidat till formatet kurs (se 3.2). Kategorin tas då från Kubiks övriga taggar.
- **Biblioteket:** ändra `TAGGAR` så att quiz, spel, rollspel, pyssel, pyssla och sagostund blir `aktivitet`. Uppdatera `bibliotek/regler.test.mjs`.
- **`gissaKategori`:**
  - Lägg till regler för `aktivitet` (verkstad, workshop, pyssel, spel, schack, häng, sagostund, prova på, yoga) före museum.
  - Titlar med visning, utställning eller vernissage ska fortfarande bli museum.
  - Reserven är fortfarande ovrigt, men mätningen ska visa under 10 %. Uppdatera `gemensamt.test.mjs`.

### 3.2 Format

Reglerna prövas i ordningen kurs, återkommande, utställning, speltid och period. Den första regel som passar gäller.

1. **`kurs`** när båda villkoren gäller:
   - perioden är längre än 14 dagar
   - källan säger att det är en kurs (till exempel Kubiks kategori "Kurser"), eller titeln eller texten innehåller kurs, kurser, termin, terminsstart, anmälan krävs eller nybörjarkurs.

   Undantag:
   - "Årskurs" anger målgrupp och betyder inte kurs.
   - En enstaka workshop med anmälan är `enstaka`.
2. **`aterkommande`** när dagarna går att läsa ut, ur titeln eller ur texten.
   - Exempel på titlar: Familjelördagar, Lördagsöppet, "lördags- och söndagsöppet", Torsdagskul, Onsdagshäng, Fredagsmys, Söndagsöppet.
   - Skriv en liten tolk för svensk text som klarar:
     - "varje lördag", "lördagar", "tisdagar och torsdagar" och "mån–fre"
     - klockslag som "kl. 11–15" och "11.00–15.00"
     - "varannan vecka", om startdagen är känd
     - "jämna/udda veckor", räknat på ISO-veckonummer. Obs: 2026 har vecka 53, så jämna eller udda veckor går inte att räkna som "varannan vecka" över årsskiftet.
   - Kubik skriver veckodagarna bara i fritext.
     - Läs dem ur kortets text under hämtningen, och vid behov ur evenemangets detaljsida.
     - Detaljsidan cachas och hämtas högst en gång per vecka och sida, och robots.txt gäller.
     - Spara de utlästa dagarna som fakta.
3. **`utstallning`** när båda villkoren gäller:
   - titeln innehåller utställning, "Utställn:" eller exhibition, eller platsen är ett museum, en konsthall eller ett galleri
   - det pågår mer än 4 dagar.

   Vernissage och finissage är `enstaka`.
4. **`speltid`** när en långvarig post ligger på en scen. Scener är platser med kategorin scen i platstabellen, samt UKK. Kyrkor räknas inte som scener.
5. **`period`** för allt annat långvarigt.

### 3.3 Ålder och barn

- **Ålder anges bara när den står utskriven.** Gissa aldrig.
  - `spannFranText` och `spannFranEtikett` i `scripts/gemensamt/omraden.mjs` klarar redan mycket. Behåll deras spann, till exempel bebis/baby som 0–3 år.
  - Lägg bara till det som saknas. Ett exempel är "Barnrytmik 3–5-åringar", som inte känns igen i dag.
- **"Vuxna"** får inte ge åldern 18–99 när texten säger "barn och vuxna".
- **Åldern [0, 99]** betyder "alla åldrar" och räknas inte som exakt åldersträff.
- **Barn och familj:** om den övre åldersgränsen är högst 15 sätts barn och familj till ja.

### 3.4 Städning

- **Klockslag:**
  - En sluttid som är samma som eller före starttiden tas bort.
  - "00:00–23:59" betyder hela dagen, utan klockslag.
- **Versaler:** en titel där mer än 60 % av bokstäverna är versaler, och som har minst 8 bokstäver, skrivs om till vanlig skrivning. Kända förkortningar behålls, till exempel UKK, IFU, SSL, AIK, IK, HC och DJ. Gör det i bygget, inte i källfilerna.
- **Sport:** titlar som "Sirius vs Hagunda" skrivs om till "Sirius – Hagunda". Sport och liga visas som en etikett.

### 3.5 Platser

- **Platstabellen:**
  - Lägg till alla bibliotek, som du tar fram ur bibliotekets data.
  - Lägg också till allaktivitetshus, fritidsgårdar, skolor som används ofta och Kubiks platser.
- **Alias:**
  - "Uppsala stadsbibliotek" är ett alias för Stadsbiblioteket.
  - "Gottsunabiblioteke…" är en felstavning av Gottsundabiblioteket.
  - Kubiks "Bror Hjorths hus" (platsnyckeln "brorhjorthhus") ska bli Bror Hjorths Hus.
- **Rum:** skilj rummet från platsen. "Gottsundabiblioteket, Sagorummet" blir platsen Gottsunda bibliotek och rummet Sagorummet.
  - Vanliga rum är sagorummet, temaverkstaden, ateljén, bildsalen, idrottshallen, lilla salen, aulan och sal B.
- **Samma byggnad:**
  - Inför byggnader, så att platser i samma hus hör ihop.
  - Bibliotekets egen data har ett rum som heter "Kulturpunkten" på Gottsundabiblioteket. Kontrollera med adresserna och lägg Gottsunda bibliotek och Kulturpunkten Gottsunda i samma byggnad om de stämmer.
- **Område:** tas från Kubiks områden, adress, postnummer eller koordinater. Målet är att under 2 % saknar område.
- **Kommungränsen:**
  - Använd en förenklad GeoJSON-polygon för Uppsala kommun med öppen licens, till exempel från SCB, Lantmäteriet eller okfse/sweden-geojson. Kontrollera licensen.
  - Polygonen avgör om en plats med koordinater ligger i kommunen.

## Fas 4: Dubbletter

Skriv om `slaIhop` i `bygg-sida.mjs`.

### Normaliserad titel

Den normaliserade titeln används bara för att jämföra. Originaltiteln visas alltid.

Så normaliseras titeln:

- Gör om till gemener.
- Ta bort diakritiska tecken, årtal och skiljetecken.
- Gör om "&" till "och".
- Ta bort stoppord: en, ett, till, med, på, i, och, för, av, the, a, of.
- Ta bort generiska inledningar, som "Författarbesök:", "Konsert:", "Utställn:" och "Lunchkonsert med", samt ordet "live".
- Ta bort platsens namn och alias ur titeln, också efter "i" eller "på" (till exempel "– på Katalins Backficka" och "i Domkyrkan").

### Begrepp

- **Ett ovanligt ord** är inget stoppord, har minst 4 bokstäver och finns i färre än 1 % av alla titlar.
- **"Innehåller"** betyder att alla ord i den kortare titeln finns i den längre.

### Huvudregeln

Huvudregeln gäller bara poster från olika källor.

- **Kandidater:** samma dag och samma kanoniska plats eller byggnad.
- **Två poster slås ihop när båda villkoren gäller:**
  1. Klockslagen skiljer högst 60 minuter, eller ett av dem saknas.
  2. Titlarna uppfyller något av följande:
     - de är lika
     - den ena innehåller den andra, och de har minst två ord gemensamt, eller ett ovanligt ord på minst 6 bokstäver
     - ordlikheten (Dice på ordmängder) är minst 0,8, och de har minst ett ovanligt ord gemensamt.
- **Sportregeln behålls:** samma dag, samma arena och samma tid.

### Skydd

- Slå aldrig ihop poster från olika platser eller byggnader.
- Slå aldrig ihop olika nummer, till exempel "del 1" och "del 2".
- Barn och vuxen: slå inte ihop när båda har känd ålder och åldersspannen inte överlappar.
- Generiska titlar kräver samma plats och samma klockslag. Exempel: sagostund, konsert, visning, fredagsmys, filosofiska samtal och kortfilmsbio.

### Specialfall

1. **Långvariga poster först:**
   - Slå först ihop långvariga poster med varandra: samma normaliserade titel, samma plats och överlappande perioder, oavsett källa.
   - Gruppen får tidigaste start och senaste slut.
   - Formatet bestäms för hela gruppen. Är någon post en utställning blir gruppen en utställning.
2. **Samma källa, identiska poster:** samma titel, plats, dag och klockslag blir en post. Heja ger ibland samma post flera gånger. Två olika klockslag samma dag från samma källa förblir två.
3. **Speltid eller period mot tillfällen:**
   - Gäller när en långvarig post med formatet `speltid` eller `period` har minst ett enstaka tillfälle från en annan källa, med samma normaliserade titel, på samma plats och inom perioden.
   - Då visas tillfällena. Den långvariga posten tas bort och dess länk läggs på tillfällena.
   - Regeln gäller inte utställningar. En visning med klockslag av en utställning är ett eget evenemang.
4. **Festival:** en festival är en enstaka post som pågår 2–4 dagar. Tillfällen inom festivalens dagar, på samma plats och med matchande titel, ingår i festivalen.
5. **Återkommande och enstaka:** ett enstaka tillfälle som matchar en serie samma dag blir en del av seriens tillfälle, och länkarna slås ihop.

### Logg

Logga varje sammanslagning i `data/kvalitet.json`, med regel, poäng och källor.

## Fas 5: Sidan (index.html)

- **Raden "Pågår under perioden":**
  - Visar bara utställningar, och speltider som saknar kända föreställningar.
  - Märk med "Öppnar [dag]" när starten ligger inom perioden eller de kommande 7 dagarna.
  - Märk med "Sista dagarna" när slutet ligger inom 7 dagar.
  - Sortera i ordningen: sista dagarna, öppnar, resten.
- **Perioder utan kända dagar:** en egen hopfälld rad under "Pågår", med rubriken "Återkommande, se dagar hos arrangören" och antalet.
- **Återkommande:** visas i dagslistan på rätt dagar, med en etikett som "Varje lördag".
- **Kurser:** visas inte. När ett barn- eller åldersfilter är valt visas en diskret länk: "Kurser och terminsaktiviteter för barn och unga finns hos Kubik".
- **Åldersfiltret:**
  - Inom varje dag visas först "Passar åldern": evenemang med känd ålder som överlappar den valda, men inte 0–99.
  - Därefter visas en tydligt märkt grupp, "Familjevänligt, ålder ej angiven". Den innehåller barn- och familjeevenemang utan ålder eller med åldern 0–99.
  - Räknarna på filterknapparna ska stämma med det som visas.
- **Förslagen överst** tar inte med kurser eller perioder.
- **Tillgänglighet,** som behålls:
  - riktiga knappar
  - `aria-pressed`
  - `aria-live` för antalet
  - fokus som inte flyttas när man byter filter
  - klickytor på minst 24×24 pixlar.
- **Heldagsevenemang** visar "Hela dagen" i stället för "–".
- **Sport:** visa etiketten med sport och liga, och en länk "Köp biljett hos klubben" när en sådan finns.
- **Rapporten:** visa en kort rad om kvaliteten i "Om datan och källorna", till exempel antalet sammanslagna dubbletter och borttagna kurser.

## Fas 6: Skydd och larm

- **Färre evenemang än vanligt (`spara.mjs`):**
  - Om en källa ger färre än hälften av medianen för de senaste 14 körningarna behålls gårdagens fil, i högst 3 dagar, och en varning skrivs.
  - Efter 3 dagar godtas det nya antalet med en varning, eftersom källan kan ha krympt på riktigt.
  - Spara historiken över antalen i en liten fil i `data/`.
- **Gammal data:** en källa vars data är äldre än 3 dygn markeras som inaktuell, både i `sida.json` och i "Om datan och källorna".
- **Larm som GitHub-ärenden:**
  - Skapa dem med `gh` i workflowet (`permissions: issues: write`).
  - Ett ärende per problem, med etiketten `larm`, till exempel:
    - "Källa: Tickster gav 0"
    - "Kvalitet: Lisa-testet"
    - "Sport: Almtuna saknar matcher"
    - "AI-steget fungerar inte".
  - Finns det redan ett öppet ärende för samma problem läggs en kommentar till i stället för ett nytt ärende.
  - Ärendet stängs automatiskt när kontrollen går igenom igen.
- **Kontrollerna från fas 1** går nu från att rapportera till att larma, men de stoppar aldrig publiceringen. Det enda som stoppar är noll evenemang totalt.

## Fas 7: Tickster-API, Ticketmaster och biljettlänkar

### Tickster

- **Bygg API-vägen nu,** enligt CLAUDE.md:
  - Event Dump API som grund
  - Event API v1.0 för den närmaste veckan, så att uppgifterna är färska
  - filtrera på koordinater inom kommunen.
- **Läs först:**
  - https://event.api.tickster.com/swagger/v1/swagger.json
  - https://developer.tickster.com/documentation/eventdump.
- **Dumpen:**
  - Den hämtas via en signerad länk till en gzip-fil och publiceras enligt dokumentationen runt kl. 07 UTC.
  - Vår körning går 04:13 UTC och får därför gårdagens dump. Därför behövs v1.0 för de närmaste dagarna.
- **Tekniska krav:**
  - Respektera rubrikerna `X-RATELIMIT-…`.
  - Spara bara fakta: titel, tider, plats, taggar (som blir kategori), status (som blir inställt) och köplänk.
- **Nyckel och reserv:**
  - API-vägen används när hemligheten `TICKSTER_API_KEY` finns.
  - Annars, eller om API:et inte svarar, används dagens hämtning från webbsidorna.
  - Logga vilken väg som användes.
- **Tester:** skriv tester med exempeldata som bygger på Swagger-schemat.

### Ticketmaster

Godta både "canceled" och "cancelled". Rätta exempelfilen och lägg till ett test.

### Biljettlänkar

Lägg in klubbarnas biljettsidor i lagtabellen (fas 8), till exempel:

- Sirius fotboll: https://www.siriusfotboll.se/matchdag/biljetter/
- Almtuna: https://www.almtuna.com/biljettinformation

Kontrollera att adresserna fungerar. Hämta ingenting från AXS.

## Fas 8: Sport på de tre högsta nivåerna

- **Lagtabell:**
  - Gör en lagtabell i `scripts/sport/konfig.mjs`: lag, sport, kön, nivå, liga och biljettlänk.
  - I dag hämtas hela ligor, till exempel hela Allsvenskan, och det finns inga rader per lag.
- **Vilka lag:** ta reda på vilka lag från Uppsala kommun som spelar på de tre högsta seniornivåerna säsongen 2026/27, herr och dam. Det gäller fotboll, ishockey, innebandy, bandy, basket, handboll och volleyboll.
- **Hemmamatcher:** hämta lagens hemmamatcher på arenor i Uppsala kommun, men bara där datan är öppen och tillåten:
  - Sportomedia. Pröva till exempel Superettan på samma sätt som Allsvenskan.
  - Sportality.
  - stats.swehockey.se, till exempel Hockeyettan.
  - Profixios publika kalenderfiler och schemasidor.

  Följ robots.txt.
- **Hämta inte från:**
  - svenskfotboll.se, som förbjuder automatisk hämtning
  - innebandyns statistiksida, som blockerar robotar.

  Skriv in luckorna i KALLOR.md.
- **Säsongsbyte:**
  - Gör säsongsbytet automatiskt. Leta upp säsongens id från lagets eller ligans namn vid varje körning, som Sportality redan gör.
  - Dagens id används som reserv.
  - Om ett lag mitt i sin säsong ger noll matcher larmar systemet enligt fas 6.
- **Ungdomsmatcher** tas inte med.

## Fas 9: Claude som klassare

Målet är att Claude fyller de luckor som reglerna lämnar: format, dagar, ålder och kategori. Det ska inte kosta något extra, och ingenting får sparas som inte får sparas.

### Källtext och kö

- **Hämtningarna** skriver en kort källtext per evenemang, högst 600 tecken, till `tmp/kalltext/<källa>.json`.
  - Lägg till `tmp/` i `.gitignore`.
  - Filen laddas inte upp som bilaga. `data/radata/` laddas upp, så den mappen får inte användas.
  - Skriv aldrig ut källtexter i Actions-loggen.
- **Ett eget steg efter hämtningarna:**
  - Steget kör `klassa.mjs` och bygger kön `tmp/ko.json`.
  - Kön innehåller evenemang som är nya eller ändrade, eller som fortfarande saknar format, ålder eller kategori efter reglerna.
  - Varje evenemang i kön har källpostens id, innehållshash, titel, plats, källans taggar och källtext.

### Claude-steget i workflowet

- **Placering:** efter kön och före bygget.
- **Action:** `anthropics/claude-code-action@v1` med `claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}`.
- **När steget körs:**
  - bara om hemligheten finns och kön inte är tom
  - med `continue-on-error: true` och en timeout på cirka 15 minuter.
- **Läs först:** https://code.claude.com/docs/en/github-actions, om
  - schemalagda körningar
  - `allowed_bots`
  - `github_token` (så att GitHub-appen inte behövs)
  - `--allowedTools`.
- **Prompten** anropar skillen `.claude/skills/klassa/SKILL.md`.
- **Verktyg:** begränsa dem till att läsa kön och skriva svarsfilen. Begränsa också `--max-turns`.
- **Modell:** välj utifrån facit. Börja med en mindre modell och byt till en större om träffsäkerheten blir för låg.

### Skillen

- **Svarsformat:** JSON per evenemang med fasta värden: format, kategori, `alderMin`, `alderMax`, barn, dagar och tider.
- **"okand"** är alltid ett tillåtet svar.
- **Belägg:**
  - Varje svar som inte är "okand" har ett belägg, alltså ett exakt citat ur källtexten eller titeln.
  - Ålder får bara anges om siffrorna står i belägget.
- **Exempel:** skillen innehåller 10–15 svenska exempel med svåra fall:
  - kurs eller drop-in
  - familj eller vuxen
  - utställning eller visning
  - "årskurs"
  - "barn och vuxna".

### Validering

Valideringen ligger i `scripts/klassning/validera.mjs` och är helt förutsägbar. Den kontrollerar att:

- svaren följer schemat och bara använder tillåtna värden
- belägget finns ordagrant i källtexten eller titeln
- åldersiffrorna finns i belägget
- en kurs har en period på mer än 14 dagar.

Allt som inte klarar kontrollen blir "okand". Belägget används bara för kontrollen och sparas inte.

### Sparande och reserv

- **Godkända svar** sparas i `data/etiketter.json`, nycklade på källpostens id och innehållshash, med ursprung `ai`, modell och promptversion.
- **Vad som klassas:**
  - bara nya eller ändrade evenemang
  - högst 150 per körning, de närmaste i tid först
  - allt klassas om när promptversionen ändras.
- **AI skriver aldrig över** källan, en regel eller en rättelse.
- **Om token saknas, har gått ut eller om steget misslyckas:** sidan byggs med reglerna, och ett larmärende skapas enligt fas 6.

## Fas 10: Facit, dokumentation och villkor

### Facit

- **Urval:** välj ut cirka 150 verkliga evenemang ur dagens data, spridda över alla källor och med många svåra fall.
- **Märkning:** märk dem noggrant själv med format, kategori, ålder och barn, och spara dem i `scripts/kvalitet/facit.json`.
- **Testet mäter reglerna:**
  - minst 95 % rätt på formaten kurs och utställning
  - ålder får aldrig vara fel, utan hellre okänd.
- **Avsnitt 13:** lägg in fallen där som egna tester.
- **Befintliga tester:** uppdatera dem som påverkas, bland annat:
  - `bibliotek/regler.test.mjs`
  - testerna för samma källa och sport i `scripts/bygg-sida.test.mjs`
  - testet för reserven ovrigt i `gemensamt.test.mjs`.

### Dokumentation

- **CLAUDE.md:**
  - beslut
  - datamodell
  - AI-principen: källtext får läsas tillfälligt för klassning men sparas aldrig
  - rätta "Svenska kyrkan (aktiv)" till "väntar på nyckel" om nyckeln fortfarande saknas.
- **README:**
  - sidans format
  - nya hemligheter (`TICKSTER_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`)
  - rätt antal tester.
- **Workflowets `env`:** de nya hemligheterna.
- **KALLOR.md:** luckorna i sporten.
- **BACKLOG.md:**
  - bocka av det som är klart
  - lägg till Du-uppgifterna i avsnitt 11
  - ta bort "uppdatera id varje säsong" om det nu sker automatiskt.

### Villkor

- **Integritetssida:**
  - Lägg till en enkel sida, `integritet.html`, med en länk i sidfoten.
  - Där står att sidan inte använder cookies eller spårning och inte sparar några personuppgifter.
  - Där står också hur man begär att ett evenemang tas bort. Det görs inom 24 timmar, vilket krävs av Ticketmasters villkor.
- **Svenska kyrkan:** visa deras källhänvisning enligt CLAUDE.md när den källan är aktiv.

## 11. Du-uppgifter att skriva in i BACKLOG.md

- **Token för Claude-prenumerationen:**
  - Installera Claude Code på datorn och kör `claude setup-token`.
  - Lägg in token som hemligheten `CLAUDE_CODE_OAUTH_TOKEN`, eller kör `/install-github-app` i Claude Code.
  - Om prenumerationen är jobbets: kontrollera först att den får användas för ett privat projekt.
- **Tickster:** lägg in `TICKSTER_API_KEY` när Tickster svarar.
- **Svenska kyrkan och Ticketmaster:** lägg in `SVK_API_KEY` och `TICKETMASTER_API_KEY`, som tidigare.

## 12. Gör inte

- Lägg inte till nya källor utöver dem i avsnitt 1.
- Spara inga beskrivningar, bilder eller personuppgifter. Svenska kyrkans beskrivningar är undantagna, eftersom licensen tillåter dem.
- Hämta inget från AXS, svenskfotboll.se eller sidor vars robots.txt säger nej.
- Bygg ingen granskningslista som Alexander måste gå igenom för hand.
- Stoppa aldrig publiceringen på grund av ett kvalitetslarm. Bara noll evenemang totalt stoppar.
- Lägg inga kontroller mot dagens data i `npm test`.

## 13. Facit för dubbletter och sortering

Fallen kommer från dagens data.

### Ska slås ihop

- **Författarbesök:**
  - "Elin Ylvasdotter" (Bibliotek, Stadsbiblioteket, 7 okt 18:00) och "Författarbesök: Elin Ylvasdotter" (Heja, 18:00).
  - På samma sätt Erika Bjerström (Gottsunda bibliotek, 12 okt 19:00), Simon Sorgenfrei (Stadsbiblioteket, 14 okt 13:30) och Tone Schunnesson (Stadsbiblioteket, 15 okt 18:00).
- **"Ebbot Lundberg":** Blackbird 9 okt, Heja 19:30 och Tickster 20:00.
- **"La Tremendita feat. Juanfe Pérez":** UKK 10 okt, 16:00 och 16:30.
- **"Lunchkonsert med Jan Olof Anderson" och "Jan Olof Anderson – Lunchkonsert":** UKK 9 okt 12:00.
- **"Moto Boy tolkar Lana Del Rey" och "Moto Boy – En hyllning till Lana Del Rey":** UKK 11 okt 19:00.
- **"Camilla Widell Quartet – Katalins Backficka" (Heja) och "Camilla Widell Quartet – på Katalins Backficka" (Tickster):** Katalin 9 okt 20:00.
- **"Banned Books Festival":** Bibliotek (Stadsbiblioteket, ålder 18–99) och Heja ("Uppsala stadsbibliotek", familj utan ålder), 10 okt 11:00.
- **"Sagostund på svenska för barn 1–3 år" (Bibliotek) och "Sagostund för barn 1-3 år" (Kubik):** Stadsbiblioteket 10:30, 6 och 13 okt.
- **"Lördagskul: Sjung barnsånger med Ako!" (Bibliotek) och "Lördagskul: Sjung med Ako!" (Kubik):** Stenhagenbiblioteket 17 okt 13:00.
- **"Torsdagsbibblan":** Gottsundabiblioteket och "Gottsundabiblioteket, temaverkstaden", 15:00.
- **"Barnrytmik 3–5-åringar" (Bibliotek, Gottsundabiblioteket) och "Barnrytmik 3-5 åringar" (Kubik, Kulturpunkten):** 15:00 de dagar båda har.
  - Villkor: adresserna visar att det är samma byggnad.
  - Kubiks tillfälle 3 nov, som bara finns hos Kubik, förblir eget.
- **SciFest:** en festival, 8–10 okt, med tre länkar. Den består av:
  - "Vetenskapsfestivalen SciFest" (Heja, Fyrishov 8–10 okt)
  - "SciFest 2026" (Kubik, 10 okt 09:00)
  - "Vetenskapsfestivalen SciFest 2026" (Destination, 10 okt 09:00).
- **Katarina Jagellonica:** en utställning, av "Katarina Jagellonica 500 år" (Destination) och två poster "Utställn: Katarina Jagellonica i Domkyrkan" (Heja). Kubiks poster 26 och 27 okt, med klockslag, är egna evenemang.
- **"Art Muse Music" (Heja):** fyra poster 6 okt 18:00 blir en.
- **"Visning: Walmstedtska gården" (Heja):** fem långvariga poster blir en.
- **Uppsala stadsteaterns föreställningar:** "Stadens ljus", "Medan vi brinner" och "Bara två stjärnor", tillsammans med Destination Uppsalas långvariga poster med samma titlar. Bara föreställningarna visas, med båda länkarna.
- **"Familjelördagar på Uppsala Konstmuseum" (Destination, 5 sep–5 dec):**
  - Blir återkommande.
  - Använd Hejas uttryckliga datum (bland annat 10 och 24 okt, 14, 21 och 28 nov och 5 dec) i stället för "varje lördag", eftersom vissa lördagar saknas.
  - Hejas post 10 okt blir samma tillfälle.

### Ska inte slås ihop

- **"Kortfilmsbio: Stor och liten"** på Storvreta bibliotek och på Gottsunda bibliotek, eftersom platserna är olika.
- **"Filosofiska samtal"** på Stadsbiblioteket 14:00 och på Storvreta bibliotek 18:30.
- **"Banned Books Festival" 11:00 och "Banned books-festival med barnteater" 13:00,** eftersom det är olika programpunkter.
- **"Uppsala Internationella Gitarrfestival"** på Katalin och på UKK, eftersom platserna är olika.
- **Samma källa, samma dag och olika klockslag:** förblir separata. Exempel: "Familjevisning med verkstad" 12:30 och 14:30, och "Saffransmysteriet" 11, 13 och 15.

### Sortering

- **Aktivitet, inte museum:** Designlabbet-posterna (Kubik).
- **Utställning:**
  - "Eija-Liisa Ahtila – A Possible Image…" (konstmuseet)
  - "Johan Thurfjell – Ljuset" (Bror Hjorths Hus)
  - "Bruno Liljefors – tillfällig utställning" (Gustavianum)
  - "HER STORY – THE COAT" (Upplandsmuseet).
- **Aktivitet, inte ovrigt:** "Sagostund", "Babysagostund", "Spela schack" och "Onsdagshäng".
- **Kurs, tas bort:** "Höstens kurser på Gränby 4H-gård".
- **Återkommande lördag och söndag:** "Pumphusets lördags- och söndagsöppet". Den ska inte bli utställning, trots att Pumphuset är ett museum.
- **Ålder 0–99:** "Schackturnering" räknas inte som exakt träff för 0–4 år.
- **Med 0–4 år valt:** "Familjelördagar på Uppsala konstmuseum" och "Familjekonsert: Flamencotopia" syns i gruppen "Familjevänligt, ålder ej angiven".

## 14. Klart när

- **Tester:** `npm test` går igenom, inklusive facit.
- **Kvalitetsrapporten** jämförd med före-mätningen:
  - ovrigt under 10 %
  - inga barnverkstäder i museum
  - under 2 % utan område
  - alla fall i avsnitt 13 rätt
  - 0 kurser i `sida.json`
  - inga familjeevenemang utan ålder, eller med åldern 0–99, döljs när man väljer en ålder
  - Lisa-testet går igenom för den kommande helgen.
- **Utan nycklar:** sidan fungerar som förut utan `CLAUDE_CODE_OAUTH_TOKEN` och utan `TICKSTER_API_KEY`.
- **Favoriter:** favoriterna har stabila id.
- **Alexander har fått:**
  - en sammanfattning av före och efter, på enkel svenska
  - en kort lista över det han behöver göra själv.
