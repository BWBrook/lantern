import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import { ParserDiagnosticError } from "../../src/engine/parser/diagnostics";
import { parseAtomicCommands } from "../../src/engine/parser/plan";
import {
  createInitialGameState,
  setCurrentRoom,
  setItemLocation,
  setPronounIt
} from "../../src/engine/state";
import { runTurn } from "../../src/engine/turn";
import tinyAdventure from "../fixtures/tiny_adventure/adventure";

function resolve(input: string, state = createInitialGameState(harrowMineAdventure)) {
  return parseAtomicCommands(harrowMineAdventure, state, input)[0]!.intent;
}

describe("parser v2", () => {
  it("parses directed commands against visible room objects", () => {
    const state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "loading_yard");

    expect(resolve("NESSA, PICK LOCK", state)).toEqual({
      actorId: "nessa",
      directObjectId: "shed_door",
      indirectObjectId: undefined,
      preposition: undefined,
      raw: "pick lock",
      verb: "UNLOCK"
    });
  });

  it("accepts natural synonym variants", () => {
    const yard = setCurrentRoom(createInitialGameState(harrowMineAdventure), "loading_yard");
    const road = setCurrentRoom(createInitialGameState(harrowMineAdventure), "mine_road");

    expect(resolve("GET CROWBAR", yard).verb).toBe("TAKE");
    expect(resolve("PICK UP CROWBAR", yard).verb).toBe("TAKE");
    expect(resolve("LOOK AT MILESTONE", road)).toEqual({
      actorId: "bram",
      directObjectId: "milestone",
      indirectObjectId: undefined,
      preposition: undefined,
      raw: "look at milestone",
      verb: "EXAMINE"
    });
  });

  it("parses indirect object commands", () => {
    let state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "stores_chamber");
    state = setItemLocation(state, "brass_key", "inventory");

    expect(resolve("UNLOCK DOOR WITH BRASS KEY", state)).toEqual({
      actorId: "bram",
      directObjectId: "assay_door",
      indirectObjectId: "brass_key",
      preposition: "with",
      raw: "unlock door with brass key",
      verb: "UNLOCK"
    });
  });

  it("supports actor switching and directed actor phrasing", () => {
    expect(resolve("BE NESSA")).toEqual({
      actorId: "nessa",
      directObjectId: "nessa",
      indirectObjectId: undefined,
      preposition: undefined,
      raw: "be nessa",
      verb: "SWITCH_ACTOR"
    });

    expect(resolve("NESSA")).toEqual({
      actorId: "nessa",
      directObjectId: "nessa",
      indirectObjectId: undefined,
      preposition: undefined,
      raw: "nessa",
      verb: "SWITCH_ACTOR"
    });

    const state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "loading_yard");

    expect(resolve("TELL NESSA TO PICK LOCK", state).actorId).toBe("nessa");
  });

  it("resolves IT and THEM from recent parser context", () => {
    let state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "foreman_shed");
    state = setItemLocation(state, "lamp", "inventory");
    state = setPronounIt(state, "lamp");

    expect(resolve("LIGHT IT", state).directObjectId).toBe("lamp");
    expect(resolve("LIGHT THEM", state).directObjectId).toBe("lamp");
  });

  it("suggests close command words for typos", () => {
    expect(() => resolve("LOK")).toThrowError(ParserDiagnosticError);

    try {
      resolve("LOK");
    } catch (error) {
      expect(error).toBeInstanceOf(ParserDiagnosticError);
      expect((error as Error).message).toContain("Try LOOK");
    }
  });

  it("raises explicit disambiguation for visible grouped nouns", () => {
    const state = createInitialGameState(tinyAdventure);

    expect(() => parseAtomicCommands(tinyAdventure, state, "EXAMINE DOOR")).toThrowError(
      'Which door do you mean: oak door or iron door?'
    );
  });

  it("reports offstage known objects as not visible", () => {
    expect(() => resolve("EXAMINE LOCKBOX")).toThrowError(
      "You know about paymaster's lockbox, but you cannot see it here."
    );
  });
});

