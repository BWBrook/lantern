import { getRoomById, getVisibleItems } from "../adventure";
import { isItemLocked, isItemOpen } from "../state";
import type {
  AdventureDefinition,
  AdventureItem,
  CanonicalVerb,
  Direction,
  GameState,
  Intent,
  ResolvedIntent
} from "../types";
import { getCompiledDictionary, normalizeDictionaryPhrase, phraseTokens } from "./dictionary";
import { ParserDiagnostic, ParserDiagnosticError } from "./diagnostics";

type ObjectRole = "directObject" | "indirectObject";

export const SCENERY_PREFIX = "scenery:";

export function sceneryRef(roomId: string, index: number): string {
  return `${SCENERY_PREFIX}${roomId}:${index}`;
}

export function isSceneryRef(id: string | undefined): boolean {
  return Boolean(id?.startsWith(SCENERY_PREFIX));
}

interface Named {
  id: string;
  name: string;
}

function uniqById<T extends { id: string }>(values: T[]): T[] {
  const seen = new Set<string>();
  const results: T[] = [];

  for (const value of values) {
    if (!seen.has(value.id)) {
      seen.add(value.id);
      results.push(value);
    }
  }

  return results;
}

function formatList(values: string[]): string {
  if (values.length <= 1) {
    return values[0] ?? "";
  }

  if (values.length === 2) {
    return `${values[0]} or ${values[1]}`;
  }

  return `${values.slice(0, -1).join(", ")}, or ${values[values.length - 1]}`;
}

function itemPhrases(adventure: AdventureDefinition, itemId: string): string[] {
  return getCompiledDictionary(adventure).itemPhrasesById.get(itemId) ?? [];
}

function actorPhrases(adventure: AdventureDefinition, actorId: string): string[] {
  return getCompiledDictionary(adventure).actorPhrasesById.get(actorId) ?? [];
}

function exactMatches<T extends { id: string }>(
  candidates: T[],
  phrasesOf: (id: string) => string[],
  query: string
): T[] {
  return candidates.filter((candidate) => phrasesOf(candidate.id).includes(query));
}

// A phrase names a thing when either every query word appears in one of its
// aliases ("brass key" for "brass office key"), or an alias is wholly present
// in the query and the leftover words are only particles or known adjectives
// ("fallen beam aside" for "beam").
function tolerantMatches<T extends { id: string }>(
  adventure: AdventureDefinition,
  candidates: T[],
  phrasesOf: (id: string) => string[],
  queryTokens: string[],
  extraLeftovers: (id: string) => Set<string>
): T[] {
  const dictionary = getCompiledDictionary(adventure);
  let best: { score: number; matches: T[] } | undefined;

  for (const candidate of candidates) {
    let candidateScore = 0;

    for (const phrase of phrasesOf(candidate.id)) {
      const aliasTokens = phraseTokens(phrase);
      const querySubset = queryTokens.every((token) => aliasTokens.includes(token));
      const aliasSubset = aliasTokens.every((token) => queryTokens.includes(token));

      if (querySubset) {
        candidateScore = Math.max(candidateScore, 100 + queryTokens.length);
        continue;
      }

      if (aliasSubset) {
        const allowed = extraLeftovers(candidate.id);
        const leftovers = queryTokens.filter((token) => !aliasTokens.includes(token));

        if (leftovers.every((token) => dictionary.particles.has(token) || allowed.has(token))) {
          candidateScore = Math.max(candidateScore, aliasTokens.length);
        }
      }
    }

    if (candidateScore === 0) {
      continue;
    }

    if (!best || candidateScore > best.score) {
      best = { score: candidateScore, matches: [candidate] };
    } else if (candidateScore === best.score) {
      best.matches.push(candidate);
    }
  }

  return best?.matches ?? [];
}

