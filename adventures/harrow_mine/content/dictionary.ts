import type { AdventureDictionary } from "../../../src/engine/types";

export const dictionary: AdventureDictionary = {
  verbs: {
    ATTACH: ["fit", "insert", "place", "put", "slot"],
    CLOSE: ["shut"],
    CROSS: ["edge across", "go across"],
    DROP: ["discard", "leave", "put down"],
    EXAMINE: ["check", "inspect", "study", "x"],
    EXTINGUISH: ["douse", "put out", "snuff"],
    GO: ["enter", "head", "leave", "walk"],
    LIGHT: ["ignite", "oil"],
    LOOK: ["l"],
    MOVE: ["clear", "force", "lever", "pry", "shift"],
    OPEN: ["unbar", "uncover"],
    PULL: ["drag", "haul"],
    PUSH: ["press", "shove"],
    SEARCH: ["rummage"],
    TAKE: ["collect", "get", "grab"],
    TURN: ["operate", "wind", "work"],
    UNLOCK: ["jimmy", "pick"],
    USE: ["apply"]
  },
  directions: {
    east: ["e"],
    north: ["n"],
    south: ["s"],
    west: ["w"]
  },
  actors: {
    bram: {
      aliases: ["bram", "bram pike", "fighter", "strong one"],
      pronouns: ["him"]
    },
    nessa: {
      aliases: ["nessa", "nessa vale", "thief", "lockpick"],
      pronouns: ["her"]
    }
  },
  items: {
    assay_door: {
      aliases: ["assay door", "assay office", "assay office door", "office", "office door", "south door", "swollen door"],
      adjectives: ["assay", "office", "south", "swollen"],
      nouns: ["door"]
    },
    beam: {
      aliases: ["beam", "fallen beam", "soaked beam", "timber beam"],
      adjectives: ["fallen", "soaked", "timber"],
      nouns: ["beam", "obstacle"]
    },
    brass_key: {
      aliases: ["key", "brass key", "brass office key", "office key", "payroll key"],
      adjectives: ["brass", "office", "payroll"],
      nouns: ["key"]
    },
    crowbar: {
      aliases: ["bar", "crowbar", "iron bar", "old crowbar", "pry bar"],
      adjectives: ["iron", "old", "pry", "rusty"],
      nouns: ["bar", "crowbar"]
    },
    desk: {
      aliases: ["assay desk", "desk", "clerk's desk", "scales", "shelves"],
      adjectives: ["assay", "clerk's", "old"],
      nouns: ["desk", "scales", "shelves"]
    },
    entrance_planks: {
      aliases: [
        "adit",
        "boards",
        "entrance",
        "entrance boards",
        "entrance planks",
        "mine entrance",
        "mine mouth",
        "planks",
        "rubble",
        "warped boards",
        "warped planks"
      ],
      adjectives: ["entrance", "mine", "warped"],
      nouns: ["adit", "boards", "entrance", "mouth", "planks", "rubble"]
    },
    flooded_ledge: {
      aliases: [
        "channel",
        "drift",
        "flooded drift",
        "ledge",
        "narrow ledge",
        "water",
        "wet ledge"
      ],
      adjectives: ["flooded", "narrow", "wet"],
      nouns: ["channel", "drift", "ledge", "water"]
    },
    gate: {
      aliases: ["gate", "gallery gate", "iron gate", "west gate"],
      adjectives: ["gallery", "iron", "west"],
      nouns: ["gate"]
    },
    lamp: {
      aliases: ["brass lamp", "hand lamp", "lamp", "lantern", "light"],
      adjectives: ["brass", "hand"],
      nouns: ["lamp", "lantern", "light"]
    },
    lockbox: {
      aliases: ["box", "iron box", "lockbox", "paymaster's box", "paymaster's lockbox", "payroll box"],
      adjectives: ["iron", "paymaster's", "payroll"],
      nouns: ["box", "lockbox"]
    },
    milestone: {
      aliases: ["broken milestone", "marker", "milestone", "road marker", "stone"],
      adjectives: ["broken", "road"],
      nouns: ["marker", "milestone", "stone"]
    },
    oil_flask: {
      aliases: ["flask", "flask of oil", "flask of lamp oil", "lamp oil", "oil", "oil flask"],
      adjectives: ["lamp", "oil"],
      nouns: ["flask", "oil"]
    },
    shed_door: {
      aliases: [
        "east shed",
        "foreman's shed",
        "hasp",
        "lock",
        "padlock",
        "shed",
        "shed door",
        "shed lock",
        "timber door"
      ],
      adjectives: ["east", "foreman's", "shed", "timber"],
      nouns: ["hasp", "padlock", "shed"]
    },
    shed_ledger: {
      aliases: ["ledger", "note", "papers", "payroll note", "foreman's ledger"],
      adjectives: ["foreman's", "payroll"],
      nouns: ["ledger", "note", "papers"]
    },
    vent_grate: {
      aliases: ["bars", "daylight grate", "exit grate", "grate", "latch", "rusted grate", "vent grate"],
      adjectives: ["daylight", "exit", "rusted", "vent"],
      nouns: ["bars", "grate", "latch"]
    },
    winch: {
      aliases: ["gear", "machinery", "mechanism", "socket", "winch", "winch mechanism"],
      adjectives: ["rusted", "winch"],
      nouns: ["gear", "machinery", "mechanism", "socket", "winch"]
    },
    winding_handle: {
      aliases: ["handle", "iron handle", "winder", "winding handle", "winch handle"],
      adjectives: ["iron", "winding", "winch"],
      nouns: ["handle", "winder"]
    }
  },
  groups: {
    door: ["shed_door", "assay_door"],
    key: ["brass_key"],
    lock: ["shed_door", "assay_door"]
  },
  noiseWords: ["carefully", "just", "maybe", "quickly"],
  idioms: {
    "open way out": { verb: "OPEN", directObject: "grate", confidence: "likely" },
    "open the way out": { verb: "OPEN", directObject: "grate", confidence: "likely" },
    "escape route": { verb: "EXAMINE", directObject: "grate", confidence: "likely" },
    "what is here": { verb: "LOOK" }
  },
  phraseAliases: {
    "edge across": "CROSS",
    "force open": "MOVE",
    "go across": "CROSS",
    "look at": "EXAMINE",
    "pick up": "TAKE",
    "pry open": "MOVE",
    "put down": "DROP",
    "put out": "EXTINGUISH",
    "turn on": "LIGHT"
  }
};
