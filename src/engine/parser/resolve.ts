import { getVisibleItems } from "../adventure";
import type {
  AdventureActor,
  AdventureDefinition,
  AdventureItem,
  GameState,
  Intent,
  ResolvedIntent
} from "../types";

function normalizePhrase(value: string): string {
  return value.trim().toLowerCase();
}

function actorMatches(actor: AdventureActor, phrase: string): boolean {
  const normalized = normalizePhrase(phrase);
  const aliases = actor.aliases ?? [];

  return actor.id === normalized || actor.name.toLowerCase() === normalized || aliases.includes(normalized);
}

function itemMatches(item: AdventureItem, phrase: string): boolean {
  const normalized = normalizePhrase(phrase);
  const aliases = item.aliases ?? [];

  return item.id === normalized || item.name.toLowerCase() === normalized || aliases.includes(normalized);
}

function resolveActor(adventure: AdventureDefinition, phrase: string | undefined): string | undefined {
  if (!phrase) {
    return undefined;
  }

  return adventure.content.actors.find((actor) => actorMatches(actor, phrase))?.id;
}

function resolveObjectId(
  adventure: AdventureDefinition,
  state: GameState,
  phrase: string | undefined
): string | undefined {
  if (!phrase) {
    return undefined;
  }

  const normalized = normalizePhrase(phrase);

  if (normalized === "it") {
    return state.pronouns.it;
  }

  const visibleItems = getVisibleItems(adventure, state);
  const matches = visibleItems.filter((item) => itemMatches(item, normalized));

  if (matches.length > 1) {
    throw new Error(`Which "${phrase}" do you mean?`);
  }

  if (matches.length === 1) {
    const match = matches[0];
    return match?.id;
  }

  const inventoryMatches = adventure.content.items.filter(
    (item) => state.inventory.includes(item.id) && itemMatches(item, normalized)
  );

  if (inventoryMatches.length === 1) {
    const match = inventoryMatches[0];
    return match?.id;
  }

  const knownMatches = adventure.content.items.filter((item) => itemMatches(item, normalized));

  if (knownMatches.length === 1) {
    const match = knownMatches[0];
    return match?.id;
  }

  return normalized;
}

export function resolveIntent(
  adventure: AdventureDefinition,
  state: GameState,
  intent: Intent
): ResolvedIntent {
  if (intent.verb === "SWITCH_ACTOR") {
    const actorId = resolveActor(adventure, intent.directObject);

    if (!actorId) {
      throw new Error("You can only switch to a known actor.");
    }

    return {
      verb: intent.verb,
      actorId,
      directObjectId: actorId,
      indirectObjectId: undefined,
      preposition: undefined,
      raw: intent.raw
    };
  }

  const actorId = intent.actorId ?? state.activeActorId;

  return {
    verb: intent.verb,
    actorId,
    directObjectId: resolveObjectId(adventure, state, intent.directObject),
    indirectObjectId: resolveObjectId(adventure, state, intent.indirectObject),
    preposition: intent.preposition,
    raw: intent.raw
  };
}