function itemLeftovers(adventure: AdventureDefinition): (id: string) => Set<string> {
  const dictionary = getCompiledDictionary(adventure);

  return (id) => dictionary.itemAdjectivesById.get(id) ?? new Set();
}

function noLeftovers(): Set<string> {
  return new Set();
}

function getRoomItems(adventure: AdventureDefinition, state: GameState): AdventureItem[] {
  return adventure.content.items.filter((item) => (state.itemLocations[item.id] ?? item.location) === state.currentRoomId);
}

function getSceneryEntries(adventure: AdventureDefinition, state: GameState): Named[] {
  const room = getRoomById(adventure, state.currentRoomId);

  return (room.scenery ?? []).map((scenery, index) => ({
    id: sceneryRef(room.id, index),
    name: scenery.nouns[0] ?? "that"
  }));
}

function sceneryPhrasesOf(adventure: AdventureDefinition, state: GameState): (id: string) => string[] {
  const compiled = getCompiledDictionary(adventure);
  const entries = compiled.sceneryByRoom.get(state.currentRoomId) ?? [];

  return (id) => entries.find((entry) => sceneryRef(entry.roomId, entry.index) === id)?.phrases ?? [];
}

// Items the player has actually encountered: in a visited room, carried, or
// attached to something. Hidden and never-seen items stay unknown.
function getKnownOffstageItems(adventure: AdventureDefinition, state: GameState): AdventureItem[] {
  const visible = new Set(getVisibleItems(adventure, state).map((item) => item.id));

  return adventure.content.items.filter((item) => {
    if (visible.has(item.id)) {
      return false;
    }

    const location = state.itemLocations[item.id] ?? item.location;

    if (location === "hidden") {
      return false;
    }

    if (location === "inventory" || location.startsWith("attached:")) {
      return true;
    }

    return (state.visitCounts[location] ?? 0) > 0;
  });
}

function visibleGroupItems(
  adventure: AdventureDefinition,
  visibleItems: AdventureItem[],
  normalized: string,
  queryTokens: string[]
): AdventureItem[] {
  const compiled = getCompiledDictionary(adventure);
  const results: AdventureItem[] = [];

  for (const [alias, itemIds] of compiled.groupAliasToIds.entries()) {
    const aliasTokens = phraseTokens(alias);
    const matchesExact = alias === normalized;
    const matchesSuffix =
      queryTokens.length > aliasTokens.length &&
      aliasTokens.every(
        (token, index) => queryTokens[queryTokens.length - aliasTokens.length + index] === token
      );

    if (!matchesExact && !matchesSuffix) {
      continue;
    }

    for (const itemId of itemIds) {
      const item = visibleItems.find((candidate) => candidate.id === itemId);

      if (
        item &&
        (matchesExact ||
          itemPhrases(adventure, item.id).some((phrase) => {
            const phraseWords = phraseTokens(phrase);
            return queryTokens.every((token) => phraseWords.includes(token));
          }))
      ) {
        results.push(item);
      }
    }
  }

  return uniqById(results);
}

function throwAmbiguous(phrase: string, candidates: Named[], objectRole: ObjectRole): never {
  const names = candidates.map((candidate) => candidate.name.toLowerCase());

  throw new ParserDiagnosticError(
    {
      code: "ambiguous_noun",
      candidateIds: candidates.map((candidate) => candidate.id),
      candidates: names,
      nounPhrase: phrase,
      objectRole
    },
    `Which ${phrase.toLowerCase()} do you mean: ${formatList(names)}?`
  );
}

function throwNotVisible(phrase: string, knownItems: AdventureItem[]): never {
  if (knownItems.length === 1) {
    throw new ParserDiagnosticError(
      {
        code: "noun_not_visible",
        nounPhrase: phrase,
        candidates: [knownItems[0]!.name]
      },
      `You know about the ${knownItems[0]!.name.toLowerCase()}, but it is not here.`
    );
  }

  throw new ParserDiagnosticError(
    {
      code: "noun_not_visible",
      nounPhrase: phrase,
      candidates: knownItems.map((item) => item.name)
    },
    `You cannot see any ${phrase.toLowerCase()} here.`
  );
}

