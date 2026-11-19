import { CANONICAL_VERBS } from "./types";
import type {
  AdventureDefinition,
  AdventureItem,
  ItemActionHookName,
  ValidationIssue
} from "./types";
import { expandDictionaryAliasSpec, normalizeDictionaryPhrase } from "./parser/dictionary";

function findDuplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates];
}

function validateDuplicateIds(
  scope: ValidationIssue["scope"],
  ids: string[]
): ValidationIssue[] {
  return findDuplicates(ids).map((id) => ({
    scope,
    id,
    message: `Duplicate ${scope} id "${id}".`
  }));
}

function validateItemLocations(
  items: AdventureItem[],
  roomIds: Set<string>
): ValidationIssue[] {
  return items
    .filter((item) => item.location !== "hidden" && !roomIds.has(item.location))
    .map((item) => ({
      scope: "item" as const,
      id: item.id,
      message: `Item "${item.id}" references unknown room "${item.location}".`
    }));
}

function validateItemHooks(
  items: AdventureItem[],
  hookIds: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const item of items) {
    const itemHooks = item.hooks ?? {};

    for (const actionName of Object.keys(itemHooks) as ItemActionHookName[]) {
      const hookId = itemHooks[actionName];

      if (hookId && !hookIds.has(hookId)) {
        issues.push({
          scope: "hook",
          id: hookId,
          message: `Item "${item.id}" references unknown ${actionName} hook "${hookId}".`
        });
      }
    }
  }

  return issues;
}

function validateDictionary(
  adventure: AdventureDefinition,
  actorIds: Set<string>,
  itemIds: Set<string>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const aliasOwners = new Map<string, Set<string>>();

  for (const actorId of Object.keys(adventure.dictionary.actors)) {
    if (!actorIds.has(actorId)) {
      issues.push({
        scope: "actor",
        id: actorId,
        message: `Dictionary references unknown actor "${actorId}".`
      });
    }
  }

  for (const itemId of Object.keys(adventure.dictionary.items)) {
    if (!itemIds.has(itemId)) {
      issues.push({
        scope: "item",
        id: itemId,
        message: `Dictionary references unknown item "${itemId}".`
      });
    }
  }

  for (const [alias, targets] of Object.entries(adventure.dictionary.groups ?? {})) {
    for (const target of targets) {
      if (!itemIds.has(target)) {
        issues.push({
          scope: "item",
          id: target,
          message: `Dictionary group "${alias}" references unknown item "${target}".`
        });
      }
    }
  }

  const aliasPairs: Array<[string, string[]]> = [];

  for (const [actorId, aliases] of Object.entries(adventure.dictionary.actors)) {
    aliasPairs.push(...expandDictionaryAliasSpec(aliases).map((alias) => [alias, [`actor:${actorId}`]] as [string, string[]]));
  }

  for (const [itemId, aliases] of Object.entries(adventure.dictionary.items)) {
    aliasPairs.push(...expandDictionaryAliasSpec(aliases).map((alias) => [alias, [`item:${itemId}`]] as [string, string[]]));
  }

  for (const [alias, owners] of aliasPairs) {
    const normalized = normalizeDictionaryPhrase(alias);
    const current = aliasOwners.get(normalized) ?? new Set<string>();

    for (const owner of owners) {
      current.add(owner);
    }

    aliasOwners.set(normalized, current);
  }

  for (const [alias, owners] of aliasOwners.entries()) {
    if (owners.size > 1) {
      issues.push({
        scope: "metadata",
        id: alias,
        message: `Alias "${alias}" is declared for multiple targets (${[...owners].join(", ")}). Prefer dictionary groups for shared nouns.`
      });
    }
  }

  const canonicalVerbs = new Set(CANONICAL_VERBS);

  for (const [alias, template] of Object.entries(adventure.dictionary.idioms ?? {})) {
    if (!canonicalVerbs.has(template.verb)) {
      issues.push({
        scope: "metadata",
        id: alias,
        message: `Dictionary command template "${alias}" references unknown verb "${template.verb}".`
      });
    }
  }

  return issues;
}

