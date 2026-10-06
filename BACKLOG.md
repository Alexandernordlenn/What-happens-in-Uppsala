# Backlog

Allt som återstår i projektet, i ungefär den ordning det bör göras. Bocka av med `[x]` och flytta raden till "Klart" längst ner när något är gjort.

- **Du** = något Alexander gör: kontakter, nycklar, beslut.
- **Claude** = kod som Claude bygger. Be om det i en ny session, till exempel "bygg Missionskyrkan från BACKLOG.md".

Mer om varje källa och vem man kontaktar: [`KALLOR.md`](KALLOR.md). Tekniken: [`README.md`](README.md).

## Nu

- [ ] **Du:** Lägg in Svenska kyrkans nyckel som hemligheten `SVK_API_KEY` (GitHub → *Settings* → *Secrets and variables* → *Actions*). Då kommer kyrkornas konserter med nästa morgon.
- [ ] **Claude:** Kontrollera Svenska kyrkans första riktiga körning. Fältnamnen i API-svaret är gissade och kan behöva justeras.
- [ ] **Du:** Skicka de fem viktigaste förfrågningarna. Be gärna Claude skriva mejlen.
  - [ ] Heja Uppsala (tjena@hejauppsala.com): avtal eller nyckel. **Beslut 6 okt (alternativ C): Heja ligger kvar under testfasen, och sidan lanseras inte förrän det är löst.**
  - [ ] Profixio: API-nyckel. En nyckel ger bandy, basket, handboll och volleyboll.
  - [ ] Kuratorskonventet (Nationsguiden): nationernas evenemang. Vår största lucka.
  - [ ] Uppsala universitet: flöde från uu.se/kalendarium.
  - [ ] Uppsala kommun, kulturförvaltningen: konstmuseet, Biotopia, Bror Hjorths Hus, Kulturnatten.
- [ ] **Du:** Påminn Tickster om API-ansökan om inget har hänt.
- [ ] **Du:** Skaffa gratisnycklar som ger fler evenemang direkt:
  - [ ] Ticketmaster Discovery API: skapa konto på developer.ticketmaster.com, skapa en app, och lägg in nyckeln ("Consumer Key") som hemligheten `TICKETMASTER_API_KEY`. Hämtningen är redan byggd och startar automatiskt.
  - [ ] Billetto (billetto.se), som ger Musicum, Upplandsmuseet och små arrangörer
- [ ] **Du:** Skicka ett kort "ok?"-mejl till källor vi redan använder: Uppsala stadsteater, Bibliotek Uppsala, Kubik och Destination Uppsala. Tala om att vi visar deras evenemang med länk tillbaka.

## Nästa: fler källor

Öppna källor som inte kräver tillstånd:

- [ ] **Claude:** Uppsala Missionskyrka (kalenderfil). Konserter, gudstjänster filtreras bort.
- [ ] **Claude:** Bror Hjorths Hus (kalenderfil)
- [ ] **Claude:** Kulturoasen (WordPress)
- [ ] **Claude:** Biotopia (WordPress)
- [ ] **Claude:** Universitetsbibliotekets evenemang (LibCal, kalenderfil)
- [ ] **Claude:** Fyrishov och IFU Arena (arenornas egna kalendrar). Cuper och arrangemang utöver ligamatcherna.
- [ ] **Claude:** Körerna: Orphei Drängar, Uppsala Akademiska Kammarkör, Domkyrkokören

När nycklarna kommer:

- [ ] **Claude:** Tickster: byt från webbsidorna till API:et.
- [ ] **Claude:** Ticketmaster: kontrollera första riktiga körningen när nyckeln finns.
- [ ] **Claude:** Billetto
- [ ] **Claude:** Profixio: byt från kalenderfiler och schemasidor till API:et.
- [ ] **Claude:** Nationsguiden, Uppsala universitet och kommunens kultur, beroende på vad de svarar.

## Sidan

- [ ] **Claude:** Låt arrangörer lägga in evenemang själva, eller klistra in en kalenderlänk (iCal). Löser alla små arrangörer utan API.
- [ ] **Du:** Skapa Firebase-projektet: Firestore i EU, inloggning med e-postlänk, GitHub Pages-adressen som tillåten domän.
- [ ] **Claude:** Riktig inloggning och sparade favoriter och kategorier mellan enheter (Firebase).
- [ ] **Claude:** Integritetspolicy länkad i sidfoten, och möjlighet att radera sitt konto (GDPR). Behövs innan inloggning blir skarp. Ticketmasters villkor kräver också en integritetspolicy i sidfoten.
- [ ] **Claude:** Uppdatera "Om datan och källorna" när källor tillkommer.