export function resolveActor(adventure: AdventureDefinition, phrase: string | undefined): string | undefined {
  if (!phrase) {
    return undefined;
  }

  const normalized = normalizeDictionaryPhrase(phrase);
  const exact = exactMatches(adventure.content.actors, (id) => actorPhrases(adventure, id), normalized);

  if (exact.length === 1) {
    return exact[0]!.id;
  }

  const tolerant = tolerantMatches(
    adventure,
    adventure.content.actors,
    (id) => actorPhrases(adventure, id),
    phraseTokens(normalized),
    noLeftovers
  );

  return tolerant.length === 1 ? tolerant[0]!.id : undefined;
}

function resolvePronoun(state: GameState, phrase: string): string | undefined {
  if (phrase === "it") {
    return state.pronouns.it;
  }

  if (phrase === "them") {
    if ((state.pronouns.them ?? []).length === 1) {
      return state.pronouns.them?.[0];
    }

    throw new ParserDiagnosticError(
      {
        code: "ambiguous_noun",
        nounPhrase: "them"
      },
      "You'll need to be more specific about them."
    );
  }

  return undefined;
}

export interface ResolveOptions {
  allowActorTargets?: boolean;
  allowScenery?: boolean;
  objectRole?: ObjectRole;
}

export function resolveObjectId(
  adventure: AdventureDefinition,
  state: GameState,
  phrase: string | undefined,
  options: ResolveOptions = {}
): string | undefined {
  if (!phrase) {
    return undefined;
  }

  const objectRole = options.objectRole ?? "directObject";
  const allowScenery = options.allowScenery ?? true;
  const normalized = normalizeDictionaryPhrase(phrase);
  const pronoun = resolvePronoun(state, normalized);

  if (pronoun) {
    return pronoun;
  }

  const queryTokens = phraseTokens(normalized);
  const roomItems = getRoomItems(adventure, state);
  const visibleItems = getVisibleItems(adventure, state);
  const actors = adventure.content.actors;
  const scenery = getSceneryEntries(adventure, state);
  const sceneryPhrases = sceneryPhrasesOf(adventure, state);
  const itemPhrasesOf = (id: string) => itemPhrases(adventure, id);
  const actorPhrasesOf = (id: string) => actorPhrases(adventure, id);

  const pick = (candidates: Named[]): string | undefined => {
    if (candidates.length > 1) {
      throwAmbiguous(phrase, candidates, objectRole);
    }

    return candidates[0]?.id;
  };

  // 1. Exact alias matches, nearest scope first.
  const exactRoom = pick(exactMatches(roomItems, itemPhrasesOf, normalized));
  if (exactRoom) return exactRoom;

  const exactCarried = pick(exactMatches(visibleItems.filter((item) => !roomItems.includes(item)), itemPhrasesOf, normalized));
  if (exactCarried) return exactCarried;

  if (options.allowActorTargets) {
    const exactActor = pick(exactMatches(actors, actorPhrasesOf, normalized));
    if (exactActor) return exactActor;
  }

  if (allowScenery) {
    const exactScenery = pick(exactMatches(scenery, sceneryPhrases, normalized));
    if (exactScenery) return exactScenery;
  }

  // 2. Shared group nouns ("door") among visible things.
  const grouped = pick(visibleGroupItems(adventure, visibleItems, normalized, queryTokens));
  if (grouped) return grouped;

  // 3. Tolerant matches: partial noun phrases and trailing particles.
  const tolerantVisible = pick(tolerantMatches(adventure, visibleItems, itemPhrasesOf, queryTokens, itemLeftovers(adventure)));
  if (tolerantVisible) return tolerantVisible;

  if (options.allowActorTargets) {
    const tolerantActor = pick(tolerantMatches(adventure, actors, actorPhrasesOf, queryTokens, noLeftovers));
    if (tolerantActor) return tolerantActor;
  }

  if (allowScenery) {
    const tolerantScenery = pick(tolerantMatches(adventure, scenery, sceneryPhrases, queryTokens, noLeftovers));
    if (tolerantScenery) return tolerantScenery;
  }

  // 4. Known but elsewhere.
  const offstage = getKnownOffstageItems(adventure, state);
  const exactOffstage = exactMatches(offstage, itemPhrasesOf, normalized);
  const offstageMatches =
    exactOffstage.length > 0
      ? exactOffstage
      : tolerantMatches(adventure, offstage, itemPhrasesOf, queryTokens, itemLeftovers(adventure));

  if (offstageMatches.length > 0) {
    throwNotVisible(phrase, offstageMatches);
  }

  throw new ParserDiagnosticError(
    {
      code: "noun_not_visible",
      nounPhrase: phrase
    },
    `You cannot see any ${phrase.toLowerCase()} here.`
  );
}

