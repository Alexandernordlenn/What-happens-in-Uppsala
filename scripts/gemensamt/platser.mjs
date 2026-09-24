// Platser: ett kanoniskt namn, alias och vad som oftast händer där.
//
// Källorna stavar samma plats olika ("Katalin", "Katalin and all that Jazz",
// "Katalin, Uppsala"). Här gör vi om dem till samma id och namn, så att
// dubbletter kan hittas och "högst ett förslag per plats" fungerar.
//
// "rum" plockas ut när källan anger en sal, till exempel "Uppsala Konsert &
// Kongress, Stora salen" -> plats UKK, rum "Stora salen".
//
// "kategori" används bara när källan inte själv har sagt vad evenemanget är.
//
// Lägg gärna till fler platser här. Mönstret skrivs som ett reguljärt uttryck
// och jämförs med platsnamnet i små bokstäver.

export const PLATSER = [
  { id: "ukk", namn: "Uppsala Konsert & Kongress", monster: /uppsala konsert (&|och) kongress|\bukk\b/, kategori: "musik" },
  { id: "katalin", namn: "Katalin", monster: /katalin/, kategori: "musik" },
  { id: "kaliber", namn: "The Kaliber Room", monster: /kaliber/, kategori: "musik" },
  { id: "blackbird", namn: "Blackbird", monster: /blackbird/, kategori: "musik" },
  { id: "parksnackan", namn: "Parksnäckan", monster: /parksnäckan/, kategori: "musik" },
  { id: "birgerjarl", namn: "Birger Jarl", monster: /birger ?jarl/, kategori: "natt" },
  { id: "flustret", namn: "Flustret", monster: /flustret/, kategori: "natt" },
  { id: "stadsteatern", namn: "Uppsala stadsteater", monster: /uppsala stadsteater/, kategori: "scen" },
  { id: "reginateatern", namn: "Reginateatern", monster: /regina ?teatern/, kategori: "scen" },
  { id: "gottsundadt", namn: "Gottsunda Dans & Teater", monster: /gottsunda dans/, kategori: "scen" },
  { id: "humanistiska", namn: "Humanistiska teatern", monster: /humanistiska teatern/, kategori: "scen" },
  { id: "sprakateatern", namn: "Språkateatern", monster: /spr[aå]kateatern/, kategori: "scen" },
  { id: "lillateatern", namn: "Den Lilla Teatern", monster: /den lilla teatern/, kategori: "scen" },
  { id: "nordisk", namn: "Nordisk Film Gränbystaden", monster: /nordisk film/, kategori: "scen" },
  { id: "konstmuseum", namn: "Uppsala konstmuseum", monster: /uppsala konstmuseum/, kategori: "museum" },
  { id: "upplandsmuseet", namn: "Upplandsmuseet", monster: /upplandsmuseet/, kategori: "museum" },
  { id: "gustavianum", namn: "Gustavianum", monster: /gustavianum/, kategori: "museum" },
  { id: "brorhjorth", namn: "Bror Hjorths Hus", monster: /bror hjorth?s hus/, kategori: "museum" },
  { id: "biotopia", namn: "Biotopia", monster: /biotopia/, kategori: "museum" },
  { id: "slottshist", namn: "Uppsala slottshistoriska", monster: /slottshistoriska/, kategori: "museum" },
  { id: "slott", namn: "Uppsala slott", monster: /^uppsala slott$/, kategori: "museum" },
  { id: "cube", namn: "Cube of Art", monster: /cube of art/, kategori: "museum" },
  { id: "gamlauppsalamuseum", namn: "Gamla Uppsala museum", monster: /gamla uppsala museum/, kategori: "museum" },
  { id: "linneshammarby", namn: "Linnés Hammarby", monster: /linnés hammarby/, kategori: "museum" },
  { id: "botaniska", namn: "Botaniska trädgården", monster: /botaniska trädgården|tropiska växthuset/ },
  { id: "ifu", namn: "IFU Arena", monster: /ifu arena/, kategori: "sport" },
  { id: "studenternas", namn: "Studenternas", monster: /studenternas/, kategori: "sport" },
  { id: "fyrishov", namn: "Fyrishov", monster: /fyrishov/ },
  { id: "granbyishall", namn: "Gränby ishall", monster: /gränby ishall|upplands bilforum arena/, kategori: "sport" },
  { id: "usif", namn: "USIF Arena", monster: /usif arena/, kategori: "sport" },
  { id: "granbyallaktivitetshus", namn: "Gränby allaktivitetshus", monster: /gränby allaktivitetshus/ },
  { id: "kulturoasen", namn: "Kulturoasen", monster: /kulturoasen/ },
  { id: "saluhall", namn: "Uppsala Saluhall", monster: /saluhall/, kategori: "mat" },
  { id: "domkyrkan", namn: "Uppsala domkyrka", monster: /uppsala domkyrka|domkyrkan/ },
  { id: "missionskyrkan", namn: "Missionskyrkan", monster: /missionskyrka/ },
  { id: "stadsbib", namn: "Stadsbiblioteket", monster: /stadsbiblioteket|läsfabriken/, kategori: "prat" },
  { id: "brygghus", namn: "Uppsala Brygghus", monster: /uppsala brygghus/, kategori: "mat" },
  { id: "kulturpunkten", namn: "Kulturpunkten, Gottsunda", monster: /kulturpunkten/ },
  { id: "kaija", namn: "KAIJA, Stallet", monster: /kaija/ },
  { id: "ulva", namn: "Ulva kvarn", monster: /ulva kvarn/ },
];

// Namn som inte är en riktig plats.
const INGEN_PLATS = /^(uppsala|annan plats|flera platser|okänd plats)$/;

// Tar ut salen ur "Plats, Sal". Ortnamnet i slutet ("Katalin, Uppsala") är ingen sal.
function rumIFrån(namn, plats) {
  const delar = namn.split(",").map((d) => d.trim());
  const rest = delar.slice(1).filter((d) => d && !/^uppsala$/i.test(d) && !plats.monster.test(d.toLowerCase()));
  return rest.join(", ") || null;
}

export function hittaPlats(namn) {
  const lagt = String(namn || "").toLowerCase().trim();
  return PLATSER.find((p) => p.monster.test(lagt)) || null;
}

// Ger evenemanget kanonisk plats. Med kategoriFranPlats blir "ovrigt"
// platsens vanliga kategori, till exempel musik på Katalin. Det ska bara
// användas för källor som inte själva anger kategori.
export function normaliseraPlats(evenemang, { kategoriFranPlats = false } = {}) {
  const original = evenemang.plats?.namn || "";
  const kand = hittaPlats(original);
  let plats = evenemang.plats;
  if (kand) {
    const rum = evenemang.plats.rum || rumIFrån(original, kand);
    plats = { ...evenemang.plats, namn: kand.namn, id: kand.id, ...(rum && { rum }) };
  } else if (INGEN_PLATS.test(original.toLowerCase())) {
    plats = { ...evenemang.plats, namn: "Uppsala", id: "uppsala" };
  }
  const kategori =
    kategoriFranPlats && evenemang.kategori === "ovrigt" && kand?.kategori ? kand.kategori : evenemang.kategori;
  return { ...evenemang, plats, kategori };
}
