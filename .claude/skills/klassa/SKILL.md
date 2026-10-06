---
name: klassa
description: Klassar evenemang i Uppsala just nu som reglerna inte kunde sortera. Läser tmp/ko.json och skriver tmp/svar.json. Körs av morgonkörningen i GitHub Actions.
allowed-tools: Read(./tmp/ko.json), Write(./tmp/svar.json)
---

# Klassa evenemang (promptversion 1)

Du fyller luckor som reglerna i `scripts/gemensamt/klassa.mjs` lämnade. Svaren kontrolleras av `scripts/klassning/validera.mjs`, och allt som inte klarar kontrollen kastas.

## Gör så här

1. Läs `tmp/ko.json`. Den har `evenemang`, en lista med `id`, `hash`, `titel`, `plats`, `start`, `slut`, `taggar`, `saknas` och `kalltext`.
2. Skriv `tmp/svar.json` med exakt den här formen, ett svar per evenemang i kön och inget annat:

```json
{ "svar": [
  { "id": "...", "hash": "...",
    "format": "aterkommande", "dagar": ["lö"], "tider": { "start": "11:00", "slut": "15:00" },
    "kategori": "aktivitet", "alderMin": 3, "alderMax": 6, "barn": true,
    "belagg": { "format": "varje lördag kl. 11–15", "kategori": "Pyssel för barn", "alder": "3–6 år", "barn": "för barn" } }
] }
```

3. Läs inga andra filer och skriv inga andra filer.

## Tillåtna värden

- `format`: `enstaka`, `aterkommande`, `utstallning`, `speltid`, `period`, `kurs` eller `okand`.
- `kategori`: `musik`, `scen`, `museum`, `prat`, `aktivitet`, `sport`, `mat`, `natt`, `ovrigt` eller `okand`.
- `alderMin`, `alderMax`: heltal 0–99, eller `okand`.
- `barn`: `true`, `false` eller `okand`.
- `dagar`: lista med `må`, `ti`, `on`, `to`, `fr`, `lö`, `sö`, eller `okand`. Bara för `aterkommande`.
- `tider`: `{ "start": "HH:MM", "slut": "HH:MM" }` eller utelämnas.

## Regler

- **`okand` är alltid ett tillåtet svar.** Gissa aldrig. Hellre `okand` än fel.
- **Belägg:** varje svar som inte är `okand` behöver ett belägg i `belagg`, med fältets namn som nyckel (`format`, `kategori`, `alder`, `barn`). Belägget är ett **exakt citat** ur `kalltext` eller `titel`, ordagrant med samma stavning. Citera kort, högst en mening.
- **Ålder** får bara anges om siffrorna står i belägget, till exempel "3–6 år" eller "för 10-åringar". "Årskurs 4–9" är ingen ålder. "Barn och vuxna" eller "hela familjen" ger ingen ålder.
- **Kurs** betyder anmälan till en serie tillfällen, till exempel en termin. En enstaka workshop med anmälan är inte en kurs. Drop-in är aldrig kurs.
- **Återkommande** kräver att dagarna står i texten ("varje tisdag", "lördagar", "mån–fre").
- **Utställning** är något man går till när det är öppet. En visning eller guidning med klockslag är `enstaka` eller `aterkommande`.
- **Kategori `aktivitet`** är verkstäder, pyssel, spel, sagostunder, häng och prova på. `museum` är utställningar och visningar. `prat` är föredrag och samtal.
- Svara bara på det som står i `saknas`. Övriga fält sätts till `okand`.

## Exempel

1. Titel "Designlabbet i Sävja, årskurs 4-9", text "Kom och skapa med 3D-skrivare varje onsdag 15–17.30. Ingen anmälan." → `format: aterkommande`, `dagar: ["on"]`, `tider: {start: "15:00", slut: "17:30"}`, belägg format "varje onsdag 15–17.30". Ingen ålder (årskurs).
2. Titel "Teater för mellanstadiet", text "Terminskurs för dig i åk 4–6. Anmälan krävs, 12 tillfällen." → `format: kurs`, belägg "Anmälan krävs, 12 tillfällen".
3. Titel "Skaparverkstad", text "Drop-in för alla åldrar." → `format: okand` (dagar saknas), `kategori: aktivitet`, belägg kategori "Skaparverkstad".
4. Titel "Familjevisning", text "Visning för barn och vuxna kl 13." → `barn: true`, belägg "för barn och vuxna". Ingen ålder.
5. Titel "Babyrytmik", text "För barn 1–3 år med vuxen." → `alderMin: 1`, `alderMax: 3`, belägg alder "1–3 år". Står åldern i månader ("0–12 månader") blir svaret `okand`, eftersom siffrorna i belägget måste vara själva åldrarna.
6. Titel "Sagostund", text "" → `kategori: aktivitet`, belägg "Sagostund". Allt annat `okand`.
7. Titel "Konstutställning: Vårsalong", text "Utställningen pågår 1 mars–30 april." → `format: utstallning`, belägg "Utställningen pågår".
8. Titel "Läxhjälp", text "Varje måndag." → `kategori: okand` (en tjänst, inte ett evenemang), `format: aterkommande`, `dagar: ["må"]`, belägg "Varje måndag."
9. Titel "Yoga för unga 13–18 år", text "Tisdagar och torsdagar kl 18." → `format: aterkommande`, `dagar: ["ti", "to"]`, `alderMin: 13`, `alderMax: 18`, belägg alder "13–18 år", format "Tisdagar och torsdagar kl 18."
10. Titel "Höstlovsläger", text "Läger måndag till fredag under höstlovet, 9–15." → `format: aterkommande`, `dagar: ["må","ti","on","to","fr"]`, belägg "måndag till fredag".
11. Titel "Fotboll för nybörjare", text "Träning varannan söndag." → `format: aterkommande`, `dagar: ["sö"]`, belägg "varannan söndag".
12. Titel "Konsert", text "Barn och vuxna välkomna, fri entré." → `kategori: musik`, belägg "Konsert". Ingen ålder.
