# Lansering av Uppsala just nu

Plan för hur sidan går från test till en publik tjänst, och hur den hålls igång. Skriven 2 november 2026. Utgångsläget är runt 1 340 evenemang från 14 källor, personkontroller som är gröna och att testet med fem personer inte är gjort än.

Det här är ingen juridisk rådgivning. Där något är osäkert står det. Källor finns som länkar i texten.

---

## 1. Kort sammanfattning

**Rekommendation:** lansera i fyra steg under november 2026 till april 2027: test med fem personer, sluten beta, mjuk lansering och publik lansering. Första versionen ska inte ha någon inloggning.

Tre saker styr planen:

1. **Lansera utan inloggning.** Firebase gratisplan (Spark) skickar bara **5 inloggningsmejl per dag** med e-postlänk ([Firebase, Authentication limits](https://firebase.google.com/docs/auth/limits)). Det räcker inte ens för en beta. Allt annat fungerar redan utan konto: favoriterna sparas i webbläsaren. Utan konton slipper du också det mesta av GDPR-arbetet (konton, radering, Google som biträde). Inloggningen kan komma senare, om användarna ber om den.
2. **Prata med Uppsala kommun före den publika lanseringen.** Kubik, Bibliotek Uppsala, Destination Uppsala (ett kommunägt bolag) och Biotopia står tillsammans för runt **57 % av alla poster** från källorna (976 av 1 726 den 2 november). Tre av dem läser vi från webbsidor utan lov. Kommunen är alltså både den största risken och den bästa möjliga partnern.
3. **Håll det litet och billigt.** Utan inloggning kostar drift i princip bara en domän. Ansök inte om pengar i början. Bilda en förening först när minst två andra vill hjälpa till.

**De tre första sakerna att göra:**

- [ ] Gör testet med fem personer (Claude uppdaterar `TEST.md` först, den nämner fortfarande Heja och demo-inloggningen).
- [ ] Skicka ett mejl till kommunen (kulturförvaltningen, Kubik och biblioteket) och till Destination Uppsala: berätta vad sidan gör och be om ett skriftligt "ok", gärna ett flöde.
- [ ] Skaffa en egen e-postadress för projektet och en domän. Låt Claude ta bort demotexterna och den falska inloggningen, lägga typsnittet på egen server och skriva om integritetssidan.

---

## 2. Innan lansering

### Måste (före mjuk lansering)

**Juridik och integritet**

- [ ] **Ta bort demo-inloggningen** ur sidan. I dag ser den ut som en riktig inloggning men sparar bara e-postadressen i webbläsaren. Det förvirrar och väcker frågor om vad som händer med adressen. (Claude)
- [ ] **Egen kontaktadress.** I dag kräver en begäran om borttagning ett konto på GitHub. Det fungerar inte för vanliga arrangörer. Lägg en e-postadress för projektet på integritetssidan och i sidfoten. Använd inte din jobbadress. (Du skapar adressen, Claude ändrar sidan)
- [ ] **Skriv om integritetssidan** (`integritet.html`) så att den säger:
  - vem som ansvarar för personuppgifterna (du, som privatperson) och hur man når dig
  - att GitHub Pages loggar besökarnas IP-adresser av säkerhetsskäl, enligt [GitHubs dokumentation](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) (avsnittet "Data collection")
  - vad som händer med mejl du får (sparas så länge ärendet pågår)
  - att namn på artister och föreläsare kan finnas i titlarna, och att de tas bort på begäran
  - Att en privat webbsida på internet inte räknas som "privat bruk" enligt GDPR slog EU-domstolen fast i ett svenskt fall, [Lindqvist (C-101/01)](https://eur-lex.europa.eu/legal-content/SV/TXT/?uri=CELEX:62001CJ0101). Därför gäller reglerna fullt ut, även om de flesta krav blir små utan konton.
- [ ] **Lägg typsnittet på egen server** i stället för att hämta det från Google Fonts. En tysk domstol (LG München, 20 jan 2022) ansåg att det bröt mot GDPR att skicka besökarens IP-adress till Google utan samtycke ([The Hacker News](https://thehackernews.com/2022/01/german-court-rules-websites-embedding.html)). Det är en tysk dom och ingen svensk praxis, men det är en liten ändring som tar bort frågan helt. Typsnittet får användas fritt. (Claude)
- [ ] **Källhänvisningar** som villkoren kräver:
  - Svenska kyrkan: "Källa: Svenska kyrkan, CC BY 4.0, bearbetad" med länk. Finns redan i detaljvyn (`index.html`). CC BY 4.0 kräver namn, länk till licensen och att det framgår att materialet är ändrat ([Creative Commons](https://creativecommons.org/licenses/by/4.0/deed.sv)).
  - OpenStreetMap: kommungränsen kommer därifrån. Lägg "Kommungräns: © OpenStreetMap-bidragsgivare, ODbL" under "Om datan och källorna" ([OSM copyright](https://www.openstreetmap.org/copyright)). (Claude)
  - Billetto: länkarna behåller Billettos UTM-koder (görs redan). Jag hittade inte Billettos API-villkor publikt. Läs det du godkände när nyckeln skapades.
  - Tickster: villkoren står i ert avtal och är inte publika. Läs igenom dem och se särskilt om data får visas offentligt och om data får ligga i ett öppet repo (se nästa punkt).
  - Ticketmaster (när nyckeln kommer): integritetspolicy länkad i sidfoten, borttagning inom 24 timmar på begäran, data sparas bara "rimlig tid", och **inga intäkter från API:et** ([Ticketmaster terms](https://developer.ticketmaster.com/support/terms-of-use/)). Ticketmaster kan säga upp licensen "när som helst av vilket skäl som helst".
- [ ] **Kontrollera vad som ligger öppet i repot.** Repot är publikt (det krävs för GitHub Pages gratis). Det betyder att filerna `data/tickster.json`, `data/billetto.json` med flera går att ladda ner av vem som helst, som en färdig databas. Sidan behöver bara `data/sida.json`. Fråga Tickster och Billetto om det är okej. Annars flyttar Claude källfilerna till Firestore eller till bilagorna i Actions och lägger bara `sida.json` i repot.

**Källornas lov**

- [ ] **Skriftligt "ok" från kommunen** för Kubik, Biotopia och Bibliotek Uppsala, och från Destination Uppsala. Varför det är viktigt:
  - Fakta (titel, tid, plats) är fria. Men den som har byggt en databas kan ha ett skydd mot att någon systematiskt hämtar en stor del av den (databasrätten, i Sverige 49 § upphovsrättslagen).
  - EU-domstolen har sagt att en specialsökmotor som kopierar en annan sajts databas kan göra intrång, om det skadar den som byggt databasen ([CV-Online Latvia, C-762/19](https://www.twobirds.com/en/insights/2021/uk/cv-online-latvia-cjeu-complicates-the-enforcement-of-database-rights), och tidigare Innoweb, C-202/12). En svensk domstol har tillämpat domen i ett mål om parkeringsappar, Parkster mot Parkamo ([IPKat](https://ipkitten.blogspot.com/2022/02/swedish-court-applies-c76219-cv-online.html)).
  - Vi länkar alltid tillbaka och tar inga beskrivningar eller bilder, så skadan för källan är liten. Men risken är verklig, och ett "ok" tar bort den. Det gör också projektet mycket starkare i kontakten med medier och kommunen.
- [ ] **En snabb väg att stänga av en källa.** I dag behöver man ändra både workflowet, listan `KALLOR` i `scripts/bygg-sida.mjs` och ta bort datafilen. Claude bygger en enda lista, till exempel `avstangda` i en konfigurationsfil, som stoppar både hämtning och visning. (Claude)

**Namn och domän**

- [ ] **Bestäm namnet.** En sökning på "Uppsala just nu" den 2 november 2026 hittade ingen tjänst med det namnet. "Just nu" är vanliga ord, så namnet blir svårt att registrera som varumärke men krockar troligen inte heller med någon. Sök själv i [PRV:s varumärkesdatabas](https://www.prv.se/) och i [TMview](https://www.tmdn.org/tmview/), och kolla Instagram och Facebook.
- [ ] **Registrera en domän.** Den 2 november 2026 hade `uppsalajustnu.se`, `uppsalajustnu.nu` och `uppsalajustnu.com` inga namnservrar (DNS svarade "finns inte"). Det tyder på att de är lediga, men bara registraren kan säga säkert. Registrera på en adress för projektet, inte på jobbet. GitHub Pages kan använda en egen domän gratis.

**Drift**

- [ ] **Fyra veckor stabila körningar** före den mjuka lanseringen: morgonkörningen grön eller med kända varningar, och personkontrollerna gröna.

### Bör (före publik lansering)

- [ ] **Förhandsvisning när någon delar länken.** Sidan saknar beskrivning och Open Graph-taggar. När länken delas i Messenger, WhatsApp eller Facebook blir det i dag en tom ruta. (Claude)
- [ ] **Bli hittad på Google.** Folk söker på "vad händer i Uppsala i helgen". Sidan byggs i webbläsaren, så sökmotorerna ser lite innehåll. Låt bygget skriva några enkla sidor till, till exempel "I helgen i Uppsala" och "Barn i Uppsala den här veckan", med vanlig text. (Claude)
- [ ] **Tillgänglighet.** Sidan har redan knappar med etiketter för skärmläsare (`aria-label`, `aria-pressed`). Kör ett test med [Lighthouse eller WAVE](https://wave.webaim.org/) och kontrollera kontraster, tangentbord och skärmläsare i mobilen. Det finns troligen inget lagkrav: lagen om tillgänglighet till digital offentlig service gäller offentlig sektor, och den nya lagen ([2023:254](https://data.riksdagen.se/dokument/sfs-2023-254.html)) gäller vissa tjänster som e-handel och bank. Men en kalender för alla bör gå att använda för alla. (Claude testar, du provar själv med skärmläsaren i telefonen)
- [ ] **Mätning utan spårning.** Utan mätning går det inte att veta om lanseringen fungerar. [GoatCounter](https://github.com/arp242/goatcounter) är gratis för icke-kommersiellt bruk och använder inga kakor. Var den hostade tjänsten lagrar data hittade jag inte, så läs deras integritetspolicy först. Skriv in det på integritetssidan. (Du skapar kontot, Claude lägger in koden)
- [ ] **Ett sätt att tycka till** direkt på sidan: en länk "Saknas något? Fel tid?" till projektets e-post.
- [ ] **Prestanda.** Första besöket laddar runt 100 kB komprimerat (`sida.json` är 70 kB komprimerad, `index.html` 30 kB). Det är bra. Kontrollera ändå på en äldre telefon med dålig täckning.
- [ ] **Svenska kyrkans och Ticketmasters nycklar inlagda**, så att kyrkokonserter och stora turnéer finns med.

### Kan vänta (efter lansering)

- [ ] Inloggning och favoriter mellan enheter. Se ruta nedan.
- [ ] Engelsk version. Uppsala har många internationella studenter, men börja på svenska.
- [ ] Arrangörer som lägger in evenemang själva eller klistrar in en iCal-länk.
- [ ] Prenumerera på favoriter som kalender i telefonen. Det ger en stor del av nyttan med inloggning, utan konto.
- [ ] Karta, skollovsfilter och tillgänglighetsfilter (från BACKLOG).

> **Om inloggningen, när den behövs**
> - Med Firebase e-postlänk måste projektet byta till Blaze-planen och lägga in ett betalkort. Gränsen blir då 25 000 mejl per dag ([Firebase limits](https://firebase.google.com/docs/auth/limits)). Vid liten användning blir det troligen gratis, men en budgetvarning stoppar inte kostnader, den bara varnar.
> - Firestore på gratisplanen: 50 000 läsningar, 20 000 skrivningar och 20 000 raderingar per dag och 1 GiB lagring ([Firebase pricing](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)). Det räcker länge.
> - Var Firebase Authentication lagrar data är oklart: Firestore kan ligga i EU, men inloggningen beskrivs i inofficiella källor som USA-baserad. Google hänvisar till EU–USA-ramverket (Data Privacy Framework) och standardavtalsklausuler ([Firebase privacy](https://firebase.google.com/support/privacy)). Det måste stå i integritetspolicyn.
> - Konton kräver: radering av kontot direkt på sidan, export av sina data, och att biträdesvillkoren från Google godkänns.
> - Enklare alternativ: en "flytta mina favoriter"-länk eller QR-kod som innehåller favoriterna själva. Inga konton och inga personuppgifter.

### Om en källa ber oss sluta

Svara samma dag, stäng av inom 24 timmar, och tacka. Det gäller oavsett om vi juridiskt måste.

| Steg | Vem | Tid |
|---|---|---|
| Svara vänligt och bekräfta | Du | Samma dag |
| Stäng av källan (listan `avstangda`) och kör om bygget | Claude | Inom 24 timmar |
| Ändra "Om datan och källorna" | Claude | Samma ändring |
| Fråga om de vill ha ett flöde i stället, eller vilka villkor som skulle fungera | Du | När det har lugnat sig |

Vad vi skulle förlora (poster från källan den 2 november 2026, före sammanslagning):

| Källa | Poster | Effekt |
|---|---|---|
| Kubik | 517 | Störst. Lisa med småbarn och tonåringen klarar sig troligen inte. |
| Bibliotek Uppsala | 283 | Sagostunder och barnaktiviteter. Stort för familjer. |
| Tickster | 220 | Konserter, scen, standup. |
| Destination Uppsala | 151 | Många finns också hos andra. |
| Övriga | 13–117 var | Märks för enskilda målgrupper. |

---

## 3. Lansering i steg

Gå bara vidare när kraven för steget är uppfyllda. Det är bättre att vänta en månad än att lansera något som inte fungerar för den första målgruppen.

| Steg | Vilka | Hur många | Mål med steget |
|---|---|---|---|
| 1. Test | Fem personer du känner, olika typer: förälder, student, pensionär, tonåring, sportfan | 5 | Hitta det som är trasigt eller obegripligt |
| 2. Sluten beta | Vänner, familj, kollegor och deras vänner | 20–50 | Kommer folk tillbaka av sig själva? |
| 3. Mjuk lansering | Några utvalda kanaler, utan press | 200–1 000 besökare | Klarar sidan främlingar, och vill de dela den? |
| 4. Publik lansering | Hela Uppsala: medier, kommunen, arrangörer | Okänt | Bli den naturliga platsen att kolla |

### Krav för att gå vidare

**Från test till sluten beta**

- [ ] Minst 4 av 5 hittar något att göra i helgen på under två minuter, utan hjälp.
- [ ] Ingen hittar ett allvarligt fel (fel datum, fel plats, trasiga länkar) som inte är rättat.
- [ ] Minst 3 av 5 säger att de skulle använda sidan igen.
- [ ] Demo-inloggningen är borttagen och kontaktadressen finns.

**Från sluten beta till mjuk lansering**

- [ ] Minst hälften av betatestarna har använt sidan igen efter en vecka (fråga dem, eller se det i mätningen).
- [ ] Personkontrollerna i `data/kvalitet.json` har varit gröna 14 dagar i rad.
- [ ] Fyra veckor stabila morgonkörningar.
- [ ] Alla "måste" i avsnitt 2 är gjorda, utom kommunens svar.
- [ ] Domänen fungerar och namnet är bestämt.

**Från mjuk lansering till publik lansering**

- [ ] Skriftligt ok, eller ett flöde, från kommunen för Kubik, Biotopia och biblioteket, och från Destination Uppsala. Kommer inget svar på sex veckor: skicka en påminnelse och fråga om ett kort möte. Lansera inte publikt med ett "nej" från kommunen.
- [ ] Ingen källa har bett oss sluta, eller så är det löst.
- [ ] Minst 20 % av besöken kommer tillbaka inom en vecka (enligt mätningen) eller via bokmärke eller hemskärm.
- [ ] Felrapporterna har blivit färre två veckor i rad.
- [ ] Alla "bör" i avsnitt 2 är gjorda.

### Mått att följa

Håll det enkelt. Ett mått du inte tittar på är inget mått.

| Mått | Var | Hur ofta |
|---|---|---|
| Besök per vecka | GoatCounter | Varje vecka |
| Andel som kommer tillbaka | GoatCounter (osäkert hur väl), eller fråga i beta | Varje vecka |
| Personkontrollerna och andel utan klockslag, i "övrigt" och utan område | `data/kvalitet.json` | Automatiskt, larm vid fel |
| Felrapporter och borttagningar | Projektets e-post | Varje vecka |
| Antal källor och evenemang | "Om datan och källorna" | Varje månad |
| Arrangörer som länkar till oss | Fråga dem | Varje månad |

---

## 4. Att nå ut i Uppsala

### Målgrupper

Börja med en eller två målgrupper där sidan redan är bra. Försök inte nå alla samtidigt.

| Målgrupp | Varför de behöver sidan | Hur bra sidan är för dem i dag |
|---|---|---|
| **Föräldrar med barn 0–12** | Letar efter något att göra i helgen och på lov, och saknar tid att leta på tio sajter | Bra: Kubik, biblioteken, Biotopia och åldersfiltret. Personkontrollen för Lisa är grön. |
| **Pensionärer och vuxna kulturintresserade** | Föredrag, konserter, utställningar dagtid | Bra |
| **Sportfans** | Hemmamatcher på ett ställe | Bra för de högsta ligorna |
| **Studenter** | Klubbar, pubar och konserter | **Svagt.** Nationernas evenemang saknas (vår största lucka). Vänta med studenterna tills Nationsguiden finns med. |
| **Tonåringar** | Det finns aktiviteter, men de letar inte på kalendersajter | Medel |

**Rekommendation: börja med föräldrarna.** Där är sidan starkast, behovet stort och grupperna tätt sammankopplade.

### Kanaler, ordnade efter vad som troligen ger mest

| # | Kanal | Hur | Kostnad | Kommentar |
|---|---|---|---|---|
| 1 | **Kommunen: Kubik, biblioteken, kulturförvaltningen** | Samarbete om data, och en länk från Kubik eller bibliotekets sida. Affisch med QR-kod på biblioteken, om de vill. | 0 kr | Ger både lov och spridning. Kubik beskrivs i kommunens egna papper som kommunens kalender för barn och unga ([uppsala.se](https://www.uppsala.se/contentassets/5ffc9c82e5774c8291149da4a2f5f329/20.-svar-pa-initiativarende-om-lokalt-fritidslyft.pdf)). Ett ideellt projekt som ger deras evenemang fler besökare är ett lätt ja. |
| 2 | **Lokala föräldragrupper på Facebook** | Fråga administratören först. Ett inlägg inför ett lov ("allt för barn under höstlovet på ett ställe"). | 0 kr | Sök själv efter grupper för föräldrar i Uppsala och i stadsdelarna. Jag har inte kontrollerat vilka som finns. |
| 3 | **Lokala medier** | Tips till [UNT](https://www.unt.se/), [P4 Uppland](https://www.sverigesradio.se/p4uppland) och studenttidningen [Ergo](https://ergo.nu/). Vinkel: "ideell Uppsalabo bygger gratis kalender över allt som händer". | 0 kr | Bäst vid den publika lanseringen. En artikel ger en topp, inte vanor. |
| 4 | **Arrangörerna själva** | Be dem länka: "Se allt som händer i Uppsala". Ge dem en liten knapp eller text. Små arrangörer får gratis synlighet. | 0 kr | Långsamt men varaktigt. Börja med dem som redan svarat på mejl (Katalin, UKK, Missionskyrkan, Bror Hjorths Hus). |
| 5 | **Reddit r/uppsala** | Ett inlägg vid den mjuka lanseringen, be om synpunkter. | 0 kr | Runt 31 000 medlemmar enligt [GummySearch](https://gummysearch.com/r/uppsala/) (tredjepartssiffra). Många studenter och nyinflyttade, också på engelska. Läs gruppens regler först. |
| 6 | **Google** | Sidor som "I helgen i Uppsala" (se "bör"). | 0 kr | Tar månader, men är den kanal som växer av sig själv. |
| 7 | **Destination Uppsala** | Partner: de har egen kalender för besökare. Vi är för invånare. | 0 kr | De kan se oss som konkurrent. Visa att vi länkar till dem och skickar trafik. |
| 8 | **Studentkåren och nationerna** | Efter att Nationsguidens data finns med. | 0 kr | Kuratorskonventet är förfrågan nummer 1 i `KALLOR.md`. Lyckas den blir studenterna en stark målgrupp, och Valborg en naturlig lanseringsdag. |
| 9 | **Eget Instagram- eller Facebookkonto** | "Helgens tips" varje torsdag, som Claude föreslår och du publicerar. | 0 kr, 20 min/vecka | Bara om du tycker det är roligt. Lätt att börja, svårt att hålla igång. |

### Samarbeten med källorna

- **Ett "tack-mejl" med statistik.** Efter mjuk lansering: berätta för varje källa hur många som klickat vidare till dem (kräver att mätningen räknar klick på länkar ut). Det är det bästa argumentet för att få flöden och lov.
- **Ge något tillbaka.** Erbjud kommunen och små arrangörer att få sina evenemang granskade (fel tider, dubbletter som vi hittar). Erbjud inte vår samlade data vidare: den är andras, och Ticketmasters och troligen Ticksters villkor tillåter inte det.
- **Lägg inte in andras logotyper**, och skriv inget som låter som att kommunen eller kyrkan står bakom sidan förrän det finns ett avtal.
- **Kommunen som partner på sikt.** Kommunen har en modell för samarbete med ideella organisationer, idéburet offentligt partnerskap (IOP), som den till exempel har med KFUK-KFUM ([uppsala.se](https://www.uppsala.se/contentassets/0f2b2d9a11c64019be2755ba4627c433/09-overenskommelse-om-ideburet-offentligt-partnerskap-iop-med-uppsala-kfuk-kfum-2024-2027.pdf)). Det kräver en förening och är inget för de första månaderna.

### Lanseringsdatum som ger draghjälp

- **Inför ett lov** (jullov, sportlov, påsklov): föräldrar letar aktivt.
- **Valborg:** stort i Uppsala, men bara om nationernas evenemang finns med. Annars blir det en besvikelse.
- **Kulturnatten** i september: bra för en "ett år senare"-nyhet.

---

## 5. Att hålla det igång

### Tid per vecka

| Period | Tid för dig | Vad |
|---|---|---|
| Lanseringsmånaderna | 3–5 timmar | Mejl till källor, testpersoner, kanaler, beslut |
| Vanlig drift | 30–60 minuter | Läs larm, svara på mejl, en kort session med Claude om något gått sönder |
| Inför varje säsong | 1–2 timmar | Be Claude uppdatera sportens id (se BACKLOG) |

Om drift tar mer än en timme i veckan i två månader: dra ner ambitionen (färre källor) hellre än att bränna ut dig.

### Kostnader

| Post | Utan inloggning | Med inloggning |
|---|---|---|
| GitHub Pages och Actions | 0 kr (publikt repo) | 0 kr |
| Firebase | 0 kr, eller används inte | Blaze-planen med betalkort. Troligen 0 kr vid liten användning, men inget tak. |
| Domän | Låg årskostnad. Priset varierar mellan registrarer, kontrollera. | Samma |
| E-post för projektet | 0 kr med ett gratiskonto | Samma |
| Claude | Din prenumeration. Kontrollera att den är din egen och inte arbetsgivarens, eller att den får användas för ett privat projekt (BACKLOG säger samma sak). | Samma |
| Mätning (GoatCounter) | 0 kr för icke-kommersiellt bruk | Samma |

GitHub Pages har en mjuk gräns på 100 GB trafik per månad och 1 GB per webbplats ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)). Med runt 100 kB per besök räcker det till ungefär en miljon besök i månaden. Pages får inte användas för e-handel eller kommersiella tjänster, vilket inte gäller oss.

### Pengar och bidrag, ärligt

Kort sagt: **projektet behöver nästan inga pengar, och nästan alla bidrag kräver en förening.** Sök inte pengar förrän det finns ett behov.

| Möjlighet | Villkor | Passar oss? |
|---|---|---|
| Uppsala kommuns föreningsbidrag | Bara för en juridisk person med organisationsnummer ([kommunens riktlinje](https://www.uppsala.se/contentassets/6836190c839d4f9dba734a95087ffcf8/riktlinje-for-foreningsbidrag-och-bidrag-till-fria-kulturlivet.pdf)). Varje nämnd har egna regler, ofta krav på medlemmar. | Först med en förening. Ett "projekt för hela kommunen" passar inte självklart in i någon nämnd. |
| Internetstiftelsens Internetfonden | Har stöttat projekt som utvecklar internet i Sverige. Jag hittade inga aktuella villkor eller utlysningar för 2026 ([Lysator, 2005](https://lists.lysator.liu.se/mailman/hyperkitty/list/runeberg@lists.lysator.liu.se/message/TGKNJYZTJM3B5MFXZDEFHJSTFUFG5NAT), äldre uppgifter). | **Osäkert.** Kontrollera på internetstiftelsen.se. |
| Sparbanksstiftelser och lokala stiftelser | Jag hittade inte Sparbanksstiftelsen Uplands villkor. Liknande stiftelser ger ofta inte pengar till löpande drift. | Osäkert. Kräver troligen förening. |
| Google Ad Grants (gratis annonser på Google) | Kräver godkänd ideell organisation via Goodstack ([Google for Nonprofits FAQ](https://www.google.com/nonprofits/about/faq)). Jag kunde inte bekräfta att svenska ideella föreningar godkänns. | Osäkert. Kräver förening. |
| Annonser eller sponsring på sidan | Ticketmasters villkor förbjuder intäkter från deras API. Andra källor kan ha liknande villkor. Annonser kräver dessutom ofta kakor. | **Nej.** |
| Swish-gåvor | Kräver i praktiken en förening med eget konto. Gåvor till dig som privatperson blandar ihop din ekonomi med projektets. | Inte nu. |

### Ska det bli en förening?

**Inte ännu. Bilda en ideell förening när minst två andra personer vill ta ansvar.**

- En ideell förening kräver minst tre personer, stadgar och ett första möte. Organisationsnummer söks gratis hos Skatteverket med blankett SKV 8400, och behövs för bankkonto och bidrag ([Skatteverket](https://skatteverket.se/foreningar/driva/ideellforening/startaenideellforening.4.70ac421612e2a997f85800028338.html)).
- Fördelar: flera delar ansvaret, projektet överlever om du tar en paus, det går att söka bidrag, och kommunen har en motpart.
- Nackdelar: årsmöte, styrelse, enkel bokföring och oftast en bankavgift. Det är mer arbete än själva sidan i början.

### Så att allt inte hänger på dig

Det går att börja redan nu, utan förening:

- [ ] **Flytta repot till en GitHub-organisation** (gratis) med två ägare: du och en person du litar på.
- [ ] **Nycklar på projektet, inte på dig.** Skapa Billetto-, Ticketmaster- och Tickster-kontona med projektets e-post. Skriv en lista (utan själva nycklarna) över vilka nycklar som finns, var de skapades och vem som kan förnya dem.
- [ ] **Driftboken finns redan:** `CLAUDE.md`, `README.md` och `BACKLOG.md` beskriver allt. Håll dem aktuella, så kan någon annan ta över med Claude.
- [ ] **Ett "vilande läge".** Sidan visar redan när en källa är inaktuell (äldre än 3 dygn). Bestäm vad som händer om du är borta länge: sidan ska då säga "uppdateras inte just nu" i stället för att visa gamla evenemang som om de vore aktuella. (Claude)
- [ ] **Var uppmärksam på GitHubs 60-dagarsregel:** i ett publikt repo stängs schemalagda körningar av efter 60 dagar utan aktivitet i repot ([GitHub](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)). De dagliga sparningarna räknas troligen som aktivitet, men om hämtningen slutar spara något kan schemat stanna. Larmet bör säga till om sidan inte uppdaterats på tre dagar.
- [ ] **AI-steget är ingen förutsättning.** Sidan fungerar utan Claude i morgonkörningen. Behåll det så.

---

## 6. Risker

| Risk | Hur trolig | Hur illa | Vad vi gör |
|---|---|---|---|
| **Kommunen säger nej till Kubik och biblioteket** | Låg–medel | Mycket illa: runt hälften av posterna, och barn och familj | Fråga tidigt och vänligt, erbjud samarbete. Lansera inte publikt förrän det är klart. |
| **En källa ber oss sluta** | Medel | Beror på källan, se tabellen i avsnitt 2 | Rutinen i avsnitt 2: stäng av inom 24 timmar, fråga sedan om flöde. |
| **Databasrätt** vid läsning av webbsidor | Låg | Illa om det blir ett krav | Ersätt webbsidorna med flöden (målet i `KALLOR.md`). Lov från de källor som läses i dag. |
| **Fel datum, tid eller plats** | Medel | Folk går förgäves och slutar lita på sidan | Länka alltid till arrangören. Text på sidan: "Kontrollera hos arrangören". Kvalitetsmåtten och larmen. |
| **Ett API stänger eller byter villkor** (Tickster, Billetto, Ticketmaster) | Medel på sikt | Medel | Varje källa är ett eget steg. Gårdagens data visas. Läs villkoren igen en gång om året. |
| **Data i det öppna repot** strider mot villkoren | Medel | Medel: kan kosta en nyckel | Fråga Tickster och Billetto, eller lägg bara `sida.json` i repot. |
| **Firebase-kostnad** om inloggningen kommer | Låg | Liten till medel | Ingen inloggning i första versionen. Med Blaze: budgetvarning och kvoter. |
| **Du tröttnar eller får ont om tid** | Medel–hög över ett år | Sidan dör tyst | Liten ambition, tidsgräns per vecka, en medägare på GitHub, vilande läge. |
| **Claude-prenumerationen** upphör eller får inte användas så | Medel | Liten: sidan fungerar utan | Kontrollera villkoren för prenumerationen. Reglerna räcker för en fungerande sida. |
| **Ensidig målgrupp**: studenter besvikna på att nationerna saknas | Hög om vi riktar oss till dem | Dåligt rykte | Rikta inte lanseringen till studenter förrän Nationsguiden finns. |
| **Mejl med personuppgifter** hamnar i GitHub-ärenden | Medel | Liten men onödig | Begäran om borttagning via e-post, inte via publika ärenden. |
| **Konkurrenter** (till exempel kommersiella kalendrar) klagar | Låg | Liten | Vi hämtar inte från dem (beslutat för Heja Uppsala). Var öppen med hur sidan fungerar. |
| **Trafiktopp** efter en artikel | Låg | Liten | GitHub Pages klarar runt en miljon besök i månaden med dagens storlek. |

---

## 7. Tidslinje

Från november 2026 till april 2027. Datumen är riktmärken. Flytta hellre ett steg än att hoppa över ett krav.

| Period | Alexander | Claude |
|---|---|---|
| **v. 45–46 (nov)** | Läs planen och bestäm. Kontrollera Claude-prenumerationen. Skapa projektets e-post. Lägg in `SVK_API_KEY` och skaffa Ticketmaster-nyckeln. | Uppdatera `TEST.md`. Ta bort demo-inloggningen och demotexterna. Typsnittet på egen server. Ny integritetssida. OSM-hänvisning. |
| **v. 47–48 (nov)** | **Test med fem personer.** Skicka mejlet till kommunen och Destination Uppsala (Claude skriver utkastet). Fråga Tickster och Billetto om datan i repot. | Sammanfatta testsvaren. Rätta fynden. Bygg listan `avstangda`. Kontrollera Svenska kyrkans första körning. |
| **v. 49–51 (dec)** | Registrera domän. Bjud in 20–50 till **sluten beta** inför jullovet. Skapa GitHub-organisation med en medägare. | Egen domän på GitHub Pages. Delningsförhandsvisning (Open Graph). Mätning med GoatCounter. Länk "Saknas något?". |
| **v. 52–2 (jul och nyår)** | Paus. Läs bara larm. | Inget planerat. |
| **v. 3–5 (jan)** | Fråga betatestarna efter en vecka och efter en månad. Påminn kommunen om inget svar kommit. | Rätta betafynd. Sidor för Google ("I helgen i Uppsala"). Tillgänglighetstest. |
| **v. 6–9 (feb)** | Om kraven är uppfyllda: **mjuk lansering** inför sportlovet. Två eller tre föräldragrupper och r/uppsala. | Följ kvalitet och felrapporter. Ersätt webbsidor med flöden när kommunen svarar. |
| **v. 10–13 (mar)** | Möte med kommunen om det behövs. Mejla arrangörer och be dem länka. Bestäm datum för publik lansering. | Klickstatistik per källa till tack-mejlen. Eventuellt Nationsguiden, om Kuratorskonventet svarat. |
| **v. 14–17 (apr)** | **Publik lansering**, helst inför påsklovet, eller Valborg om nationerna finns med. Tips till UNT, P4 Uppland och Ergo (Claude skriver pressmeddelandet). | Beredskap för trafik och felrapporter. |
| **Maj och framåt** | Utvärdera: fortsätta, växa eller dra ner? Fundera på förening om andra vill hjälpa till. | Arrangörer lägger in själva eller klistrar in iCal-länk. Inloggning bara om användarna efterfrågar det. |

---

## 8. Osäkerheter

Det här kunde jag inte kontrollera, eller så är det bedömningar:

- **Domänerna:** att `uppsalajustnu.se`, `.nu` och `.com` saknade namnservrar den 2 november 2026 tyder på att de är lediga, men det är inte säkert. Kontrollera hos en registrar.
- **Namnet som varumärke:** jag har inte sökt i PRV:s eller EUIPO:s databaser. En vanlig webbsökning hittade ingen tjänst som heter "Uppsala just nu".
- **Databasrätten:** domarna (CV-Online, Innoweb, Parkster) gällde andra branscher. Hur en domstol skulle se på en ideell kalender som länkar tillbaka är oklart. Bedömningen att risken är låg men verklig är min, inte en jurists.
- **Tickster och Billetto:** jag har inte sett deras API-villkor. Tickster har ett avtal med dig, och Billettos dokumentation stänger ute robotar. Läs villkoren själv, särskilt om offentlig visning och om data i ett öppet repo.
- **Firebase Authentication:** gränsen på 5 inloggningsmejl per dag är bekräftad i Firebases dokumentation, som också säger att gränsen "nyligen ändrats". Var inloggningsdatan lagras bekräftade jag inte i officiella källor.
- **Google Fonts:** domen är tysk. Det finns ingen svensk dom jag känner till. Att byta är ändå billigt.
- **Tillgänglighetslagen (2023:254):** jag bedömer att en gratis kalender inte omfattas, men har inte läst hela lagen och propositionen.
- **GoatCounter:** var den hostade tjänsten lagrar data hittade jag inte.
- **Bidrag:** Internetfondens nuvarande villkor, Sparbanksstiftelsen Uplands villkor och om Google for Nonprofits godkänner svenska föreningar kunde jag inte bekräfta.
- **Bibliotek Uppsala som kommunal källa:** jag utgår från att Bibliotek Uppsala är kommunens folkbibliotek. Destination Uppsala AB finns i [Uppsala Stadshus AB:s årsredovisning](https://www.uppsala.se/contentassets/33f962f2180846938ad445c325c41729/bilaga-6-arsredovisning-uppsala-stadshus-ab-2020.pdf) som dotterbolag (2020). Kommunen har föreslagit att bolaget byter namn till Uppsala Destination och Event AB, så kontaktvägarna kan ha ändrats.
- **Medier och grupper:** jag har inte kontrollerat vilka föräldragrupper som finns, eller aktuella kontaktpersoner på UNT, P4 Uppland och Ergo. Använd kontaktsidorna.
- **r/uppsala:** medlemsantalet kommer från en tredjepartstjänst, inte från Reddit.
- **Kraven per steg** (4 av 5, hälften, 20 %) är mina förslag, inte etablerade siffror. Justera efter testet.
- **Claude-prenumerationen:** jag har inte kontrollerat villkoren för att köra den i GitHub Actions för ett privat projekt.
