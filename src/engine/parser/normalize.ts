import type { CanonicalVerb, Intent, ParseConfidence } from "../types";
import type { CompiledAdventureDictionary } from "./dictionary";
import { normalizeDictionaryPhrase } from "./dictionary";
import { ParserDiagnosticError } from "./diagnostics";
import { matchLeadingPhrase } from "./phrases";

export const PREPOSITIONS = new Set([
  "about",
  "across",
  "along",
  "at",
  "behind",
  "beneath",
  "from",
  "in",
  "inside",
  "into",
  "on",
  "onto",
  "over",
  "through",
  "to",
  "toward",
  "towards",
  "under",
  "using",
  "with"
]);

const SENTENCE_WRAPPERS = [
  ["i", "want", "to"],
  ["i", "would", "like", "to"],
  ["i'd", "like", "to"],
  ["i", "need", "to"],
  ["i", "should"],
  ["i", "will"],
  ["i'll"],
  ["we", "should"],
  ["let's"],
  ["lets"],
  ["let", "me"],
  ["let", "us"],
  ["can", "you"],
  ["could", "you"],
  ["would", "you"],
  ["can", "i"],
  ["could", "i"],
  ["try", "to"]
];

const ACTOR_QUESTION_WORDS = new Set(["can", "could", "will", "would", "should", "may"]);
const ACTOR_DIRECTIVES_WITH_TO = new Set(["ask", "get", "tell", "order", "instruct"]);
const ACTOR_DIRECTIVES_BARE = new Set(["have", "make", "let", "order"]);

const GERUNDS: Record<string, string> = {
  applying: "use",
  crossing: "cross",
  entering: "go",
  going: "go",
  igniting: "ignite",
  leaving: "leave",
  lighting: "light",
  prying: "pry",
  taking: "take",
  using: "use"
};

// Multi-word idioms that act as a single particle.
const PARTICLE_PHRASES: Array<{ tokens: string[]; particle: string }> = [
  { tokens: ["out", "of", "way"], particle: "aside" },
  { tokens: ["to", "one", "side"], particle: "aside" },
  { tokens: ["off", "of"], particle: "off" }
];

function collapseParticlePhrases(tokens: string[], particles: string[]): string[] {
  const result: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const phrase = PARTICLE_PHRASES.find((candidate) =>
      candidate.tokens.every((token, offset) => tokens[index + offset] === token)
    );

    if (phrase) {
      particles.push(phrase.particle);
      index += phrase.tokens.length - 1;
      continue;
    }

    result.push(tokens[index]!);
  }

  return result;
}

interface Chunk {
  direct: string[];
  indirect: string[];
  leadingPreposition: string | undefined;
  particles: string[];
  preposition: string | undefined;
}

function stripStopWords(tokens: string[], dictionary: CompiledAdventureDictionary): string[] {
  return tokens.filter(
    (token) => token === "," || (!dictionary.stopWords.has(token) && !dictionary.noiseWords.has(token))
  );
}

function getSingleActorId(
  alias: string | undefined,
  dictionary: CompiledAdventureDictionary
): string | undefined {
  if (!alias) {
    return undefined;
  }

  const matches = dictionary.actorAliasToIds.get(alias) ?? [];

  return matches.length === 1 ? matches[0] : undefined;
}

function stripSentenceWrapper(tokens: string[]): string[] {
  for (const pattern of SENTENCE_WRAPPERS) {
    if (pattern.every((token, index) => tokens[index] === token) && tokens.length > pattern.length) {
      return tokens.slice(pattern.length);
    }
  }

  return tokens;
}

function normalizeGerund(token: string, dictionary: CompiledAdventureDictionary): string {
  if (dictionary.verbAliases.has(token) || !token.endsWith("ing") || token.length < 5) {
    return token;
  }

  const mapped = GERUNDS[token];

  if (mapped) {
    return mapped;
  }

  const stem = token.slice(0, -3);
  const candidates = [stem, `${stem}e`, stem.slice(0, -1)];

  for (const candidate of candidates) {
    if (candidate.length >= 2 && dictionary.verbAliases.has(candidate)) {
      return candidate;
    }
  }

  return token;
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
  confidence: ParseConfidence | undefined,
  particles: string[] = []
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

  if (particles.length > 0) {
    intent.particles = particles;
  }

  return intent;
}