function hasAffordance(
  adventure: AdventureDefinition,
  state: GameState,
  item: AdventureItem,
  verb: CanonicalVerb,
  role: ObjectRole
): boolean {
  const hooks = item.hooks ?? {};

  switch (verb) {
    case "CROSS":
      return Boolean(hooks.cross);
    case "TURN":
      return Boolean(hooks.turn);
    case "LIGHT":
      return Boolean(hooks.light);
    case "SEARCH":
      return Boolean(hooks.search);
    case "MOVE":
    case "PUSH":
    case "PULL":
      return Boolean(hooks.move);
    case "UNLOCK":
      return Boolean(hooks.unlock) || (Boolean(item.lockable) && isItemLocked(adventure, state, item.id));
    case "OPEN":
      return Boolean(hooks.open) || (Boolean(item.openable) && !isItemOpen(adventure, state, item.id));
    case "CLOSE":
      return Boolean(item.openable) && isItemOpen(adventure, state, item.id);
    case "ATTACH":
      return role === "indirectObject" && Boolean(hooks.attach);
    default:
      return false;
  }
}

// When the verb names no object but exactly one visible thing answers to it,
// take that thing and say so.
export function inferSoleObject(
  adventure: AdventureDefinition,
  state: GameState,
  verb: CanonicalVerb,
  role: ObjectRole
): string | undefined {
  const candidates = getVisibleItems(adventure, state).filter((item) =>
    hasAffordance(adventure, state, item, verb, role)
  );

  return candidates.length === 1 ? candidates[0]!.id : undefined;
}

export type Destination = Direction | "back";

export function resolveDestination(
  adventure: AdventureDefinition,
  state: GameState,
  phrase: string
): Destination | undefined {
  const compiled = getCompiledDictionary(adventure);
  const normalized = normalizeDictionaryPhrase(phrase);
  const direction = compiled.directionAliases.get(normalized);

  if (direction) {
    return direction;
  }

  if (normalized === "back") {
    return "back";
  }

  const queryTokens = phraseTokens(normalized);
  const leadingDirection = queryTokens[0] ? compiled.directionAliases.get(queryTokens[0]) : undefined;

  if (leadingDirection) {
    return leadingDirection;
  }

  const room = getRoomById(adventure, state.currentRoomId);
  const currentTitle = compiled.roomTitleTokensById.get(room.id) ?? [];

  if (queryTokens.every((token) => currentTitle.includes(token))) {
    return "out";
  }

  const matches: Direction[] = [];

  for (const exit of room.exits) {
    if (exit.hiddenUnlessFlags?.some((flagId) => !state.flags.includes(flagId))) {
      continue;
    }

    const titleTokens = compiled.roomTitleTokensById.get(exit.targetRoomId) ?? [];
    const titleMatch =
      queryTokens.every((token) => titleTokens.includes(token)) ||
      (titleTokens.length > 0 && titleTokens.every((token) => queryTokens.includes(token)));
    const viaMatch = exit.viaItemId
      ? itemPhrases(adventure, exit.viaItemId).some((alias) => {
          const aliasTokens = phraseTokens(alias);
          return (
            alias === normalized ||
            queryTokens.every((token) => aliasTokens.includes(token)) ||
            aliasTokens.every((token) => queryTokens.includes(token))
          );
        })
      : false;

    if (titleMatch || viaMatch) {
      matches.push(exit.direction);
    }
  }

  const unique = [...new Set(matches)];

  if (unique.length > 1) {
    throw new ParserDiagnosticError(
      { code: "ambiguous_noun", nounPhrase: phrase },
      `More than one way here could be "${phrase}". Try a compass direction.`
    );
  }

  return unique[0];
}

