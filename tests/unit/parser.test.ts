import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import { parseCommand } from "../../src/engine/parser/parse";
import { resolveIntent } from "../../src/engine/parser/resolve";

function parse(input: string) {
  return resolveIntent(harrowMineAdventure, parseCommand(input, harrowMineAdventure.lexicon));
}

describe("parser v1", () => {
  it("parses directed commands", () => {
    expect(parse("NESSA, PICK LOCK")).toEqual({
      actorId: "nessa",
      directObject: "lock",
      indirectObject: undefined,
      preposition: undefined,
      raw: "NESSA, PICK LOCK",
      verb: "UNLOCK"
    });
  });

  it("parses simple object commands", () => {
    expect(parse("TAKE LAMP")).toEqual({
      actorId: undefined,
      directObject: "lamp",
      indirectObject: undefined,
      preposition: undefined,
      raw: "TAKE LAMP",
      verb: "TAKE"
    });
  });

  it("parses indirect object commands", () => {
    expect(parse("UNLOCK DOOR WITH KEY")).toEqual({
      actorId: undefined,
      directObject: "door",
      indirectObject: "key",
      preposition: "with",
      raw: "UNLOCK DOOR WITH KEY",
      verb: "UNLOCK"
    });
  });

  it("parses actor switching", () => {
    expect(parse("BE NESSA")).toEqual({
      actorId: "nessa",
      directObject: undefined,
      indirectObject: undefined,
      preposition: undefined,
      raw: "BE NESSA",
      verb: "SWITCH_ACTOR"
    });
  });
});
