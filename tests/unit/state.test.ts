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

  it("includes explicit navigation guidance in room output", () => {
    const state = createInitialTranscriptState(harrowMineAdventure);

    expect(state.transcript.at(-1)?.text).toBe("You can go east to Mine Road.");
  });

  it("reports blocked routes and available exits on look", () => {
    let state = createInitialTranscriptState(harrowMineAdventure);
    state = runTurn(harrowMineAdventure, state, "east", undefined).state;
    state = runTurn(harrowMineAdventure, state, "east", undefined).state;
    state = runTurn(harrowMineAdventure, state, "north", undefined).state;

    const lookResult = runTurn(harrowMineAdventure, state, "look", undefined);

    expect(lookResult.messages).toContain("You can go south to Loading Yard.");
    expect(lookResult.messages).toContain("North is blocked: the planks still choke the entrance.");
  });

  it("gives directional guidance when movement is invalid", () => {
    const state = createInitialTranscriptState(harrowMineAdventure);
    const result = runTurn(harrowMineAdventure, state, "north", undefined);

    expect(result.messages).toEqual([
      "You cannot go north from here.",
      "You can go east to Mine Road."
    ]);
  });

  it("offers contextual suggestions for noun-only input", () => {
    let state = createInitialTranscriptState(harrowMineAdventure);
    state = runTurn(harrowMineAdventure, state, "east", undefined).state;
    state = runTurn(harrowMineAdventure, state, "east", undefined).state;

    const result = runTurn(harrowMineAdventure, state, "door", undefined);

    expect(result.messages).toEqual(["Try EXAMINE DOOR, OPEN DOOR, or UNLOCK DOOR."]);
  });

  it("uses clearer parser diagnostics for malformed unlock commands", () => {
    const state = createInitialTranscriptState(harrowMineAdventure);
    const result = runTurn(harrowMineAdventure, state, "unlock with key", undefined);

    expect(result.messages).toEqual(["Unlock what with what?"]);
  });

  it("reports known offstage objects as not visible", () => {
    const state = createInitialTranscriptState(harrowMineAdventure);
    const result = runTurn(harrowMineAdventure, state, "examine lockbox", undefined);

    expect(result.messages).toEqual([
      "You know about paymaster's lockbox, but you cannot see it here."
    ]);
  });

  it("accepts alternate natural phrasing for Harrow puzzle verbs", () => {
    let state = createInitialTranscriptState(harrowMineAdventure);
    state = runTurn(harrowMineAdventure, state, "east", undefined).state;
    state = runTurn(harrowMineAdventure, state, "east", undefined).state;
    state = runTurn(harrowMineAdventure, state, "get crowbar", undefined).state;
    state = runTurn(harrowMineAdventure, state, "open shed door", undefined).state;
    state = runTurn(harrowMineAdventure, state, "tell nessa to pick lock", undefined).state;
    state = runTurn(harrowMineAdventure, state, "open shed door", undefined).state;
    state = runTurn(harrowMineAdventure, state, "east", undefined).state;
    state = runTurn(harrowMineAdventure, state, "pick up lamp", undefined).state;

    expect(state.inventory).toContain("crowbar");
    expect(state.inventory).toContain("lamp");
    expect(state.flags).toContain("shed_unlocked");
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
