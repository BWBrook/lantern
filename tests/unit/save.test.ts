import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import tinyAdventure from "../fixtures/tiny_adventure/adventure";
import { createInitialTranscriptState, runTurn } from "../../src/engine/turn";
import { createSaveKey, loadGame, saveGame } from "../../src/engine/save/storage";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("save/load", () => {
  it("round-trips Harrow state", () => {
    const storage = new MemoryStorage();
    const progressed = runTurn(
      harrowMineAdventure,
      createInitialTranscriptState(harrowMineAdventure),
      "east",
      storage
    ).state;

    saveGame(storage, harrowMineAdventure, progressed);
    const loaded = loadGame(storage, harrowMineAdventure);

    expect(loaded?.currentRoomId).toBe("mine_road");
    expect(loaded?.adventureId).toBe("harrow_mine");
  });

  it("rejects loading save data for another adventure", () => {
    const storage = new MemoryStorage();
    const state = createInitialTranscriptState(tinyAdventure);
    storage.setItem(
      createSaveKey(harrowMineAdventure),
      JSON.stringify({
        adventureId: tinyAdventure.metadata.id,
        savedAt: new Date().toISOString(),
        state
      })
    );

    expect(() => loadGame(storage, harrowMineAdventure)).toThrow(
      "Save data belongs to a different adventure."
    );
  });
});
