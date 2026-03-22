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
    bar: "crowbar",
    crowbar: "crowbar",
    mine: "harrow_mine",
    road: "mine_road",
    yard: "loading_yard"
  },
  verbAliases: {
    get: "take",
    inspect: "look",
    l: "look"
  }
};
