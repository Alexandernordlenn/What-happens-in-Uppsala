# Backlog

Allt som återstår i projektet, i ungefär den ordning det bör göras. Bocka av med `[x]` och flytta raden till "Klart" längst ner när något är gjort.

- **Du** = något Alexander gör: kontakter, nycklar, beslut.
- **Claude** = kod som Claude bygger. Be om det i en ny session, till exempel "bygg Missionskyrkan från BACKLOG.md".

Mer om varje källa och vem man kontaktar: [`KALLOR.md`](KALLOR.md). Tekniken: [`README.md`](README.md).

## Nu

- [ ] **Du:** Lägg in Svenska kyrkans nyckel som hemligheten `SVK_API_KEY` (GitHub → *Settings* → *Secrets and variables* → *Actions*). Då kommer kyrkornas konserter med nästa morgon.
- [ ] **Claude:** Kontrollera Svenska kyrkans första riktiga körning. Fältnamnen i API-svaret är gissade och kan behöva justeras.
- [ ] **Du:** Skicka de fem viktigaste förfrågningarna. Be gärna Claude skriva mejlen.
  - [ ] Heja Uppsala (tjena@hejauppsala.com): avtal eller nyckel. **Måste lösas innan sidan blir skarp.**
  - [ ] Profixio: API-nyckel. En nyckel ger bandy, basket, handboll och volleyboll.
  - [ ] Kuratorskonventet (Nationsguiden): nationernas evenemang. Vår största lucka.
  - [ ] Uppsala universitet: flöde från uu.se/kalendarium.
  - [ ] Uppsala kommun, kulturförvaltningen: konstmuseet, Biotopia, Bror Hjorths Hus, Kulturnatten.
- [ ] **Du:** Påminn Tickster om API-ansökan om inget har hänt.
- [ ] **Du:** Skaffa gratisnycklar som ger fler evenemang direkt:
  - [ ] Ticketmaster Discovery API (developer.ticketmaster.com)
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
- [ ] **Claude:** Ticketmaster
- [ ] **Claude:** Billetto
- [ ] **Claude:** Profixio: byt från kalenderfiler och schemasidor till API:et.
- [ ] **Claude:** Nationsguiden, Uppsala universitet och kommunens kultur, beroende på vad de svarar.

## Sidan

- [ ] **Claude:** Låt arrangörer lägga in evenemang själva, eller klistra in en kalenderlänk (iCal). Löser alla små arrangörer utan API.
- [ ] **Du:** Skapa Firebase-projektet: Firestore i EU, inloggning med e-postlänk, GitHub Pages-adressen som tillåten domän.
- [ ] **Claude:** Riktig inloggning och sparade favoriter och kategorier mellan enheter (Firebase).
- [ ] **Claude:** Integritetspolicy och möjlighet att radera sitt konto (GDPR). Behövs innan inloggning blir skarp.
- [ ] **Claude:** Enkel redaktörsvy för att rätta kategorier och godkänna osäkra dubbletter.
- [ ] **Claude:** Uppdatera "Om datan och källorna" när källor tillkommer.

Idéer att fundera på:

- [ ] Filter för skollov (Kubik har sommarlov, höstlov, jullov, sportlov och påsklov).
- [ ] Filter för tillgänglighet (Kubik har rullstol, hörslinga med mera).
- [ ] Karta över platser.
- [ ] Prenumerera på sina favoriter som kalender i telefonen.

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
