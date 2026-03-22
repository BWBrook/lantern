import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import { createInitialGameState } from "../../src/engine/state";
import { createInitialTranscriptState, runTurn } from "../../src/engine/turn";

describe("turn loop", () => {
  it("starts in the Harrow opening room", () => {
    const state = createInitialGameState(harrowMineAdventure);

    expect(state.currentRoomId).toBe("town_edge");
    expect(state.activeActorId).toBe("bram");
  });

  it("moves east through the opening rooms", () => {
    const state = createInitialTranscriptState(harrowMineAdventure);
    const firstMove = runTurn(harrowMineAdventure, state, "east", undefined);
    const secondMove = runTurn(harrowMineAdventure, firstMove.state, "east", undefined);

    expect(firstMove.state.currentRoomId).toBe("mine_road");
    expect(secondMove.state.currentRoomId).toBe("loading_yard");
  });

  it("completes the Harrow golden path to victory", () => {
    const commands = readFileSync(
      join(process.cwd(), "adventures/harrow_mine/tests/golden-path.txt"),
      "utf8"
    )
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    let state = createInitialTranscriptState(harrowMineAdventure);

    for (const command of commands) {
      state = runTurn(harrowMineAdventure, state, command, undefined).state;
    }

    expect(state.currentRoomId).toBe("mine_road");
    expect(state.flags).toContain("victory");
    expect(state.inventory).toContain("lockbox");
  });
});