Idéer, senare:

- [ ] Enkel redaktörsvy för att rätta kategorier och dubbletter. Flyttad hit i okt 2026: inget manuellt arbete i vardagen, kvaliteten mäts och larmar automatiskt i stället.

- [ ] Filter för skollov (Kubik har sommarlov, höstlov, jullov, sportlov och påsklov).
- [ ] Filter för tillgänglighet (Kubik har rullstol, hörslinga med mera).
- [ ] Karta över platser.
- [ ] Prenumerera på sina favoriter som kalender i telefonen.

## Antaganden i kvalitetslyftet (okt 2026)

Beslut som Claude tog under arbetet med `UPPDRAG-KVALITET.md`, enligt regeln "välj det säkraste och skriv in antagandet". Ändra gärna.

- Kubiks kulturskola (titlar med "Kulturis"), "undervisning" och "skridskoskola" räknas som kurser och visas inte. De kräver anmälan till en termin.
- "Årskurs" i en titel är målgrupp, inte kurs, och ger ingen ålder (bara utskrivna åldrar räknas).
- Område från postnummer bara där numret säkert hör till ett område: 753 centrum, 755 norra, 756–757 södra, 740–741 östra landsbygden. 752 och 754 delas av flera områden och används inte.
- Rosendal räknas till Västra staden, som Kubik gör med Rosendalsbiblioteket. Därför ligger USIF Arena och Himlen är blå som en apelsin där.
- Kommungränsen kommer från OpenStreetMap (ODbL, kräver att vi anger källan, vilket görs i `scripts/gemensamt/kommungrans.mjs`). Förenklad, så den kan slå fel med några hundra meter.
- Kubiks aktivitetssidor läses för veckodagar en gång i veckan. Tolken är provad mot påhittad text, eftersom källorna inte fick hämtas om under arbetet. **Claude:** kontrollera första riktiga körningen (hur många perioder fick veckodagar?).
- Fakta från källorna (kategorier, taggar, adress, datum, veckodagar) sparas från första körningen efter sammanslagningen. Före-mätningen och de första efter-siffrorna bygger delvis på äldre rådata.

## Återkommande underhåll

- [ ] **Inför varje säsong:** uppdatera ligornas och lagens id:n i `scripts/sport/konfig.mjs`. Hämtningen varnar på GitHub när en rad ger noll matcher. Ungefärliga tider:
  - Allsvenskan och Damallsvenskan: februari–mars
  - Ishockey, basket, innebandy, handboll och volleyboll: augusti–september
  - Bandy: oktober
- [ ] **Juni 2027:** be om Kulturnatten 2027 som export (kulturnatten@uppsala.se).
- [ ] **När den öppnar igen:** Reginateatern, stängd sedan maj 2026.
- [ ] **Löpande:** titta under *Actions* ibland. En röd körning eller en gul varning betyder att en källa har ändrat något. Du får också mejl från GitHub.

## Klart

- [x] 24 sep 2026: automatisk hämtning varje morgon med GitHub Actions
- [x] 24 sep: Svenska kyrkan (väntar på nyckel), Uppsala stadsteater, Destination Uppsala, Tickster och Bibliotek Uppsala
- [x] 24 sep: tydligare filter i mobilen
- [x] 24 sep: sidan visar riktig data (steg 4), och dubbletter mellan källor slås ihop
- [x] 25 sep: Heja Uppsala (tillfälligt) och Kubik Uppsala
- [x] 25 sep: filter för ålder och område
- [x] 25 sep: sport från ligor och förbund: Sirius, IK Uppsala, Almtuna, Storvreta, Uppsala Basket, Sirius bandy med flera
- [x] 25 sep: tre månader framåt ("3 mån")
- [x] 25 sep: kartläggning av källor och API:er (`KALLOR.md`)
- [x] 25 sep: nya versioner av GitHubs verktyg (Node.js 24)
- [x] 27 sep: README och backlog
- [x] 27 sep: Ticketmaster byggd, väntar på nyckel