function itemSuggestionVerbs(item: AdventureItem): CanonicalVerb[] {
  const verbs: CanonicalVerb[] = ["EXAMINE"];

  if (item.portable !== false && !item.scenery) {
    verbs.push("TAKE");
  }

  if (item.openable) {
    verbs.push("OPEN");
  }

  if (item.lockable) {
    verbs.push("UNLOCK");
  }

  if (item.hooks?.light) {
    verbs.push("LIGHT");
  }

  if (item.hooks?.move) {
    verbs.push("MOVE");
  }

  if (item.hooks?.search) {
    verbs.push("SEARCH");
  }

  if (item.hooks?.turn || item.hooks?.use) {
    verbs.push("TURN");
  }

  if (item.hooks?.cross) {
    verbs.push("CROSS");
  }

  return [...new Set(verbs)];
}

export function describeNounOnlyPrompt(
  adventure: AdventureDefinition,
  state: GameState,
  phrase: string
): string {
  let resolved: string | undefined;

  try {
    resolved = resolveObjectId(adventure, state, phrase, { allowActorTargets: true });
  } catch (error) {
    if (error instanceof ParserDiagnosticError) {
      return error.message;
    }

    throw error;
  }

  if (!resolved) {
    return `Try EXAMINE ${phrase.toUpperCase()}.`;
  }

  const item = adventure.content.items.find((candidate) => candidate.id === resolved);

  if (item) {
    const suggestions = itemSuggestionVerbs(item)
      .slice(0, 3)
      .map((verb) => `${verb} ${phrase.toUpperCase()}`);

    return `Try ${formatList(suggestions)}.`;
  }

  if (adventure.content.actors.some((actor) => actor.id === resolved)) {
    return `Try EXAMINE ${phrase.toUpperCase()} or BE ${phrase.toUpperCase()}.`;
  }

  return `Try EXAMINE ${phrase.toUpperCase()}.`;
}

export function formatParserDiagnosticMessage(
  diagnostic: ParserDiagnostic,
  adventure: AdventureDefinition,
  state: GameState
): string {
  if (diagnostic.code === "noun_only" && diagnostic.nounPhrase) {
    return describeNounOnlyPrompt(adventure, state, diagnostic.nounPhrase);
  }

  return "";
}

function withConfidence(resolved: ResolvedIntent, intent: Intent, likely: boolean): ResolvedIntent {
  if (likely) {
    resolved.confidence = "likely";
  } else if (intent.confidence) {
    resolved.confidence = intent.confidence;
  }

  if (intent.normalized) {
    resolved.normalized = intent.normalized;
  }

  return resolved;
}

const OBJECT_FREE_VERBS = new Set<CanonicalVerb>([
  "GIVE",
  "HELP",
  "INVENTORY",
  "LISTEN",
  "LOAD",
  "LOOK",
  "SAVE",
  "SWIM",
  "WAIT"
]);

