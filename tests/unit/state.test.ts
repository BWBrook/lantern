import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import { createInitialGameState } from "../../src/engine/state";
import { runBootstrapTurn } from "../../src/engine/turn";

describe("bootstrap turn loop", () => {
  it("starts in the Harrow opening room", () => {
    const state = createInitialGameState(harrowMineAdventure);

    expect(state.currentRoomId).toBe("town_edge");
    expect(state.activeActorId).toBe("bram");
  });

  it("moves east through the seed rooms", () => {
    const state = createInitialGameState(harrowMineAdventure);
    const firstMove = runBootstrapTurn(harrowMineAdventure, state, "east");
    const secondMove = runBootstrapTurn(harrowMineAdventure, firstMove.state, "east");

    expect(firstMove.state.currentRoomId).toBe("mine_road");
    expect(secondMove.state.currentRoomId).toBe("loading_yard");
  });
});
