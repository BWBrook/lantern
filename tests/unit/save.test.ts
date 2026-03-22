import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import tinyAdventure from "../fixtures/tiny_adventure/adventure";
import { createInitialTranscriptState, runTurn } from "../../src/engine/turn";
import { loadGame, saveGame } from "../../src/engine/save/storage";

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
    saveGame(storage, tinyAdventure, createInitialTranscriptState(tinyAdventure));

    expect(() => loadGame(storage, harrowMineAdventure)).not.toThrow();
    expect(loadGame(storage, harrowMineAdventure)).toBeNull();
  });
});