function matchCommandTemplate(
  tokens: string[],
  dictionary: CompiledAdventureDictionary,
  raw: string
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
    match.template.confidence
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

// Only offer a correction for a plausible slip: one edit away, same initial
// letter, and long enough that the match is unlikely to be a different word.
function suggestCommandWord(
  token: string,
  dictionary: CompiledAdventureDictionary
): string | undefined {
  if (token.length < 3) {
    return undefined;
  }

  const candidates = [...dictionary.commandWords].filter(
    (word) => word.length >= 3 && word[0] === token[0] && levenshteinDistance(token, word) === 1
  );

  return candidates.sort((left, right) => left.length - right.length)[0];
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
    dictionary.groupAliasToIds.has(normalized) ||
    dictionary.sceneryPhrases.has(normalized)
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

function stripParticles(slot: string[], particles: string[], dictionary: CompiledAdventureDictionary): void {
  while (slot.length > 1 && dictionary.particles.has(slot[slot.length - 1]!)) {
    particles.push(slot.pop()!);
  }

  while (slot.length > 1 && dictionary.particles.has(slot[0]!)) {
    particles.push(slot.shift()!);
  }
}

// Split the words after the verb into a direct phrase, an optional
// preposition, an indirect phrase, and any loose particles ("aside", "open").
export function chunkRemainder(rawTokens: string[], dictionary: CompiledAdventureDictionary): Chunk {
  const direct: string[] = [];
  const indirect: string[] = [];
  const particles: string[] = [];
  const tokens = collapseParticlePhrases(rawTokens, particles);
  let leadingPreposition: string | undefined;
  let preposition: string | undefined;
  let slot = direct;

  tokens.forEach((token, index) => {
    const isLast = index === tokens.length - 1;

    if (PREPOSITIONS.has(token)) {
      if (slot === direct && direct.length === 0 && leadingPreposition === undefined) {
        leadingPreposition = token;
        return;
      }

      if (isLast) {
        particles.push(token);
        return;
      }

      if (preposition === undefined) {
        preposition = token === "onto" ? "on" : token;
        slot = indirect;
        return;
      }
    }

    slot.push(token);
  });

  // "unlock with the key": the instrument came first and the object is missing.
  if ((leadingPreposition === "with" || leadingPreposition === "using") && preposition === undefined) {
    indirect.push(...direct);
    direct.length = 0;
    preposition = leadingPreposition;
  }

  stripParticles(direct, particles, dictionary);
  stripParticles(indirect, particles, dictionary);

  return { direct, indirect, leadingPreposition, particles, preposition };
}

function refineVerbByParticles(verb: CanonicalVerb, particles: string[]): CanonicalVerb {
  if (["PUSH", "PULL", "MOVE", "BREAK", "TAKE"].includes(verb)) {
    if (particles.includes("open")) {
      return "OPEN";
    }

    if (particles.includes("closed") || particles.includes("shut")) {
      return "CLOSE";
    }
  }

  return verb;
}

interface ActorPrefix {
  actorId: string | undefined;
  tokens: string[];
  verbOverride: CanonicalVerb | undefined;
}

function extractActorPrefix(tokens: string[], dictionary: CompiledAdventureDictionary): ActorPrefix {
  const [first, second, third] = tokens;
  const none: ActorPrefix = { actorId: undefined, tokens, verbOverride: undefined };

  if (!first) {
    return none;
  }

  // "nessa, pick lock"
  if (second === "," && getSingleActorId(first, dictionary)) {
    return { actorId: getSingleActorId(first, dictionary), tokens: tokens.slice(2), verbOverride: undefined };
  }

  const secondActor = getSingleActorId(second, dictionary);

  // "tell nessa to pick lock", "ask nessa to cross", "get nessa to ..."
  if (ACTOR_DIRECTIVES_WITH_TO.has(first) && secondActor && third === "to") {
    return { actorId: secondActor, tokens: tokens.slice(3), verbOverride: undefined };
  }

  // "ask nessa about the mine" -> talk to nessa
  if (first === "ask" && secondActor) {
    return { actorId: undefined, tokens: [second!, ...tokens.slice(2)], verbOverride: "TALK" };
  }

  // "have nessa pick the lock", "make bram move the beam"
  if (ACTOR_DIRECTIVES_BARE.has(first) && secondActor && third) {
    return { actorId: secondActor, tokens: tokens.slice(2), verbOverride: undefined };
  }

  // "send nessa across the ledge"
  if (first === "send" && secondActor && third === "across") {
    return { actorId: secondActor, tokens: ["cross", ...tokens.slice(3)], verbOverride: undefined };
  }

  // "can nessa cross the ledge"
  if (ACTOR_QUESTION_WORDS.has(first) && secondActor && third) {
    return { actorId: secondActor, tokens: tokens.slice(2), verbOverride: undefined };
  }

  // "nessa pick the lock" (missing comma)
  const firstActor = getSingleActorId(first, dictionary);

  if (
    firstActor &&
    second &&
    (dictionary.verbAliases.has(normalizeGerund(second, dictionary)) || dictionary.directionAliases.has(second))
  ) {
    return { actorId: firstActor, tokens: tokens.slice(1), verbOverride: undefined };
  }

  return none;
}

export function normalizeTokens(
  rawTokens: string[],
  dictionary: CompiledAdventureDictionary
): Intent {
  const stripped = stripStopWords(rawTokens, dictionary);
  const tokens = stripSentenceWrapper(stripped);

  if (tokens.length === 0) {
    throw new ParserDiagnosticError({ code: "incomplete_command" });
  }

  let templateMatch = matchCommandTemplate(tokens, dictionary, tokens.join(" "));

  if (templateMatch) {
    return templateMatch;
  }

  const prefix = extractActorPrefix(tokens, dictionary);
  const actorId = prefix.actorId;
  const working = prefix.tokens;
  const raw = working.join(" ");

  if (working.length === 0) {
    throw new ParserDiagnosticError({ code: "incomplete_command" });
  }

  templateMatch = matchCommandTemplate(working, dictionary, raw);

  if (templateMatch) {
    return {
      ...templateMatch,
      actorId: templateMatch.actorId ?? actorId
    };
  }

  const soleToken = working[0];

  if (working.length === 1 && soleToken && getSingleActorId(soleToken, dictionary) && !prefix.verbOverride) {
    return intentFromParts("SWITCH_ACTOR", undefined, soleToken, undefined, undefined, raw, undefined);
  }

  let verb: CanonicalVerb | undefined = prefix.verbOverride;
  let remainder = working;
  let headToken: string | undefined;

  if (!verb) {
    const phraseMatch = matchLeadingPhrase(working, dictionary);

    if (phraseMatch) {
      verb = phraseMatch.verb;
      remainder = working.slice(phraseMatch.consumed);
      headToken = working.slice(0, phraseMatch.consumed).join(" ");
    } else {
      const originalHead = working[0]!;
      const commandHead = normalizeGerund(originalHead, dictionary);
      const direction = dictionary.directionAliases.get(commandHead);

      if (direction) {
        return intentFromParts("GO", actorId, direction, undefined, undefined, raw, undefined);
      }

      verb = dictionary.verbAliases.get(commandHead);
      headToken = commandHead;
      remainder = working.slice(1);

      if (!verb) {
        const nounPhrase = working.join(" ");

        if (isPlausibleReferencePhrase(nounPhrase, dictionary)) {
          throw new ParserDiagnosticError({ code: "noun_only", nounPhrase });
        }

        const suggestion = suggestCommandWord(commandHead, dictionary);

        throw new ParserDiagnosticError(
          suggestion
            ? { code: "unknown_verb", nounPhrase: commandHead, suggestion }
            : { code: "unknown_verb", nounPhrase: commandHead }
        );
      }
    }
  }

  if (verb === "SWITCH_ACTOR") {
    return intentFromParts(verb, undefined, remainder.join(" ") || undefined, undefined, undefined, raw, undefined);
  }

  const chunk = chunkRemainder(remainder, dictionary);
  let direct = chunk.direct;
  let indirect = chunk.indirect;
  let preposition = chunk.preposition;
  let confidence: ParseConfidence | undefined;

  // "use the crowbar to lever the boards" -> lever the boards with the crowbar
  const purposeVerb = indirect[0] ? dictionary.verbAliases.get(normalizeGerund(indirect[0], dictionary)) : undefined;

  if (preposition === "to" && purposeVerb && (verb === "USE" || verb === "TAKE") && direct.length > 0) {
    const purposeChunk = chunkRemainder(indirect.slice(1), dictionary);
    chunk.particles.push(...purposeChunk.particles);
    verb = purposeVerb;
    indirect = direct;
    direct = purposeChunk.direct;
    preposition = "with";
    confidence = "likely";
  }

  verb = refineVerbByParticles(verb, chunk.particles);

  if (verb === "GO") {
    if (direct.length === 0 && indirect.length > 0) {
      direct = indirect;
      indirect = [];
      preposition = undefined;
    }

    if (direct.length === 0) {
      if (headToken === "leave" || headToken === "exit" || headToken === "get out") {
        direct = ["out"];
      } else if (headToken === "return" || headToken === "back") {
        direct = ["back"];
      } else if (headToken === "enter") {
        direct = ["in"];
      } else if (chunk.leadingPreposition && dictionary.directionAliases.has(chunk.leadingPreposition)) {
        direct = [chunk.leadingPreposition];
      } else {
        const particleDirection = chunk.particles.find((particle) => dictionary.directionAliases.has(particle));

        if (particleDirection) {
          direct = [particleDirection];
        }
      }
    }
  }

  if (verb === "CLIMB") {
    const target = direct.join(" ");
    const particleDirection =
      chunk.particles.find((particle) => dictionary.directionAliases.has(particle)) ??
      (chunk.leadingPreposition && dictionary.directionAliases.has(chunk.leadingPreposition)
        ? chunk.leadingPreposition
        : undefined);

    if (direct.length === 0 && particleDirection) {
      verb = "GO";
      direct = [particleDirection];
    } else if (dictionary.directionAliases.has(target)) {
      verb = "GO";
    }
  }

  if (verb === "LOOK" && direct.length === 1 && dictionary.directionAliases.has(direct[0]!)) {
    direct = [];
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
    confidence,
    chunk.particles
  );
}
