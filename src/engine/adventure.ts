import type {
  AdventureActor,
  AdventureDefinition,
  AdventureItem,
  AdventureRoom,
  GameState,
  ItemId,
  RoomId
} from "./types";

export function getRoomById(
  adventure: AdventureDefinition,
  roomId: RoomId
): AdventureRoom {
  const room = adventure.content.rooms.find((candidate) => candidate.id === roomId);

  if (!room) {
    throw new Error(`Unknown room id "${roomId}" for adventure "${adventure.metadata.id}".`);
  }

  return room;
}

export function getItemById(
  adventure: AdventureDefinition,
  itemId: ItemId
): AdventureItem {
  const item = adventure.content.items.find((candidate) => candidate.id === itemId);

  if (!item) {
    throw new Error(`Unknown item id "${itemId}" for adventure "${adventure.metadata.id}".`);
  }

  return item;
}

export function getActorById(
  adventure: AdventureDefinition,
  actorId: string
): AdventureActor {
  const actor = adventure.content.actors.find((candidate) => candidate.id === actorId);

  if (!actor) {
    throw new Error(`Unknown actor id "${actorId}" for adventure "${adventure.metadata.id}".`);
  }

  return actor;
}

export function getArtLabel(
  adventure: AdventureDefinition,
  artId: string
): string {
  return (
    adventure.content.art.find((candidate) => candidate.id === artId)?.label ??
    "Placeholder scene"
  );
}

export function appendTranscript(
  state: GameState,
  kind: "system" | "player",
  text: string
): GameState {
  return {
    ...state,
    transcript: [...state.transcript, { kind, text }]
  };
}

export function isItemVisible(
  adventure: AdventureDefinition,
  state: GameState,
  itemId: ItemId
): boolean {
  const item = getItemById(adventure, itemId);
  const location = state.itemLocations[itemId] ?? item.location;

  return location === "inventory" || location === state.currentRoomId;
}

export function getVisibleItems(
  adventure: AdventureDefinition,
  state: GameState
): AdventureItem[] {
  return adventure.content.items.filter((item) => isItemVisible(adventure, state, item.id));
}

export function describeRoom(
  adventure: AdventureDefinition,
  state: GameState
): string {
  const room = getRoomById(adventure, state.currentRoomId);
  const visits = state.visitCounts[state.currentRoomId] ?? 0;

  return visits <= 1 ? room.descriptions.first : room.descriptions.repeat;
}
