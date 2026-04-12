import type { Intent } from "../types";
import type { CompiledAdventureDictionary } from "./dictionary";
import { normalizeDictionaryPhrase } from "./dictionary";
import { ParserDiagnosticError } from "./diagnostics";
import { matchLeadingPhrase } from "./phrases";

const PREPOSITIONS = new Set([
  "at",
  "from",
  "in",
  "into",
  "on",
  "through",
  "to",
  "using",
  "with"
]);

function stripStopWords(tokens: string[], dictionary: CompiledAdventureDictionary): string[] {
  return tokens.filter((token) => token === "," || !dictionary.stopWords.has(token));
}

function getSingleActorId(
  alias: string,
  dictionary: CompiledAdventureDictionary
): string | undefined {
  const matches = dictionary.actorAliasToIds.get(alias) ?? [];

  return matches[0];
}

function splitPreposition(tokens: string[]): {
  direct: string[];
  indirect: string[];
  preposition: string | undefined;
} {
  const index = tokens.findIndex((token) => PREPOSITIONS.has(token));

  if (index === -1) {
    return {
      direct: tokens,
      indirect: [],
      preposition: undefined
    };
  }

  return {
    direct: tokens.slice(0, index),
    indirect: tokens.slice(index + 1),
    preposition: tokens[index]
  };
}

function levenshteinDistance(left: string, right: string): number {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const table = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let row = 0; row < rows; row += 1) {
    table[row]![0] = row;
  }

  for (let col = 0; col < cols; col += 1) {
    table[0]![col] = col;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      table[row]![col] = Math.min(
        table[row - 1]![col]! + 1,
        table[row]![col - 1]! + 1,
        table[row - 1]![col - 1]! + cost
      );
    }
  }

  return table[left.length]![right.length]!;
}

function suggestCommandWord(
  token: string,
  dictionary: CompiledAdventureDictionary
): string | undefined {
  const candidates = [...dictionary.commandWords];
  let best: { distance: number; word: string } | undefined;

  for (const word of candidates) {
    const distance = levenshteinDistance(token, word);

    if (distance > 2) {
      continue;
    }

    if (!best || distance < best.distance) {
      best = { distance, word };
    }
  }

  return best?.word;
}

function phraseTokensMatch(phrase: string, queryTokens: string[]): boolean {
  const phraseTokens = normalizeDictionaryPhrase(phrase).split(" ").filter(Boolean);

  return queryTokens.every((token) => phraseTokens.includes(token));
}

function isPlausibleReferencePhrase(
  phrase: string,
  dictionary: CompiledAdventureDictionary
): boolean {
  const normalized = normalizeDictionaryPhrase(phrase);
  const queryTokens = normalized.split(" ").filter(Boolean);

  if (queryTokens.length === 0) {
    return false;
  }

  if (
    dictionary.actorAliasToIds.has(normalized) ||
    dictionary.itemAliasToIds.has(normalized) ||
    dictionary.groupAliasToIds.has(normalized)
  ) {
    return true;
  }

  for (const phrases of dictionary.actorPhrasesById.values()) {
    if (phrases.some((candidate) => phraseTokensMatch(candidate, queryTokens))) {
      return true;
    }
  }

  for (const phrases of dictionary.itemPhrasesById.values()) {
    if (phrases.some((candidate) => phraseTokensMatch(candidate, queryTokens))) {
      return true;
    }
  }

  return false;
}

export function normalizeTokens(
  rawTokens: string[],
  dictionary: CompiledAdventureDictionary
): Intent {
  const tokens = stripStopWords(rawTokens, dictionary);

  if (tokens.length === 0) {
    throw new ParserDiagnosticError({ code: "incomplete_command" });
  }

  let actorId: string | undefined;
  let working = [...tokens];
  const firstToken = working[0];
  const secondToken = working[1];
  const thirdToken = working[2];

  if (firstToken && secondToken === "," && getSingleActorId(firstToken, dictionary)) {
    actorId = getSingleActorId(firstToken, dictionary);
    working = working.slice(2);
  } else if (
    firstToken === "tell" &&
    secondToken &&
    getSingleActorId(secondToken, dictionary) &&
    thirdToken === "to"
  ) {
    actorId = getSingleActorId(secondToken, dictionary);
    working = working.slice(3);
  }

  const raw = working.join(" ");

  if (working.length === 0) {
    throw new ParserDiagnosticError({ code: "incomplete_command" });
  }

  const soleToken = working[0];

  if (working.length === 1 && soleToken && getSingleActorId(soleToken, dictionary)) {
    return {
      verb: "SWITCH_ACTOR",
      actorId: undefined,
      directObject: soleToken,
      indirectObject: undefined,
      preposition: undefined,
      raw
    };
  }

  const phraseMatch = matchLeadingPhrase(working, dictionary);

  if (phraseMatch) {
    const remainder = working.slice(phraseMatch.consumed);

    if (phraseMatch.verb === "SWITCH_ACTOR") {
      return {
        verb: phraseMatch.verb,
        actorId: undefined,
        directObject: remainder.join(" ") || undefined,
        indirectObject: undefined,
        preposition: undefined,
        raw
      };
    }

    const split = splitPreposition(remainder);

    return {
      verb: phraseMatch.verb,
      actorId,
      directObject: split.direct.join(" ") || undefined,
      indirectObject: split.indirect.join(" ") || undefined,
      preposition: split.preposition,
      raw
    };
  }

  const commandHead = working[0];

  if (!commandHead) {
    throw new ParserDiagnosticError({ code: "incomplete_command" });
  }

  const direction = dictionary.directionAliases.get(commandHead);

  if (direction) {
    return {
      verb: "GO",
      actorId,
      directObject: direction,
      indirectObject: undefined,
      preposition: undefined,
      raw
    };
  }

  const verb = dictionary.verbAliases.get(commandHead);

  if (!verb) {
    const nounPhrase = working.join(" ");

    if (isPlausibleReferencePhrase(nounPhrase, dictionary)) {
      throw new ParserDiagnosticError({
        code: "noun_only",
        nounPhrase
      });
    }

    const suggestion = suggestCommandWord(commandHead, dictionary);

    throw new ParserDiagnosticError(
      suggestion
        ? {
            code: "unknown_verb",
            nounPhrase: commandHead,
            suggestion
          }
        : {
            code: "unknown_verb",
            nounPhrase: commandHead
          }
    );
  }

  const remainder = working.slice(1);

  if (verb === "SWITCH_ACTOR") {
    return {
      verb,
      actorId: undefined,
      directObject: remainder.join(" ") || undefined,
      indirectObject: undefined,
      preposition: undefined,
      raw
    };
  }

  const split = splitPreposition(remainder);

  if (verb === "UNLOCK" && split.preposition === "with" && (!split.direct.length || !split.indirect.length)) {
    throw new ParserDiagnosticError({
      code: !split.direct.length ? "missing_direct_object" : "missing_indirect_object",
      verb
    });
  }

  return {
    verb,
    actorId,
    directObject: split.direct.join(" ") || undefined,
    indirectObject: split.indirect.join(" ") || undefined,
    preposition: split.preposition,
    raw
  };
}
