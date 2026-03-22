import type { AdventureDefinition, GameState } from "./types";

export function createInitialGameState(
  adventure: AdventureDefinition
): GameState {
  const seed = adventure.createInitialState();

  return {
    adventureId: adventure.metadata.id,
    currentRoomId: seed.currentRoomId,
    activeActorId: seed.activeActorId,
    inventory: seed.inventory ?? [],
    flags: seed.flags ?? [],
    visitCounts: {},
    transcript: []
  };
}
