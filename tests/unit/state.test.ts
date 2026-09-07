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

  it("does not leak unseen objects when a noun is not here", () => {
    const state = createInitialTranscriptState(harrowMineAdventure);
    const result = runTurn(harrowMineAdventure, state, "examine lockbox", undefined);

    expect(result.messages).toEqual(["You cannot see any lockbox here."]);
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

  it("resolves destinations, relative exits, and scenery in ordinary play", () => {
    let state = createInitialTranscriptState(harrowMineAdventure);
    const tooFar = runTurn(harrowMineAdventure, state, "go to the loading yard", undefined);
    expect(tooFar.messages[0]).toBe("You cannot see a way to loading yard from here.");

    state = runTurn(harrowMineAdventure, state, "go to the mine road", undefined).state;
    state = runTurn(harrowMineAdventure, state, "go to the loading yard", undefined).state;

    expect(state.currentRoomId).toBe("loading_yard");

    const carts = runTurn(harrowMineAdventure, state, "look at the ore carts", undefined);
    expect(carts.messages[0]).toContain("drunks at closing time");

    const shed = runTurn(harrowMineAdventure, state, "enter the shed", undefined);
    expect(shed.messages[0]).toBe("The shed door is still shut.");

    state = runTurn(harrowMineAdventure, state, "nessa, open the shed", undefined).state;
    state = runTurn(harrowMineAdventure, state, "enter the shed", undefined).state;
    expect(state.currentRoomId).toBe("foreman_shed");

    state = runTurn(harrowMineAdventure, state, "leave the shed", undefined).state;
    expect(state.currentRoomId).toBe("loading_yard");

    state = runTurn(harrowMineAdventure, state, "back", undefined).state;
    expect(state.currentRoomId).toBe("foreman_shed");
  });

  it("takes a thing before using it and delegates actions on fitted parts", () => {
    let state = createInitialTranscriptState(harrowMineAdventure);
    state = runTurn(harrowMineAdventure, state, "e. e. take crowbar. nessa, pick lock. open shed. east", undefined).state;

    const lit = runTurn(harrowMineAdventure, state, "light the lamp", undefined);
    expect(lit.messages).toEqual([
      "(first taking the brass lamp)",
      "The brass lamp catches after a moment and settles into a steady glow."
    ]);

    state = runTurn(harrowMineAdventure, lit.state, "take handle. west. north. pry planks. north. north. north", undefined).state;
    expect(state.currentRoomId).toBe("winch_platform");

    state = runTurn(harrowMineAdventure, state, "attach handle", undefined).state;
    const turned = runTurn(harrowMineAdventure, state, "turn the handle", undefined);
    expect(turned.state.flags).toContain("west_gate_open");
  });

  it("splits 'and' chains only where a new command starts", () => {
    let state = createInitialTranscriptState(harrowMineAdventure);
    state = runTurn(harrowMineAdventure, state, "east and east", undefined).state;
    const result = runTurn(harrowMineAdventure, state, "take crowbar and go north", undefined);

    expect(result.state.inventory).toContain("crowbar");
    expect(result.state.currentRoomId).toBe("broken_entrance");
  });

  it("keeps engine help free of adventure names while naming the companion", () => {
    const state = createInitialTranscriptState(harrowMineAdventure);
    const result = runTurn(harrowMineAdventure, state, "help", undefined);

    expect(result.messages[0]).toContain("NESSA, <command>");
    expect(result.messages[0]).toContain("BE NESSA");
  });

  it("completes the Harrow golden path in natural phrasing", () => {
    const commands = readFileSync(
      join(process.cwd(), "adventures/harrow_mine/tests/golden-path-natural.txt"),
      "utf8"
    )
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    let state = createInitialTranscriptState(harrowMineAdventure);

    for (const command of commands) {
      const result = runTurn(harrowMineAdventure, state, command, undefined);
      const failed = result.messages.find((message) => /^(I do not know|You cannot see|The rest of your command)/.test(message));

      expect(failed, `"${command}" -> ${result.messages.join(" | ")}`).toBeUndefined();
      state = result.state;
    }

    expect(state.currentRoomId).toBe("mine_road");
    expect(state.flags).toContain("victory");
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
