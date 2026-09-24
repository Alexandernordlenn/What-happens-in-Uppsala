// Gissar kategori utifrån text, när källan inte själv säger vad det är.
// Ordningen spelar roll: första träffen vinner.

export const ORD_TILL_KATEGORI = [
  ["scen", /musikal|stand.?up|komik|humor|improv/i],
  ["sport", /\bmatch|hockey|fotboll|bandy|basket|innebandy|handboll|volleyboll|superligan|allsvenskan|\((herr|dam)\)|löpning|\blopp\b/i],
  ["natt", /klubbkväll|nattklubb|\bdj\b|\bclub\b|rave|afterwork/i],
  ["musik", /konsert|musik|kör(en|er)?\b|orgel|sång|jazz|psalm|kammar|aftonsång|evensong/i],
  ["scen", /teater|film|bio\b|föreställning|dans|opera|cirkus|show\b/i],
  ["museum", /utställning|konst|vernissage|museum|visning|guidning|vandring/i],
  ["prat", /föredrag|föreläsning|samtal|seminarium|studiecirkel|bokcirkel|berättar/i],
  ["mat", /lunch|middag|soppa|frukost|fika|våfflor|mat\b/i],
  ["ovrigt", /loppis|marknad|basar|festival|mässa\b/i],
];

export function gissaKategori(text, standard = "ovrigt") {
  for (const [kat, re] of ORD_TILL_KATEGORI) if (re.test(text || "")) return kat;
  return standard;
}
