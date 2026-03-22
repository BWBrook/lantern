import type { AdventureLexicon } from "../../../src/engine/types";

export const lexicon: AdventureLexicon = {
  actorAliases: {
    bram: "bram",
    nessa: "nessa"
  },
  directionAliases: {
    e: "east",
    east: "east",
    n: "north",
    north: "north",
    s: "south",
    south: "south",
    w: "west",
    west: "west"
  },
  nounAliases: {
    lantern: "lamp",
    key: "brass_key"
  },
  verbAliases: {
    get: "take",
    inspect: "examine",
    l: "look",
    x: "examine"
  }
};
