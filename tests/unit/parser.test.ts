import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import { parseCommand } from "../../src/engine/parser/parse";
import { resolveIntent } from "../../src/engine/parser/resolve";
import { createInitialGameState, setItemLocation, setCurrentRoom } from "../../src/engine/state";

function resolve(input: string, state = createInitialGameState(harrowMineAdventure)) {
  return resolveIntent(harrowMineAdventure, state, parseCommand(input, harrowMineAdventure.lexicon));
}

describe("parser v1", () => {
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

  it("parses simple object commands", () => {
    const state = setCurrentRoom(createInitialGameState(harrowMineAdventure), "foreman_shed");

    expect(resolve("TAKE LAMP", state)).toEqual({
      actorId: "bram",
      directObjectId: "lamp",
      indirectObjectId: undefined,
      preposition: undefined,
      raw: "take lamp",
      verb: "TAKE"
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

  it("parses actor switching", () => {
    expect(resolve("BE NESSA")).toEqual({
      actorId: "nessa",
      directObjectId: "nessa",
      indirectObjectId: undefined,
      preposition: undefined,
      raw: "be nessa",
      verb: "SWITCH_ACTOR"
    });
  });
});
