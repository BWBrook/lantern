import type {
  AdventureActor,
  AdventureDefinition,
  AdventureItem,
  AdventureRoom,
  AdventureScenery,
  GameState,
  ItemId,
  RoomId,
  TranscriptLine
} from "./types";

const ATTACHED_PREFIX = "attached:";
const SCENERY_PREFIX = "scenery:";

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

export function findItemById(
  adventure: AdventureDefinition,
  itemId: string | undefined
): AdventureItem | undefined {
  return itemId ? adventure.content.items.find((candidate) => candidate.id === itemId) : undefined;
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

export function findActorById(
  adventure: AdventureDefinition,
  actorId: string | undefined
): AdventureActor | undefined {
  return actorId ? adventure.content.actors.find((candidate) => candidate.id === actorId) : undefined;
}

export function getSceneryByRef(
  adventure: AdventureDefinition,
  ref: string | undefined
): AdventureScenery | undefined {
  if (!ref?.startsWith(SCENERY_PREFIX)) {
    return undefined;
  }

  const separator = ref.lastIndexOf(":");
  const roomId = ref.slice(SCENERY_PREFIX.length, separator);
  const index = Number(ref.slice(separator + 1));
  const room = adventure.content.rooms.find((candidate) => candidate.id === roomId);

  return room?.scenery?.[index];
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

export function getArtAssetPath(
  adventure: AdventureDefinition,
  artId: string
): string | undefined {
  return adventure.content.art.find((candidate) => candidate.id === artId)?.assetPath;
}

export function getArtScene(
  adventure: AdventureDefinition,
  artId: string
) {
  return adventure.content.art.find((candidate) => candidate.id === artId)?.scene;
}

export function appendTranscript(
  state: GameState,
  kind: TranscriptLine["kind"],
  text: string
): GameState {
  return {
    ...state,
    transcript: [...state.transcript, { kind, text }]
  };
}

export function getItemLocation(
  adventure: AdventureDefinition,
  state: GameState,
  itemId: ItemId
): string {
  return state.itemLocations[itemId] ?? getItemById(adventure, itemId).location;
}

export function getAttachmentHost(
  adventure: AdventureDefinition,
  state: GameState,
  itemId: ItemId
): AdventureItem | undefined {
  const location = getItemLocation(adventure, state, itemId);

  return location.startsWith(ATTACHED_PREFIX)
    ? findItemById(adventure, location.slice(ATTACHED_PREFIX.length))
    : undefined;
}

export function isItemVisible(
  adventure: AdventureDefinition,
  state: GameState,
  itemId: ItemId
): boolean {
  const location = getItemLocation(adventure, state, itemId);

  if (location === "inventory" || location === state.currentRoomId) {
    return true;
  }

  if (location.startsWith(ATTACHED_PREFIX)) {
    return isItemVisible(adventure, state, location.slice(ATTACHED_PREFIX.length));
  }

  return false;
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
