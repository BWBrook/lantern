import type { AdventureItem } from "../../../src/engine/types";

export const items: AdventureItem[] = [
  {
    id: "crowbar",
    name: "old crowbar",
    description: "A long iron crowbar, pitted with rust but still perfectly persuasive.",
    location: "loading_yard"
  },
  {
    id: "shed_door",
    name: "shed door",
    description: "A stout timber door secured with a plain, weather-beaten padlock.",
    location: "loading_yard",
    portable: false,
    openable: true,
    initiallyOpen: false,
    lockable: true,
    initiallyLocked: true,
    hooks: {
      unlock: "unlock_shed_door"
    }
  },
  {
    id: "lamp",
    name: "brass lamp",
    description: "A brass hand lamp with enough dignity left to resent this mine.",
    location: "foreman_shed",
    hooks: {
      light: "light_lamp"
    }
  },
  {
    id: "oil_flask",
    name: "flask of lamp oil",
    description: "A flask of lamp oil. Useful in theory, reassuring in practice.",
    location: "foreman_shed"
  },
  {
    id: "winding_handle",
    name: "iron winding handle",
    description: "A removable iron handle sized to fit a proper bit of mining machinery.",
    location: "foreman_shed"
  },
  {
    id: "shed_ledger",
    name: "foreman's ledger",
    description:
      "The ledger confirms what the rumors promised: the assay office handled payroll, and the lockbox was never signed out.",
    location: "foreman_shed",
    portable: false,
    scenery: true
  },
  {
    id: "entrance_planks",
    name: "warped planks",
    description:
      "The planks are more stubborn than sound. With leverage, they should give.",
    location: "broken_entrance",
    portable: false,
    hooks: {
      move: "pry_entrance"
    }
  },
  {
    id: "gate",
    name: "iron gate",
    description: "A heavy gate barring the west branch of the gallery. Somewhere, a mechanism still controls it.",
    location: "main_gallery",
    portable: false,
    scenery: true
  },
  {
    id: "winch",
    name: "winch",
    description: "A rusted winch missing the handle that should make it useful.",
    location: "winch_platform",
    portable: false,
    hooks: {
      attach: "attach_handle",
      turn: "turn_winch",
      use: "turn_winch"
    }
  },
  {
    id: "flooded_ledge",
    name: "narrow ledge",
    description: "The ledge is thin, wet, and mean-spirited. It is a thief's crossing, not a fighter's.",
    location: "flooded_drift",
    portable: false,
    hooks: {
      cross: "cross_ledge",
      use: "cross_ledge"
    }
  },
  {
    id: "brass_key",
    name: "brass office key",
    description: "A tarnished brass key that looks exactly important enough.",
    location: "hidden"
  },
  {
    id: "beam",
    name: "fallen beam",
    description: "A soaked beam has slumped across the office doorway, awkward rather than immovable.",
    location: "stores_chamber",
    portable: false,
    hooks: {
      move: "move_beam"
    }
  },
  {
    id: "assay_door",
    name: "assay office door",
    description: "A swollen timber door with a brass lock and just enough clearance to be annoying.",
    location: "stores_chamber",
    portable: false,
    openable: true,
    initiallyOpen: false,
    lockable: true,
    initiallyLocked: true,
    keyItemId: "brass_key",
    requiredFlagsToOpen: ["beam_moved"],
    blockedOpenMessage: "The fallen beam still jams the office door.",
    hooks: {
      unlock: "unlock_assay_door"
    }
  },
  {
    id: "lockbox",
    name: "paymaster's lockbox",
    description: "Iron-banded, ugly, and very real. The whole job has collapsed into this one object.",
    location: "assay_office"
  },
  {
    id: "vent_grate",
    name: "vent grate",
    description: "A rusted grate with a latch that looks one push short of surrender.",
    location: "vent_crawl",
    portable: false,
    openable: true,
    initiallyOpen: false,
    hooks: {
      open: "open_grate"
    }
  },
  {
    id: "milestone",
    name: "broken milestone",
    description: "The milestone has lost both distance and dignity, but not the knack of marking a road.",
    location: "mine_road",
    portable: false,
    scenery: true
  },
  {
    id: "desk",
    name: "assay desk",
    description: "A clerk's desk gone dry with age. The interesting thing in here is beside it.",
    location: "assay_office",
    portable: false,
    scenery: true
  }
];