describe("parser v3", () => {
  it("accepts polite fillers, gerunds, reordered prepositions, and richer actor direction", () => {
    const yard = setCurrentRoom(createInitialGameState(harrowMineAdventure), "loading_yard");
    const entrance = setItemLocation(
      setCurrentRoom(createInitialGameState(harrowMineAdventure), "broken_entrance"),
      "crowbar",
      "inventory"
    );
    const winch = setItemLocation(
      setCurrentRoom(createInitialGameState(harrowMineAdventure), "winch_platform"),
      "winding_handle",
      "inventory"
    );

    expect(resolve("try opening the shed", yard)).toMatchObject({
      directObjectId: "shed_door",
      verb: "OPEN"
    });
    expect(resolve("use the crowbar on the planks", entrance)).toMatchObject({
      directObjectId: "crowbar",
      indirectObjectId: "entrance_planks",
      preposition: "on",
      verb: "USE"
    });
    expect(resolve("put the handle on the winch", winch)).toMatchObject({
      directObjectId: "winding_handle",
      indirectObjectId: "winch",
      preposition: "on",
      verb: "ATTACH"
    });
    expect(resolve("have Nessa pick the lock", yard)).toMatchObject({
      actorId: "nessa",
      directObjectId: "shed_door",
      verb: "UNLOCK"
    });
  });

  it("executes command chains in order and remembers AGAIN", () => {
    let state = createInitialGameState(harrowMineAdventure);

    let result = runTurn(harrowMineAdventure, state, "east then east then take crowbar", undefined);
    state = result.state;

    expect(state.currentRoomId).toBe("loading_yard");
    expect(state.inventory).toContain("crowbar");

    state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "mine_road");
    result = runTurn(harrowMineAdventure, state, "examine milestone", undefined);
    result = runTurn(harrowMineAdventure, result.state, "again", undefined);

    expect(result.messages).toContain(
      "The milestone has lost both distance and dignity, but not the knack of marking a road."
    );
  });

  it("supports TAKE ALL, EXCEPT filters, batch THEM, and noun lists", () => {
    let state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "foreman_shed");
    let result = runTurn(harrowMineAdventure, state, "take all except lamp", undefined);
    state = result.state;

    expect(state.inventory).toEqual(expect.arrayContaining(["oil_flask", "winding_handle"]));
    expect(state.inventory).not.toContain("lamp");

    result = runTurn(harrowMineAdventure, state, "drop them", undefined);
    state = result.state;

    expect(state.inventory).not.toContain("oil_flask");
    expect(state.inventory).not.toContain("winding_handle");

    result = runTurn(harrowMineAdventure, state, "take oil and handle", undefined);

    expect(result.state.inventory).toEqual(expect.arrayContaining(["oil_flask", "winding_handle"]));
  });

  it("keeps broad unsafe batch commands from guessing", () => {
    const state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "loading_yard");
    const result = runTurn(harrowMineAdventure, state, "unlock all", undefined);

    expect(result.messages).toContain("That is too broad. Try naming the thing you want.");
  });

  it("stores clarification state and resolves a short follow-up", () => {
    let state = createInitialGameState(tinyAdventure);
    let result = runTurn(tinyAdventure, state, "examine door", undefined);
    state = result.state;

    expect(result.messages).toContain("Which door do you mean: oak door or iron door?");
    expect(state.parser.pendingClarification?.candidateIds).toEqual(["oak_door", "iron_door"]);

    result = runTurn(tinyAdventure, state, "oak", undefined);

    expect(result.messages).toEqual([
      "I read that as: EXAMINE DOOR.",
      "A plain oak door with a brass latch."
    ]);
  });

  it("shows likely-parse normalization when acting on natural directed phrasing", () => {
    const state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "loading_yard");
    const result = runTurn(harrowMineAdventure, state, "have Nessa pick lock", undefined);

    expect(result.messages[0]).toBe("I read that as: UNLOCK LOCK.");
    expect(result.messages.join("\n")).toContain("The hasp clicks.");
  });
});
