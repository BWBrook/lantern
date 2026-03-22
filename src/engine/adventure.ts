import type {
  AdventureDefinition,
  AdventureRoom,
  GameState,
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
