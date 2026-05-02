import type { Intent, ParseConfidence } from "../types";
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
  "onto",
  "through",
  "to",
  "using",
  "with"
]);

function stripStopWords(tokens: string[], dictionary: CompiledAdventureDictionary): string[] {
  return tokens.filter(
    (token) => token === "," || (!dictionary.stopWords.has(token) && !dictionary.noiseWords.has(token))
  );
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
    preposition: tokens[index] === "onto" ? "on" : tokens[index]
  };
}

function stripSentenceWrapper(tokens: string[]): { confidence: ParseConfidence | undefined; tokens: string[] } {
  const wrapperPatterns = [
    ["i", "want", "to"],
    ["i", "would", "like", "to"],
    ["i", "need", "to"],
    ["can", "you"],
    ["could", "you"],
    ["would", "you"]
  ];

  for (const pattern of wrapperPatterns) {
    if (pattern.every((token, index) => tokens[index] === token) && tokens.length > pattern.length) {
      return {
        confidence: "likely",
        tokens: tokens.slice(pattern.length)
      };
    }
  }

  return { confidence: undefined, tokens };
}

function normalizeGerund(token: string): string {
  const gerunds: Record<string, string> = {
    applying: "use",
    attaching: "attach",
    closing: "close",
    crossing: "cross",
    dropping: "drop",
    entering: "go",
    examining: "examine",
    fitting: "fit",
    forcing: "force",
    getting: "get",
    going: "go",
    grabbing: "grab",
    igniting: "ignite",
    inserting: "insert",
    lighting: "light",
    looking: "look",
    moving: "move",
    opening: "open",
    picking: "pick",
    placing: "place",
    prying: "pry",
    pulling: "pull",
    pushing: "push",
    searching: "search",
    shifting: "shift",
    taking: "take",
    turning: "turn",
    unlocking: "unlock",
    using: "use",
    walking: "walk",
    working: "work"
  };

  return gerunds[token] ?? token;
}

function normalizeIntentLabel(
  verb: string,
  directObject: string | undefined,
  preposition: string | undefined,
  indirectObject: string | undefined
): string {
  return [verb, directObject, preposition, indirectObject]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();
}

function intentFromParts(
  verb: Intent["verb"],
  actorId: string | undefined,
  directObject: string | undefined,
  preposition: string | undefined,
  indirectObject: string | undefined,
  raw: string,
  confidence: ParseConfidence | undefined
): Intent {
  const intent: Intent = {
    verb,
    actorId,
    directObject,
    indirectObject,
    preposition,
    raw
  };

  if (confidence) {
    intent.confidence = confidence;
    intent.normalized = normalizeIntentLabel(verb, directObject, preposition, indirectObject);
  }

  return intent;
}