export function validateAdventureBundle(
  adventure: AdventureDefinition
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const roomIds = new Set(adventure.content.rooms.map((room) => room.id));
  const artIds = new Set(adventure.content.art.map((art) => art.id));
  const hookIds = new Set(Object.keys(adventure.hooks));
  const actorIds = new Set(adventure.content.actors.map((actor) => actor.id));
  const itemIds = new Set(adventure.content.items.map((item) => item.id));
  const initialState = adventure.createInitialState();

  issues.push(...validateDuplicateIds("room", adventure.content.rooms.map((room) => room.id)));
  issues.push(...validateDuplicateIds("item", adventure.content.items.map((item) => item.id)));
  issues.push(...validateDuplicateIds("actor", adventure.content.actors.map((actor) => actor.id)));
  issues.push(...validateDuplicateIds("flag", adventure.content.flags));
  issues.push(...validateDuplicateIds("art", adventure.content.art.map((art) => art.id)));

  for (const room of adventure.content.rooms) {
    if (!artIds.has(room.artId)) {
      issues.push({
        scope: "room",
        id: room.id,
        message: `Room "${room.id}" references unknown art id "${room.artId}".`
      });
    }

    if (room.enterHookId && !hookIds.has(room.enterHookId)) {
      issues.push({
        scope: "hook",
        id: room.enterHookId,
        message: `Room "${room.id}" references unknown enter hook "${room.enterHookId}".`
      });
    }

    for (const [index, scenery] of (room.scenery ?? []).entries()) {
      if (scenery.nouns.length === 0 || scenery.nouns.some((noun) => !noun.trim())) {
        issues.push({
          scope: "room",
          id: room.id,
          message: `Room "${room.id}" scenery entry ${index} has an empty noun.`
        });
      }
    }

    for (const exit of room.exits) {
      if (!roomIds.has(exit.targetRoomId)) {
        issues.push({
          scope: "room",
          id: room.id,
          message: `Room "${room.id}" has exit to unknown room "${exit.targetRoomId}".`
        });
      }

      if (exit.viaItemId && !itemIds.has(exit.viaItemId)) {
        issues.push({
          scope: "item",
          id: exit.viaItemId,
          message: `Exit from room "${room.id}" references unknown via item "${exit.viaItemId}".`
        });
      }

      if (exit.requiresOpenItemId && !itemIds.has(exit.requiresOpenItemId)) {
        issues.push({
          scope: "item",
          id: exit.requiresOpenItemId,
          message: `Exit from room "${room.id}" references unknown item "${exit.requiresOpenItemId}".`
        });
      }
    }
  }

  for (const item of adventure.content.items) {
    if (item.keyItemId && !itemIds.has(item.keyItemId)) {
      issues.push({
        scope: "item",
        id: item.keyItemId,
        message: `Item "${item.id}" references unknown key item "${item.keyItemId}".`
      });
    }
  }

  issues.push(...validateItemLocations(adventure.content.items, roomIds));
  issues.push(...validateItemHooks(adventure.content.items, hookIds));
  issues.push(...validateDictionary(adventure, actorIds, itemIds));

  if (!roomIds.has(initialState.currentRoomId)) {
    issues.push({
      scope: "metadata",
      id: initialState.currentRoomId,
      message: `Initial state references unknown room "${initialState.currentRoomId}".`
    });
  }

  if (!actorIds.has(initialState.activeActorId)) {
    issues.push({
      scope: "metadata",
      id: initialState.activeActorId,
      message: `Initial state references unknown actor "${initialState.activeActorId}".`
    });
  }

  for (const itemId of initialState.inventory ?? []) {
    if (!itemIds.has(itemId)) {
      issues.push({
        scope: "item",
        id: itemId,
        message: `Initial inventory references unknown item "${itemId}".`
      });
    }
  }

  for (const flagId of initialState.flags ?? []) {
    if (!adventure.content.flags.includes(flagId)) {
      issues.push({
        scope: "flag",
        id: flagId,
        message: `Initial state references unknown flag "${flagId}".`
      });
    }
  }

  if (adventure.rules?.lightFlagId && !adventure.content.flags.includes(adventure.rules.lightFlagId)) {
    issues.push({
      scope: "flag",
      id: adventure.rules.lightFlagId,
      message: `Adventure rules reference unknown light flag "${adventure.rules.lightFlagId}".`
    });
  }

  return issues;
}
