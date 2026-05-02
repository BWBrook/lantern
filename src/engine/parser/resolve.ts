import type {
  AdventureActor,
  AdventureDefinition,
  AdventureItem,
  CanonicalVerb,
  GameState,
  Intent,
  ResolvedIntent
} from "../types";
import { getCompiledDictionary, normalizeDictionaryPhrase } from "./dictionary";
import { ParserDiagnostic, ParserDiagnosticError } from "./diagnostics";

interface PhraseInspection {
  inventoryItems: AdventureItem[];
  knownItems: AdventureItem[];
  roomItems: AdventureItem[];
  visibleActors: AdventureActor[];
  visibleGroupItems: AdventureItem[];
}

function getRoomItems(adventure: AdventureDefinition, state: GameState): AdventureItem[] {
  return adventure.content.items.filter((item) => (state.itemLocations[item.id] ?? item.location) === state.currentRoomId);
}

function getInventoryItems(adventure: AdventureDefinition, state: GameState): AdventureItem[] {
  return adventure.content.items.filter((item) => state.inventory.includes(item.id));
}

function getVisibleActors(adventure: AdventureDefinition): AdventureActor[] {
  return adventure.content.actors;
}

function tokenizePhrase(phrase: string): string[] {
  return normalizeDictionaryPhrase(phrase).split(" ").filter(Boolean);
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

function phraseMatchesExactly(phrases: string[], query: string): boolean {
  return phrases.includes(query);
}

function phraseMatchesBySubset(phrases: string[], queryTokens: string[]): boolean {
  return phrases.some((phrase) => {
    const phraseTokens = tokenizePhrase(phrase);

    return queryTokens.every((token) => phraseTokens.includes(token));
  });
}

function actorPhrases(adventure: AdventureDefinition, actorId: string): string[] {
  return getCompiledDictionary(adventure).actorPhrasesById.get(actorId) ?? [];
}

function itemPhrases(adventure: AdventureDefinition, itemId: string): string[] {
  return getCompiledDictionary(adventure).itemPhrasesById.get(itemId) ?? [];
}

function exactItemMatches(
  adventure: AdventureDefinition,
  items: AdventureItem[],
  query: string
): AdventureItem[] {
  return items.filter((item) => phraseMatchesExactly(itemPhrases(adventure, item.id), query));
}

function subsetItemMatches(
  adventure: AdventureDefinition,
  items: AdventureItem[],
  queryTokens: string[]
): AdventureItem[] {
  return items.filter((item) => phraseMatchesBySubset(itemPhrases(adventure, item.id), queryTokens));
}

function exactActorMatches(
  adventure: AdventureDefinition,
  actors: AdventureActor[],
  query: string
): AdventureActor[] {
  return actors.filter((actor) => phraseMatchesExactly(actorPhrases(adventure, actor.id), query));
}

function subsetActorMatches(
  adventure: AdventureDefinition,
  actors: AdventureActor[],
  queryTokens: string[]
): AdventureActor[] {
  return actors.filter((actor) => phraseMatchesBySubset(actorPhrases(adventure, actor.id), queryTokens));
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

function inspectPhrase(
  adventure: AdventureDefinition,
  state: GameState,
  phrase: string
): PhraseInspection {
  const compiled = getCompiledDictionary(adventure);
  const normalized = normalizeDictionaryPhrase(phrase);
  const queryTokens = tokenizePhrase(normalized);
  const roomItems = getRoomItems(adventure, state);
  const inventoryItems = getInventoryItems(adventure, state);
  const visibleActors = getVisibleActors(adventure);
  const visibleItemIds = new Set([...roomItems, ...inventoryItems].map((item) => item.id));
  const knownItems = adventure.content.items.filter((item) => !visibleItemIds.has(item.id));
  const visibleGroupItems: AdventureItem[] = [];

  for (const [alias, itemIds] of compiled.groupAliasToIds.entries()) {
    const aliasTokens = tokenizePhrase(alias);
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
      const item = [...roomItems, ...inventoryItems].find((candidate) => candidate.id === itemId);

      if (
        item &&
        (matchesExact || phraseMatchesBySubset(itemPhrases(adventure, item.id), queryTokens))
      ) {
        visibleGroupItems.push(item);
      }
    }
  }

  return {
    inventoryItems,
    knownItems,
    roomItems,
    visibleActors,
    visibleGroupItems: uniqById(visibleGroupItems)
  };
}

function throwAmbiguous(
  phrase: string,
  candidates: Array<{ id: string; name: string }>,
  objectRole: "directObject" | "indirectObject"
): never {
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
      `You know about ${knownItems[0]!.name.toLowerCase()}, but you cannot see it here.`
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

function resolveActor(adventure: AdventureDefinition, phrase: string | undefined): string | undefined {
  if (!phrase) {
    return undefined;
  }

  const normalized = normalizeDictionaryPhrase(phrase);
  const exact = exactActorMatches(adventure, adventure.content.actors, normalized);

  if (exact.length === 1) {
    return exact[0]!.id;
  }

  return undefined;
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

export function resolveObjectId(
  adventure: AdventureDefinition,
  state: GameState,
  phrase: string | undefined,
  allowActorTargets: boolean,
  objectRole: "directObject" | "indirectObject" = "directObject"
): string | undefined {
  if (!phrase) {
    return undefined;
  }

  const normalized = normalizeDictionaryPhrase(phrase);
  const pronoun = resolvePronoun(state, normalized);

  if (pronoun) {
    return pronoun;
  }

  const queryTokens = tokenizePhrase(normalized);
  const inspection = inspectPhrase(adventure, state, normalized);
  const exactRoomItems = exactItemMatches(adventure, inspection.roomItems, normalized);

  if (exactRoomItems.length > 1) {
    throwAmbiguous(phrase, exactRoomItems, objectRole);
  }

  if (exactRoomItems.length === 1) {
    return exactRoomItems[0]!.id;
  }

  const exactInventoryItems = exactItemMatches(adventure, inspection.inventoryItems, normalized);

  if (exactInventoryItems.length > 1) {
    throwAmbiguous(phrase, exactInventoryItems, objectRole);
  }

  if (exactInventoryItems.length === 1) {
    return exactInventoryItems[0]!.id;
  }

  if (allowActorTargets) {
    const exactActors = exactActorMatches(adventure, inspection.visibleActors, normalized);

    if (exactActors.length > 1) {
      throwAmbiguous(phrase, exactActors, objectRole);
    }

    if (exactActors.length === 1) {
      return exactActors[0]!.id;
    }
  }

  if (inspection.visibleGroupItems.length > 1) {
    throwAmbiguous(phrase, inspection.visibleGroupItems, objectRole);
  }

  if (inspection.visibleGroupItems.length === 1) {
    return inspection.visibleGroupItems[0]!.id;
  }

  if (queryTokens.length > 1) {
    const roomSubset = subsetItemMatches(adventure, inspection.roomItems, queryTokens);

    if (roomSubset.length > 1) {
      throwAmbiguous(phrase, roomSubset, objectRole);
    }

    if (roomSubset.length === 1) {
      return roomSubset[0]!.id;
    }

    const inventorySubset = subsetItemMatches(adventure, inspection.inventoryItems, queryTokens);

    if (inventorySubset.length > 1) {
      throwAmbiguous(phrase, inventorySubset, objectRole);
    }

    if (inventorySubset.length === 1) {
      return inventorySubset[0]!.id;
    }

    if (allowActorTargets) {
      const actorSubset = subsetActorMatches(adventure, inspection.visibleActors, queryTokens);

      if (actorSubset.length > 1) {
        throwAmbiguous(phrase, actorSubset, objectRole);
      }

      if (actorSubset.length === 1) {
        return actorSubset[0]!.id;
      }
    }
  }

  const offstageMatches = uniqById([
    ...exactItemMatches(adventure, inspection.knownItems, normalized),
    ...subsetItemMatches(adventure, inspection.knownItems, queryTokens)
  ]);

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
  const normalized = normalizeDictionaryPhrase(phrase);
  const inspection = inspectPhrase(adventure, state, normalized);
  const visibleItems = uniqById([
    ...exactItemMatches(adventure, inspection.roomItems, normalized),
    ...exactItemMatches(adventure, inspection.inventoryItems, normalized),
    ...inspection.visibleGroupItems,
    ...subsetItemMatches(adventure, inspection.roomItems, tokenizePhrase(normalized)),
    ...subsetItemMatches(adventure, inspection.inventoryItems, tokenizePhrase(normalized))
  ]);

  if (visibleItems.length > 0) {
    const verbs = [...new Set(visibleItems.flatMap((item) => itemSuggestionVerbs(item)))].slice(0, 3);

    if (verbs.length > 0) {
      const suggestions = verbs.map((verb) => `${verb} ${phrase.toUpperCase()}`);

      return `Try ${formatList(suggestions)}.`;
    }
  }

  const visibleActors = uniqById([
    ...exactActorMatches(adventure, inspection.visibleActors, normalized),
    ...subsetActorMatches(adventure, inspection.visibleActors, tokenizePhrase(normalized))
  ]);

  if (visibleActors.length > 0) {
    return `Try EXAMINE ${phrase.toUpperCase()} or BE ${phrase.toUpperCase()}.`;
  }

  if (inspection.knownItems.length > 0) {
    return inspection.knownItems.length === 1
      ? `You know about ${inspection.knownItems[0]!.name.toLowerCase()}, but you cannot see it here.`
      : `You cannot see any ${phrase.toLowerCase()} here.`;
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

export function resolveIntent(
  adventure: AdventureDefinition,
  state: GameState,
  intent: Intent
): ResolvedIntent {
  if (intent.verb === "SWITCH_ACTOR") {
    const actorId = resolveActor(adventure, intent.directObject);

    if (!actorId) {
      throw new ParserDiagnosticError(
        {
          code: "noun_not_visible",
          nounPhrase: intent.directObject ?? "that actor"
        },
        "You can only switch to a known actor."
      );
    }

    const resolved: ResolvedIntent = {
      verb: intent.verb,
      actorId,
      directObjectId: actorId,
      indirectObjectId: undefined,
      preposition: undefined,
      raw: intent.raw
    };

    if (intent.confidence) {
      resolved.confidence = intent.confidence;
    }

    if (intent.normalized) {
      resolved.normalized = intent.normalized;
    }

    return resolved;
  }

  const actorId = intent.actorId ?? state.activeActorId;
  const allowActorTargets = intent.verb === "EXAMINE";

  const resolved: ResolvedIntent = {
    verb: intent.verb,
    actorId,
    directObjectId:
      intent.verb === "GO"
        ? intent.directObject
        : resolveObjectId(adventure, state, intent.directObject, allowActorTargets, "directObject"),
    indirectObjectId:
      intent.verb === "GO"
        ? undefined
        : resolveObjectId(adventure, state, intent.indirectObject, false, "indirectObject"),
    preposition: intent.preposition,
    raw: intent.raw
  };

  if (intent.confidence) {
    resolved.confidence = intent.confidence;
  }

  if (intent.normalized) {
    resolved.normalized = intent.normalized;
  }

  return resolved;
}