function matchCommandTemplate(
  tokens: string[],
  dictionary: CompiledAdventureDictionary,
  raw: string,
  confidence: ParseConfidence | undefined
): Intent | undefined {
  const normalized = tokens.join(" ");
  const match = dictionary.commandTemplates.find((template) => template.alias === normalized);

  if (!match) {
    return undefined;
  }

  const actorId = match.template.actor
    ? getSingleActorId(normalizeDictionaryPhrase(match.template.actor), dictionary)
    : undefined;

  return intentFromParts(
    match.template.verb,
    actorId,
    match.template.directObject,
    match.template.preposition,
    match.template.indirectObject,
    raw,
    match.template.confidence ?? confidence
  );
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
  const stripped = stripStopWords(rawTokens, dictionary);
  const wrapper = stripSentenceWrapper(stripped);
  const tokens = wrapper.tokens;
  let confidence = wrapper.confidence;

  if (tokens.length === 0) {
    throw new ParserDiagnosticError({ code: "incomplete_command" });
  }

  let actorId: string | undefined;
  let working = [...tokens];
  let templateMatch = matchCommandTemplate(working, dictionary, working.join(" "), confidence);

  if (templateMatch) {
    return templateMatch;
  }

  const firstToken = working[0];
  const secondToken = working[1];
  const thirdToken = working[2];

  if (firstToken && secondToken === "," && getSingleActorId(firstToken, dictionary)) {
    actorId = getSingleActorId(firstToken, dictionary);
    working = working.slice(2);
  } else if (
    ["ask", "have", "order", "tell"].includes(firstToken ?? "") &&
    secondToken &&
    getSingleActorId(secondToken, dictionary) &&
    (thirdToken === "to" || firstToken !== "tell")
  ) {
    actorId = getSingleActorId(secondToken, dictionary);
    working = working.slice(thirdToken === "to" ? 3 : 2);
    confidence ??= "likely";
  } else if (
    firstToken === "send" &&
    secondToken &&
    getSingleActorId(secondToken, dictionary) &&
    thirdToken === "across"
  ) {
    actorId = getSingleActorId(secondToken, dictionary);
    working = ["cross", ...working.slice(3)];
    confidence ??= "likely";
  } else if (
    firstToken &&
    secondToken &&
    getSingleActorId(firstToken, dictionary) &&
    (dictionary.verbAliases.has(normalizeGerund(secondToken)) || dictionary.directionAliases.has(secondToken))
  ) {
    actorId = getSingleActorId(firstToken, dictionary);
    working = working.slice(1);
    confidence ??= "likely";
  }

  const raw = working.join(" ");

  if (working.length === 0) {
    throw new ParserDiagnosticError({ code: "incomplete_command" });
  }

  templateMatch = matchCommandTemplate(working, dictionary, raw, confidence);

  if (templateMatch) {
    return {
      ...templateMatch,
      actorId: templateMatch.actorId ?? actorId
    };
  }

  const soleToken = working[0];

  if (working.length === 1 && soleToken && getSingleActorId(soleToken, dictionary)) {
    return intentFromParts("SWITCH_ACTOR", undefined, soleToken, undefined, undefined, raw, confidence);
  }

  const phraseMatch = matchLeadingPhrase(working, dictionary);

  if (phraseMatch) {
    const remainder = working.slice(phraseMatch.consumed);

    if (phraseMatch.verb === "SWITCH_ACTOR") {
      return intentFromParts(
        phraseMatch.verb,
        undefined,
        remainder.join(" ") || undefined,
        undefined,
        undefined,
        raw,
        confidence
      );
    }

    const split = splitPreposition(remainder);

    return intentFromParts(
      phraseMatch.verb,
      actorId,
      split.direct.join(" ") || undefined,
      split.preposition,
      split.indirect.join(" ") || undefined,
      raw,
      confidence
    );
  }

  const originalCommandHead = working[0];
  const commandHead = originalCommandHead ? normalizeGerund(originalCommandHead) : undefined;
  if (commandHead && originalCommandHead && commandHead !== originalCommandHead) {
    confidence ??= "likely";
  }

  if (!commandHead) {
    throw new ParserDiagnosticError({ code: "incomplete_command" });
  }

  const direction = dictionary.directionAliases.get(commandHead);

  if (direction) {
    return intentFromParts("GO", actorId, direction, undefined, undefined, raw, confidence);
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
    return intentFromParts(
      verb,
      undefined,
      remainder.join(" ") || undefined,
      undefined,
      undefined,
      raw,
      confidence
    );
  }

  const split = splitPreposition(remainder);
  let direct = split.direct;
  let indirect = split.indirect;
  let preposition = split.preposition;

  if (verb === "GO" && direct.length === 0 && indirect.length > 0) {
    direct = indirect;
    indirect = [];
    preposition = undefined;
    confidence ??= "likely";
  }

  if (verb === "UNLOCK" && preposition === "with" && (!direct.length || !indirect.length)) {
    throw new ParserDiagnosticError({
      code: !direct.length ? "missing_direct_object" : "missing_indirect_object",
      verb
    });
  }

  return intentFromParts(
    verb,
    actorId,
    direct.join(" ") || undefined,
    preposition,
    indirect.join(" ") || undefined,
    raw,
    confidence
  );
}
