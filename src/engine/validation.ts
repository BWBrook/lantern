import type {
  AdventureDefinition,
  AdventureItem,
  ValidationIssue
} from "./types";

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
    .filter((item) => !roomIds.has(item.location))
    .map((item) => ({
      scope: "item" as const,
      id: item.id,
      message: `Item "${item.id}" references unknown room "${item.location}".`
    }));
}

export function validateAdventureBundle(
  adventure: AdventureDefinition
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const roomIds = new Set(adventure.content.rooms.map((room) => room.id));
  const artIds = new Set(adventure.content.art.map((art) => art.id));
  const hookIds = new Set(Object.keys(adventure.hooks));
  const actorIds = new Set(adventure.content.actors.map((actor) => actor.id));
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

    for (const exit of room.exits) {
      if (!roomIds.has(exit.targetRoomId)) {
        issues.push({
          scope: "room",
          id: room.id,
          message: `Room "${room.id}" has exit to unknown room "${exit.targetRoomId}".`
        });
      }

      if (exit.hookId && !hookIds.has(exit.hookId)) {
        issues.push({
          scope: "hook",
          id: exit.hookId,
          message: `Exit from room "${room.id}" references unknown hook "${exit.hookId}".`
        });
      }
    }
  }

  for (const item of adventure.content.items) {
    if (item.hookId && !hookIds.has(item.hookId)) {
      issues.push({
        scope: "hook",
        id: item.hookId,
        message: `Item "${item.id}" references unknown hook "${item.hookId}".`
      });
    }
  }

  issues.push(...validateItemLocations(adventure.content.items, roomIds));

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

  return [...issues, ...adventure.validate()];
}