export function resolveIntent(
  adventure: AdventureDefinition,
  state: GameState,
  intent: Intent
): ResolvedIntent {
  const base = {
    verb: intent.verb,
    preposition: intent.preposition,
    raw: intent.raw
  };

  if (intent.verb === "SWITCH_ACTOR") {
    const actorId = intent.directObject ? resolveActor(adventure, intent.directObject) : undefined;

    if (intent.directObject && !actorId) {
      throw new ParserDiagnosticError(
        {
          code: "noun_not_visible",
          nounPhrase: intent.directObject
        },
        "You can only switch to a known actor."
      );
    }

    return withConfidence(
      {
        ...base,
        actorId: actorId ?? state.activeActorId,
        directObjectId: actorId,
        indirectObjectId: undefined,
        preposition: undefined
      },
      intent,
      false
    );
  }

  const actorId = intent.actorId ?? state.activeActorId;

  if (intent.verb === "GO") {
    // "crawl out to the road": an explicit destination beats a relative word.
    const explicit =
      intent.indirectObject && (!intent.directObject || ["out", "in", "back"].includes(intent.directObject))
        ? resolveDestination(adventure, state, intent.indirectObject)
        : undefined;
    const destination =
      explicit ?? (intent.directObject ? resolveDestination(adventure, state, intent.directObject) : undefined);

    // "walk along the ledge": going via a crossable thing is crossing it.
    if (!destination && intent.directObject) {
      let crossable: string | undefined;

      try {
        crossable = resolveObjectId(adventure, state, intent.directObject, { allowScenery: false });
      } catch {
        crossable = undefined;
      }

      const item = crossable ? adventure.content.items.find((candidate) => candidate.id === crossable) : undefined;

      if (item?.hooks?.cross) {
        return withConfidence(
          { ...base, verb: "CROSS", actorId, directObjectId: item.id, indirectObjectId: undefined, preposition: undefined },
          intent,
          true
        );
      }
    }

    return withConfidence(
      {
        ...base,
        actorId,
        directObjectId: destination ?? intent.directObject,
        indirectObjectId: undefined,
        preposition: undefined
      },
      intent,
      false
    );
  }

  if (intent.verb === "TALK") {
    const target = resolveActor(adventure, intent.directObject) ?? resolveActor(adventure, intent.indirectObject);

    return withConfidence(
      {
        ...base,
        actorId,
        directObjectId: target,
        indirectObjectId: undefined
      },
      intent,
      false
    );
  }

  if (OBJECT_FREE_VERBS.has(intent.verb) && !intent.directObject) {
    return withConfidence(
      { ...base, actorId, directObjectId: undefined, indirectObjectId: undefined },
      intent,
      false
    );
  }

  let inferred = false;
  let directObjectId = resolveObjectId(adventure, state, intent.directObject, {
    allowActorTargets: intent.verb === "EXAMINE" || intent.verb === "SEARCH",
    objectRole: "directObject"
  });
  // "take the crowbar from the wreckage": the source is colour, not a target.
  const ignoresIndirect = intent.verb === "TAKE" || intent.verb === "DROP" || intent.verb === "EXAMINE";
  let indirectObjectId = ignoresIndirect
    ? undefined
    : resolveObjectId(adventure, state, intent.indirectObject, {
        allowScenery: false,
        objectRole: "indirectObject"
      });

  if (!directObjectId && intent.verb !== "ATTACH") {
    directObjectId = inferSoleObject(adventure, state, intent.verb, "directObject");
    inferred = Boolean(directObjectId);
  }

  if (intent.verb === "ATTACH" && directObjectId && !indirectObjectId) {
    indirectObjectId = inferSoleObject(adventure, state, intent.verb, "indirectObject");
    inferred = inferred || Boolean(indirectObjectId);
  }

  return withConfidence(
    {
      ...base,
      actorId,
      directObjectId,
      indirectObjectId,
      preposition: intent.preposition ?? (indirectObjectId && intent.verb === "ATTACH" ? "to" : undefined)
    },
    intent,
    inferred
  );
}
