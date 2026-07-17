/**
 * Browser voice discovery + "best quality" ranking.
 * The default speechSynthesis voice is often robotic; neural/natural voices
 * exist on most platforms — we just have to find and prefer them.
 */

export function speechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export async function loadBrowserVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported()) return [];
  const immediate = speechSynthesis.getVoices();
  if (immediate.length > 0) return immediate;

  return new Promise((resolve) => {
    const timer = window.setTimeout(
      () => resolve(speechSynthesis.getVoices()),
      1600,
    );
    speechSynthesis.onvoiceschanged = () => {
      window.clearTimeout(timer);
      resolve(speechSynthesis.getVoices());
    };
  });
}

const PREMIUM_NAME_PATTERNS = [
  /natural/i, // Microsoft Edge "Natural Online" neural voices
  /neural/i, // Azure/Polly neural voices
  /aria|jenny|guy |sonia|emma|andrew|brian|ava|michelle|ryan|libby|maisie/i, // Edge favorites
  /google us english|google uk english/i, // Chrome remote neural voices
  /samantha|alex|daniel|serena|karen|moira|tessa|zoe|allison|ava|susan/i, // Apple
  /online/i,
];

export function scoreVoice(voice: SpeechSynthesisVoice): number {
  let score = 0;
  for (const pattern of PREMIUM_NAME_PATTERNS) {
    if (pattern.test(voice.name)) score += 40;
  }
  if (/^en[-_]US/i.test(voice.lang)) score += 12;
  else if (/^en[-_]GB/i.test(voice.lang)) score += 10;
  else if (/^en/i.test(voice.lang)) score += 6;
  if (voice.default) score += 4;
  if (voice.localService) score += 2; // offline capable
  return score;
}

export function sortVoicesByQuality(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice[] {
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a));
}
