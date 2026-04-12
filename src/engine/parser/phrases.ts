import type { CanonicalVerb } from "../types";
import type { CompiledAdventureDictionary } from "./dictionary";

export function matchLeadingPhrase(
  tokens: string[],
  dictionary: CompiledAdventureDictionary
): { consumed: number; verb: CanonicalVerb } | undefined {
  for (const phrase of dictionary.phraseAliases) {
    if (phrase.tokens.length > tokens.length) {
      continue;
    }

    const matches = phrase.tokens.every((token, index) => tokens[index] === token);

    if (matches) {
      return {
        consumed: phrase.tokens.length,
        verb: phrase.verb
      };
    }
  }

  return undefined;
}
