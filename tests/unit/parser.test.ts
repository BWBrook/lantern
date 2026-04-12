import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import { ParserDiagnosticError } from "../../src/engine/parser/diagnostics";
import { parseAndResolveCommand } from "../../src/engine/parser/parse";
import {
  createInitialGameState,
  setCurrentRoom,
  setItemLocation,
  setPronounIt
} from "../../src/engine/state";
import tinyAdventure from "../fixtures/tiny_adventure/adventure";

function resolve(input: string, state = createInitialGameState(harrowMineAdventure)) {
  return parseAndResolveCommand(harrowMineAdventure, state, input);
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

    expect(() => parseAndResolveCommand(tinyAdventure, state, "EXAMINE DOOR")).toThrowError(
      'Which door do you mean: oak door or iron door?'
    );
  });

  it("reports offstage known objects as not visible", () => {
    expect(() => resolve("EXAMINE LOCKBOX")).toThrowError(
      "You know about paymaster's lockbox, but you cannot see it here."
    );
  });
});
