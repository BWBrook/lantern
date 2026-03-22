import { describe, expect, it } from "vitest";
import harrowMineAdventure from "../../adventures/harrow_mine/adventure";
import tinyAdventure from "../fixtures/tiny_adventure/adventure";
import { validateAdventureBundle } from "../../src/engine/validation";

describe("adventure contract", () => {
  it("validates the Harrow stub bundle", () => {
    expect(validateAdventureBundle(harrowMineAdventure)).toEqual([]);
  });

  it("validates a tiny fixture adventure", () => {
    expect(validateAdventureBundle(tinyAdventure)).toEqual([]);
  });
});
