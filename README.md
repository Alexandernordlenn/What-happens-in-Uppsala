# Uppsala just nu

En samlad kalender över allt som händer i Uppsala kommun: konserter, teater, sport, föreläsningar, barnaktiviteter och mycket mer. Evenemangen hämtas automatiskt varje morgon från källornas egna API:er och webbplatser.

- **Sidan:** https://alexandernordlenn.github.io/What-happens-in-Uppsala/
- **Ideellt, privat projekt** av Alexander. Inget företag.

## Vilken teknik används?

Kort svar: **JavaScript**, både på sidan och i hämtningarna. Hämtningarna körs med **Node.js**. Allt är gratis och körs hos **GitHub**.

| Del | Teknik | Vad det betyder |
|---|---|---|
| Sidan | **HTML, CSS och JavaScript** i en enda fil, `index.html` | Det som visas i webbläsaren. Inget ramverk som React, bara vanlig JavaScript. |
| Webbhotell | **GitHub Pages** | GitHub publicerar `index.html` gratis som en webbplats. |
| Hämtningarna | **JavaScript som körs med Node.js** (version 22) | Node.js är ett program som kör JavaScript utanför webbläsaren, till exempel på en server. Skripten ligger i `scripts/`. |
| Schema | **GitHub Actions** | GitHubs tjänst för att köra program automatiskt. Den startar hämtningarna varje morgon kl. 06.13 svensk sommartid (04:13 UTC). Inställningen finns i `.github/workflows/hamta-evenemang.yml`. |
| Data | **JSON-filer** i `data/` | JSON är ett vanligt textformat för data. Sidan läser `data/sida.json`. |
| Tester | Node.js inbyggda testverktyg | `npm test` kör 65 tester som kontrollerar att varje källa tolkas rätt. |
| Paket | **npm** | Node.js pakethanterare. Projektet använder bara ett paket, `firebase-admin`, och bara när Firebase är inställt. |
| Databas (senare) | **Firebase / Firestore** | Planerad för inloggning och sparade favoriter. Inte aktiv än. |

Filändelsen `.mjs` betyder "JavaScript-modul", alltså vanlig modern JavaScript.

## Hur hänger det ihop?

```
Källorna (API:er och webbplatser)
        │   varje morgon kl. 06.13
        ▼
GitHub Actions kör skripten i scripts/<källa>/hamta.mjs
        │   en fil per källa: data/<källa>.json
        ▼
scripts/bygg-sida.mjs slår ihop allt och tar bort dubbletter
        │   data/sida.json
        ▼
GitHub sparar filerna och publicerar sidan
        ▼
index.html läser data/sida.json i besökarens webbläsare
```

## Källor

Nio källor är byggda: Tickster, Destination Uppsala, Heja Uppsala, Uppsala stadsteater, Bibliotek Uppsala, Kubik Uppsala, förbund och ligor (sport), Svenska kyrkan och Ticketmaster. Svenska kyrkan och Ticketmaster väntar på att nycklarna läggs in.

- Hur varje källa hämtas och status: se avsnittet "Hämtningarna" i [`CLAUDE.md`](CLAUDE.md).
- Alla källor i Uppsala och vilka API:er som ska begäras: [`KALLOR.md`](KALLOR.md).
- Vad som återstår att göra: [`BACKLOG.md`](BACKLOG.md).

## Mappar och filer

| Sökväg | Innehåll |
|---|---|
| `index.html` | Hela sidan |
| `scripts/<källa>/` | En mapp per källa: `hamta.mjs` hämtar, `regler.mjs` tolkar, `regler.test.mjs` testar, `exempel*` är testdata |
| `scripts/gemensamt/` | Delar som alla källor använder: schysst hämtning, tider, platser, kategorier, områden och åldrar |
| `scripts/sport/konfig.mjs` | Vilka ligor och lag som hämtas. Uppdateras inför varje säsong. |
| `scripts/bygg-sida.mjs` | Slår ihop alla källor till `data/sida.json` |
| `data/` | Hämtad data. `data/cache/` minns sidor som redan lästs. |
| `.github/workflows/` | Schemat för GitHub Actions |
| `CLAUDE.md` | Beslut, regler och teknisk beskrivning (läses också av Claude) |

## Köra själv

Behövs bara för den som vill köra hämtningarna på sin egen dator. Installera Node.js 22 eller senare och kör:

```
npm install        # installerar paketen
npm test           # kör testerna
npm run hamta:sport   # hämtar en källa, här sporten
npm run bygg:sida  # bygger data/sida.json
```

## Hemligheter

API-nycklar skrivs aldrig i koden. De sparas som hemligheter i GitHub (*Settings → Secrets and variables → Actions*):

- `SVK_API_KEY`: Svenska kyrkans nyckel
- `TICKETMASTER_API_KEY`: Ticketmasters nyckel
- `FIREBASE_SERVICE_ACCOUNT`: Firebase, när det är inställt
