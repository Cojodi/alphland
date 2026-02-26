const BLOCKED_WORDS = [
  "fuck",
  "fucking",
  "fucker",
  "fucked",
  "fucks",
  "fck",
  "f*ck",
  "f**k",
  "shit",
  "shitting",
  "shitty",
  "bitch",
  "bitches",
  "asshole",
  "cunt",
  "dick",
  "cock",
  "pussy",
  "bastard",
  "motherfucker",
  "motherfucking",
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase().replace(/[*@#$!]/g, "");
  return BLOCKED_WORDS.some((word) => {
    const regex = new RegExp(`(^|\\s|[^a-z])${word}($|\\s|[^a-z])`, "i");
    return regex.test(lower);
  });
}
