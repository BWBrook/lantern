import type { AdventureDefinition, GameState, SaveRecord, StorageLike } from "../types";

const DEFAULT_SLOT = "default";

export function createSaveKey(adventure: AdventureDefinition): string {
  return `lantern:${adventure.metadata.id}:${DEFAULT_SLOT}`;
}

export function saveGame(
  storage: StorageLike,
  adventure: AdventureDefinition,
  state: GameState
): void {
  const record: SaveRecord = {
    adventureId: adventure.metadata.id,
    adventureVersion: adventure.metadata.version,
    savedAt: new Date().toISOString(),
    state
  };

  storage.setItem(createSaveKey(adventure), JSON.stringify(record));
}

export function loadGame(
  storage: StorageLike,
  adventure: AdventureDefinition
): GameState | null {
  const raw = storage.getItem(createSaveKey(adventure));

  if (!raw) {
    return null;
  }

  const parsed = JSON.parse(raw) as SaveRecord;

  if (parsed.adventureId !== adventure.metadata.id) {
    throw new Error("Save data belongs to a different adventure.");
  }

  return {
    ...parsed.state,
    parser: parsed.state.parser ?? {
      lastIntent: undefined,
      pendingClarification: undefined,
      recentObjectIds: []
    }
  };
}
