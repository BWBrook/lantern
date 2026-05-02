import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
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

  it("resolves Harrow image assets declared in the art manifest", () => {
    const artWithAssets = harrowMineAdventure.content.art.filter((art) => art.assetPath);

    expect(artWithAssets.map((art) => art.id).sort()).toEqual([
      "loading_yard_ruin",
      "main_gallery_hub",
      "town_edge_dawn"
    ]);

    for (const art of artWithAssets) {
      const url = new URL(art.assetPath!);

      expect(url.protocol).toBe("file:");
      expect(existsSync(fileURLToPath(url))).toBe(true);
    }
  });
});
