import { getItemById } from "./adventure";
import type {
  AdventureDefinition,
  FlagId,
  GameState,
  ItemId,
  ItemLocation,
  ItemRuntimeState
} from "./types";

function initialItemLocations(adventure: AdventureDefinition): Record<ItemId, ItemLocation> {
  const entries: Record<ItemId, ItemLocation> = {};

  for (const item of adventure.content.items) {
    entries[item.id] = item.location;
  }

  return entries;
}

function initialItemStates(adventure: AdventureDefinition): Record<ItemId, ItemRuntimeState> {
  const entries: Record<ItemId, ItemRuntimeState> = {};

  for (const item of adventure.content.items) {
    const runtimeState: ItemRuntimeState = {};

    if (item.openable) {
      runtimeState.open = Boolean(item.initiallyOpen);
    }

    if (item.lockable) {
      runtimeState.locked = Boolean(item.initiallyLocked);
    }

    entries[item.id] = runtimeState;
  }

  return entries;
}

export function createInitialGameState(
  adventure: AdventureDefinition
): GameState {
  const seed = adventure.createInitialState();
  const itemLocations = initialItemLocations(adventure);
  const itemStates = initialItemStates(adventure);

  for (const [itemId, location] of Object.entries(seed.itemLocations ?? {})) {
    if (location) {
      itemLocations[itemId] = location;
    }
  }

  for (const [itemId, runtimeState] of Object.entries(seed.itemStates ?? {})) {
    if (runtimeState) {
      itemStates[itemId] = runtimeState;
    }
  }

  return {
    adventureId: adventure.metadata.id,
    currentRoomId: seed.currentRoomId,
    activeActorId: seed.activeActorId,
    inventory: seed.inventory ?? [],
    flags: seed.flags ?? [],
    itemLocations,
    itemStates,
    parser: {
      lastIntent: undefined,
      pendingClarification: undefined
    },
    pronouns: {
      it: undefined,
      them: undefined
    },
    visitCounts: {},
    transcript: []
  };
}

export function hasFlag(state: GameState, flagId: FlagId): boolean {
  return state.flags.includes(flagId);
}

export function setFlag(state: GameState, flagId: FlagId): GameState {
  if (hasFlag(state, flagId)) {
    return state;
  }

  return {
    ...state,
    flags: [...state.flags, flagId]
  };
}

export function clearFlag(state: GameState, flagId: FlagId): GameState {
  if (!hasFlag(state, flagId)) {
    return state;
  }

  return {
    ...state,
    flags: state.flags.filter((candidate) => candidate !== flagId)
  };
}

export function setItemLocation(
  state: GameState,
  itemId: ItemId,
  location: ItemLocation
): GameState {
  const currentInventory = state.inventory.includes(itemId)
    ? state.inventory.filter((candidate) => candidate !== itemId)
    : state.inventory;

  return {
    ...state,
    inventory: location === "inventory" ? [...currentInventory, itemId] : currentInventory,
    itemLocations: {
      ...state.itemLocations,
      [itemId]: location
    }
  };
}

export function setCurrentRoom(state: GameState, roomId: string): GameState {
  return {
    ...state,
    currentRoomId: roomId,
    visitCounts: {
      ...state.visitCounts,
      [roomId]: (state.visitCounts[roomId] ?? 0) + 1
    }
  };
}

export function setActiveActor(state: GameState, actorId: string): GameState {
  return {
    ...state,
    activeActorId: actorId
  };
}

export function setItemState(
  state: GameState,
  itemId: ItemId,
  patch: ItemRuntimeState
): GameState {
  return {
    ...state,
    itemStates: {
      ...state.itemStates,
      [itemId]: {
        ...state.itemStates[itemId],
        ...patch
      }
    }
  };
}

export function isItemOpen(
  adventure: AdventureDefinition,
  state: GameState,
  itemId: ItemId
): boolean {
  const item = getItemById(adventure, itemId);
  const runtimeState = state.itemStates[itemId];

  if (!item.openable) {
    return false;
  }

  return runtimeState?.open ?? Boolean(item.initiallyOpen);
}

export function isItemLocked(
  adventure: AdventureDefinition,
  state: GameState,
  itemId: ItemId
): boolean {
  const item = getItemById(adventure, itemId);
  const runtimeState = state.itemStates[itemId];

  if (!item.lockable) {
    return false;
  }

  return runtimeState?.locked ?? Boolean(item.initiallyLocked);
}

export function setPronounIt(state: GameState, itemId: string | undefined): GameState {
  return {
    ...state,
    pronouns: {
      ...state.pronouns,
      it: itemId,
      them: itemId ? [itemId] : undefined
    }
  };
}

export function setPronounThem(state: GameState, itemIds: string[]): GameState {
  const uniqueItemIds = [...new Set(itemIds)].filter(Boolean);
  const firstItemId = uniqueItemIds[0];

  return {
    ...state,
    pronouns: {
      ...state.pronouns,
      it: uniqueItemIds.length === 1 ? firstItemId : state.pronouns.it,
      them: uniqueItemIds.length > 0 ? uniqueItemIds : undefined
    }
  };
}

export function setLastParserIntent(
  state: GameState,
  intent: GameState["parser"]["lastIntent"] | undefined
): GameState {
  return {
    ...state,
    parser: {
      ...state.parser,
      lastIntent: intent
    }
  };
}

export function setPendingClarification(
  state: GameState,
  pendingClarification: GameState["parser"]["pendingClarification"] | undefined
): GameState {
  return {
    ...state,
    parser: {
      ...state.parser,
      pendingClarification
    }
  };
}

export function playerHasItem(state: GameState, itemId: ItemId): boolean {
  return state.inventory.includes(itemId);
}
