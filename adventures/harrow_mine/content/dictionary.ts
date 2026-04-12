import type { AdventureDictionary } from "../../../src/engine/types";

export const dictionary: AdventureDictionary = {
  verbs: {
    EXAMINE: ["inspect", "x"],
    LOOK: ["l"],
    MOVE: ["pry", "shift"],
    TAKE: ["get"],
    UNLOCK: ["pick"]
  },
  directions: {
    east: ["e"],
    north: ["n"],
    south: ["s"],
    west: ["w"]
  },
  actors: {
    bram: ["bram", "fighter"],
    nessa: ["nessa", "thief"]
  },
  items: {
    assay_door: ["assay door", "office door"],
    beam: ["fallen beam"],
    brass_key: ["key", "brass key", "office key"],
    crowbar: ["crowbar", "bar"],
    desk: ["desk"],
    entrance_planks: ["planks", "boards", "entrance"],
    flooded_ledge: ["ledge", "narrow ledge", "water", "channel"],
    gate: ["gate", "iron gate", "west gate"],
    lamp: ["lamp", "brass lamp", "lantern"],
    lockbox: ["lockbox", "box", "paymaster's lockbox"],
    milestone: ["milestone", "stone"],
    oil_flask: ["oil", "flask", "oil flask", "lamp oil"],
    shed_door: ["shed door", "padlock", "shed"],
    shed_ledger: ["ledger", "papers", "note"],
    vent_grate: ["grate", "vent grate", "bars", "latch"],
    winch: ["winch", "mechanism", "socket"],
    winding_handle: ["handle", "winding handle", "iron handle"]
  },
  groups: {
    door: ["shed_door", "assay_door"],
    key: ["brass_key"],
    lock: ["shed_door", "assay_door"]
  },
  phraseAliases: {
    "look at": "EXAMINE",
    "pick up": "TAKE",
    "turn on": "LIGHT"
  }
};
